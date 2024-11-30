import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { ChatManager } from "../../lib/ChatManager";

interface ChatServiceState {
  isInitialized: boolean;
  error: string | null;
}

// Create a singleton instance of ChatManager
const chatManagerInstance = new ChatManager();

// Async thunks for ChatManager operations
export const initializeChatManager = createAsyncThunk(
  "chatService/initialize",
  async () => {
    await chatManagerInstance.initialize();
  }
);

export const updateVectorDatabase = createAsyncThunk(
  "chatService/updateVectors",
  async (summary: string) => {
    await chatManagerInstance.updateAndStoreSummaryVectors(summary);
  }
);

export const chatWithDocuments = createAsyncThunk(
  "chatService/chat",
  async (message: string) => {
    return await chatManagerInstance.linguisticChat(message);
  }
);

export const summarizeDocuments = createAsyncThunk(
  "chatService/summarize",
  async (input: { combinedSummaries: string; selectedLanguage: string }) => {
    return await chatManagerInstance.summarize(
      input.combinedSummaries,
      input.selectedLanguage
    );
  }
);

const initialState: ChatServiceState = {
  isInitialized: false,
  error: null,
};

const chatServiceSlice = createSlice({
  name: "chatService",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(initializeChatManager.fulfilled, (state) => {
        state.isInitialized = true;
        state.error = null;
      })
      .addCase(initializeChatManager.rejected, (state, action) => {
        state.error =
          action.error.message || "Failed to initialize chat service";
      });
  },
});

// Export the ChatManager instance for direct access if needed
export const getChatManager = () => chatManagerInstance;

export default chatServiceSlice.reducer;
