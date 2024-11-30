import React, { useEffect, useCallback } from "react";
import { Upload, Button, List, Divider, Spin } from "antd";
import { UploadOutlined } from "@ant-design/icons";
import { UploadChangeParam } from "antd/es/upload";
import { EnhancedUploadFile } from "../types";
import { processFileWithState } from "../lib/ContentParser";
import CombinedSummary from "./CombinedSummary";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import { setDocuments, updateDocument } from "../store/slices/documentsSlice";
import { getSummaryForClinicalReport } from "../lib/GeminiWorkload";

const DocumentPanel: React.FC = () => {
  const dispatch = useAppDispatch();
  const { documents } = useAppSelector((state) => state.documents);

  const serializeFileList = (
    fileList: EnhancedUploadFile[]
  ): EnhancedUploadFile[] => {
    return fileList.map(
      (file) =>
        ({
          ...file,
          error: JSON.stringify(file.error),
          // Convert Date objects to ISO strings
          lastModifiedDate: file.lastModifiedDate
            ? new Date(file.lastModifiedDate).toISOString()
            : undefined,
          // Remove non-serializable objects
          originFileObj: file.originFileObj
            ? {
                uid: file.originFileObj.uid,
              }
            : undefined,
        } as EnhancedUploadFile)
    );
  };

  const updateFileState = useCallback(
    (uid: string, updates: Partial<EnhancedUploadFile>) => {
      dispatch(updateDocument({ uid, updates }));
    },
    [dispatch]
  );

  const processDocuments = useCallback(
    async (docs: EnhancedUploadFile[]) => {
      const readyDocs = docs.filter(
        (doc) => doc.base64Content && doc.processingState === "contentReady"
      );

      for (const doc of readyDocs) {
        try {
          updateFileState(doc.uid, {
            processingState: "analyzing",
          });

          const workloadResponse = await getSummaryForClinicalReport(
            doc.base64Content!
          );

          updateFileState(doc.uid, {
            processingState: "done",
            summary: workloadResponse,
            status: "done",
          });
        } catch (error) {
          updateFileState(doc.uid, {
            processingState: "error",
            status: "error",
            errorMessage:
              error instanceof Error
                ? error.message
                : "Failed to process document",
          });
        }
      }
    },
    [updateFileState]
  );

  useEffect(() => {
    const readyDocs = documents.filter(
      (file) => file.processingState === "contentReady" && file.base64Content
    );

    if (readyDocs.length > 0) {
      processDocuments(readyDocs);
    }
  }, [documents, processDocuments]);

  const handleChange = useCallback(
    async (info: UploadChangeParam<EnhancedUploadFile>) => {
      const { file, fileList: newFileList } = info;

      if (file.status === "removed") {
        dispatch(setDocuments(serializeFileList(newFileList)));
        return;
      }

      dispatch(setDocuments(serializeFileList(newFileList)));

      if (file.status === "uploading" && !file.base64Content) {
        const originalFile = file.originFileObj;
        if (originalFile) {
          try {
            await processFileWithState(originalFile, updateFileState, file.uid);
          } catch (error) {
            console.error("Failed to process file:", error);
          }
        }
      }
    },
    [dispatch, updateFileState]
  );

  const renderFileStatus = (file: EnhancedUploadFile) => {
    switch (file.processingState) {
      case "processing":
        return (
          <div className="flex items-center">
            <Spin size="small" />
            <span className="ml-2 text-red-600">Reading file...</span>
          </div>
        );
      case "contentReady":
        return (
          <div className="flex items-center">
            <Spin size="small" />
            <span className="ml-2 text-red-600">Content extracted</span>
          </div>
        );
      case "analyzing":
        return (
          <div className="flex items-center">
            <Spin size="small" />
            <span className="ml-2 text-red-600">Processing for chat...</span>
          </div>
        );
      case "error":
        return <span className="text-red-500">{file.errorMessage}</span>;
      case "done":
        return <span className="text-green-600">Ready for chat</span>;
      default:
        return null;
    }
  };

  return (
    <div className="h-full flex flex-col p-4">
      <div className="flex-none">
        <h2 className="text-xl font-semibold mb-4 text-red-900">Documents</h2>
        <Upload
          accept=".pdf,.txt,.doc,.docx"
          fileList={documents}
          onChange={handleChange}
          multiple={true}
          className="w-full mb-4"
        >
          <Button icon={<UploadOutlined />} className="w-full hover:bg-red-50">
            Upload Documents
          </Button>
        </Upload>
      </div>

      <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
        <div className="h-2/5 overflow-y-auto mb-4">
          <List
            itemLayout="horizontal"
            dataSource={documents}
            renderItem={(file) => (
              <List.Item className="cursor-pointer hover:bg-red-50 px-4 rounded-lg transition-colors">
                <List.Item.Meta
                  title={<span className="text-red-900">{file.name}</span>}
                  description={
                    <div className="flex justify-between">
                      <span className="text-gray-600">{`Size: ${(
                        file.size! / 1024
                      ).toFixed(2)} KB`}</span>
                      {renderFileStatus(file)}
                    </div>
                  }
                />
              </List.Item>
            )}
          />
        </div>

        <Divider className="border-red-100" />
        <div className="h-3/5 overflow-y-auto">
          <CombinedSummary />
        </div>
      </div>
    </div>
  );
};

export default DocumentPanel;
