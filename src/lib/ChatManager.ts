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

  constructor() {
    this.vectorDb = new VectorDatabase();
    this.gptNano = new GPTNano();
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
  private async getDynamicPageChunks(
    content: string,
    maxTokensPerChunk = 4090
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

  private async getRelevantContexts(
    query: string,
    isGeneralQuery: boolean
  ): Promise<ChatReference[]> {
    const messageEmbeddingResult = await extractFeatures(query);

    // Get more results for general queries
    const numResults = isGeneralQuery ? 30 : 10;

    const relevantDocs = await this.vectorDb.searchSimilar(
      messageEmbeddingResult,
      "cosineSimilarity",
      numResults
    );

    // Group by filename to consolidate references
    const groupedByFile = new Map<string, string[]>();

    relevantDocs.forEach((doc) => {
      const filename = doc.metadata.filename as string;
      if (!groupedByFile.has(filename)) {
        groupedByFile.set(filename, []);
      }
      groupedByFile.get(filename)?.push(doc.metadata.text as string);
    });

    // Convert to ChatReference format
    let refIndex = 1;
    const references: ChatReference[] = [];

    for (const [filename, texts] of groupedByFile.entries()) {
      // For general queries, combine all texts from the same file
      if (isGeneralQuery) {
        references.push({
          text: texts.join("\n\n"),
          ref: `[${refIndex}]`,
          name: filename,
        });
        refIndex++;
      } else {
        // For specific queries, keep separate references
        texts.forEach((text) => {
          references.push({
            text,
            ref: `[${refIndex}]`,
            name: filename,
          });
          refIndex++;
        });
      }
    }

    return references;
  }

  // ... other methods remain similar but with proper TypeScript types ...

  public async chat(userMessage: string): Promise<ChatResponse> {
    try {
      const isGeneralQuery = false;
      const contextWithRefs = await this.getRelevantContexts(
        userMessage,
        isGeneralQuery
      );

      const context = contextWithRefs
        .map((c) => `${c.text} ${c.ref}`)
        .join("\n\n");

      const prompt = `Using this context from the documents: 
        
${context}

Please answer: ${userMessage}

If the context doesn't provide sufficient relevant information for a complete answer, please let me know.`;

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
