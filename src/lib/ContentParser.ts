import { EnhancedUploadFile } from "../types";
import mammoth from "mammoth";
import readPdf from "react-pdftotext";

export class FileContentParser {
  /**
   * Parse content based on file type
   */
  static async parseFileContent(file: File): Promise<string> {
    switch (file.type) {
      case "application/pdf":
        return await FileContentParser.parsePdfContent(file);
      case "application/msword": // .doc
      case "application/vnd.openxmlformats-officedocument.wordprocessingml.document": // .docx
        return await FileContentParser.parseWordContent(file);
      case "text/plain":
        return await FileContentParser.parseTextContent(file);
      default:
        throw new Error(`Unsupported file type: ${file.type}`);
    }
  }

  /**
   * Parse PDF files using react-pdftotext
   */
  private static async parsePdfContent(file: File): Promise<string> {
    try {
      const text = await readPdf(file);
      return text.trim();
    } catch (error) {
      throw new Error(
        `Failed to parse PDF: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  /**
   * Parse Word documents using mammoth
   */
  private static async parseWordContent(file: File): Promise<string> {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const result = await mammoth.extractRawText({ arrayBuffer });
      return result.value.trim();
    } catch (error) {
      throw new Error(
        `Failed to parse Word document: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  /**
   * Parse plain text files
   */
  private static async parseTextContent(file: File): Promise<string> {
    try {
      return await file.text();
    } catch (error) {
      throw new Error(
        `Failed to parse text file: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }
}

/**
 * Utility function to process file content with state management
 */
export async function processFileWithState(
  file: File,
  updateFileState: (uid: string, updates: Partial<EnhancedUploadFile>) => void,
  fileUid: string
): Promise<string> {
  try {
    // Update state to processing
    updateFileState(fileUid, {
      processingState: "processing",
      status: "uploading",
      errorMessage: undefined, // Clear any previous errors
    });

    const content = await FileContentParser.parseFileContent(file);

    // If content was successfully extracted, update state to contentReady
    updateFileState(fileUid, {
      processingState: "contentReady",
      status: "uploading", // Keep status as uploading since we still need to vectorize
      content,
      errorMessage: undefined,
    });

    return content;
  } catch (error) {
    // Update state to error
    updateFileState(fileUid, {
      processingState: "error",
      status: "error",
      errorMessage:
        error instanceof Error ? error.message : "Failed to process file",
    });
    throw error;
  }
}
