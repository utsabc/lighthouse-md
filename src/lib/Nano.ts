interface AICapabilities {
  available: "no" | "readily" | string;
  defaultTemperature?: number;
  defaultTopK?: number;
  maxTopK?: number;
}

interface DownloadProgressEvent extends Event {
  loaded: number;
  total: number;
}

interface AIModel {
  ready: Promise<void>;
  addEventListener(
    event: string,
    callback: (e: DownloadProgressEvent) => void
  ): void;
}

interface Summarizer extends AIModel {
  summarize(text: string): Promise<string>;
}

interface ChatSession extends AIModel {
  prompt(text: string): Promise<string>;
}

interface Translator extends AIModel {
  translate(text: string): Promise<string>;
}

interface DetectedLanguage {
  detectedLanguages: string;
  confidence: number;
}

interface LanguageDetector extends AIModel {
  detectLanguage(text: string): Promise<Array<DetectedLanguage>>;
}

interface LanguagePair {
  sourceLanguage: string;
  targetLanguage: string;
}

interface AI {
  summarizer: Summarizer | null;
  chatSession: ChatSession | null;
  translator: Map<string, Translator>;
  languageDetector: LanguageDetector | null;
}

export class GPTNano {
  private readonly SUPPORTED_LANGUAGES: string[] = [
    "ar",
    "bn",
    "de",
    "es",
    "fr",
    "hi",
    "it",
    "ja",
    "ko",
    "nl",
    "pl",
    "pt",
    "ru",
    "th",
    "tr",
    "vi",
    "zh",
    "zh-Hant",
  ];

  private version: string;
  private ai: AI | null;

  constructor() {
    this.version = "1.0.0";
    this.ai = null;
    this.initializeAI();
  }

  public isInitialised(): boolean {
    return this.ai !== null;
  }

  private async initializeAI(): Promise<void> {
    try {
      const status = await ai.languageModel.capabilities();
      if (status.available !== "no") {
        this.ai = {
          summarizer: await this.initialiseSummarizer(),
          chatSession: await this.initialiseChatSession(),
          languageDetector: await this.languageDetector(),
          translator: new Map(),
        };
      }
    } catch (error) {
      console.error("Failed to initialize AI:", error);
    }
  }

  private async initialiseSummarizer(): Promise<Summarizer | null> {
    const canSummarize = await ai.summarizer.capabilities();
    let summarizer: Summarizer | null = null;

    if (canSummarize && canSummarize.available !== "no") {
      if (canSummarize.available === "readily") {
        // The summarizer can immediately be used.
        summarizer = await ai.summarizer.create();
      } else {
        // The summarizer can be used after the model download.
        summarizer = await ai.summarizer.create();
        if (!summarizer) {
          throw new Error("Failed to create summarizer");
        }
        await summarizer.ready;
      }
    } else {
      // The summarizer can't be used at all.
      console.error("Summarizer is not available.");
    }
    return summarizer;
  }

  private async initialiseChatSession(): Promise<ChatSession | null> {
    // Start by checking if it's possible to create a session based on the availability of the model, and the characteristics of the device.
    const { available }: AICapabilities = await ai.languageModel.capabilities();

    let session: ChatSession | null = null;
    if (available !== "no") {
      session = await ai.languageModel.create({
        systemPrompt: "You are a friendly, helpful assistant",
        monitor(m: AIModel) {
          m.addEventListener("downloadprogress", (e: DownloadProgressEvent) => {
            console.log(`Downloaded ${e.loaded} of ${e.total} bytes.`);
          });
        },
      });
    } else {
      console.error("Chat is not available.");
    }
    return session;
  }

  private async languageDetector(): Promise<LanguageDetector | null> {
    const canDetect = await translation.canDetect();
    let detector;
    if (canDetect !== "no") {
      if (canDetect === "readily") {
        // The language detector can immediately be used.
        detector = await translation.createDetector();
        console.log("Detector ready");
      } else {
        // The language detector can be used after the model download.
        detector = await translation.createDetector();
        detector.addEventListener("downloadprogress", (e) => {
          console.log(e.loaded, e.total);
        });
        await detector.ready;
      }
    } else {
      console.error("Language detector is not available.");
    }
    return detector;
  }

  private async initialiseTranslator(
    languagePair: LanguagePair
  ): Promise<Translator | null> {
    const canTranslate = await translation.canTranslate(languagePair);
    let translator: Translator | null = null;

    if (canTranslate !== "no") {
      if (canTranslate === "readily") {
        // The translator can immediately be used.
        translator = await translation.createTranslator(languagePair);
        console.log("Translator ready");
      } else {
        // The translator can be used after the model download.
        translator = await translation.createTranslator(languagePair);
        await translator.ready;
      }
    } else {
      console.error("Translator is not available.");
    }
    return translator;
  }

  private async getTranslationModel(
    sourceLanguage: string,
    targetLanguage: string
  ): Promise<Translator | null> {
    if (!this.ai) return null;

    let translator = this.ai.translator.get(
      `${sourceLanguage}#${targetLanguage}`
    );
    if (translator) {
      return translator;
    }

    if (sourceLanguage === targetLanguage) {
      return null;
    }

    const languagePair: LanguagePair = {
      sourceLanguage,
      targetLanguage,
    };

    translator = await this.initialiseTranslator(languagePair);
    if (translator) {
      this.ai.translator.set(`${sourceLanguage}#${targetLanguage}`, translator);
    }
    return translator;
  }

  public async chat(prompt: string): Promise<string> {
    if (!this.ai?.chatSession) {
      throw new Error("Chat session not initialized");
    }
    const response = await this.ai.chatSession.prompt(prompt);
    return response;
  }

  public async summarize(
    text: string,
    _language: string = "en"
  ): Promise<string> {
    if (!this.ai?.summarizer) {
      throw new Error("Summarizer not initialized");
    }
    const summary = await this.ai.summarizer.summarize(text);
    return summary;
  }

  public async summarizeChunks(chunks: string[]): Promise<string> {
    // Summarize each chunk individually
    const chunkSummaries: string[] = [];
    for (const chunk of chunks) {
      const summary = await this.summarize(chunk);
      chunkSummaries.push(summary);
    }

    let summary: string;

    // If we have multiple summaries, combine them and summarize again
    if (chunkSummaries.length > 1) {
      const combinedSummaries = chunkSummaries.join("\n\n");
      summary = await this.summarize(combinedSummaries);
    } else {
      summary = chunkSummaries[0];
    }

    return summary;
  }

  public async translate(
    text: string,
    { source, target }: { source: string; target: string }
  ): Promise<string> {
    const translator = await this.getTranslationModel(source, target);
    // If the source and target languages are the same, return the original text
    if (!translator) {
      return text;
    }
    const translation = await translator.translate(text);
    return translation;
  }

  public isSupportedLanguage(language: string): boolean {
    return this.SUPPORTED_LANGUAGES.includes(language);
  }
}
