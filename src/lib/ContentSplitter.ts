import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";

/**
 * Split text content into chunks
 * @param text The text content to split
 * @param config Splitting configuration
 * @returns An array of text chunks
 */

interface SplitContentConfig {
  chunkSize?: number;
  chunkOverlap?: number;
}

export const splitContent = async (
  text: string,
  config: SplitContentConfig = {}
) => {
  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: config.chunkSize || 700,
    chunkOverlap: config.chunkOverlap || 10,
  });

  const chunks = [];

  // Split the text into chunks
  const documents = await splitter.createDocuments([text]);

  for (const doc of documents) {
    const chunkText = doc.pageContent;

    // Store the chunk
    chunks.push({ text: chunkText, metadata: doc.metadata });
  }

  return chunks;
};
