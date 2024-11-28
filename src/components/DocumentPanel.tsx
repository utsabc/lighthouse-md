import React, { useEffect } from "react";
import { Upload, Button, List, Spin } from "antd";
import { UploadOutlined } from "@ant-design/icons";
import { EnhancedUploadFile } from "../types";
import { UploadChangeParam } from "antd/es/upload";
import { processFileWithState } from "../lib/ContentParser";

interface DocumentPanelProps {
  fileList: EnhancedUploadFile[];
  setFileList: React.Dispatch<React.SetStateAction<EnhancedUploadFile[]>>;
  onDocumentsProcessed: (documents: EnhancedUploadFile[]) => Promise<void>;
}

const DocumentPanel: React.FC<DocumentPanelProps> = ({
  fileList,
  setFileList,
  onDocumentsProcessed,
}) => {
  useEffect(() => {
    // Check if there are any newly content-ready documents
    const readyDocs = fileList.filter(
      (file) => file.processingState === "contentReady" && file.content
    );

    if (readyDocs.length > 0) {
      onDocumentsProcessed(readyDocs);
    }
  }, [fileList, onDocumentsProcessed]);

  const updateFileState = (
    uid: string,
    updates: Partial<EnhancedUploadFile>
  ) => {
    setFileList((prevList) =>
      prevList.map((f) => (f.uid === uid ? { ...f, ...updates } : f))
    );
  };

  const handleChange = async (info: UploadChangeParam<EnhancedUploadFile>) => {
    const { file, fileList: newFileList } = info;

    // If the file is removed, update the fileList and return
    if (file.status === "removed") {
      setFileList(newFileList);
      return;
    }

    // Update the fileList with the new file
    setFileList(newFileList);

    // If the file is newly added, start processing its content
    if (file.status === "uploading" && !file.content) {
      const originalFile = file.originFileObj;
      if (originalFile) {
        try {
          await processFileWithState(originalFile, updateFileState, file.uid);
        } catch (error) {
          console.error("Failed to process file:", error);
        }
      }
    }
  };

  const renderFileStatus = (file: EnhancedUploadFile) => {
    switch (file.processingState) {
      case "processing":
        return (
          <div className="flex items-center">
            <Spin size="small" />
            <span className="ml-2">Reading file...</span>
          </div>
        );
      case "contentReady":
        return (
          <div className="flex items-center">
            <Spin size="small" />
            <span className="ml-2">Content extracted</span>
          </div>
        );
      case "vectorizing":
        return (
          <div className="flex items-center">
            <Spin size="small" />
            <span className="ml-2">Processing for chat...</span>
          </div>
        );
      case "error":
        return <span className="text-red-500">{file.errorMessage}</span>;
      case "done":
        return <span className="text-green-500">Ready for chat</span>;
      default:
        return null;
    }
  };

  return (
    <div className="h-full p-4 flex flex-col">
      <div className="mb-4">
        <h2 className="text-xl font-semibold mb-4">Documents</h2>
        <Upload
          accept=".pdf,.txt,.doc,.docx"
          fileList={fileList}
          onChange={handleChange}
          multiple={true}
          className="w-full"
        >
          <Button icon={<UploadOutlined />} className="w-full">
            Upload Document
          </Button>
        </Upload>
      </div>

      <List
        className="flex-grow overflow-y-auto"
        itemLayout="horizontal"
        dataSource={fileList}
        renderItem={(file) => (
          <List.Item className="cursor-pointer hover:bg-gray-50 px-4">
            <List.Item.Meta
              title={file.name}
              description={
                <div className="flex justify-between">
                  <span>{`Size: ${(file.size! / 1024).toFixed(2)} KB`}</span>
                  {renderFileStatus(file)}
                </div>
              }
            />
          </List.Item>
        )}
      />
    </div>
  );
};

export default DocumentPanel;
