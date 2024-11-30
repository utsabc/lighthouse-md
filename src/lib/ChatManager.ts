import removeMd from "remove-markdown";
import { splitContent } from "./ContentSplitter";
import { extractFeatures } from "./FeatureExtractor";
import { GPTNano } from "./GeminiNano";
import { VectorDatabase } from "./VectorStore";

// Types for chat responses and references
interface ChatReference {
  text: string;
  ref?: string;
  name?: string;
}

interface ChatResponse {
  text: string;
  references: ChatReference[];
}

export class ChatManager {
  private vectorDb: VectorDatabase;
  private gptNano: GPTNano;
  private initialized: boolean;

  constructor() {
    this.vectorDb = new VectorDatabase();
    this.gptNano = new GPTNano();
    this.initialized = false;
  }

  public async initialize(): Promise<void> {
    try {
      await this.vectorDb.init();
      await this.vectorDb.clearDatabase();

      await new Promise<void>((resolve) => {
        const checkInit = () => {
          if (this.gptNano.isInitialised()) {
            resolve();
          } else {
            setTimeout(checkInit, 100);
          }
        };
        checkInit();
      });

      this.initialized = true;
      console.log("ChatManager successfully initialized");
    } catch (error) {
      console.error("ChatManager initialization error:", error);
      throw new Error(
        `Failed to initialize chat system: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  public isInitialized(): boolean {
    return this.initialized;
  }

  private async getDynamicPageChunks(
    content: string,
    maxTokensPerChunk = 4070
  ) {
    // Estimate the number of tokens in the content
    const estimatedTokens = Math.ceil(content.length / 4);

    // Calculate the number of chunks needed
    const numChunks = Math.ceil(estimatedTokens / maxTokensPerChunk);

    // Split content into chunks
    const chunkSize = Math.ceil(content.length / numChunks);
    const chunks = await splitContent(content, {
      chunkSize: chunkSize,
      chunkOverlap: 20,
    });
    return chunks;
  }

  public async updateAndStoreSummaryVectors(summary: string) {
    await this.vectorDb.clearDatabase();

    const textSummary = removeMd(summary);

    const chunks = await this.getDynamicPageChunks(textSummary);

    for (const chunk of chunks) {
      const features = await extractFeatures(chunk.text);
      await this.vectorDb.addRecord(
        {
          text: chunk.text,
          ...chunk.metadata,
        },
        features
      );
    }
  }

  public async getRelevantContexts(userMessage: string) {
    const features = await extractFeatures(userMessage);

    const contextWithRefs = await this.vectorDb.searchSimilar(
      features,
      "cosineSimilarity",
      3
    );

    return contextWithRefs;
  }

  async detectLanguage(text: string): Promise<string> {
    try {
      const detectedLanguage = await this.gptNano.detectLanguage(text);

      if (detectedLanguage) {
        return detectedLanguage;
      } else {
        console.error("No language detected");
        return "";
      }
    } catch (error: unknown) {
      console.error("Language detection error:", error);
      throw new Error("Failed to detect language: " + error);
    }
  }

  public async chat(userMessage: string): Promise<ChatResponse> {
    try {
      if (!this.gptNano.isInitialised()) {
        throw new Error("Chat system not fully initialized");
      }

      const contextWithRefs = await this.getRelevantContexts(userMessage);

      const context = contextWithRefs
        .map((c) => `${c.metadata.text}`)
        .join("\n");

      const prompt = `Using this context from the documents: 
        
${context}

Please answer: ${userMessage}

If the context doesn't provide sufficient relevant information for a complete answer, please let me know.`;

      const response = await this.gptNano.chat(prompt);

      return {
        text: response,
        references: contextWithRefs.map(
          (c) =>
            ({
              text: c.metadata.text,
            } as ChatReference)
        ),
      };
    } catch (error) {
      console.error("Chat error:", JSON.stringify(error));
      throw new Error(
        `Failed to process chat: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  async linguisticChat(userMessage: string): Promise<ChatResponse> {
    // Get the language of the user message
    const userLanguage = await this.detectLanguage(userMessage);
    if (!userLanguage) {
      throw new Error("Failed to detect language of user message");
    }

    if (userLanguage === "en") {
      // If the user message is already in English, chat directly
      return this.chat(userMessage);
    }

    if (!this.gptNano.isSupportedLanguage(userLanguage)) {
      throw new Error("Unsupported language: " + userLanguage);
    }

    // Translate the user message to English
    const englishMessage = await this.gptNano.translate(userMessage, {
      source: userLanguage,
      target: "en",
    });
    if (!englishMessage) {
      throw new Error("Translation failed");
    }

    // Chat with the AI
    const aiResponse = await this.chat(englishMessage);

    // Translate the AI response back to the user's language
    const userResponse = await this.gptNano.translate(aiResponse.text, {
      source: "en",
      target: userLanguage,
    });
    if (!userResponse) {
      throw new Error("Translation failed");
    }

    // Translate the references back to the user's language
    const translatedReferences = await Promise.all(
      aiResponse.references.map(async (ref) => {
        const translatedText = await this.gptNano.translate(ref.text, {
          source: "en",
          target: userLanguage,
        });
        return { ...ref, text: translatedText };
      })
    );

    return {
      text: userResponse,
      references: translatedReferences,
    };
  }

  async getEnSummary(content: string) {
    if (!this.gptNano.isInitialised()) {
      throw new Error("Chat system not fully initialized");
    }
    const enSummary = await this.gptNano.summarize(content);
    return enSummary;
  }

  async summarize(content: string, language = "en") {
    try {
      const enSummary = await this.getEnSummary(content);
      if (language === "en") {
        return enSummary;
      }
      const translatedSummary = await this.gptNano.translate(enSummary, {
        source: "en",
        target: language,
      });

      return translatedSummary;
    } catch (error) {
      console.error("Summary error:", JSON.stringify(error));
      throw new Error("Failed to process Summary: " + error);
    }
  }
}
