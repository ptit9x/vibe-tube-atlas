const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { query, hl = "vi", gl = "VN" } = await req.json();

    if (!query || typeof query !== "string") {
      return jsonResponse({ suggestions: [] });
    }

    // Use Google's free autocomplete endpoint (no API key, no quota cost)
    const url = `https://suggestqueries.google.com/complete/search?client=youtube&ds=yt&q=${
      encodeURIComponent(query)
    }&hl=${
      encodeURIComponent(hl)
    }&gl=${
      encodeURIComponent(gl)
    }`;

    const response = await fetch(url);
    // 🔴 ENCODING PITFALL (verified empirically): Google Suggest declares
    // charset=ISO-8859-1 and the body REALLY IS Latin-1 for chars ≤ U+00FF,
    // while higher codepoints are \uXXXX escapes resolved by JSON.parse.
    // Decoding as UTF-8 corrupts Vietnamese letters like "á" (→ U+FFFD).
    const buffer = await response.arrayBuffer();
    const text = new TextDecoder("latin1").decode(buffer);

    // Response is JSONP: window.google.ac.h(["query",[["suggestion1",0],["suggestion2",0],...]])
    // Extract the JSON array from the JSONP wrapper
    const match = text.match(/\[.*\]/s);
    if (!match) {
      return jsonResponse({ suggestions: [] });
    }

    const parsed = JSON.parse(match[0]);
    const suggestions: string[] = [];

    // parsed[1] is array of arrays: [["suggestion", 0, [...]], ...]
    if (Array.isArray(parsed[1])) {
      for (const item of parsed[1]) {
        if (Array.isArray(item) && typeof item[0] === "string") {
          suggestions.push(item[0]);
        }
      }
    }

    return jsonResponse({ query, suggestions });
  } catch (err) {
    // Degrade gracefully — autocomplete is non-critical
    const message = err instanceof Error ? err.message : "Unknown error";
    return jsonResponse({ suggestions: [], error: message });
  }

  function jsonResponse(body: Record<string, unknown>, status = 200) {
    return new Response(JSON.stringify(body), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
