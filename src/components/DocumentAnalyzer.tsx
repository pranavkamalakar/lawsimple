import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Download, Share, AlertTriangle, CheckCircle, Info, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Language } from "@/contexts/LanguageContext";

interface DocumentAnalyzerProps {
  content: string;
  fileName?: string;
  onBack: () => void;
  language: Language;
}

interface AnalysisResult {
  summary: string;
  documentType?: string;
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
  error?: string;
}

const DocumentAnalyzer = ({ content, fileName, onBack, language }: DocumentAnalyzerProps) => {
  const [isAnalyzing, setIsAnalyzing] = useState(true);
  const [progress, setProgress] = useState(0);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [loadingMessage, setLoadingMessage] = useState("Initializing AI analysis...");
  const { toast } = useToast();

  // Real AI analysis with Gemini
  useEffect(() => {
    const analyzeDocument = async () => {
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
        currentProgress += Math.random() * 10 + 3;
        if (currentProgress > 95) currentProgress = 95;
        
        setProgress(currentProgress);
        
        if (messageIndex < messages.length - 1 && currentProgress > (messageIndex + 1) * (95 / messages.length)) {
          messageIndex++;
          setLoadingMessage(messages[messageIndex]);
        }
      }, 300);

      try {
        const { data, error } = await supabase.functions.invoke('analyze-document', {
          body: { content, fileName, language }
        });

        clearInterval(interval);
        setProgress(100);

        if (error) {
          console.error('Analysis error:', error);
          toast({
            title: "Analysis Failed",
            description: "Failed to analyze document. Please try again.",
            variant: "destructive"
          });
          setAnalysis({
            summary: "Analysis failed due to technical issues. Please try again.",
            keyPoints: [],
            clauses: [],
            error: error.message
          });
        } else {
          setAnalysis(data);
          toast({
            title: "Analysis Complete",
            description: "Your document has been successfully analyzed."
          });
        }
      } catch (error) {
        clearInterval(interval);
        console.error('Network error:', error);
        toast({
          title: "Connection Error",
          description: "Failed to connect to analysis service. Please check your connection.",
          variant: "destructive"
        });
        setAnalysis({
          summary: "Connection error occurred. Please check your internet connection and try again.",
          keyPoints: [],
          clauses: [],
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      } finally {
        setProgress(100);
        setTimeout(() => {
          setIsAnalyzing(false);
        }, 500);
      }
    };

    analyzeDocument();
  }, [content, fileName, toast]);

  // Helper function to get document type from analysis or content
  const getDocumentType = (): string => {
    if (analysis?.documentType) return analysis.documentType;
    if (content.toLowerCase().includes("employment")) return "employment agreement";
    if (content.toLowerCase().includes("lease") || content.toLowerCase().includes("rental")) return "lease agreement";
    if (content.toLowerCase().includes("license")) return "license agreement";
    if (content.toLowerCase().includes("service")) return "service agreement";
    return "legal contract";
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
Document Type: ${getDocumentType()}

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