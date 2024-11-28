import type { UploadFile } from "antd/es/upload/interface";

export interface EnhancedUploadFile extends UploadFile {
    // string or binary data
  content?: string;
  errorMessage?: string;
  processingState?: "processing" | "done" | "error";
}
