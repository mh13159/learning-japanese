"use client";

import { useState } from "react";
import { Mic, Copy, Play, Check, Languages } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function Translator() {
  const [inputText, setInputText] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  // Example translations (in a real app, these would come from an API)
  const translations = {
    english: inputText ? "Hello, how are you?" : "",
    japanese: inputText ? "こんにちは、お元気ですか？" : "",
    romaji: inputText ? "Konnichiwa, ogenki desu ka?" : "",
  };

  const handleCopy = async (text: string, field: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleMicClick = () => {
    setIsRecording(!isRecording);
    // In a real app, this would trigger speech recognition
    if (!isRecording) {
      setTimeout(() => {
        setIsRecording(false);
        setInputText("Hello, how are you?");
      }, 2000);
    }
  };

  const handlePlay = () => {
    setIsPlaying(true);
    // In a real app, this would play audio
    setTimeout(() => setIsPlaying(false), 2000);
  };

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="mb-2 inline-flex items-center gap-2">
            <Languages className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-semibold tracking-tight text-foreground">
              Japanese Translator
            </h1>
          </div>
          <p className="text-muted-foreground">
            Translate between English and Japanese instantly
          </p>
        </div>

        {/* Input Section */}
        <div className="mb-8">
          <div className="relative">
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Type in English or Japanese..."
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
          <p className="mt-2 text-sm text-muted-foreground">
            {isRecording
              ? "Listening..."
              : "Click the microphone to speak or type your text above"}
          </p>
        </div>

        {/* Output Cards Grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {/* English Card */}
          <Card className="border-border bg-card shadow-sm transition-shadow hover:shadow-md">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-secondary text-xs font-semibold text-secondary-foreground">
                  EN
                </span>
                English
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="min-h-[80px] text-lg text-foreground">
                {translations.english || (
                  <span className="text-muted-foreground/50">
                    Translation will appear here...
                  </span>
                )}
              </p>
            </CardContent>
          </Card>

          {/* Japanese Card */}
          <Card className="border-border bg-card shadow-sm transition-shadow hover:shadow-md">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center justify-between text-sm font-medium text-muted-foreground">
                <div className="flex items-center gap-2">
                  <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                    日
                  </span>
                  Japanese (Hyojungo)
                </div>
                {translations.japanese && (
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 text-muted-foreground hover:text-primary"
                    onClick={() =>
                      handleCopy(translations.japanese, "japanese")
                    }
                    aria-label="Copy Japanese text"
                  >
                    {copiedField === "japanese" ? (
                      <Check className="h-4 w-4 text-primary" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="min-h-[80px] text-2xl leading-relaxed text-foreground">
                {translations.japanese || (
                  <span className="text-lg text-muted-foreground/50">
                    日本語がここに表示されます...
                  </span>
                )}
              </p>
            </CardContent>
          </Card>

          {/* Romaji Card */}
          <Card className="border-border bg-card shadow-sm transition-shadow hover:shadow-md">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center justify-between text-sm font-medium text-muted-foreground">
                <div className="flex items-center gap-2">
                  <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-secondary text-xs font-semibold text-secondary-foreground">
                    Aa
                  </span>
                  Romaji
                </div>
                {translations.romaji && (
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 text-muted-foreground hover:text-primary"
                    onClick={() => handleCopy(translations.romaji, "romaji")}
                    aria-label="Copy Romaji text"
                  >
                    {copiedField === "romaji" ? (
                      <Check className="h-4 w-4 text-primary" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="min-h-[80px] text-lg italic text-foreground">
                {translations.romaji || (
                  <span className="not-italic text-muted-foreground/50">
                    Romaji will appear here...
                  </span>
                )}
              </p>
            </CardContent>
          </Card>

          {/* Audio Card */}
          <Card className="border-border bg-card shadow-sm transition-shadow hover:shadow-md">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-secondary text-xs">
                  🔊
                </span>
                Audio
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex min-h-[80px] flex-col items-center justify-center">
                {translations.japanese ? (
                  <>
                    <Button
                      size="lg"
                      variant={isPlaying ? "default" : "secondary"}
                      className={`h-14 w-14 rounded-full transition-all ${
                        isPlaying
                          ? "bg-primary text-primary-foreground"
                          : "hover:bg-primary hover:text-primary-foreground"
                      }`}
                      onClick={handlePlay}
                      disabled={isPlaying}
                      aria-label={
                        isPlaying ? "Playing audio" : "Play pronunciation"
                      }
                    >
                      <Play
                        className={`h-6 w-6 ${isPlaying ? "animate-pulse" : ""}`}
                      />
                    </Button>
                    <p className="mt-2 text-sm text-muted-foreground">
                      {isPlaying ? "Playing..." : "Play pronunciation"}
                    </p>
                  </>
                ) : (
                  <p className="text-center text-muted-foreground/50">
                    Audio will be available after translation
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Footer hint */}
        <p className="mt-8 text-center text-sm text-muted-foreground">
          Tip: You can type in either English or Japanese and get translations
          in both directions
        </p>
      </div>
    </div>
  );
}
