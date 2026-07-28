import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface RequestBody {
  action: "search" | "videos" | "channels" | "videoCategories";
  params: Record<string, unknown>;
}

const QUOTA_COSTS: Record<string, number> = {
  search: 100,
  videos: 1,
  channels: 1,
  videoCategories: 1,
};

function jsonResponse(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

// Parse YouTube API response into our domain types
function parseYouTubeResponse(action: string, data: Record<string, unknown>) {
  const items = ((data.items || []) as Record<string, unknown>[]);

  switch (action) {
    case "search":
      return items.map((item) => {
        const id = item.id as Record<string, string>;
        const snippet = item.snippet as Record<string, unknown>;
        return {
          id: id.videoId || id.channelId || "",
          kind: id.kind || "youtube#video",
          title: snippet?.title || "",
          description: snippet?.description || "",
          channelId: snippet?.channelId || "",
          channelTitle: snippet?.channelTitle || "",
          publishedAt: snippet?.publishedAt || "",
          thumbnails: snippet?.thumbnails || {},
        };
      });

    case "videos":
      return items.map((item) => {
        const snippet = item.snippet as Record<string, unknown>;
        const stats = (item.statistics as Record<string, string>) || {};
        const contentDetails = (item.contentDetails as Record<string, string>) || {};
        return {
          id: item.id as string,
          title: snippet?.title || "",
          description: snippet?.description || "",
          channelId: snippet?.channelId || "",
          channelTitle: snippet?.channelTitle || "",
          publishedAt: snippet?.publishedAt || "",
          thumbnails: snippet?.thumbnails || {},
          duration: contentDetails?.duration || "",
          viewCount: stats?.viewCount ? parseInt(stats.viewCount, 10) : 0,
          likeCount: stats?.likeCount ? parseInt(stats.likeCount, 10) : 0,
          commentCount: stats?.commentCount ? parseInt(stats.commentCount, 10) : 0,
          tags: snippet?.tags || [],
          categoryId: snippet?.categoryId || "",
        };
      });

    case "channels":
      return items.map((item) => {
        const snippet = item.snippet as Record<string, unknown>;
        const stats = (item.statistics as Record<string, string>) || {};
        return {
          id: item.id as string,
          title: snippet?.title || "",
          description: snippet?.description || "",
          customUrl: snippet?.customUrl || "",
          publishedAt: snippet?.publishedAt || "",
          thumbnails: snippet?.thumbnails || {},
          country: snippet?.country || "",
          subscriberCount: stats?.subscriberCount
            ? parseInt(stats.subscriberCount, 10)
            : 0,
          videoCount: stats?.videoCount
            ? parseInt(stats.videoCount, 10)
            : 0,
          viewCount: stats?.viewCount
            ? parseInt(stats.viewCount, 10)
            : 0,
        };
      });

    case "videoCategories":
      return items.map((item) => {
        const snippet = item.snippet as Record<string, unknown>;
        return {
          id: item.id as string,
          title: snippet?.title || "",
          assignable: snippet?.assignable || false,
        };
      });

    default:
      return [];
  }
}

Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Get the JWT token from Authorization header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return jsonResponse({ error: "Missing authorization header" }, 401);
    }

    // Create Supabase client with user's JWT
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      {
        global: {
          headers: { Authorization: authHeader },
        },
      },
    );

    // Verify the user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    if (userError || !user) {
      return jsonResponse({ error: "Unauthorized" }, 401);
    }

    // Get user's API key from user_api_keys table
    const { data: keyData, error: keyError } = await supabase
      .from("user_api_keys")
      .select("api_key_encrypted")
      .eq("user_id", user.id)
      .eq("provider", "youtube")
      .eq("is_active", true)
      .maybeSingle();

    if (keyError || !keyData?.api_key_encrypted) {
      return jsonResponse(
        { error: "No YouTube API key found. Please add your API key in Settings." },
        400,
      );
    }

    const apiKey = keyData.api_key_encrypted;
    const { action, params }: RequestBody = await req.json();

    let youtubeUrl = "";
    const quotaCost = QUOTA_COSTS[action] || 1;

    // Build YouTube API URL based on action
    switch (action) {
      case "search": {
        const p = new URLSearchParams({
          key: apiKey,
          part: "snippet",
          type: (params.type as string) || "video",
          q: params.keyword as string,
          maxResults: String(params.maxResults || 20),
          order: (params.order as string) || "relevance",
          regionCode: (params.regionCode as string) || "VN",
          relevanceLanguage: (params.relevanceLanguage as string) || "vi",
        });
        if (params.publishedAfter) {
          p.set("publishedAfter", params.publishedAfter as string);
        }
        if (params.videoCategoryId) {
          p.set("videoCategoryId", params.videoCategoryId as string);
        }
        youtubeUrl = `https://www.googleapis.com/youtube/v3/search?${p}`;
        break;
      }
      case "videos": {
        const p = new URLSearchParams({
          key: apiKey,
          part: "snippet,statistics,contentDetails",
          id: params.ids as string,
          maxResults: String(params.ids?.split(",").length || 50),
        });
        youtubeUrl = `https://www.googleapis.com/youtube/v3/videos?${p}`;
        break;
      }
      case "channels": {
        const p = new URLSearchParams({
          key: apiKey,
          part: "snippet,statistics",
          id: params.ids as string,
          maxResults: String(params.ids?.split(",").length || 50),
        });
        youtubeUrl = `https://www.googleapis.com/youtube/v3/channels?${p}`;
        break;
      }
      case "videoCategories": {
        const p = new URLSearchParams({
          key: apiKey,
          part: "snippet",
          regionCode: (params.regionCode as string) || "VN",
        });
        youtubeUrl = `https://www.googleapis.com/youtube/v3/videoCategories?${p}`;
        break;
      }
      default:
        return jsonResponse({ error: `Unknown action: ${action}` }, 400);
    }

    // Call YouTube API
    const ytResponse = await fetch(youtubeUrl);
    const ytData = await ytResponse.json();

    if (!ytResponse.ok) {
      const errMsg = ytData.error?.message ||
        `YouTube API error: ${ytResponse.status}`;
      return jsonResponse({ error: errMsg }, ytResponse.status);
    }

    // Log quota usage (non-blocking, don't fail the request)
    supabase
      .from("api_usage")
      .insert({
        user_id: user.id,
        endpoint: action,
        quota_cost: quotaCost,
      })
      .then(() => {}, () => {}); // swallow errors

    // Log search history for search action
    if (action === "search") {
      const itemCount = ytData.pageInfo?.totalResults || 0;
      supabase
        .from("search_history")
        .insert({
          user_id: user.id,
          query: params.keyword as string,
          search_type: (params.type as string) || "video",
          country: (params.regionCode as string) || "VN",
          results_count: itemCount,
        })
        .then(() => {}, () => {});
    }

    // Parse and return data
    const parsed = parseYouTubeResponse(action, ytData);
    return jsonResponse({ data: parsed });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return jsonResponse({ error: message }, 500);
  }
});
