import { EnhancedUploadFile } from "../types";
import { splitContent } from "./ContentSplitter";
import { extractFeatures } from "./FeatureExtractor";
import { GPTNano } from "./Nano";
import { VectorDatabase } from "./VectorStore";

// Types for chat responses and references
interface ChatReference {
  text: string;
  ref: string;
  name: string;
}

interface ChatResponse {
  text: string;
  references: ChatReference[];
}

export class ChatManager {
  private vectorDb: VectorDatabase;
  private gptNano: GPTNano;
  private pageContentProcessed: boolean;
  private pageContent: string;
  private currentUrl: string;
  private enPageContent: string;
  private pageLang?: string;
  private enSummary: string;
  private langSummaries: Map<string, string>;

  constructor() {
    this.vectorDb = new VectorDatabase();
    this.gptNano = new GPTNano();
    this.pageContentProcessed = false;
    this.pageContent = "";
    this.currentUrl = "";
    this.enPageContent = "";
    this.pageLang = undefined;
    this.enSummary = "";
    this.langSummaries = new Map();
  }

  public async initialize(): Promise<void> {
    try {
      await this.vectorDb.init();

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
    } catch (error) {
      console.error("ChatManager initialization error:", error);
      throw new Error(
        `Failed to initialize chat system: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  // const maxTokensPerChunk = 1024 - 26;
  private async getDynamicPageChunks(content: string, maxTokensPerChunk = 998) {
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

  public async storeFeatures(files: EnhancedUploadFile[]): Promise<void> {
    try {
      // Validate all files have content
      if (files.some((file) => !file.content)) {
        throw new Error("Selected files must have content");
      }

      // Process all files
      for (const file of files) {
        const content = file.content as string;
        const chunks = await this.getDynamicPageChunks(content);
        for (const chunk of chunks) {
          const embedding = await extractFeatures(chunk.text);
          this.vectorDb.addRecord(
            {
              filename: file.name,
              fileId: file.uid,
              text: chunk.text,
              ...chunk.metadata,
            },
            embedding
          );
        }
      }
    } catch (error) {
      throw new Error(
        `Failed to process document: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  // ... other methods remain similar but with proper TypeScript types ...

  public async chat(userMessage: string): Promise<ChatResponse> {
    try {
      const messageEmbeddingResult = await extractFeatures(userMessage);

      const relevantDocs = await this.vectorDb.searchSimilar(
        messageEmbeddingResult,
        "cosineSimilarity",
        3
      );

      const contextWithRefs: ChatReference[] = relevantDocs.map(
        (doc, index) =>
          ({
            text: doc.metadata.text,
            ref: `[${index + 1}]`,
            name: doc.metadata.filename,
          } as ChatReference)
      );

      const context = contextWithRefs
        .map((c) => `${c.text} ${c.ref}`)
        .join("\n\n");

      const prompt = `Given the following context from the webpage (${this.currentUrl}): 
      ${context}
      Use relevant information from the context, please respond to ${userMessage}. If the context doesn't contain relevant information to answer the question, please let me know that you don't have enough information from the webpage to answer accurately.`;

      const response = await this.gptNano.chat(prompt);

      return {
        text: response,
        references: contextWithRefs,
      };
    } catch (error) {
      console.error("Chat error:", error);
      throw new Error(
        `Failed to process chat: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }
}
