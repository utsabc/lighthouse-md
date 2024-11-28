import type { UploadFile } from "antd/es/upload/interface";
export interface Message {
  id: number;
  text: string;
  sender: "user" | "ai";
  timestamp: Date;
  references?: {
    text: string;
    ref: string;
    name: string;
  }[];
}

export interface EnhancedUploadFile extends UploadFile {
  // string or binary data
  content?: string;
  errorMessage?: string;
  processingState?:
    | "processing"
    | "contentReady"
    | "vectorizing"
    | "done"
    | "error";
}
