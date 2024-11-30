import React, { useEffect, useRef, useState } from "react";
import { Layout } from "antd";
import DocumentPanel from "./components/DocumentPanel";
import ChatPanel from "./components/ChatPanel";
import { EnhancedUploadFile, Message } from "./types";
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

  const updateDocumentState = (
    uid: string,
    updates: Partial<EnhancedUploadFile>
  ) => {
    setDocuments((prevDocs) =>
      prevDocs.map((doc) => (doc.uid === uid ? { ...doc, ...updates } : doc))
    );
  };

  const processDocuments = async (docs: EnhancedUploadFile[]) => {
    if (!chatManagerRef.current) return;

    const readyDocs = docs.filter(
      (doc) => doc.content && doc.processingState === "contentReady"
    );

    for (const doc of readyDocs) {
      try {
        // Update state to show vectorization in progress
        updateDocumentState(doc.uid, {
          processingState: "vectorizing",
        });

        await chatManagerRef.current.storeFeatures([doc]);

        // Update state to done after successful vectorization
        updateDocumentState(doc.uid, {
          processingState: "done",
          status: "done",
        });
      } catch (error) {
        console.error(`Failed to process document ${doc.name}:`, error);
        updateDocumentState(doc.uid, {
          processingState: "error",
          status: "error",
          errorMessage:
            error instanceof Error
              ? error.message
              : "Failed to vectorize document",
        });
      }
    }
  };

  return (
    <Layout className="min-h-screen">
      <Content className="flex p-4 gap-4">
        <div className="w-1/3 bg-white rounded-lg shadow-md">
          <DocumentPanel
            fileList={documents}
            setFileList={setDocuments}
            onDocumentsProcessed={processDocuments}
          />
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
