import React from "react";
import { Input, Button, Spin } from "antd";
import { SendOutlined } from "@ant-design/icons";

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

/*
  // chat states
  const [inputText, setInputText] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
*/

interface ChatProps {
  isInitializing: boolean;
  messages: Message[];
  inputText: string;
  isLoading: boolean;
  handleSend: () => Promise<void>;
  setInputText: React.Dispatch<React.SetStateAction<string>>;
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>;
}

const ChatPanel: React.FC<ChatProps> = ({
  isInitializing,
  messages,
  inputText,
  setInputText,
  isLoading,
  handleSend,
}) => {
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
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${
              message.sender === "user" ? "justify-end" : "justify-start"
            }`}
          >
            <div
              className={`max-w-[70%] rounded-lg p-3 ${
                message.sender === "user"
                  ? "bg-blue-500 text-white"
                  : "bg-gray-100"
              }`}
            >
              <div>{message.text}</div>
              {message.references && (
                <div className="mt-2 text-sm text-gray-600">
                  {message.references.map((ref, index) => (
                    <div key={index} className="mt-1">
                      {ref.ref}: {ref.text}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="flex gap-2">
        <Input
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onPressEnter={handleSend}
          placeholder="Type your message..."
          className="flex-grow"
          disabled={isLoading}
        />
        <Button
          type="primary"
          icon={<SendOutlined />}
          onClick={handleSend}
          loading={isLoading}
        >
          Send
        </Button>
      </div>
    </div>
  );
};

export default ChatPanel;
