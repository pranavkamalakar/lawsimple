import { useState } from "react";
import LandingHero from "@/components/LandingHero";
import DocumentUploader from "@/components/DocumentUploader";
import DocumentAnalyzer from "@/components/DocumentAnalyzer";
import { useLanguage } from "@/contexts/LanguageContext";

type AppState = "landing" | "upload" | "analyze";

const Index = () => {
  const [currentState, setCurrentState] = useState<AppState>("landing");
  const [documentContent, setDocumentContent] = useState<string>("");
  const [documentFileName, setDocumentFileName] = useState<string>("");
  const { language } = useLanguage();

  const handleGetStarted = () => {
    setCurrentState("upload");
  };

  const handleDocumentProcess = (content: string, fileName?: string) => {
    setDocumentContent(content);
    setDocumentFileName(fileName || "");
    setCurrentState("analyze");
  };

  const handleBackToHome = () => {
    setCurrentState("landing");
    setDocumentContent("");
    setDocumentFileName("");
  };

  const handleBackToUpload = () => {
    setCurrentState("upload");
  };

  if (currentState === "analyze") {
    return (
      <DocumentAnalyzer 
        content={documentContent}
        fileName={documentFileName}
        onBack={handleBackToUpload}
        language={language}
      />
    );
  }

  if (currentState === "upload") {
    return (
      <DocumentUploader 
        onDocumentProcess={handleDocumentProcess}
        onBack={handleBackToHome}
      />
    );
  }

  return (
    <LandingHero onGetStarted={handleGetStarted} />
  );
};

export default Index;