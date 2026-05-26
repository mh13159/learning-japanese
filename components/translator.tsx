"use client";

import { useEffect, useRef, useState } from "react";
import { Mic, Copy, Play, Check, Languages, AlertTriangle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type Translation = {
  english: string;
  japanese: string;
  hiragana: string;
  katakana: string;
  kana: string;
  romaji: string;
  meta: {
    detected: "english" | "romaji" | "japanese" | "audio";
    confidence: number;
    provider: string;
    cached: boolean;
    notes?: string[];
  };
};

const EMPTY: Translation = {
  english: "",
  japanese: "",
  hiragana: "",
  katakana: "",
  kana: "",
  romaji: "",
  meta: { detected: "english", confidence: 0, provider: "none", cached: false },
};

export function Translator() {
  const [inputText, setInputText] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [result, setResult] = useState<Translation>(EMPTY);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const trimmed = inputText.trim();
    if (!trimmed) {
      setResult(EMPTY);
      setError(null);
      setLoading(false);
      return;
    }

    // Cancel any in-flight request and clear stale output immediately so the
    // user doesn't see the previous query's translation while waiting for
    // the new one. Loading spinners appear in each card.
    abortRef.current?.abort();
    setLoading(true);
    setError(null);
    setResult(EMPTY);

    const handle = setTimeout(async () => {
      const ctrl = new AbortController();
      abortRef.current = ctrl;
      try {
        const res = await fetch("/api/translate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ input: trimmed }),
          signal: ctrl.signal,
        });
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.error || `Request failed: ${res.status}`);
        }
        const data = (await res.json()) as Translation;
        if (ctrl.signal.aborted) return;
        setResult(data);
      } catch (e) {
        if ((e as Error).name === "AbortError") return;
        setError((e as Error).message);
      } finally {
        if (!ctrl.signal.aborted) setLoading(false);
      }
    }, 700);

    return () => clearTimeout(handle);
  }, [inputText]);

  const handleCopy = async (text: string, field: string) => {
    if (!text) return;
    await navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 1500);
  };

  const handleMicClick = () => {
    if (typeof window === "undefined") return;
    const SpeechRecognition =
      (window as unknown as { SpeechRecognition?: typeof window.SpeechRecognition }).SpeechRecognition ||
      (window as unknown as { webkitSpeechRecognition?: typeof window.SpeechRecognition }).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setError("Speech recognition is not supported in this browser. Try Chrome or Edge.");
      return;
    }
    if (isRecording) {
      setIsRecording(false);
      return;
    }
    const recog = new SpeechRecognition();
    recog.lang = "ja-JP";
    recog.interimResults = false;
    recog.maxAlternatives = 1;
    recog.onresult = (event: SpeechRecognitionEvent) => {
      const transcript = event.results[0]?.[0]?.transcript;
      if (transcript) setInputText(transcript);
    };
    recog.onerror = () => setIsRecording(false);
    recog.onend = () => setIsRecording(false);
    setIsRecording(true);
    recog.start();
  };

  const handlePlay = () => {
    if (!result.japanese || typeof window === "undefined" || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(result.japanese);
    utter.lang = "ja-JP";
    utter.rate = 0.95;
    utter.onstart = () => setIsPlaying(true);
    utter.onend = () => setIsPlaying(false);
    utter.onerror = () => setIsPlaying(false);
    window.speechSynthesis.speak(utter);
  };

  const lowConfidence = !!result.japanese && result.meta.confidence > 0 && result.meta.confidence < 0.7;

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 text-center">
          <div className="mb-2 inline-flex items-center gap-2">
            <Languages className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-semibold tracking-tight text-foreground">
              Japanese Speech Companion
            </h1>
          </div>
          <p className="text-muted-foreground">
            English ⇄ Romaji ⇄ Japanese ⇄ Kana — open-source, offline-capable
          </p>
        </div>

        <div className="mb-6">
          <div className="relative">
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Type English, romaji, or Japanese — or press the mic and speak Japanese…"
              className="min-h-[140px] w-full resize-none rounded-xl border border-border bg-card p-4 pr-16 text-lg text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
            <Button
              size="icon"
              variant={isRecording ? "default" : "secondary"}
              className={`absolute right-3 top-3 h-11 w-11 rounded-full transition-all ${
                isRecording
                  ? "bg-primary text-primary-foreground animate-pulse"
                  : "hover:bg-primary hover:text-primary-foreground"
              }`}
              onClick={handleMicClick}
              aria-label={isRecording ? "Stop recording" : "Start recording"}
            >
              <Mic className="h-5 w-5" />
            </Button>
          </div>
          <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-sm text-muted-foreground">
            <span>
              {isRecording
                ? "Listening (ja-JP)…"
                : loading
                  ? "Translating…"
                  : "Type or speak — auto-detects English, romaji, or Japanese."}
            </span>
            {result.meta.detected && inputText.trim() && (
              <span className="rounded-full bg-secondary px-3 py-0.5 text-xs">
                detected: {result.meta.detected}
                {result.meta.cached && " · cached"}
              </span>
            )}
          </div>
        </div>

        {error && (
          <div className="mb-4 flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
            <AlertTriangle className="h-4 w-4" />
            <span>{error}</span>
          </div>
        )}

        {lowConfidence && (
          <div className="mb-4 flex items-center gap-2 rounded-lg border border-yellow-500/30 bg-yellow-500/10 p-3 text-sm text-yellow-700 dark:text-yellow-300">
            <AlertTriangle className="h-4 w-4" />
            <span>Ambiguous input — please review the output below.</span>
          </div>
        )}

        {result.meta.notes?.map((n) => (
          <div
            key={n}
            className="mb-3 rounded-lg border border-border bg-secondary/40 p-3 text-xs text-muted-foreground"
          >
            {n}
          </div>
        ))}

        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
          <OutputCard
            label="English"
            chip="EN"
            chipClass="bg-secondary text-secondary-foreground"
            value={result.english}
            loading={loading}
            placeholder="English translation appears here…"
            onCopy={() => handleCopy(result.english, "english")}
            copied={copiedField === "english"}
            textClass="text-lg"
          />
          <OutputCard
            label="Japanese (Hyōjungo)"
            chip="日"
            chipClass="bg-primary/10 text-primary"
            value={result.japanese}
            loading={loading}
            placeholder="日本語がここに表示されます…"
            onCopy={() => handleCopy(result.japanese, "japanese")}
            copied={copiedField === "japanese"}
            textClass="text-2xl leading-relaxed"
          />
          <OutputCard
            label="Hiragana"
            chip="あ"
            chipClass="bg-primary/10 text-primary"
            value={result.hiragana}
            loading={loading}
            placeholder="ひらがなで表示されます…"
            onCopy={() => handleCopy(result.hiragana, "hiragana")}
            copied={copiedField === "hiragana"}
            textClass="text-2xl leading-relaxed"
          />
          <OutputCard
            label="Katakana"
            chip="ア"
            chipClass="bg-primary/10 text-primary"
            value={result.katakana}
            loading={loading}
            placeholder="カタカナで表示されます…"
            onCopy={() => handleCopy(result.katakana, "katakana")}
            copied={copiedField === "katakana"}
            textClass="text-2xl leading-relaxed"
          />
          <OutputCard
            label="Romaji (Hepburn)"
            chip="Aa"
            chipClass="bg-secondary text-secondary-foreground"
            value={result.romaji}
            loading={loading}
            placeholder="Romaji will appear here…"
            onCopy={() => handleCopy(result.romaji, "romaji")}
            copied={copiedField === "romaji"}
            textClass="text-lg italic"
          />
        </div>

        <div className="mt-4 flex justify-center">
          <Card className="w-full max-w-md border-border bg-card shadow-sm">
            <CardContent className="flex items-center justify-center gap-4 py-4">
              <Button
                size="lg"
                variant={isPlaying ? "default" : "secondary"}
                className={`h-14 w-14 rounded-full transition-all ${
                  isPlaying
                    ? "bg-primary text-primary-foreground"
                    : "hover:bg-primary hover:text-primary-foreground"
                }`}
                onClick={handlePlay}
                disabled={!result.japanese || isPlaying}
                aria-label={isPlaying ? "Playing audio" : "Play Japanese pronunciation"}
              >
                <Play className={`h-6 w-6 ${isPlaying ? "animate-pulse" : ""}`} />
              </Button>
              <div className="text-sm text-muted-foreground">
                {result.japanese
                  ? isPlaying
                    ? "Speaking…"
                    : "Play Japanese (browser TTS)"
                  : "Audio appears after translation"}
              </div>
            </CardContent>
          </Card>
        </div>

        <p className="mt-8 text-center text-xs text-muted-foreground">
          Open-source pipeline: Kuroshiro + Kuromoji + wanakana (Japanese ↔ kana ↔ romaji) ·
          browser <code>speechSynthesis</code> for audio ·
          optional LibreTranslate for EN ⇄ JA (set <code>LIBRETRANSLATE_URL</code> in <code>.env.local</code>).
        </p>
      </div>
    </div>
  );
}

type OutputCardProps = {
  label: string;
  chip: string;
  chipClass: string;
  value: string;
  loading: boolean;
  placeholder: string;
  onCopy: () => void;
  copied: boolean;
  textClass: string;
};

function OutputCard({
  label,
  chip,
  chipClass,
  value,
  loading,
  placeholder,
  onCopy,
  copied,
  textClass,
}: OutputCardProps) {
  return (
    <Card className="border-border bg-card shadow-sm transition-shadow hover:shadow-md">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between text-sm font-medium text-muted-foreground">
          <div className="flex items-center gap-2">
            <span className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold ${chipClass}`}>
              {chip}
            </span>
            {label}
          </div>
          {value && (
            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8 text-muted-foreground hover:text-primary"
              onClick={onCopy}
              aria-label={`Copy ${label} text`}
            >
              {copied ? <Check className="h-4 w-4 text-primary" /> : <Copy className="h-4 w-4" />}
            </Button>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className={`min-h-[80px] text-foreground ${textClass}`}>
          {loading && !value ? (
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          ) : value ? (
            value
          ) : (
            <span className="not-italic text-muted-foreground/50">{placeholder}</span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
