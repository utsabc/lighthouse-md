import React, { useMemo } from "react";
import { Alert, Spin } from "antd";
import ChatMessage from "./ChatMessage";
import ChatInput from "./ChatInput";
import { useAppSelector, useAppDispatch } from "../store/hooks";
import { addMessage } from "../store/slices/chatSlice";
import { setLoading } from "../store/slices/uiSlice";
import { chatWithDocuments } from "../store/slices/chatServiceSlice";


const ChatPanel: React.FC = () => {

  const dispatch = useAppDispatch();
  const { messages } = useAppSelector((state) => state.chat);
  const { isLoading, isInitializing } = useAppSelector((state) => state.ui);
  const { isInitialized } = useAppSelector((state) => state.chatService);

  const handleSend = async (inputText: string) => {
    if (!inputText.trim() || !isInitialized) return;

    const userMessage = {
      id: Date.now(),
      text: inputText,
      sender: "user",
      timestamp: new Date().toISOString(),
    };

    dispatch(addMessage(userMessage));
    dispatch(setLoading(true));

    try {
      const response = await dispatch(chatWithDocuments(inputText)).unwrap();

      const aiMessage = {
        id: Date.now(),
        text: response.text,
        sender: "ai",
        timestamp: new Date().toISOString(),
        references: response.references,
      };

      dispatch(addMessage(aiMessage));
    } catch (error) {
      console.error("Chat error:", error);
    } finally {
      dispatch(setLoading(false));
    }
  };

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
        <Spin size="large" />
      </div>
    );
  }

  const showInitialDisclaimer = messages.length === 0;
  return (
    <div className="h-full flex flex-col p-4">
      <h2 className="text-xl font-semibold mb-4 flex-none">Chat</h2>

      <div className="flex-1 overflow-y-auto mb-4 space-y-4 min-h-0">
        {showInitialDisclaimer && (
          <Alert
            type="info"
            showIcon
            message="Welcome to Medical Document Assistant"
            description={
              <div className="space-y-2 text-sm">
                <p>
                  This AI assistant can help you understand your medical
                  documents, but remember:
                </p>
                <ul className="list-disc pl-4">
                  <li>All responses are for informational purposes only</li>
                  <li>Verify information with your healthcare provider</li>
                  <li>Not a substitute for professional medical advice</li>
                </ul>
              </div>
            }
            className="mb-4"
          />
        )}
        {messageElements}
      </div>

      <div className="flex-none">
        <ChatInput
          onSend={handleSend}
          isLoading={isLoading}
          disabled={!isInitialized}
        />
      </div>
    </div>
  );
};

export default ChatPanel;
