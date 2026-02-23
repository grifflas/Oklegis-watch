// netlify/functions/api.mjs
// Server-side proxy for LegiScan (avoids CORS) and Claude AI
// Called by the frontend as /.netlify/functions/api

export async function handler(event) {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Content-Type": "application/json",
  };

  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers, body: "" };
  }

  const params = event.queryStringParameters || {};
  const body = event.body ? JSON.parse(event.body) : {};
  const action = params.action || body.action;

  try {
    // ── LEGISCAN PROXY ──────────────────────────────────────────────────────
    if (action === "legiscan") {
      const key = process.env.LEGISCAN_API_KEY;
      if (!key) return { statusCode: 500, headers, body: JSON.stringify({ error: "LEGISCAN_API_KEY not configured" }) };

      const op = params.op;
      const qp = new URLSearchParams({ key, op });
      if (params.state) qp.set("state", params.state);
      if (params.id) qp.set("id", params.id);

      const res = await fetch(`https://api.legiscan.com/?${qp}`);
      const data = await res.json();
      return { statusCode: 200, headers, body: JSON.stringify(data) };
    }

    // ── CLAUDE AI PROXY ─────────────────────────────────────────────────────
    if (action === "kennedy") {
      const key = process.env.ANTHROPIC_API_KEY;
      if (!key) return { statusCode: 500, headers, body: JSON.stringify({ error: "ANTHROPIC_API_KEY not configured" }) };

      const { bill_id, bill_number, title, last_action, committee } = body;

      const prompt = `You are roleplaying as Senator John Kennedy of Louisiana — known for sharp wit, folksy Southern expressions, plain-spoken legal analysis, and colorful analogies. Analyze this Oklahoma bill for constitutional concerns (state or federal). 3-4 sentences max. Kennedy voice and Southern idioms throughout. If constitutionally sound, say so clearly in his style.

Bill: ${bill_number}
Title: ${title}
Last action: ${last_action || "N/A"}
Committee: ${committee || "N/A"}

Give ONLY the Kennedy-voice analysis, no preamble, no labels.`;

      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": key,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 280,
          messages: [{ role: "user", content: prompt }],
        }),
      });

      const data = await res.json();
      const text = data.content?.[0]?.text || "Analysis unavailable.";
      const clean = /sound|clean|constitutional|no concern|complies|permitted|valid|fine|rock solid/i.test(text) &&
                    !/violat|concern|problem|unconstitut|overbroad|challenge|issue|worry/i.test(text);

      return { statusCode: 200, headers, body: JSON.stringify({ text, clean, bill_id }) };
    }

    // ── CLAUDE DIGEST PROXY ─────────────────────────────────────────────────
    if (action === "digest") {
      const key = process.env.ANTHROPIC_API_KEY;
      if (!key) return { statusCode: 500, headers, body: JSON.stringify({ error: "ANTHROPIC_API_KEY not configured" }) };

      const { bills, full } = body;
      const lines = (bills || []).slice(0, 20).map(b =>
        `${b.id}: "${(b.title||"").slice(0,70)}" — ${b.stage}, ${b.last_action_date||"N/A"}`
      ).join("\n");

      const maxTokens = full ? 550 : 350;
      const prompt = full
        ? `Write a comprehensive 5-6 sentence daily legislative briefing for Oklahoma legislators and citizens. Today: ${new Date().toLocaleDateString()}. Focus on most active bills, key committee movements, and upcoming session deadlines (Committee Origin Mar 5, Floor Origin Mar 26, Sine Die May 29 2026). Professional and accessible language.\n\n${lines}`
        : `Write a 3-4 sentence daily legislative briefing for Oklahoma's 2026 session. Professional but accessible. Highlight most significant movements and flag any constitutionally sensitive bills. Today: ${new Date().toLocaleDateString()}.\n\nBill data:\n${lines}`;

      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": key,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: maxTokens,
          messages: [{ role: "user", content: prompt }],
        }),
      });

      const data = await res.json();
      const text = data.content?.[0]?.text || "";
      return { statusCode: 200, headers, body: JSON.stringify({ text }) };
    }

    return { statusCode: 400, headers, body: JSON.stringify({ error: "Unknown action" }) };

  } catch (err) {
    console.error("API error:", err);
    return { statusCode: 500, headers, body: JSON.stringify({ error: err.message }) };
  }
}
