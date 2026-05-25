declare module "kuroshiro" {
  interface ConvertOptions {
    to?: "hiragana" | "katakana" | "romaji";
    mode?: "normal" | "spaced" | "okurigana" | "furigana";
    romajiSystem?: "nippon" | "passport" | "hepburn";
    delimiter_start?: string;
    delimiter_end?: string;
  }

  interface Analyzer {
    init(): Promise<void>;
    parse(str: string): Promise<unknown[]>;
  }

  class Kuroshiro {
    constructor();
    init(analyzer: Analyzer): Promise<void>;
    convert(str: string, options?: ConvertOptions): Promise<string>;
  }

  export default Kuroshiro;
}

declare module "kuroshiro-analyzer-kuromoji" {
  interface AnalyzerOptions {
    dictPath?: string;
  }
  class KuromojiAnalyzer {
    constructor(options?: AnalyzerOptions);
    init(): Promise<void>;
    parse(str: string): Promise<unknown[]>;
  }
  export default KuromojiAnalyzer;
}
