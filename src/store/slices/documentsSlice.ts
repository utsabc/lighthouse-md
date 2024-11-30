import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { EnhancedUploadFile } from "../../types";

interface DocumentsState {
  documents: EnhancedUploadFile[];
  combinedSummary: string;
  isAnyDocumentLoading: boolean;
}

const initialState: DocumentsState = {
  documents: [],
  combinedSummary: "",
  isAnyDocumentLoading: false,
};

export const documentsSlice = createSlice({
  name: "documents",
  initialState,
  reducers: {
    setDocuments: (state, action: PayloadAction<EnhancedUploadFile[]>) => {
      state.documents = action.payload;
      state.isAnyDocumentLoading = action.payload.some((doc) =>
        ["processing", "contentReady", "analyzing"].includes(
          doc.processingState || ""
        )
      );
    },
    updateDocument: (
      state,
      action: PayloadAction<{
        uid: string;
        updates: Partial<EnhancedUploadFile>;
      }>
    ) => {
      const { uid, updates } = action.payload;
      state.documents = state.documents.map((doc) =>
        doc.uid === uid ? { ...doc, ...updates } : doc
      );
      state.isAnyDocumentLoading = state.documents.some((doc) =>
        ["processing", "contentReady", "analyzing"].includes(
          doc.processingState || ""
        )
      );
    },
    setCombinedSummary: (state, action: PayloadAction<string>) => {
      state.combinedSummary = action.payload;
    },
  },
});

export const { setDocuments, updateDocument, setCombinedSummary } =
  documentsSlice.actions;
export default documentsSlice.reducer;
