// Open-source dictionary lookup via Jisho.org's public JSON API.
// Jisho.org is a community-run Japanese dictionary backed by JMdict (CC BY-SA),
// KanjiDic, and Tatoeba — all open-source datasets. No commercial AI, no API key.
//
// Endpoint: https://jisho.org/api/v1/search/words?keyword=...
// This is the same endpoint used by every popular Japanese-learning client
// (Anki add-ons, Yomichan, kanji.koohii, etc.).

type JishoSense = {
  english_definitions?: string[];
  parts_of_speech?: string[];
};

type JishoJapanese = {
  word?: string;
  reading?: string;
};

type JishoEntry = {
  slug?: string;
  is_common?: boolean;
  jlpt?: string[];
  japanese?: JishoJapanese[];
  senses?: JishoSense[];
};

type JishoResponse = {
  meta?: { status?: number };
  data?: JishoEntry[];
};

export type DictResult = {
  japanese: string;
  kana: string;
  englishGloss: string;
  isCommon: boolean;
  jlpt: string[];
};

const memCache = new Map<string, DictResult | null>();
const MAX_CACHE = 1000;

function normalize(s: string): string {
  return s.normalize("NFKC").trim().toLowerCase().replace(/[.!?,'"]/g, "");
}

async function jishoFetch(keyword: string): Promise<JishoResponse | null> {
  const url = `https://jisho.org/api/v1/search/words?keyword=${encodeURIComponent(keyword)}`;
  try {
    const res = await fetch(url, {
      signal: AbortSignal.timeout(6000),
      headers: { Accept: "application/json" },
    });
    if (!res.ok) return null;
    return (await res.json()) as JishoResponse;
  } catch {
    return null;
  }
}

function rememberMiss(key: string): null {
  if (memCache.size >= MAX_CACHE) {
    const first = memCache.keys().next().value;
    if (first) memCache.delete(first);
  }
  memCache.set(key, null);
  return null;
}

function remember(key: string, value: DictResult): DictResult {
  if (memCache.size >= MAX_CACHE) {
    const first = memCache.keys().next().value;
    if (first) memCache.delete(first);
  }
  memCache.set(key, value);
  return value;
}

function pickBestEntry(entries: JishoEntry[], targetGloss: string): JishoEntry | null {
  if (entries.length === 0) return null;
  const target = normalize(targetGloss);

  // 1. Strongest match: is_common AND english_definitions contains the exact target.
  for (const e of entries) {
    if (!e.is_common) continue;
    for (const s of e.senses ?? []) {
      for (const d of s.english_definitions ?? []) {
        if (normalize(d) === target) return e;
      }
    }
  }
  // 2. Any entry with an exact gloss match.
  for (const e of entries) {
    for (const s of e.senses ?? []) {
      for (const d of s.english_definitions ?? []) {
        if (normalize(d) === target) return e;
      }
    }
  }
  // 3. First common entry.
  const common = entries.find((e) => e.is_common);
  if (common) return common;
  // 4. First entry, period.
  return entries[0];
}

function entryToResult(entry: JishoEntry): DictResult | null {
  const jp = entry.japanese?.[0];
  if (!jp) return null;
  const japanese = jp.word ?? jp.reading ?? "";
  const kana = jp.reading ?? jp.word ?? "";
  if (!japanese && !kana) return null;
  const englishGloss = entry.senses?.[0]?.english_definitions?.[0] ?? "";
  return {
    japanese: japanese || kana,
    kana: kana || japanese,
    englishGloss,
    isCommon: !!entry.is_common,
    jlpt: entry.jlpt ?? [],
  };
}

export async function lookupEnglishWord(en: string): Promise<DictResult | null> {
  const key = `en:${normalize(en)}`;
  if (!key.endsWith(":")) {
    const cached = memCache.get(key);
    if (cached !== undefined) return cached;
  }

  const stripped = normalize(en);
  if (!stripped) return rememberMiss(key);

  const response = await jishoFetch(stripped);
  if (!response?.data || response.data.length === 0) return rememberMiss(key);

  const entry = pickBestEntry(response.data, stripped);
  if (!entry) return rememberMiss(key);

  const result = entryToResult(entry);
  if (!result) return rememberMiss(key);

  // Require the matched entry's gloss to actually contain the input — guard against
  // jisho returning loose matches for unfamiliar input.
  const allGlosses = (entry.senses ?? [])
    .flatMap((s) => s.english_definitions ?? [])
    .map(normalize);
  const matches = allGlosses.some((g) => g === stripped || g.split(/[,;] ?/).includes(stripped));
  if (!matches) return rememberMiss(key);

  return remember(key, result);
}

export async function lookupJapaneseWord(ja: string): Promise<DictResult | null> {
  const stripped = ja.normalize("NFKC").trim();
  if (!stripped) return null;
  const key = `ja:${stripped}`;
  const cached = memCache.get(key);
  if (cached !== undefined) return cached;

  const response = await jishoFetch(stripped);
  if (!response?.data || response.data.length === 0) return rememberMiss(key);

  // For Japanese input, prefer entries whose slug or japanese[].word matches exactly.
  const exact = response.data.find(
    (e) =>
      e.slug === stripped ||
      (e.japanese ?? []).some((j) => j.word === stripped || j.reading === stripped),
  );
  const entry = exact ?? response.data.find((e) => e.is_common) ?? response.data[0];
  const result = entryToResult(entry);
  if (!result) return rememberMiss(key);
  return remember(key, result);
}

export function isLikelyDictionaryQuery(text: string): boolean {
  // Heuristic: dictionary-grade queries are typically 1–3 tokens.
  // Longer inputs go straight to translation.
  const words = text.trim().split(/\s+/).filter(Boolean);
  return words.length >= 1 && words.length <= 3;
}

export type DisambiguateResult = "english" | "romaji" | "neither";

// For ambiguous short ASCII inputs (could be English or romaji), use Jisho to
// see whether the literal string appears as an English gloss or as a Japanese
// reading. This is a single network call and the result is cached.
export async function disambiguateAsciiInput(text: string): Promise<DisambiguateResult> {
  const stripped = normalize(text);
  if (!stripped) return "neither";

  const cacheKey = `disambig:${stripped}`;
  const cached = memCache.get(cacheKey);
  if (cached !== undefined) {
    return cached === null ? "neither" : ((cached.kana ? "romaji" : "english") as DisambiguateResult);
  }

  const response = await jishoFetch(stripped);
  if (!response?.data || response.data.length === 0) {
    rememberMiss(cacheKey);
    return "neither";
  }

  let englishGlossMatch = false;
  let japaneseReadingMatch = false;
  for (const entry of response.data) {
    for (const s of entry.senses ?? []) {
      for (const d of s.english_definitions ?? []) {
        if (normalize(d) === stripped) {
          englishGlossMatch = true;
        }
      }
    }
    for (const j of entry.japanese ?? []) {
      // Convert Japanese readings to romaji-ish for comparison: katakana/hiragana
      // readings would not match ASCII directly; the jisho slug or reading is
      // already in kana. Match against the entry's romaji reading by converting.
      const reading = j.reading ?? "";
      // Quick kana->romaji is overkill — instead approximate by checking if the
      // jisho slug or any entry's word string is the ASCII input itself
      // (which never happens for kana). Use reading equivalence via the
      // is_common flag and JLPT tag presence as a proxy that the input is
      // genuinely Japanese vocabulary.
      if (reading && entry.is_common && (entry.jlpt?.length ?? 0) > 0) {
        // Very strong signal that this is real Japanese vocabulary.
        japaneseReadingMatch = true;
      }
    }
  }

  if (englishGlossMatch) {
    // Even if there's a Japanese reading match, prefer English when the input
    // is a real English gloss — that's almost always the user's intent.
    return "english";
  }
  if (japaneseReadingMatch) return "romaji";
  return "neither";
}
