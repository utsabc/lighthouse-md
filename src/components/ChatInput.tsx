import React from "react";
import { Input, Button } from "antd";
import { SendOutlined } from "@ant-design/icons";

interface ChatInputProps {
  inputText: string;
  setInputText: (text: string) => void;
  handleSend: () => Promise<void>;
  isLoading: boolean;
}

const ChatInput: React.FC<ChatInputProps> = ({
  inputText,
  setInputText,
  handleSend,
  isLoading,
}) => {
  return (
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
  );
};

export default ChatInput;
