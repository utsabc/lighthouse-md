import { EnhancedUploadFile } from "../types";

export class FileContentParser {
  /**
   * Parse content based on file type
   */
  static async parseFileContent(file: File): Promise<string> {
    switch (file.type) {
      case "application/pdf":
        return await FileContentParser.parsePdfContent(file);
      case "image/jpeg":
      case "image/png":
        return await FileContentParser.parseImageContent(file);
      default:
        throw new Error(`Unsupported file type: ${file.type}`);
    }
  }

  /**
   * Parse PDF files to base64 content
   */
  private static async parsePdfContent(file: File): Promise<string> {
    let content: string;
    try {
      const reader = new FileReader();
      content = await new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = () => reject(reader.error);
        reader.readAsDataURL(file);
      });
    } catch (error) {
      throw new Error(
        `Failed to parse PDF: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
    return content;
  }

  /**
   * Parse Image files
   */
  private static async parseImageContent(file: File): Promise<string> {
    let content: string;
    try {
      const reader = new FileReader();
      const compressedFile = await this.compressImage(file);

      content = await new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = () => reject(reader.error);
        reader.readAsDataURL(compressedFile);
      });
    } catch (error) {
      throw new Error(
        `Failed to parse Image: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
    return content;
  }


  private static compressImage(file: File): Promise<File> {

    return new Promise((resolve, ) => {
      const reader = new FileReader();

      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          // Create a canvas with the original dimensions
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d')

          // Set the canvas dimensions to the original image dimensions
          canvas.width = img.width;
          canvas.height = img.height;

          // Draw the image to the canvas
          ctx?.drawImage(img, 0, 0);

          // Appy basic compression
          const quality = 0.1

          const dataURL = canvas.toDataURL('image/jpeg', quality);

          // Convert the data URL to a Blob
          const byteString = atob(dataURL.split(',')[1]);
          const ab = new ArrayBuffer(byteString.length);
          const ia = new Uint8Array(ab);
          for(let i = 0; i<  byteString.length; i++) {
            ia[i]= byteString.charCodeAt(i)
          }

          const compressedFile = new File([ab], file.name, {type: 'image/jpeg'});

          resolve(compressedFile);
        }
        img.src = e.target?.result as string;
      }
      reader.readAsDataURL(file);
    });

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
      base64Content: content,
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
