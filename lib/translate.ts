import Kuroshiro from "kuroshiro";
import KuromojiAnalyzer from "kuroshiro-analyzer-kuromoji";
import * as wanakana from "wanakana";
import {
  lookupEnglishWord,
  lookupJapaneseWord,
  isLikelyDictionaryQuery,
  disambiguateAsciiInput,
} from "./dictionary";

export type DetectedType = "english" | "romaji" | "japanese";

export type Translation = {
  english: string;
  japanese: string;
  hiragana: string;
  katakana: string;
  /** @deprecated kept for backward compat — equals `hiragana` */
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

const RX_JP_CHARS = /[぀-ゟ゠-ヿ一-鿿豈-﫿]/;

// English common vocabulary (~120 entries) — used ONLY for the input-type detector,
// not for translation. Detection is heuristic; translation is delegated to
// open-source services (Jisho.org JMdict + LibreTranslate).
const ENGLISH_COMMON = new Set([
  "the","a","an","is","are","was","were","i","you","he","she","it","we","they",
  "and","or","but","not","of","in","on","at","to","for","with","this","that",
  "have","has","had","do","does","did","be","been","being","go","going","went",
  "what","how","where","when","why","who","which","my","your","his","her",
  "their","our","its","me","him","us","them","would","could","should","will",
  "shall","may","might","must","can","like","want","need","know","think","make",
  "made","get","got","take","took","give","gave","see","saw","come","came",
  "hello","hi","yes","no","please","thanks","thank","sorry","ok","okay",
  "from","by","about","into","over","under","through","between","after","before",
  "very","really","just","also","still","again","always","never","now","then",
  "next","summer","winter","spring","autumn","fall","day","night","year","month",
  "week","mountain","mount","city","country","beautiful","nice","good","bad",
  "happy","sad","love","tired","sleepy","hungry","cold","hot","big","small",
]);

// Romaji-only tokens that are unambiguous Japanese vocabulary or particles.
// Used ONLY for detection.
const ROMAJI_TOKENS = new Set([
  "wa","ga","wo","ni","de","no","to","mo","ka","ne","yo",
  "desu","masu","deshita","datta","desune","desuyo","kudasai",
  "konnichiwa","ohayou","sayounara","sumimasen","sayonara","onegai","onegaishimasu",
  "imasu","arimasu","watashi","anata","kare","kanojo","kore","sore","are",
  "nan","nani","dare","doko","itsu","naze","dou","ikura","ikutsu",
  "arigatou","arigato","gozaimasu","hai","iie",
]);

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

export type DetectSyncResult = DetectedType | "ambiguous";

export function detectSync(text: string): DetectSyncResult {
  const t = text.trim();
  if (!t) return "english";
  if (RX_JP_CHARS.test(t)) return "japanese";
  if (!/^[\x00-\x7F]+$/.test(t)) return "english";

  const cleanWords = t
    .toLowerCase()
    .split(/\s+/)
    .map((w) => w.replace(/[^a-z]/g, ""))
    .filter(Boolean);
  if (cleanWords.length === 0) return "english";

  const englishHits = cleanWords.filter((w) => ENGLISH_COMMON.has(w)).length;
  const romajiHits = cleanWords.filter((w) => ROMAJI_TOKENS.has(w)).length;

  if (cleanWords.length >= 3) {
    if (englishHits > romajiHits) return "english";
    if (romajiHits > englishHits) return "romaji";
  }
  if (englishHits > 0 && romajiHits === 0) return "english";
  if (romajiHits > 0 && englishHits === 0) return "romaji";

  const ascii = cleanWords.join("");
  if (!/^[aeiouknhmrstzpbgdwyfjvch]+$/.test(ascii)) return "english";
  const hasEnglishCluster = /(th|ph|wh|ck|ng|gh|qu|ld|mp|nd|nt|rk|rt|rm|sm|sp|st|ld|lk|lp|lf|sk|sl|sw|tr|br|cr|dr|fr|gr|pr|wr|bl|cl|fl|gl|pl|rr|ll|ff|mm|dd|ww|bb|ee|oo)/.test(ascii);
  if (hasEnglishCluster) return "english";
  // Unambiguous Japanese syllable patterns only. "ou", "ei", "aa", "ii", "uu"
  // also occur in English words (house, vein, etc.) so we exclude them here
  // and let the async dictionary tiebreaker resolve such cases.
  const hasJapanesePhonotactics = /(tsu|cha|chi|cho|chu|sha|shi|sho|shu|kyo|kya|kyu|ryo|rya|ryu|nyo|nya|nyu|gyo|gya|gyu|hyo|hya|hyu|nn)/.test(ascii);
  if (hasJapanesePhonotactics) return "romaji";
  return "ambiguous";
}

export function detectInputType(text: string): DetectedType {
  const t = text.trim();
  if (!t) return "english";
  if (RX_JP_CHARS.test(t)) return "japanese";

  if (!/^[\x00-\x7F]+$/.test(t)) return "english";

  const cleanWords = t
    .toLowerCase()
    .split(/\s+/)
    .map((w) => w.replace(/[^a-z]/g, ""))
    .filter(Boolean);
  if (cleanWords.length === 0) return "english";

  const englishHits = cleanWords.filter((w) => ENGLISH_COMMON.has(w)).length;
  const romajiHits = cleanWords.filter((w) => ROMAJI_TOKENS.has(w)).length;

  if (cleanWords.length >= 3) {
    if (englishHits > romajiHits) return "english";
    if (romajiHits > englishHits) return "romaji";
  }

  if (englishHits > 0 && romajiHits === 0) return "english";
  if (romajiHits > 0 && englishHits === 0) return "romaji";

  // Tiebreaker for short, unknown inputs: distinguish romaji from English by
  // Japanese phonotactic signal — strict CV (consonant-vowel) structure, no
  // consonant clusters except specific digraphs, and ≥3 vowels for words that
  // are long enough to be romanized Japanese vocabulary.
  const ascii = cleanWords.join("");
  if (!/^[aeiouknhmrstzpbgdwyfjvch]+$/.test(ascii)) return "english";

  const vowels = (ascii.match(/[aeiou]/g) ?? []).length;
  const hasJapanesePhonotactics = /(tsu|cha|chi|cho|chu|sha|shi|sho|shu|kyo|kya|kyu|ryo|rya|ryu|nyo|nya|nyu|gyo|gya|gyu|hyo|hya|hyu|jya|jyo|jyu|byu|byo|bya|pyo|pyu|pya|myu|myo|mya|ou|ei|aa|ii|uu|nn)/.test(ascii);
  // English-only consonant clusters and digraphs (none of these occur in romaji).
  const hasEnglishCluster = /(th|ph|wh|ck|ng|gh|qu|ld|mp|nd|nt|rk|rt|rm|sm|sp|st|ld|lk|lp|lf|sk|sl|sw|tr|br|cr|dr|fr|gr|pr|wr|bl|cl|fl|gl|pl|rr|ll|ff|mm|dd|ww|bb|ee|oo)/.test(ascii);

  if (hasEnglishCluster) return "english";
  if (hasJapanesePhonotactics && vowels >= 2) return "romaji";
  if (vowels >= 3 && cleanWords.length === 1 && ascii.length >= 5) return "romaji";
  return "english";
}

// Algorithmic orthography fix for romaji input: when wanakana produces kana
// using the strict-phonetic rule (e.g. "konnichiwa" → こんにちわ), restore
// the particle exceptions that real Japanese uses (は for the topic-marker
// wa, へ for the direction-marker e, を for the object-marker o).
// This is rule-based, not a lookup table.
function fixRomajiParticleKana(kana: string, originalRomaji: string): string {
  const lower = originalRomaji.toLowerCase().trim();
  let out = kana;
  // Trailing "wa" preceded by a space-or-particle position → は
  // Common cases: "konnichiwa" (greeting), "kore wa", "watashi wa", "X wa".
  // wanakana renders trailing "wa" as わ; the canonical form for the particle
  // and the greeting suffix is は.
  if (/(^|\s)(konnichiwa|konbanwa|kombanwa)$/.test(lower)) {
    out = out.replace(/わ$/, "は");
  }
  // Standalone trailing " wa" particle.
  out = out.replace(/(\S)\s?わ($|\s|、|。)/g, (_m, before, after) => `${before}は${after}`);
  // Trailing " wo" or " o" object-marker particle → を (wanakana already does
  // を for "wo" but renders bare "o" as お — handle the "o" particle case).
  out = out.replace(/(\S)\sお($|\s|、|。)/g, (_m, before, after) => `${before}を${after}`);
  // " he" direction marker → へ (wanakana gives へ correctly for "he", noop
  // here but kept for symmetry).
  out = out.replace(/(\S)\sえ($|\s|、|。)/g, (_m, before, after) => `${before}へ${after}`);
  return out;
}

async function processJapanese(text: string) {
  const k = await getKuroshiro();
  const [hiragana, katakana, romaji] = await Promise.all([
    k.convert(text, { to: "hiragana" }),
    k.convert(text, { to: "katakana" }),
    k.convert(text, { to: "romaji", romajiSystem: "hepburn" }),
  ]);
  return { japanese: text, hiragana, katakana, kana: hiragana, romaji };
}

async function processRomaji(originalRomaji: string) {
  let kana = wanakana.toKana(originalRomaji);
  kana = fixRomajiParticleKana(kana, originalRomaji);
  // Strip any leftover ASCII characters that wanakana couldn't map
  // (e.g. trailing punctuation that survived).
  const kanaOnly = kana.replace(/[A-Za-z]/g, "");
  const k = await getKuroshiro();
  const [hiragana, katakana, standardRomaji] = await Promise.all([
    k.convert(kanaOnly, { to: "hiragana" }),
    k.convert(kanaOnly, { to: "katakana" }),
    k.convert(kanaOnly, { to: "romaji", romajiSystem: "hepburn" }),
  ]);
  return {
    japanese: kanaOnly,
    hiragana,
    katakana,
    kana: hiragana,
    romaji: standardRomaji || originalRomaji,
  };
}

type LibreTranslateOptions = {
  source: "en" | "ja";
  target: "en" | "ja";
};

async function libreTranslate(
  text: string,
  opts: LibreTranslateOptions,
): Promise<string | null> {
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
      // NLLB-200 on CPU takes ~5-10s per inference. Allow generous headroom
      // for queued requests when the user types fast.
      signal: AbortSignal.timeout(60000),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { translatedText?: string };
    return data.translatedText ?? null;
  } catch {
    return null;
  }
}

// Two-tier EN→JA: dictionary first (jisho/JMdict) for short queries that look
// like vocabulary lookups; LibreTranslate for sentences or when the dictionary
// has no confident match.
async function resolveEnToJa(text: string): Promise<{ ja: string; source: string } | null> {
  if (isLikelyDictionaryQuery(text)) {
    const dict = await lookupEnglishWord(text);
    if (dict?.japanese) {
      return { ja: dict.japanese, source: dict.isCommon ? "jisho(common)" : "jisho" };
    }
  }
  const lt = await libreTranslate(text, { source: "en", target: "ja" });
  if (lt) return { ja: lt, source: "mt-server" };
  return null;
}

async function resolveJaToEn(text: string): Promise<{ en: string; source: string } | null> {
  if (isLikelyDictionaryQuery(text)) {
    const dict = await lookupJapaneseWord(text);
    if (dict?.englishGloss) {
      return { en: dict.englishGloss, source: dict.isCommon ? "jisho(common)" : "jisho" };
    }
  }
  const lt = await libreTranslate(text, { source: "ja", target: "en" });
  if (lt) return { en: lt, source: "mt-server" };
  return null;
}

const memCache = new Map<string, Translation>();
const MAX_CACHE = 500;

export async function translate(rawInput: string): Promise<Translation> {
  const normalized = rawInput.normalize("NFKC").trim();
  if (!normalized) {
    return {
      english: "",
      japanese: "",
      hiragana: "",
      katakana: "",
      kana: "",
      romaji: "",
      meta: { detected: "english", confidence: 0, provider: "none", cached: false },
    };
  }

  const cached = memCache.get(normalized);
  if (cached) return { ...cached, meta: { ...cached.meta, cached: true } };

  const syncResult = detectSync(normalized);
  let detected: DetectedType;
  if (syncResult === "ambiguous") {
    const tiebreak = await disambiguateAsciiInput(normalized);
    detected = tiebreak === "romaji" ? "romaji" : "english";
  } else {
    detected = syncResult;
  }
  const notes: string[] = [];
  const providers: string[] = ["kuroshiro"];

  let english = "";
  let japanese = "";
  let hiragana = "";
  let katakana = "";
  let kana = "";
  let romaji = "";
  let confidence = 0.9;

  if (detected === "japanese") {
    const j = await processJapanese(normalized);
    ({ japanese, hiragana, katakana, kana, romaji } = j);
    const enRes = await resolveJaToEn(japanese);
    if (enRes) {
      english = enRes.en;
      providers.push(enRes.source);
    } else {
      notes.push(
        "English unavailable — neither the dictionary nor the MT server (LIBRETRANSLATE_URL) returned a result. Check that scripts/mt_server.py is running, or retry — it may have been a transient timeout.",
      );
    }
  } else if (detected === "romaji") {
    const j = await processRomaji(normalized);
    ({ japanese, hiragana, katakana, kana, romaji } = j);
    providers.push("wanakana");
    confidence = 0.75;
    const enRes = await resolveJaToEn(japanese);
    if (enRes) {
      english = enRes.en;
      providers.push(enRes.source);
    }
    notes.push(
      "Romaji input has no kanji disambiguation — output uses kana only. Type Japanese directly for kanji-aware output.",
    );
  } else {
    english = normalized;
    const jaRes = await resolveEnToJa(normalized);
    if (jaRes) {
      providers.push(jaRes.source);
      const j = await processJapanese(jaRes.ja);
      ({ japanese, hiragana, katakana, kana, romaji } = j);
    } else {
      notes.push(
        "Japanese unavailable — neither the dictionary nor the MT server (LIBRETRANSLATE_URL) returned a result. Check that scripts/mt_server.py is running, or retry — it may have been a transient timeout.",
      );
      confidence = 0.3;
    }
  }

  const result: Translation = {
    english,
    japanese,
    hiragana,
    katakana,
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

  // Only cache successful translations. A response that produced no Japanese
  // output (dictionary miss + MT server unavailable / timed out) should not
  // be sticky — the user should be able to retry once the underlying issue
  // is resolved.
  const isSuccess =
    detected === "japanese"
      ? !!japanese && (!!english || !process.env.LIBRETRANSLATE_URL)
      : !!japanese && !!hiragana;

  if (isSuccess) {
    if (memCache.size >= MAX_CACHE) {
      const firstKey = memCache.keys().next().value;
      if (firstKey) memCache.delete(firstKey);
    }
    memCache.set(normalized, result);
  }
  return result;
}
