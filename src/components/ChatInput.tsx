import React from "react";
import { Input, Button } from "antd";
import { SendOutlined } from "@ant-design/icons";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import { setInputText } from "../store/slices/chatSlice";

interface ChatInputProps {
  onSend: (text: string) => Promise<void>;
  isLoading: boolean;
  disabled?: boolean;
}

const ChatInput: React.FC<ChatInputProps> = ({
  onSend,
  isLoading,
  disabled,
}) => {
  const dispatch = useAppDispatch();
  const { inputText } = useAppSelector((state) => state.chat);

  const handleSend = async () => {
    if (!inputText.trim() || isLoading || disabled) return;
    await onSend(inputText);
    dispatch(setInputText(""));
  };

  return (
    <div className="flex gap-2">
      <Input
        value={inputText}
        onChange={(e) => dispatch(setInputText(e.target.value))}
        onPressEnter={handleSend}
        placeholder={
          disabled
            ? "Chat initialization in progress..."
            : "Type your message..."
        }
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
