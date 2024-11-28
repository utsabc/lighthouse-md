import React, { useEffect, useRef, useState } from "react";
import { Layout } from "antd";
import DocumentPanel from "./components/DocumentPanel";
import ChatPanel, { Message } from "./components/ChatPanel";
import { EnhancedUploadFile } from "./types";
import { ChatManager } from "./lib/ChatManager";

const { Content } = Layout;

const App: React.FC = () => {
  const [documents, setDocuments] = useState<EnhancedUploadFile[]>([]);
  const chatManagerRef = useRef<ChatManager | null>(null);

  // chat states
  const [inputText, setInputText] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    const initChatManager = async () => {
      try {
        chatManagerRef.current = new ChatManager();
        await chatManagerRef.current.initialize();
      } catch (error) {
        console.error("Failed to initialize ChatManager:", error);
      } finally {
        setIsInitializing(false);
      }
    };

    initChatManager();
  }, []);

  const handleSend = async () => {
    if (!inputText.trim() || !chatManagerRef.current) return;

    const userMessage: Message = {
      id: Date.now(),
      text: inputText,
      sender: "user",
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputText("");
    setIsLoading(true);

    try {
      const response = await chatManagerRef.current.chat(inputText);

      const aiMessage: Message = {
        id: Date.now(),
        text: response.text,
        sender: "ai",
        timestamp: new Date(),
        references: response.references,
      };

      setMessages((prev) => [...prev, aiMessage]);
    } catch (error) {
      console.error("Chat error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Layout className="min-h-screen">
      <Content className="flex p-4 gap-4">
        <div className="w-1/3 bg-white rounded-lg shadow-md">
          <DocumentPanel fileList={documents} setFileList={setDocuments} />
        </div>
        <div className="w-2/3 bg-white rounded-lg shadow-md">
          <ChatPanel
            isInitializing={isInitializing}
            handleSend={handleSend}
            inputText={inputText}
            isLoading={isLoading}
            messages={messages}
            setInputText={setInputText}
            setIsLoading={setIsLoading}
          />
        </div>
      </Content>
    </Layout>
  );
};

export default App;
