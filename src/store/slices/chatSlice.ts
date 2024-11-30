import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { Message } from "../../types";

interface ChatState {
  messages: Message[];
  inputText: string;
}

const initialState: ChatState = {
  messages: [],
  inputText: "",
};

export const chatSlice = createSlice({
  name: "chat",
  initialState,
  reducers: {
    addMessage: (state, action: PayloadAction<Message>) => {
      state.messages.push(action.payload);
    },
    setInputText: (state, action: PayloadAction<string>) => {
      state.inputText = action.payload;
    },
    clearMessages: (state) => {
      state.messages = [];
    },
  },
});

export const { addMessage, setInputText, clearMessages } = chatSlice.actions;
export default chatSlice.reducer;
