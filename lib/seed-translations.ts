// Bundled offline EN ⇄ JA phrase dictionary.
// Covers common greetings, courtesies, JLPT N5 essentials, and travel basics.
// Used as a fallback when LIBRETRANSLATE_URL is not configured.
// Honest scope: this is NOT a general translator — it's a curated set of ~120 phrases.
// For arbitrary text, self-host LibreTranslate (see README).

type SeedEntry = { en: string; ja: string };

const SEED: SeedEntry[] = [
  // Greetings
  { en: "hello", ja: "こんにちは" },
  { en: "hi", ja: "やあ" },
  { en: "good morning", ja: "おはようございます" },
  { en: "good afternoon", ja: "こんにちは" },
  { en: "good evening", ja: "こんばんは" },
  { en: "good night", ja: "おやすみなさい" },
  { en: "goodbye", ja: "さようなら" },
  { en: "see you", ja: "またね" },
  { en: "see you later", ja: "また後で" },
  { en: "see you tomorrow", ja: "また明日" },
  { en: "welcome", ja: "ようこそ" },

  // Courtesies
  { en: "thank you", ja: "ありがとう" },
  { en: "thank you very much", ja: "どうもありがとうございます" },
  { en: "thanks", ja: "ありがとう" },
  { en: "you're welcome", ja: "どういたしまして" },
  { en: "please", ja: "お願いします" },
  { en: "excuse me", ja: "すみません" },
  { en: "i'm sorry", ja: "ごめんなさい" },
  { en: "sorry", ja: "ごめん" },
  { en: "no problem", ja: "大丈夫です" },
  { en: "congratulations", ja: "おめでとうございます" },

  // Yes/No
  { en: "yes", ja: "はい" },
  { en: "no", ja: "いいえ" },
  { en: "okay", ja: "オーケー" },
  { en: "of course", ja: "もちろん" },
  { en: "maybe", ja: "たぶん" },
  { en: "i don't know", ja: "分かりません" },
  { en: "i understand", ja: "分かりました" },
  { en: "i don't understand", ja: "分かりません" },

  // Self introduction
  { en: "my name is", ja: "私の名前は" },
  { en: "nice to meet you", ja: "はじめまして" },
  { en: "pleased to meet you", ja: "よろしくお願いします" },
  { en: "how are you", ja: "お元気ですか" },
  { en: "i'm fine", ja: "元気です" },
  { en: "i'm good", ja: "元気です" },
  { en: "and you", ja: "あなたは" },

  // Common questions
  { en: "what", ja: "何" },
  { en: "what is this", ja: "これは何ですか" },
  { en: "what is that", ja: "それは何ですか" },
  { en: "who", ja: "誰" },
  { en: "where", ja: "どこ" },
  { en: "when", ja: "いつ" },
  { en: "why", ja: "なぜ" },
  { en: "how", ja: "どう" },
  { en: "how much", ja: "いくら" },
  { en: "how many", ja: "いくつ" },
  { en: "which", ja: "どちら" },
  { en: "what time is it", ja: "今何時ですか" },
  { en: "where is the bathroom", ja: "トイレはどこですか" },
  { en: "where is the station", ja: "駅はどこですか" },
  { en: "how do you say", ja: "何と言いますか" },
  { en: "do you speak english", ja: "英語を話せますか" },
  { en: "can you help me", ja: "手伝ってもらえますか" },

  // Travel essentials
  { en: "i need help", ja: "助けが必要です" },
  { en: "help", ja: "助けて" },
  { en: "i'm lost", ja: "道に迷いました" },
  { en: "i don't speak japanese", ja: "日本語が話せません" },
  { en: "i speak a little japanese", ja: "少し日本語が話せます" },
  { en: "i'm a student", ja: "学生です" },
  { en: "i'm a tourist", ja: "観光客です" },
  { en: "from america", ja: "アメリカから" },
  { en: "i'm from america", ja: "アメリカから来ました" },
  { en: "how much is this", ja: "これはいくらですか" },
  { en: "the bill please", ja: "お会計をお願いします" },
  { en: "water please", ja: "水をください" },
  { en: "delicious", ja: "美味しい" },
  { en: "it's delicious", ja: "美味しいです" },
  { en: "thank you for the meal", ja: "ごちそうさまでした" },
  { en: "let's eat", ja: "いただきます" },
  { en: "cheers", ja: "乾杯" },

  // Time
  { en: "today", ja: "今日" },
  { en: "tomorrow", ja: "明日" },
  { en: "yesterday", ja: "昨日" },
  { en: "now", ja: "今" },
  { en: "later", ja: "後で" },
  { en: "morning", ja: "朝" },
  { en: "afternoon", ja: "午後" },
  { en: "evening", ja: "夕方" },
  { en: "night", ja: "夜" },

  // Numbers
  { en: "one", ja: "一" },
  { en: "two", ja: "二" },
  { en: "three", ja: "三" },
  { en: "four", ja: "四" },
  { en: "five", ja: "五" },
  { en: "six", ja: "六" },
  { en: "seven", ja: "七" },
  { en: "eight", ja: "八" },
  { en: "nine", ja: "九" },
  { en: "ten", ja: "十" },
  { en: "hundred", ja: "百" },
  { en: "thousand", ja: "千" },

  // Pronouns
  { en: "i", ja: "私" },
  { en: "you", ja: "あなた" },
  { en: "he", ja: "彼" },
  { en: "she", ja: "彼女" },
  { en: "we", ja: "私たち" },
  { en: "they", ja: "彼ら" },
  { en: "this", ja: "これ" },
  { en: "that", ja: "それ" },

  // Common verbs / phrases
  { en: "i love you", ja: "愛してる" },
  { en: "i like it", ja: "好きです" },
  { en: "i love japan", ja: "日本が大好きです" },
  { en: "japan is beautiful", ja: "日本は美しいです" },
  { en: "happy birthday", ja: "お誕生日おめでとうございます" },
  { en: "happy new year", ja: "明けましておめでとうございます" },
  { en: "good luck", ja: "頑張って" },
  { en: "do your best", ja: "頑張ってください" },
  { en: "wait a moment", ja: "ちょっと待ってください" },
  { en: "what's your name", ja: "お名前は何ですか" },
  { en: "what do you do", ja: "お仕事は何ですか" },
  { en: "i'm hungry", ja: "お腹が空きました" },
  { en: "i'm tired", ja: "疲れました" },
  { en: "i'm sleepy", ja: "眠いです" },
  { en: "it's cold", ja: "寒いです" },
  { en: "it's hot", ja: "暑いです" },
  { en: "it's raining", ja: "雨が降っています" },
  { en: "beautiful", ja: "美しい" },
  { en: "cute", ja: "かわいい" },
  { en: "cool", ja: "かっこいい" },
  { en: "interesting", ja: "面白い" },
  { en: "fun", ja: "楽しい" },
  { en: "boring", ja: "つまらない" },
  { en: "difficult", ja: "難しい" },
  { en: "easy", ja: "簡単" },

  // Single words common in test inputs
  { en: "japan", ja: "日本" },
  { en: "japanese", ja: "日本語" },
  { en: "english", ja: "英語" },
  { en: "language", ja: "言語" },
  { en: "translator", ja: "翻訳者" },
  { en: "translation", ja: "翻訳" },
  { en: "tokyo", ja: "東京" },
  { en: "kyoto", ja: "京都" },
  { en: "osaka", ja: "大阪" },
  { en: "food", ja: "食べ物" },
  { en: "water", ja: "水" },
  { en: "tea", ja: "お茶" },
  { en: "coffee", ja: "コーヒー" },
  { en: "sushi", ja: "寿司" },
  { en: "ramen", ja: "ラーメン" },
  { en: "book", ja: "本" },
  { en: "school", ja: "学校" },
  { en: "house", ja: "家" },
  { en: "car", ja: "車" },
  { en: "train", ja: "電車" },
  { en: "airport", ja: "空港" },
  { en: "hotel", ja: "ホテル" },
  { en: "restaurant", ja: "レストラン" },
  { en: "friend", ja: "友達" },
  { en: "family", ja: "家族" },
  { en: "love", ja: "愛" },
  { en: "happy", ja: "嬉しい" },
  { en: "sad", ja: "悲しい" },
];

function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFKC")
    .replace(/[.!?,'"]/g, "")
    .trim();
}

const EN_TO_JA = new Map<string, string>();
const JA_TO_EN = new Map<string, string>();
for (const entry of SEED) {
  EN_TO_JA.set(normalize(entry.en), entry.ja);
  if (!JA_TO_EN.has(entry.ja)) JA_TO_EN.set(entry.ja, entry.en);
}

export function seedLookupEnToJa(text: string): string | null {
  return EN_TO_JA.get(normalize(text)) ?? null;
}

export function seedLookupJaToEn(text: string): string | null {
  return JA_TO_EN.get(text.trim()) ?? null;
}

export const SEED_SIZE = SEED.length;
