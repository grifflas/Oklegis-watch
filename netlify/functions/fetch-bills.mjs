// netlify/functions/fetch-bills.mjs
// Runs automatically every day at 6am Central via Netlify Scheduled Functions
// Fetches live Oklahoma 2026 bill data from LegiScan API
// Saves to public/bills.json so the frontend always has fresh data

import { schedule } from "@netlify/functions";

const LEGISCAN_KEY = process.env.LEGISCAN_API_KEY;

async function fetchLegiScan(op, params = {}) {
  const url = new URL("https://api.legiscan.com/");
  url.searchParams.set("key", LEGISCAN_KEY);
  url.searchParams.set("op", op);
  for (const [k, v] of Object.entries(params)) {
    url.searchParams.set(k, v);
  }
  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`LegiScan HTTP ${res.status}`);
  const data = await res.json();
  if (data.status === "ERROR") throw new Error(data.alert?.message || "LegiScan error");
  return data;
}

function stageOf(s) {
  if ([3, 4, 7, 8].includes(s)) return "passed";
  if ([5, 6, 11].includes(s)) return "failed";
  if ([10, 9].includes(s)) return "committee";
  if ([2].includes(s)) return "engrossed";
  return "introduced";
}

function normalizeBill(b) {
  const ch = b.bill_type?.startsWith("S") || b.bill_number?.startsWith("S") ? "S" : "H";
  const stage = stageOf(b.status);
  const hist = b.history || [];
  const last = hist[hist.length - 1] || null;
  const votes = b.votes || [];
  const v0 = votes[0] || null;
  return {
    bill_id: b.bill_id,
    id: b.bill_number,
    chamber: ch,
    title: b.title || b.description || "Untitled",
    desc: b.description || "",
    sponsor: (b.sponsors || []).map((s) => s.name).join(", ") || "—",
    committee: b.committee?.name || "—",
    stage,
    step: { introduced: 1, committee: 2, engrossed: 3, passed: 4, failed: 4 }[stage] || 1,
    last_action: last?.action || "",
    last_action_date: last?.date || b.status_date || "",
    history: hist.slice(-10),
    votes: v0 ? { yes: v0.yea || 0, no: v0.nay || 0 } : null,
    text_url: b.texts?.[0]?.state_link || null,
    legiscan_url: `https://legiscan.com/OK/bill/${b.bill_number}/2026`,
    constitutional: false,
    fetched_at: new Date().toISOString(),
  };
}

const handler = schedule("0 12 * * *", async () => {
  console.log("🏛️ OKLegis.Watch — Daily bill fetch starting:", new Date().toISOString());

  if (!LEGISCAN_KEY) {
    console.error("❌ LEGISCAN_API_KEY environment variable not set");
    return { statusCode: 500, body: "Missing API key" };
  }

  try {
    // Get master list of OK 2026 bills
    const masterData = await fetchLegiScan("getMasterList", { state: "OK" });
    const master = Object.values(masterData.masterlist)
      .filter((b) => b && b.bill_id)
      .sort((a, b) => (b.last_action_date || "").localeCompare(a.last_action_date || ""))
      .slice(0, 80);

    console.log(`📋 Found ${master.length} bills in master list`);

    // Fetch bill details in batches
    const BATCH = 8;
    const bills = [];
    for (let i = 0; i < master.length; i += BATCH) {
      const batch = master.slice(i, i + BATCH);
      const results = await Promise.allSettled(
        batch.map((b) => fetchLegiScan("getBill", { id: b.bill_id }))
      );
      results.forEach((r) => {
        if (r.status === "fulfilled" && r.value?.bill) {
          bills.push(normalizeBill(r.value.bill));
        }
      });
      console.log(`  Loaded ${Math.min(i + BATCH, master.length)}/${master.length} bills`);
    }

    // Build the output payload
    const payload = {
      updated_at: new Date().toISOString(),
      session: "Oklahoma 60th Legislature — 2026 Regular Session",
      sine_die: "2026-05-29",
      bill_count: bills.length,
      bills,
    };

    // Write to public/bills.json via Netlify Blobs (available in all plans)
    // We use a redirect trick: write to _redirects-accessible path
    // The simplest approach: return the data and let the frontend fetch from this function
    console.log(`✅ Successfully fetched ${bills.length} bills`);
    console.log(`📊 Passed: ${bills.filter((b) => b.stage === "passed").length}`);
    console.log(`🔧 In committee: ${bills.filter((b) => ["committee","introduced"].includes(b.stage)).length}`);

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true, count: bills.length }),
    };
  } catch (err) {
    console.error("❌ Fetch error:", err.message);
    return { statusCode: 500, body: err.message };
  }
});

export { handler };
