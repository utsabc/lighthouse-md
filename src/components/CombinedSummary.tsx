import React, { useState, useEffect } from "react";
import { Card, Input, Button, message, Space, Select } from "antd";
import {
  EditOutlined,
  CheckOutlined,
  CloseOutlined,
  SendOutlined,
  LoadingOutlined,
} from "@ant-design/icons";
import ReactMarkdown from "react-markdown";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import { setCombinedSummary } from "../store/slices/documentsSlice";
import {
  summarizeDocuments,
  updateVectorDatabase,
} from "../store/slices/chatServiceSlice";
import { addMessage } from "../store/slices/chatSlice";
import { Message } from "../types";

const { TextArea } = Input;
const { Option } = Select;

// Language options mapping
const LANGUAGES = [
  { value: "en", label: "English" },
  { value: "ar", label: "Arabic" },
  { value: "bn", label: "Bengali" },
  { value: "de", label: "German" },
  { value: "es", label: "Spanish" },
  { value: "hi", label: "Hindi" },
  { value: "it", label: "Italian" },
  { value: "ja", label: "Japanese" },
  { value: "nl", label: "Dutch" },
  { value: "pl", label: "Polish" },
  { value: "pt", label: "Portuguese" },
  { value: "ru", label: "Russian" },
  { value: "th", label: "Thai" },
  { value: "tr", label: "Turkish" },
  { value: "vi", label: "Vietnamese" },
  { value: "zh", label: "Chinese (Simplified)" },
  { value: "zh-Hant", label: "Chinese (Traditional)" },
];

const CombinedSummary: React.FC = () => {
  const dispatch = useAppDispatch();
  const { documents, combinedSummary, isAnyDocumentLoading } = useAppSelector(
    (state) => state.documents
  );
  const { isInitialized } = useAppSelector((state) => state.chatService);

  const [isEditing, setIsEditing] = useState(false);
  const [editedSummary, setEditedSummary] = useState("");
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState("en");

  useEffect(() => {
    if (!isEditing) {
      const newCombinedSummary = documents
        .map((doc) => {
          if (!doc.summary) return null;
          return `## ${doc.name}\n\n${doc.summary}\n\n---\n`;
        })
        .filter(Boolean)
        .join("\n");

      dispatch(setCombinedSummary(newCombinedSummary));
      setEditedSummary(newCombinedSummary);
      setIsConfirmed(false);
    }
  }, [documents, isEditing, dispatch]);

  const handleSave = () => {
    dispatch(setCombinedSummary(editedSummary));
    setIsEditing(false);
    setIsConfirmed(false);
    message.success("Summary updated. Please confirm to enable chat.");
  };

  const handleCancel = () => {
    setEditedSummary(combinedSummary);
    setIsEditing(false);
    message.info("Changes discarded");
  };

  const handleConfirm = async () => {
    if (!isInitialized) {
      message.error("Chat service not initialized");
      return;
    }

    setIsUpdating(true);
    try {
      const response = await dispatch(
        summarizeDocuments({
          combinedSummaries: combinedSummary,
          selectedLanguage: selectedLanguage,
        })
      ).unwrap();
      const summary: Message = {
        id: Date.now(),
        text: response,
        sender: "ai",
        timestamp: new Date().toISOString(),
      };
      dispatch(addMessage(summary));
      await dispatch(updateVectorDatabase(combinedSummary)).unwrap();
      setIsConfirmed(true);
      message.success("Summary confirmed and ready for chat");
    } catch (error) {
      console.error("Failed to update vector database:", error);
      message.error("Failed to prepare summary for chat");
    } finally {
      setIsUpdating(false);
    }
  };

  if (!documents.length) {
    return null;
  }

  if (isAnyDocumentLoading) {
    return (
      <Card title="Patient Summary" className="border-none shadow-none">
        <div className="flex justify-center items-center p-4">
          <LoadingOutlined className="mr-2" />
          <span>Processing documents...</span>
        </div>
      </Card>
    );
  }

  const showConfirmButton =
    !isConfirmed && !isEditing && combinedSummary && !isUpdating;
  const showEditButton = !isEditing && !isUpdating;
  const showSaveButtons = isEditing;

  return (
    <Card
      title="Patient Summary"
      className="border-none shadow-none"
      extra={
        <Space>
          {showConfirmButton && (
            <>
              <Select
                value={selectedLanguage}
                onChange={setSelectedLanguage}
                style={{ width: 120 }}
                size="small"
              >
                {LANGUAGES.map((lang) => (
                  <Option key={lang.value} value={lang.value}>
                    {lang.label}
                  </Option>
                ))}
              </Select>
              <Button
                type="primary"
                icon={<SendOutlined />}
                size="small"
                onClick={handleConfirm}
                className="bg-green-500"
              >
                Confirm Summary
              </Button>
            </>
          )}
          {showEditButton && (
            <Button
              icon={<EditOutlined />}
              size="small"
              onClick={() => setIsEditing(true)}
              disabled={!documents.some((doc) => doc.summary)}
            />
          )}
          {showSaveButtons && (
            <>
              <Button
                icon={<CheckOutlined />}
                size="small"
                type="primary"
                onClick={handleSave}
              />
              <Button
                icon={<CloseOutlined />}
                size="small"
                onClick={handleCancel}
              />
            </>
          )}
        </Space>
      }
    >
      <div className="prose prose-sm max-w-none">
        {isEditing ? (
          <TextArea
            value={editedSummary}
            onChange={(e) => setEditedSummary(e.target.value)}
            autoSize={{ minRows: 4, maxRows: 12 }}
            className="font-mono text-sm"
          />
        ) : (
          <div className="relative">
            {isUpdating && (
              <div className="absolute inset-0 bg-white/50 flex items-center justify-center">
                <LoadingOutlined className="text-xl" />
                <span className="ml-2">
                  Preparing summary in{" "}
                  {LANGUAGES.find((l) => l.value === selectedLanguage)?.label}
                  ...
                </span>
              </div>
            )}
            <ReactMarkdown className="text-sm">{combinedSummary}</ReactMarkdown>
            {!isConfirmed && combinedSummary && !isUpdating && (
              <div className="mt-4 p-4 bg-yellow-50 rounded-lg text-sm text-yellow-800">
                Please confirm this summary to enable chat functionality.
              </div>
            )}
            {isConfirmed && (
              <div className="mt-4 p-4 bg-green-50 rounded-lg text-sm text-green-800">
                Summary confirmed and ready for chat.
              </div>
            )}
          </div>
        )}
      </div>
    </Card>
  );
};

export default CombinedSummary;
