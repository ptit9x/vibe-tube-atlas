// Daily niche keyword scanner. Invoked by pg_cron (one HTTP call per user).
// Zero YouTube API quota: Google Suggest + ytInitialData scraping only.
// Multi-market: the keyword budget is split evenly across selected markets.
//
// 2026-10-05 rework: the previous fully-sequential flow issued ~1,100 Google
// Suggest calls per market (28 industries x ~10 seeds x 4 prefixes) BEFORE
// the first scrape — a default 2-market run needed 7-15 minutes and the
// gateway killed it at the ~150s free-tier wall clock (clients saw 504)
// during market-1 expansion: zero keywords scraped, last_scan_at never
// stamped. This version:
//   - runs suggest expansion + scraping through small concurrency pools
//   - caps expansion tasks/candidates per industry (round-robin only needs
//     perMarketBudget candidates anyway)
//   - enforces a 130s soft deadline: stop launching work, return partial
//   - stamps api_usage + last_scan_at BEFORE scanning (proof the run fired)
//   - interactive "Scan now" runs use a smaller budget for fast response
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import {
  calcDifficultyScore,
  calcNicheScore,
  relativeTimeToDays,
} from "../_shared/scoring.ts";
import {
  INDUSTRIES,
  CATEGORIES,
  MODIFIER_PREFIXES_VI,
  MODIFIER_PREFIXES_EN,
  MODIFIER_PREFIXES_JA,
  MODIFIER_PREFIXES_KO,
} from "../_shared/taxonomy.ts";
import { MARKET_MAP, estimateRpm, MAX_MARKETS } from "../_shared/markets.ts";

const CRON_SECRET = Deno.env.get("CRON_SECRET") ?? "";
const HARD_MAX_KEYWORDS = 80; // wall-clock safety (free tier ≈150s)
const MIN_VIDEOS_TO_SCORE = 5;
const UPSERT_BATCH = 10;
const MAX_CUSTOM_KEYWORDS = 20; // per user, enforced in UI + scanner
const CUSTOM_INDUSTRY = "custom"; // pseudo-industry key for user keywords

// Soft deadline: gateway kills at ~150s; stop launching new work at 130s so
// the final upserts + response always make it out with partial results.
const DEADLINE_MS = 130_000;
const SUGGEST_CONCURRENCY = 8;
const SCRAPE_CONCURRENCY = 3;
const MAX_EXPAND_TASKS_PER_BUCKET = 16; // seed×prefix suggest queries / industry
const INTERACTIVE_MAX_KEYWORDS = 30; // "Scan now": responsiveness > depth
const INTERACTIVE_MAX_MARKETS = 2;
const INTERACTIVE_PREFIXES = 2;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

interface ScrapedVideo {
  id: string;
  title: string;
  views: number;
  published: string;
  ageDays: number;
}

// Run fn over items with at most `limit` in flight (order-preserving).
async function mapPool<T, R>(
  items: T[],
  limit: number,
  fn: (item: T) => Promise<R>,
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let next = 0;
  await Promise.all(
    Array.from({ length: Math.min(limit, items.length) }, async () => {
      while (next < items.length) {
        const idx = next++;
        results[idx] = await fn(items[idx]);
      }
    }),
  );
  return results;
}

function extractText(node: Record<string, unknown>): string {
  if (!node) return "";
  const runs = (node as { runs?: Array<{ text?: string }> }).runs;
  if (Array.isArray(runs)) return runs.map((r) => r.text ?? "").join("");
  return (node as { simpleText?: string }).simpleText ?? "";
}

function collectVideos(obj: unknown, out: ScrapedVideo[]): void {
  if (Array.isArray(obj)) {
    for (const v of obj) collectVideos(v, out);
    return;
  }
  if (!obj || typeof obj !== "object") return;
  const record = obj as Record<string, unknown>;
  const vr = record.videoRenderer as Record<string, unknown> | undefined;
  if (vr) {
    const viewsTxt = extractText(
      (vr.viewCountText ?? {}) as Record<string, unknown>,
    );
    const views = parseInt(
      (viewsTxt.match(/[\d.,]+/)?.[0] ?? "0").replace(/[.,]/g, ""),
      10,
    ) || 0;
    const published = extractText(
      (vr.publishedTimeText ?? {}) as Record<string, unknown>,
    );
    const videoId = vr.videoId as string | undefined;
    if (videoId && views > 0) {
      out.push({
        id: videoId,
        title: extractText((vr.title ?? {}) as Record<string, unknown>),
        views,
        published,
        ageDays: relativeTimeToDays(published),
      });
    }
  }
  for (const v of Object.values(record)) collectVideos(v, out);
}

async function scrapeKeyword(
  keyword: string,
  hl: string,
  gl: string,
): Promise<{ videos: ScrapedVideo[]; estimatedResults: number }> {
  const url =
    `https://www.youtube.com/results?search_query=${encodeURIComponent(keyword)}&hl=${hl}&gl=${gl}`;
  const resp = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36",
      "Accept-Language": `${hl}-${gl},${hl};q=0.9,en;q=0.5`,
    },
  });
  if (!resp.ok) throw new Error(`youtube ${resp.status}`);
  // 🔴 charset pitfall: always decode explicitly as UTF-8
  const html = new TextDecoder("utf-8").decode(await resp.arrayBuffer());
  const m = html.match(/var ytInitialData = (.+?);<\/script>/s);
  if (!m) throw new Error("no ytInitialData");
  const data = JSON.parse(m[1]) as {
    estimatedResults?: string;
    [k: string]: unknown;
  };
  const estimatedResults = parseInt(data.estimatedResults ?? "0", 10) || 0;
  const raw: ScrapedVideo[] = [];
  collectVideos(data, raw);
  const seen = new Set<string>();
  const videos: ScrapedVideo[] = [];
  for (const v of raw) {
    if (!seen.has(v.id)) {
      seen.add(v.id);
      videos.push(v);
    }
  }
  return { videos: videos.slice(0, 15), estimatedResults };
}

async function getSuggestions(
  query: string,
  hl: string,
  gl: string,
): Promise<string[]> {
  const url =
    `https://suggestqueries.google.com/complete/search?client=youtube&ds=yt&q=${encodeURIComponent(query)}&hl=${hl}&gl=${gl}`;
  try {
    const resp = await fetch(url);
    // 🔴 ENCODING PITFALL (verified empirically): Google Suggest declares
    // charset=ISO-8859-1 and the body REALLY IS Latin-1 for chars ≤ U+00FF,
    // while higher codepoints are \uXXXX escapes resolved by JSON.parse.
    // Decoding as UTF-8 corrupts Vietnamese letters like "á" (→ U+FFFD).
    const text = new TextDecoder("latin1").decode(await resp.arrayBuffer());
    const parsed = JSON.parse(text.match(/\[.*\]/s)?.[0] ?? "[]") as unknown[];
    const entries = (parsed[1] ?? []) as unknown[];
    return entries
      .map((e) => Array.isArray(e) ? String(e[0]) : "")
      .filter((s) => typeof s === "string" && s.length > 0);
  } catch {
    return []; // unofficial endpoint — degrade gracefully
  }
}

function prefixesFor(lang: string): string[] {
  if (lang === "vi") return MODIFIER_PREFIXES_VI;
  if (lang === "ja") return MODIFIER_PREFIXES_JA;
  if (lang === "ko") return MODIFIER_PREFIXES_KO;
  return MODIFIER_PREFIXES_EN;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const startedAt = Date.now();
  const timedOut = () => Date.now() - startedAt > DEADLINE_MS;

  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { persistSession: false } },
  );

  // Two auth paths:
  //  a) Bearer CRON_SECRET — pg_cron fan-out (scans any requested user).
  //  b) Bearer <user JWT> — the "Scan now" button in Niche Radar. The JWT is
  //     verified server-side with admin.auth.getUser(); user_id is forced to
  //     the caller, so a user can only ever scan their own settings.
  const authHeader = req.headers.get("Authorization") ?? "";
  let user_id: string | undefined;
  let isCron = false;
  if (CRON_SECRET && authHeader === `Bearer ${CRON_SECRET}`) {
    const body = await req.json().catch(() => ({} as { user_id?: string }));
    user_id = body.user_id;
    isCron = true;
  } else if (authHeader.startsWith("Bearer ")) {
    const token = authHeader.slice(7);
    if (token.split(".").length === 3) { // looks like a JWT
      const { data: userData } = await admin.auth.getUser(token);
      if (userData?.user) user_id = userData.user.id;
    }
  }
  if (!user_id) return json({ error: "Unauthorized" }, 401);

  const { data: settings } = await admin
    .from("scan_settings")
    .select("*")
    .eq("user_id", user_id)
    .maybeSingle();
  if (!settings) return json({ skipped: "scan disabled for user" });
  // "enabled" gates the daily cron only — an explicit "Scan now" tap runs
  // regardless, since the user just asked for it.
  if (!settings.enabled && isCron) {
    return json({ skipped: "scan disabled for user" });
  }

  // Markets: validate, cap at MAX_MARKETS, fallback to defaults
  const markets = (settings.markets?.length ? settings.markets : ["VN", "US"])
    .filter((k: string) => MARKET_MAP[k])
    .slice(0, MAX_MARKETS);
  if (!markets.length) return json({ error: "no valid markets" }, 400);

  const wanted = settings.industries?.length
    ? INDUSTRIES.filter((i) => settings.industries.includes(i.key))
    : INDUSTRIES;
  // Custom keywords: user-defined seeds, expanded via Suggest like any other
  // seed. They become a pseudo-industry bucket ("custom") so round-robin
  // treats them fairly against taxonomy industries.
  const customSeeds = (settings.custom_keywords ?? [])
    .map((k: string) => k.trim())
    .filter(Boolean)
    .slice(0, MAX_CUSTOM_KEYWORDS);
  // Interactive "Scan now" runs trim budget/markets/prefixes so the UI
  // answers in well under a minute; cron runs keep the full configuration.
  const totalBudget = Math.min(
    isCron
      ? (settings.max_keywords_per_run ?? 50)
      : Math.min(settings.max_keywords_per_run ?? 50, INTERACTIVE_MAX_KEYWORDS),
    HARD_MAX_KEYWORDS,
  );
  const effMarkets = isCron
    ? markets
    : markets.slice(0, INTERACTIVE_MAX_MARKETS);
  const perMarketBudget = Math.max(5, Math.floor(totalBudget / effMarkets.length));
  const prefixCount = isCron ? 4 : INTERACTIVE_PREFIXES;
  const categoryMap = Object.fromEntries(
    CATEGORIES.map((c) => [c.key, c.rpmMultiplier]),
  );

  // Stamp the run BEFORE scanning. Even if the gateway still kills us (cold
  // start + slow upstreams), the UI can prove the scan fired and when —
  // this was the 504 blind spot: runs happened but nothing was ever stamped.
  await admin
    .from("api_usage")
    .insert({ user_id, endpoint: "daily-scan", quota_cost: 0 })
    .then(() => {}, () => {});
  await admin
    .from("scan_settings")
    .update({ last_scan_at: new Date().toISOString() })
    .eq("user_id", user_id)
    .then(() => {}, () => {});

  const savedCounters: Record<string, number> = {};
  let errorCount = 0;

  for (const marketKey of effMarkets) {
    if (timedOut()) break; // finish with what we have
    const market = MARKET_MAP[marketKey];

    // 1) Expand seeds via Google Suggest → candidates per industry.
    //    Buckets expand concurrently; each bucket is capped (round-robin
    //    only needs perMarketBudget candidates total, so ~1.2x is plenty).
    const prefixes = prefixesFor(market.hl).slice(0, prefixCount);
    const candidateCap = Math.max(8, Math.ceil(perMarketBudget * 1.2));
    type Bucket = {
      industry: string;
      category: string;
      seeds: string[];
      candidates: string[];
    };
    const buckets: Bucket[] = wanted.map((ind) => ({
      industry: ind.key,
      category: ind.category,
      seeds:
        ind.seeds[market.seedLang]?.length
          ? ind.seeds[market.seedLang]!
          : ind.seeds.en, // ja/ko fallback → en
      candidates: [],
    }));
    // Custom keywords join the round-robin as their own bucket. Category
    // unknown → multiplier 1 (neutral RPM estimate).
    if (customSeeds.length) {
      buckets.push({
        industry: CUSTOM_INDUSTRY,
        category: "lifestyle", // neutral ×1.1 multiplier
        seeds: customSeeds,
        candidates: [],
      });
    }

    // ONE global task list across all buckets so SUGGEST_CONCURRENCY is the
    // true upper bound of in-flight suggest requests (per-bucket pools would
    // multiply it by the bucket count and get rate-limited).
    const candSets: Set<string>[] = buckets.map((b) => new Set<string>(b.seeds));
    const expandTasks: { bucketIdx: number; q: string; seed: string }[] = [];
    buckets.forEach((b, i) => {
      let n = 0;
      for (const seed of b.seeds) {
        for (const p of prefixes) {
          if (n >= MAX_EXPAND_TASKS_PER_BUCKET) return;
          expandTasks.push({ bucketIdx: i, q: `${p} ${seed}`, seed });
          n++;
        }
      }
    });
    await mapPool(expandTasks, SUGGEST_CONCURRENCY, async ({ bucketIdx, q, seed }) => {
      const candidates = candSets[bucketIdx];
      if (timedOut() || candidates.size >= candidateCap) return;
      for (const s of await getSuggestions(q, market.hl, market.gl)) {
        if (candidates.size >= candidateCap) break;
        if (s.toLowerCase() !== seed.toLowerCase()) candidates.add(s);
      }
    });
    buckets.forEach((b, i) => {
      b.candidates = [...candSets[i]];
    });

    // 2) Round-robin across industries up to per-market budget
    const queue: { industry: string; category: string; keyword: string }[] = [];
    let added = true;
    while (queue.length < perMarketBudget && added) {
      added = false;
      for (const bucket of buckets) {
        if (queue.length >= perMarketBudget) break;
        const next = bucket.candidates.shift();
        if (next) {
          queue.push({
            industry: bucket.industry,
            category: bucket.category,
            keyword: next,
          });
          added = true;
        }
      }
    }

    // 3) Scrape + score concurrently, then upsert in batches
    savedCounters[marketKey] = 0;
    const scored = await mapPool(queue, SCRAPE_CONCURRENCY, async (item) => {
      if (timedOut()) return null;
      // politeness: ~1 req/1.2-1.6s per worker ⇒ ~2-2.5 rps total
      await sleep(400 + Math.random() * 400);
      try {
        const { videos, estimatedResults } = await scrapeKeyword(
          item.keyword,
          market.hl,
          market.gl,
        );
        if (videos.length >= MIN_VIDEOS_TO_SCORE) {
          const avgViews = Math.round(
            videos.reduce((s, v) => s + v.views, 0) / videos.length,
          );
          const avgAge = videos.reduce((s, v) => s + v.ageDays, 0) / videos.length;
          const viewsPerDayTop = Math.max(
            ...videos.map((v) => Math.round(v.views / Math.max(v.ageDays, 1 / 24))),
          );
          const difficulty = calcDifficultyScore(
            estimatedResults,
            0,
            avgAge,
            viewsPerDayTop,
          );
          const niche = calcNicheScore(difficulty, viewsPerDayTop, 0);
          const estRpm = estimateRpm(marketKey, categoryMap[item.category] ?? 1);
          savedCounters[marketKey]++;
          return {
            user_id,
            industry: item.industry,
            category: item.category,
            keyword: item.keyword,
            market: marketKey,
            niche_score: niche,
            difficulty_score: difficulty,
            estimated_results: estimatedResults,
            avg_views: avgViews,
            views_per_day_top: viewsPerDayTop,
            avg_video_age_days: Math.round(avgAge),
            est_rpm: estRpm,
            sample_videos: videos.slice(0, 5).map((v) => ({
              id: v.id,
              title: v.title,
              views: v.views,
              published: v.published,
            })),
            status: "ok",
            last_seen_at: new Date().toISOString(),
          } as Record<string, unknown>;
        }
      } catch {
        errorCount++; // per-keyword failure must not kill the run
      }
      return null;
    });
    // Incremental persistence — partial progress survives unexpected kills
    const rows = scored.filter(
      (r): r is Record<string, unknown> => r !== null,
    );
    for (let i = 0; i < rows.length; i += UPSERT_BATCH) {
      await admin
        .from("discovered_keywords")
        .upsert(rows.slice(i, i + UPSERT_BATCH), {
          onConflict: "user_id,keyword,market",
        })
        .then(() => {}, () => {});
    }
  }

  return json({
    user_id,
    markets: effMarkets,
    customKeywords: customSeeds.length,
    scanned: savedCounters,
    errors: errorCount,
    partial: timedOut(),
    elapsed_ms: Date.now() - startedAt,
  });
});
