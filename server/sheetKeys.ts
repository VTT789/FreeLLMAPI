const SHEET_URL =
  "https://opensheet.elk.sh/14TIknZTVUyw40Suhj74UzgzXRZaJVX_qg17EeCBsZWM/Sheet1";

const PLATFORM_COLUMN: Record<string, number> = {
  google: 3,
  groq: 4,
  cerebras: 5,
  nvidia: 6,
  mistral: 7,
  openrouter: 8,
  github: 9,
  cohere: 10,
  cloudflare: 11,
  zhipu: 12,
  ollama: 13,
  kilo: 14,
  pollinations: 15,
  llm7: 16,
  huggingface: 17,
  opencode: 18,
  ovh: 19,
  agnes: 20,
  custom: 21
};

export async function getSheetApiKey(platform: string) {
  const res = await fetch(SHEET_URL);
  const rows = await res.json();

  const apiRow = rows.find((row: any) =>
    Object.values(row)[1] === "API"
  );

  if (!apiRow) return null;

  return Object.values(apiRow)[PLATFORM_COLUMN[platform]] || null;
}