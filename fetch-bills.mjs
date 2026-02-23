// netlify/functions/fetch-bills.mjs
// Scheduled daily at 6am Central via netlify.toml

export async function handler(event) {
  console.log("🏛️ OKLegis daily fetch:", new Date().toISOString());
  const KEY = process.env.LEGISCAN_API_KEY;
  if (!KEY) return { statusCode: 500, body: "Missing LEGISCAN_API_KEY" };

  try {
    const url = `https://api.legiscan.com/?key=${KEY}&op=getMasterList&state=OK`;
    const res = await fetch(url);
    const data = await res.json();
    const count = Object.values(data.masterlist || {}).filter(b => b?.bill_id).length;
    console.log(`✅ ${count} bills found`);
    return { statusCode: 200, body: JSON.stringify({ success: true, count }) };
  } catch (err) {
    return { statusCode: 500, body: err.message };
  }
}
