import React from "react";
import { Button, Popover } from "antd";
import { QuestionCircleOutlined } from "@ant-design/icons";
import { Message } from "../types";

interface ReferencePopupProps {
  message: Message;
}

const ReferencePopup: React.FC<ReferencePopupProps> = ({ message }) => {
  if (!message.references?.length) return null;

  const content = (
    <div className="max-w-md">
      <h4 className="font-medium mb-2">Source References:</h4>
      <div className="space-y-2">
        {message.references.map((ref, index) => (
          <div key={index} className="p-2 bg-gray-50 rounded">
            <div className="text-sm font-medium text-gray-600">
              {ref.name} {ref.ref}
            </div>
            <div className="text-sm mt-1">{ref.text}</div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="mt-2">
      <Popover
        content={content}
        title={null}
        trigger="click"
        placement="right"
        overlayClassName="max-w-lg"
      >
        <Button
          type="link"
          size="small"
          className="flex items-center text-gray-500 hover:text-blue-500"
          icon={<QuestionCircleOutlined />}
        >
          View {message.references.length} source
          {message.references.length > 1 ? "s" : ""}
        </Button>
      </Popover>
    </div>
  );
};

export default ReferencePopup;
