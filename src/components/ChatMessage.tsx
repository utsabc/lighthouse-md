import React from "react";
import ReferencePopup from "./ReferencePopup";
import { Message } from "../types";
import Markdown from "react-markdown";

interface ChatMessageProps {
  message: Message;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  const isAI = message.sender === "ai";

  return (
    <div className={`flex ${isAI ? "justify-start" : "justify-end"}`}>
      <div
        className={`max-w-[70%] rounded-lg p-3 ${
          isAI ? "bg-red-50 border border-red-100" : "bg-red-500 text-white"
        }`}
      >
        <Markdown className="whitespace-pre-wrap">{message.text}</Markdown>
        {isAI && <ReferencePopup message={message} />}
      </div>
    </div>
  );
};

export default ChatMessage;
