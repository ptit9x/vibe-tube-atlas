// Daily niche keyword scanner. Invoked by pg_cron (one HTTP call per user).
// Zero YouTube API quota: Google Suggest + ytInitialData scraping only.
// Multi-market: the keyword budget is split evenly across selected markets.
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
  if (!CRON_SECRET || req.headers.get("Authorization") !== `Bearer ${CRON_SECRET}`) {
    return json({ error: "Unauthorized" }, 401);
  }

  const { user_id } = await req.json().catch(() => ({} as { user_id?: string }));
  if (!user_id) return json({ error: "user_id required" }, 400);

  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { persistSession: false } },
  );

  const { data: settings } = await admin
    .from("scan_settings")
    .select("*")
    .eq("user_id", user_id)
    .maybeSingle();
  if (!settings?.enabled) return json({ skipped: "scan disabled for user" });

  // Markets: validate, cap at MAX_MARKETS, fallback to defaults
  const markets = (settings.markets?.length ? settings.markets : ["VN", "US"])
    .filter((k: string) => MARKET_MAP[k])
    .slice(0, MAX_MARKETS);
  if (!markets.length) return json({ error: "no valid markets" }, 400);

  const wanted = settings.industries?.length
    ? INDUSTRIES.filter((i) => settings.industries.includes(i.key))
    : INDUSTRIES;
  const totalBudget = Math.min(
    settings.max_keywords_per_run ?? 50,
    HARD_MAX_KEYWORDS,
  );
  const perMarketBudget = Math.max(5, Math.floor(totalBudget / markets.length));
  const categoryMap = Object.fromEntries(
    CATEGORIES.map((c) => [c.key, c.rpmMultiplier]),
  );

  const savedCounters: Record<string, number> = {};
  let errorCount = 0;

  for (const marketKey of markets) {
    const market = MARKET_MAP[marketKey];
    const seedLang = market.seedLang;

    // 1) Expand seeds via Google Suggest → candidates per industry
    const prefixes = prefixesFor(market.hl).slice(0, 4);
    const perIndustry: {
      industry: string;
      category: string;
      candidates: string[];
    }[] = [];
    for (const ind of wanted) {
      const baseSeeds = ind.seeds[seedLang]?.length
        ? ind.seeds[seedLang]!
        : ind.seeds.en; // ja/ko fallback → en
      const candidates = new Set<string>();
      for (const seed of baseSeeds) {
        candidates.add(seed);
        for (const p of prefixes) {
          for (const s of await getSuggestions(`${p} ${seed}`, market.hl, market.gl)) {
            if (s.toLowerCase() !== seed.toLowerCase()) candidates.add(s);
          }
        }
      }
      perIndustry.push({
        industry: ind.key,
        category: ind.category,
        candidates: [...candidates],
      });
    }

    // 2) Round-robin across industries up to per-market budget
    const queue: { industry: string; category: string; keyword: string }[] = [];
    let added = true;
    while (queue.length < perMarketBudget && added) {
      added = false;
      for (const bucket of perIndustry) {
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

    // 3) Scrape + score + upsert in batches
    let rows: Record<string, unknown>[] = [];
    savedCounters[marketKey] = 0;
    for (const { industry, category, keyword } of queue) {
      try {
        const { videos, estimatedResults } = await scrapeKeyword(
          keyword,
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
          const estRpm = estimateRpm(marketKey, categoryMap[category] ?? 1);
          rows.push({
            user_id,
            industry,
            category,
            keyword,
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
          });
          savedCounters[marketKey]++;
        }
      } catch {
        errorCount++; // per-keyword failure must not kill the run
      }
      if (rows.length >= UPSERT_BATCH) {
        // Incremental persistence — survives the 150s wall-clock limit
        await admin
          .from("discovered_keywords")
          .upsert(rows, { onConflict: "user_id,keyword,market" })
          .then(() => {}, () => {});
        rows = [];
      }
      await sleep(700 + Math.random() * 400); // ~1 rps + jitter
    }
    if (rows.length) {
      await admin
        .from("discovered_keywords")
        .upsert(rows, { onConflict: "user_id,keyword,market" })
        .then(() => {}, () => {});
    }
  }

  // 4) Zero-quota usage log (dashboard consistency)
  await admin
    .from("api_usage")
    .insert({ user_id, endpoint: "daily-scan", quota_cost: 0 })
    .then(() => {}, () => {});

  return json({ user_id, markets, scanned: savedCounters, errors: errorCount });
});
