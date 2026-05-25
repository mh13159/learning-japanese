import Kuroshiro from "kuroshiro";
import KuromojiAnalyzer from "kuroshiro-analyzer-kuromoji";
import * as wanakana from "wanakana";

export type DetectedType = "english" | "romaji" | "japanese";

export type Translation = {
  english: string;
  japanese: string;
  kana: string;
  romaji: string;
  meta: {
    detected: DetectedType;
    confidence: number;
    provider: string;
    cached: boolean;
    notes?: string[];
  };
};

const RX_JP_CHARS = /[぀-ゟ゠-ヿ一-鿿豈-﫿]/;
const RX_ROMAJI_PARTICLES = /(^|\s)(wa|ga|wo|ni|de|no|to|mo|ka|ne|yo)(\s|$|\?|!|\.|,)/i;
const RX_ROMAJI_ENDINGS = /(desu|masu|deshita|nai|kudasai|imasu|aru|iru|suru|kuru)/i;
const RX_ROMAJI_SYLLABLES = /(ts|ky|sh|ch|ry|ny|my|gy|by|py|hy)[aiueo]|[kstnhmrgzdbpw][aiueo]{1,2}/i;

let kuroshiroPromise: Promise<Kuroshiro> | null = null;

function getKuroshiro(): Promise<Kuroshiro> {
  if (!kuroshiroPromise) {
    kuroshiroPromise = (async () => {
      const k = new Kuroshiro();
      await k.init(new KuromojiAnalyzer());
      return k;
    })();
  }
  return kuroshiroPromise;
}

export function detectInputType(text: string): DetectedType {
  const t = text.trim();
  if (!t) return "english";
  if (RX_JP_CHARS.test(t)) return "japanese";

  const asciiOnly = /^[\x00-\x7F]+$/.test(t);
  if (!asciiOnly) return "english";

  const romajiScore =
    (RX_ROMAJI_PARTICLES.test(t) ? 2 : 0) +
    (RX_ROMAJI_ENDINGS.test(t) ? 2 : 0) +
    (RX_ROMAJI_SYLLABLES.test(t) ? 1 : 0);

  const words = t.toLowerCase().split(/\s+/);
  const englishCommon = new Set([
    "the","a","an","is","are","was","were","i","you","he","she","it","we","they",
    "and","or","but","not","of","in","on","at","to","for","with","this","that",
    "have","has","do","does","did","be","been","being","go","going","what","how",
    "where","when","why","who","hello","hi","yes","no","please","thanks","thank",
  ]);
  const englishHits = words.filter((w) => englishCommon.has(w.replace(/[^a-z]/g, ""))).length;

  if (englishHits >= 1 && romajiScore < 2) return "english";
  if (romajiScore >= 1) return "romaji";
  return "english";
}

async function processJapanese(text: string) {
  const k = await getKuroshiro();
  const [kana, romaji] = await Promise.all([
    k.convert(text, { to: "hiragana" }),
    k.convert(text, { to: "romaji", romajiSystem: "hepburn" }),
  ]);
  return { japanese: text, kana, romaji };
}

async function processRomaji(text: string) {
  const kana = wanakana.toKana(text);
  return processJapanese(kana);
}

type LibreTranslateOptions = {
  source: "en" | "ja";
  target: "en" | "ja";
};

async function libreTranslate(text: string, opts: LibreTranslateOptions): Promise<string | null> {
  const baseUrl = process.env.LIBRETRANSLATE_URL?.replace(/\/$/, "");
  if (!baseUrl) return null;

  const body: Record<string, string> = {
    q: text,
    source: opts.source,
    target: opts.target,
    format: "text",
  };
  const apiKey = process.env.LIBRETRANSLATE_API_KEY;
  if (apiKey) body.api_key = apiKey;

  try {
    const res = await fetch(`${baseUrl}/translate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { translatedText?: string };
    return data.translatedText ?? null;
  } catch {
    return null;
  }
}

const memCache = new Map<string, Translation>();
const MAX_CACHE = 500;

export async function translate(rawInput: string): Promise<Translation> {
  const normalized = rawInput.normalize("NFKC").trim();
  if (!normalized) {
    return {
      english: "",
      japanese: "",
      kana: "",
      romaji: "",
      meta: {
        detected: "english",
        confidence: 0,
        provider: "none",
        cached: false,
      },
    };
  }

  const cached = memCache.get(normalized);
  if (cached) return { ...cached, meta: { ...cached.meta, cached: true } };

  const detected = detectInputType(normalized);
  const notes: string[] = [];
  const providers: string[] = ["kuroshiro"];

  let english = "";
  let japanese = "";
  let kana = "";
  let romaji = "";
  let confidence = 0.9;

  if (detected === "japanese") {
    const j = await processJapanese(normalized);
    ({ japanese, kana, romaji } = j);
    const en = await libreTranslate(japanese, { source: "ja", target: "en" });
    if (en) {
      english = en;
      providers.push("libretranslate");
    } else {
      notes.push("English unavailable — set LIBRETRANSLATE_URL to enable JA→EN.");
    }
  } else if (detected === "romaji") {
    const j = await processRomaji(normalized);
    ({ japanese, kana, romaji } = j);
    providers.push("wanakana");
    confidence = 0.7;
    notes.push("Romaji input lacks kanji disambiguation — output uses kana only.");
    const en = await libreTranslate(japanese, { source: "ja", target: "en" });
    if (en) {
      english = en;
      providers.push("libretranslate");
    }
  } else {
    english = normalized;
    const ja = await libreTranslate(normalized, { source: "en", target: "ja" });
    if (ja) {
      providers.push("libretranslate");
      const j = await processJapanese(ja);
      ({ japanese, kana, romaji } = j);
    } else {
      notes.push("Japanese unavailable — set LIBRETRANSLATE_URL to enable EN→JA.");
      confidence = 0.3;
    }
  }

  const result: Translation = {
    english,
    japanese,
    kana,
    romaji,
    meta: {
      detected,
      confidence,
      provider: providers.join("+"),
      cached: false,
      notes: notes.length ? notes : undefined,
    },
  };

  if (memCache.size >= MAX_CACHE) {
    const firstKey = memCache.keys().next().value;
    if (firstKey) memCache.delete(firstKey);
  }
  memCache.set(normalized, result);
  return result;
}
