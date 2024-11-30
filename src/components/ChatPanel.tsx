import React, { useMemo } from "react";
import { Spin } from "antd";
import ChatMessage from "./ChatMessage";
import ChatInput from "./ChatInput";
import { Message } from "../types";

interface ChatPanelProps {
  isInitializing: boolean;
  messages: Message[];
  inputText: string;
  isLoading: boolean;
  handleSend: () => Promise<void>;
  setInputText: React.Dispatch<React.SetStateAction<string>>;
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>;
}

const ChatPanel: React.FC<ChatPanelProps> = ({
  isInitializing,
  messages,
  inputText,
  setInputText,
  isLoading,
  handleSend,
}) => {
  const messageElements = useMemo(
    () =>
      messages.map((message) => (
        <ChatMessage key={message.id} message={message} />
      )),
    [messages]
  );

  if (isInitializing) {
    return (
      <div className="h-full flex items-center justify-center">
        <Spin size="large" tip="Initializing chat..." />
      </div>
    );
  }

  return (
    <div className="h-full p-4 flex flex-col">
      <h2 className="text-xl font-semibold mb-4">Chat</h2>

      <div className="flex-grow overflow-y-auto mb-4 space-y-4">
        {messageElements}
      </div>

      <ChatInput
        inputText={inputText}
        setInputText={setInputText}
        handleSend={handleSend}
        isLoading={isLoading}
      />
    </div>
  );
};

export default ChatPanel;
