import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Download, Share, AlertTriangle, CheckCircle, Info, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface DocumentAnalyzerProps {
  content: string;
  fileName?: string;
  onBack: () => void;
}

interface AnalysisResult {
  summary: string;
  keyPoints: Array<{
    text: string;
    type: "important" | "critical" | "favorable";
    explanation: string;
  }>;
  clauses: Array<{
    title: string;
    original: string;
    simplified: string;
    risk: "low" | "medium" | "high";
  }>;
}

const DocumentAnalyzer = ({ content, fileName, onBack }: DocumentAnalyzerProps) => {
  const [isAnalyzing, setIsAnalyzing] = useState(true);
  const [progress, setProgress] = useState(0);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [loadingMessage, setLoadingMessage] = useState("Initializing AI analysis...");
  const { toast } = useToast();

  // Simulate AI analysis with realistic progress
  useEffect(() => {
    const messages = [
      "Initializing AI analysis...",
      "Reading document structure...",
      "Identifying legal clauses...",
      "Analyzing contract terms...",
      "Highlighting critical sections...",
      "Generating plain English translations...",
      "Finalizing analysis report..."
    ];

    let messageIndex = 0;
    let currentProgress = 0;

    const interval = setInterval(() => {
      currentProgress += Math.random() * 15 + 5;
      if (currentProgress > 100) currentProgress = 100;
      
      setProgress(currentProgress);
      
      if (messageIndex < messages.length - 1 && currentProgress > (messageIndex + 1) * (100 / messages.length)) {
        messageIndex++;
        setLoadingMessage(messages[messageIndex]);
      }

      if (currentProgress >= 100) {
        clearInterval(interval);
        setTimeout(() => {
          setIsAnalyzing(false);
          generateMockAnalysis();
        }, 500);
      }
    }, 200);

    return () => clearInterval(interval);
  }, [content]);

  const generateMockAnalysis = () => {
    // Generate realistic analysis based on content
    const mockAnalysis: AnalysisResult = {
      summary: `This document is a ${getDocumentType(content)} containing ${content.split('.').length} clauses. The agreement establishes legal obligations between parties with several important terms that require attention. Key areas include payment terms, liability limitations, and termination conditions.`,
      keyPoints: [
        {
          text: "Payment obligations and late fees are specified",
          type: "important",
          explanation: "The document clearly outlines when payments are due and what happens if they're late. This is important for budgeting and avoiding penalties."
        },
        {
          text: "Limited liability clause may restrict your rights",
          type: "critical", 
          explanation: "This clause limits how much the other party has to pay if something goes wrong. This could be significant if there are major problems."
        },
        {
          text: "Termination notice period is reasonable",
          type: "favorable",
          explanation: "The agreement gives adequate time to prepare for termination, which is beneficial for planning purposes."
        }
      ],
      clauses: extractClauses(content)
    };
    setAnalysis(mockAnalysis);
  };

  const getDocumentType = (content: string): string => {
    if (content.toLowerCase().includes("employment")) return "employment agreement";
    if (content.toLowerCase().includes("lease") || content.toLowerCase().includes("rental")) return "lease agreement";
    if (content.toLowerCase().includes("license")) return "license agreement";
    if (content.toLowerCase().includes("service")) return "service agreement";
    return "legal contract";
  };

  const extractClauses = (content: string): AnalysisResult['clauses'] => {
    // Simple clause extraction - in real app this would use AI
    const sections = content.split(/\d+\.\s+/).filter(section => section.trim().length > 50);
    
    return sections.slice(0, 5).map((section, index) => {
      const title = section.split('\n')[0].trim() || `Clause ${index + 1}`;
      const risk = Math.random() > 0.7 ? "high" : Math.random() > 0.4 ? "medium" : "low";
      
      return {
        title: title.length > 50 ? title.substring(0, 50) + "..." : title,
        original: section.trim(),
        simplified: generateSimplified(section.trim()),
        risk: risk as "low" | "medium" | "high"
      };
    });
  };

  const generateSimplified = (text: string): string => {
    // Mock simplification - in real app this would use AI
    if (text.toLowerCase().includes("whereas")) {
      return "This section explains the background and reasons for the agreement.";
    }
    if (text.toLowerCase().includes("liability")) {
      return "This limits how much money one party has to pay if something goes wrong.";
    }
    if (text.toLowerCase().includes("termination")) {
      return "This explains how and when the agreement can be ended by either party.";
    }
    if (text.toLowerCase().includes("payment") || text.toLowerCase().includes("rent")) {
      return "This section covers how much money needs to be paid and when.";
    }
    return "This clause establishes specific rights and obligations for the parties involved.";
  };

  const highlightText = (text: string) => {
    // Simple highlighting logic
    let highlighted = text;
    
    // Critical terms (red)
    const criticalTerms = ["liable", "damages", "penalty", "breach", "default", "terminate"];
    criticalTerms.forEach(term => {
      const regex = new RegExp(`\\b${term}\\b`, 'gi');
      highlighted = highlighted.replace(regex, `<span class="highlight-critical">$&</span>`);
    });
    
    // Important terms (yellow)
    const importantTerms = ["payment", "notice", "obligation", "rights", "warranty"];
    importantTerms.forEach(term => {
      const regex = new RegExp(`\\b${term}\\b`, 'gi');
      highlighted = highlighted.replace(regex, `<span class="highlight-important">$&</span>`);
    });
    
    // Favorable terms (green)
    const favorableTerms = ["benefit", "entitled", "may", "option"];
    favorableTerms.forEach(term => {
      const regex = new RegExp(`\\b${term}\\b`, 'gi');
      highlighted = highlighted.replace(regex, `<span class="highlight-favorable">$&</span>`);
    });
    
    return highlighted;
  };

  const handleDownload = () => {
    if (!analysis) return;
    
    const reportContent = `
LAWSIMPLE ANALYSIS REPORT
${fileName ? `Document: ${fileName}` : ''}
Generated: ${new Date().toLocaleDateString()}

SUMMARY:
${analysis.summary}

KEY POINTS:
${analysis.keyPoints.map((point, i) => `${i + 1}. ${point.text}\n   ${point.explanation}`).join('\n\n')}

DETAILED CLAUSE ANALYSIS:
${analysis.clauses.map((clause, i) => `
${i + 1}. ${clause.title}
Risk Level: ${clause.risk.toUpperCase()}
Simplified: ${clause.simplified}
`).join('\n')}
    `;
    
    const blob = new Blob([reportContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `lawsimple-analysis-${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast({
      title: "Analysis Downloaded",
      description: "Your document analysis has been saved as a text file."
    });
  };

  if (isAnalyzing) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md shadow-legal">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <Loader2 className="w-12 h-12 text-primary animate-spin" />
            </div>
            <CardTitle className="text-xl">Analyzing Document</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Progress value={progress} className="h-3" />
            <p className="text-center text-muted-foreground text-sm">
              {loadingMessage}
            </p>
            <p className="text-center text-xs text-muted-foreground">
              {Math.round(progress)}% complete
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" onClick={onBack}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <div>
                <h1 className="text-2xl font-bold">Document Analysis</h1>
                {fileName && <p className="text-sm text-muted-foreground">{fileName}</p>}
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleDownload}>
                <Download className="w-4 h-4 mr-2" />
                Download Report
              </Button>
              <Button variant="outline">
                <Share className="w-4 h-4 mr-2" />
                Share
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="split-view">
          {/* Original Document */}
          <div className="space-y-6">
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  Original Document
                  <Badge variant="outline" className="ml-2">
                    {content.split(' ').length} words
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div 
                  className="prose prose-sm max-w-none whitespace-pre-wrap text-sm leading-relaxed max-h-[600px] overflow-y-auto p-4 bg-muted/30 rounded border"
                  dangerouslySetInnerHTML={{ __html: highlightText(content) }}
                />
              </CardContent>
            </Card>
          </div>

          {/* Analysis Results */}
          <div className="space-y-6">
            {/* Summary */}
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle>Executive Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground leading-relaxed">
                  {analysis?.summary}
                </p>
              </CardContent>
            </Card>

            {/* Key Points */}
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle>Key Highlights</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {analysis?.keyPoints.map((point, index) => (
                  <div key={index} className="flex gap-3 p-3 border rounded-lg">
                    <div className="flex-shrink-0 mt-0.5">
                      {point.type === "critical" && <AlertTriangle className="w-5 h-5 text-destructive" />}
                      {point.type === "important" && <Info className="w-5 h-5 text-warning" />}
                      {point.type === "favorable" && <CheckCircle className="w-5 h-5 text-success" />}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-sm mb-1">{point.text}</p>
                      <p className="text-xs text-muted-foreground">{point.explanation}</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Detailed Analysis */}
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle>Clause-by-Clause Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <Accordion type="single" collapsible className="w-full">
                  {analysis?.clauses.map((clause, index) => (
                    <AccordionItem key={index} value={`item-${index}`}>
                      <AccordionTrigger className="text-left">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{clause.title}</span>
                          <Badge 
                            variant={clause.risk === "high" ? "destructive" : clause.risk === "medium" ? "secondary" : "outline"}
                            className="text-xs"
                          >
                            {clause.risk} risk
                          </Badge>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="space-y-4">
                        <div>
                          <h4 className="font-medium text-sm mb-2 text-muted-foreground">Plain English:</h4>
                          <p className="text-sm bg-accent/50 p-3 rounded border-l-4 border-primary">
                            {clause.simplified}
                          </p>
                        </div>
                        <div>
                          <h4 className="font-medium text-sm mb-2 text-muted-foreground">Original Text:</h4>
                          <p className="text-xs text-muted-foreground bg-muted/50 p-3 rounded">
                            {clause.original.substring(0, 300)}...
                          </p>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DocumentAnalyzer;