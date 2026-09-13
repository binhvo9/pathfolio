// Plain fetch, no SDK — same lightweight style as apps/market-data's
// providers.ts (Finnhub/CoinGecko), avoids an extra dependency for one
// HTTP call. docs/specs/07-insight-ai.md: Flash tier, not the cheapest
// variant, since this text is the product's headline feature.

const MODEL = "gemini-flash-latest";

export async function generateInsight(prompt: string): Promise<string> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-goog-api-key": process.env.GEMINI_API_KEY!,
    },
    body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
  });
  if (!res.ok) throw new Error(`Gemini API error: ${res.status}`);
  const data = (await res.json()) as { candidates: { content: { parts: { text: string }[] } }[] };
  return data.candidates[0].content.parts[0].text;
}
