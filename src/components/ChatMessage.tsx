import React from "react";
import ReferencePopup from "./ReferencePopup";
import { Message } from "../types";

interface ChatMessageProps {
  message: Message;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  const isAI = message.sender === "ai";

  return (
    <div className={`flex ${isAI ? "justify-start" : "justify-end"}`}>
      <div
        className={`max-w-[70%] rounded-lg p-3 ${
          isAI ? "bg-gray-100" : "bg-blue-500 text-white"
        }`}
      >
        <div className="whitespace-pre-wrap">{message.text}</div>
        {isAI && <ReferencePopup message={message} />}
      </div>
    </div>
  );
};

export default ChatMessage;
