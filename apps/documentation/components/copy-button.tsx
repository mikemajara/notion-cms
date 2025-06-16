"use client";

import React, { useState } from "react";
import { CheckIcon, Clipboard, CopyIcon } from "lucide-react";

interface CopyButtonProps {
  textToCopy: string;
  className?: string;
}

const CopyButton: React.FC<CopyButtonProps> = ({ textToCopy, className }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000); // Reset after 2 seconds
    } catch (error) {
      console.error("Failed to copy text: ", error);
    }
  };

  return (
    <button
      onClick={handleCopy}
      className={`flex items-center justify-center p-2 ${className} hover:cursor-pointer hover:bg-neutral-50 rounded-md h-auto w-auto`}
      aria-label="Copy to clipboard"
    >
      {copied ? (
        <CheckIcon className="w-4 h-4" />
      ) : (
        <Clipboard className="w-4 h-4" />
      )}
    </button>
  );
};

export default CopyButton;
