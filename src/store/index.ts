// src/store/index.ts
import { configureStore } from "@reduxjs/toolkit";
import documentsReducer from "./slices/documentsSlice";
import chatReducer from "./slices/chatSlice";
import uiReducer from "./slices/uiSlice";
import chatServiceReducer from "./slices/chatServiceSlice";

export const store = configureStore({
  reducer: {
    documents: documentsReducer,
    chat: chatReducer,
    ui: uiReducer,
    chatService: chatServiceReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;