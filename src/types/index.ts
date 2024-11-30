import type { UploadFile } from "antd/es/upload/interface";
export interface Message {
  id: number;
  text: string;
  sender: string;
  timestamp: string;
  references?: {
    text: string;
    ref?: string;
    name?: string;
  }[];
}

export interface EnhancedUploadFile extends UploadFile {
  // string or binary data
  base64Content?: string;
  errorMessage?: string;
  summary?: string;
  processingState?:
    | "processing"
    | "contentReady"
    | "analyzing"
    | "done"
    | "error";
}
