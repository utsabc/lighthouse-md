import React from "react";
import { Alert } from "antd";

export const Disclaimer: React.FC = () => {
  return (
    <Alert
      className="text-xs"
      type="warning"
      showIcon
      message="Medical Disclaimer"
      description={
        <div className="space-y-2">
          <p>
            This application is designed to assist in reviewing medical
            documents but should not be used as a primary diagnostic tool or
            substitute for professional medical advice.
          </p>
          <p>
            The AI-generated summaries and chat responses are for informational
            purposes only. Always consult with qualified healthcare
            professionals for medical advice, diagnosis, or treatment.
          </p>
          <p>
            The accuracy and completeness of the information processed cannot be
            guaranteed. Users should verify all information with original
            medical documents and healthcare providers.
          </p>
        </div>
      }
    />
  );
};

// Compact version for smaller spaces
export const CompactDisclaimer: React.FC = () => {
  return (
    <Alert
      className="text-xs"
      type="warning"
      showIcon
      message="This is an AI assistance tool. Not for diagnostic use. Consult healthcare professionals for medical advice."
      banner
    />
  );
};
