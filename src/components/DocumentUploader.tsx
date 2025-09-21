import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Upload, FileText, X, File, Zap, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import * as pdfjsLib from 'pdfjs-dist';

interface DocumentUploaderProps {
  onDocumentProcess: (content: string, fileName?: string) => void;
  onBack: () => void;
}

const DocumentUploader = ({ onDocumentProcess, onBack }: DocumentUploaderProps) => {
  const [dragActive, setDragActive] = useState(false);
  const [textInput, setTextInput] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isProcessingPDF, setIsProcessingPDF] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // Configure PDF.js worker
  pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

  // Sample documents for quick demo
  const sampleDocuments = [
    {
      title: "Software License Agreement",
      type: "License",
      content: `SOFTWARE LICENSE AGREEMENT

This Software License Agreement ("Agreement") is entered into on [DATE] between TechCorp Inc. ("Licensor") and the end user ("Licensee").

WHEREAS, Licensor has developed proprietary software ("Software"); and
WHEREAS, Licensee desires to use said Software subject to the terms herein;

NOW THEREFORE, the parties agree as follows:

1. GRANT OF LICENSE
Licensor hereby grants Licensee a non-exclusive, non-transferable license to use the Software solely for Licensee's internal business purposes, subject to the limitations set forth herein.

2. RESTRICTIONS
Licensee shall not: (a) reverse engineer, decompile, or disassemble the Software; (b) distribute, rent, lease, or sublicense the Software; (c) remove any proprietary notices from the Software.

3. TERM AND TERMINATION
This Agreement shall commence on the date first written above and shall continue until terminated. Either party may terminate this Agreement upon thirty (30) days written notice. Upon termination, Licensee shall cease all use of the Software and destroy all copies.

4. WARRANTY DISCLAIMER
THE SOFTWARE IS PROVIDED "AS IS" WITHOUT WARRANTY OF ANY KIND. LICENSOR DISCLAIMS ALL WARRANTIES, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE.

5. LIMITATION OF LIABILITY
IN NO EVENT SHALL LICENSOR BE LIABLE FOR ANY INDIRECT, SPECIAL, INCIDENTAL, OR CONSEQUENTIAL DAMAGES ARISING OUT OF OR RELATING TO THIS AGREEMENT OR THE USE OF THE SOFTWARE.

6. GOVERNING LAW
This Agreement shall be governed by and construed in accordance with the laws of the State of California.

IN WITNESS WHEREOF, the parties have executed this Agreement as of the date first written above.`
    },
    {
      title: "Employment Contract",
      type: "Employment",
      content: `EMPLOYMENT AGREEMENT

This Employment Agreement ("Agreement") is made between InnovaCorp LLC ("Company") and [EMPLOYEE NAME] ("Employee").

1. EMPLOYMENT
Company hereby employs Employee, and Employee accepts employment with Company, subject to the terms and conditions set forth herein.

2. POSITION AND DUTIES
Employee shall serve as Senior Software Developer and shall perform such duties as are customarily performed by someone in such position, including but not limited to software development, code review, and technical documentation.

3. COMPENSATION
Company shall pay Employee an annual salary of $95,000, payable in accordance with Company's regular payroll schedule. Employee shall also be eligible for performance bonuses at Company's discretion.

4. BENEFITS
Employee shall be entitled to participate in all benefit plans generally available to Company employees, including health insurance, dental insurance, and 401(k) retirement plan.

5. CONFIDENTIALITY
Employee acknowledges that during employment, Employee may have access to confidential information. Employee agrees to maintain the confidentiality of such information and not to disclose it to any third party.

6. NON-COMPETE
During employment and for a period of twelve (12) months following termination, Employee agrees not to engage in any business that competes with Company within a 50-mile radius of Company's headquarters.

7. TERMINATION
Either party may terminate this Agreement at any time, with or without cause, upon two (2) weeks written notice.

This Agreement constitutes the entire agreement between the parties and supersedes all prior negotiations, representations, or agreements.`
    },
    {
      title: "Rental Lease Agreement",
      type: "Lease",
      content: `RESIDENTIAL LEASE AGREEMENT

This Lease Agreement ("Lease") is entered into between PropertyMax LLC ("Landlord") and [TENANT NAME] ("Tenant").

1. PROPERTY
Landlord leases to Tenant the residential property located at 123 Oak Street, Apartment 4B, Springfield, State 12345 ("Premises").

2. TERM
The lease term shall commence on [START DATE] and expire on [END DATE], for a total term of twelve (12) months.

3. RENT
Monthly rent is $2,800, due on the first day of each month. Late fees of $50 per day will be assessed for rent received after the 5th day of the month.

4. SECURITY DEPOSIT
Tenant shall pay a security deposit of $2,800 prior to occupancy. This deposit shall secure Tenant's performance and may be used to remedy damages beyond normal wear and tear.

5. USE OF PREMISES
Premises shall be used solely as a private residence. No commercial activities, illegal activities, or activities that disturb other tenants are permitted.

6. PETS
No pets are allowed on the Premises without prior written consent from Landlord. Unauthorized pets may result in immediate termination and additional fees.

7. MAINTENANCE AND REPAIRS
Tenant is responsible for routine maintenance and minor repairs under $100. Landlord is responsible for major repairs, structural issues, and appliance maintenance.

8. DEFAULT AND REMEDIES
If Tenant fails to pay rent or breaches any other provision, Landlord may terminate this Lease and pursue all available legal remedies, including eviction and damages.

By signing below, both parties agree to be bound by the terms of this Lease Agreement.`
    }
  ];

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const extractTextFromPDF = async (file: File): Promise<string> => {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    let textContent = '';
    
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      const pageText = content.items
        .map((item: any) => item.str)
        .join(' ');
      textContent += pageText + '\n\n';
    }
    
    return textContent.trim();
  };

  const handleFileSelect = async (file: File) => {
    if (file.type === "application/pdf" || file.type === "text/plain") {
      setSelectedFile(file);
      
      if (file.type === "text/plain") {
        const reader = new FileReader();
        reader.onload = (e) => {
          if (e.target?.result) {
            setTextInput(e.target.result as string);
          }
        };
        reader.readAsText(file);
      } else if (file.type === "application/pdf") {
        setIsProcessingPDF(true);
        try {
          const extractedText = await extractTextFromPDF(file);
          setTextInput(extractedText);
          toast({
            title: "PDF Processed",
            description: "Text successfully extracted from PDF.",
          });
        } catch (error) {
          console.error('Error extracting PDF text:', error);
          toast({
            title: "PDF Processing Failed",
            description: "Could not extract text from PDF. Please try a different file.",
            variant: "destructive"
          });
        } finally {
          setIsProcessingPDF(false);
        }
      }
    } else {
      toast({
        title: "Unsupported File Type",
        description: "Please upload a PDF or text file.",
        variant: "destructive"
      });
    }
  };

  const handleProcessDocument = () => {
    if (isProcessingPDF) {
      toast({
        title: "Please Wait",
        description: "PDF is still being processed.",
        variant: "destructive"
      });
      return;
    }
    
    if (textInput.trim()) {
      onDocumentProcess(textInput, selectedFile?.name);
    } else {
      toast({
        title: "No Content Found",
        description: "Please enter text or upload a document.",
        variant: "destructive"
      });
    }
  };

  const loadSampleDocument = (sample: typeof sampleDocuments[0]) => {
    setTextInput(sample.content);
    setSelectedFile(null);
    toast({
      title: "Sample Loaded",
      description: `${sample.title} loaded for analysis.`
    });
  };

  return (
    <div className="min-h-screen bg-background py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <Button 
            variant="ghost" 
            onClick={onBack}
            className="mb-4"
          >
            ← Back to Home
          </Button>
          <h1 className="text-4xl font-bold text-foreground mb-4">
            Upload Your Document
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Upload a PDF file, paste text directly, or try one of our sample documents for a quick demo.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Upload Section */}
          <div className="space-y-6">
            {/* File Upload */}
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="w-5 h-5" />
                  File Upload
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div
                  className={`upload-zone ${dragActive ? "upload-zone-active" : ""}`}
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-lg font-medium mb-2">
                    Drop your PDF here or click to browse
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Supports PDF and text files up to 10MB
                  </p>
                  {selectedFile && (
                    <div className="mt-4 flex items-center justify-center gap-2 text-primary">
                      {isProcessingPDF ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <File className="w-4 h-4" />
                      )}
                      <span className="font-medium">
                        {selectedFile.name} 
                        {isProcessingPDF && " - Processing..."}
                      </span>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        disabled={isProcessingPDF}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedFile(null);
                          setTextInput("");
                        }}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.txt"
                  onChange={(e) => e.target.files && handleFileSelect(e.target.files[0])}
                  className="hidden"
                />
              </CardContent>
            </Card>

            {/* Text Input */}
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle>Or Paste Text Directly</CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  placeholder="Paste your legal document text here..."
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  className="min-h-[300px] resize-none"
                />
              </CardContent>
            </Card>

            {/* Process Button */}
            <Button 
              onClick={handleProcessDocument}
              disabled={!textInput.trim() || isProcessingPDF}
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground py-6 text-lg font-semibold"
            >
              {isProcessingPDF ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Processing PDF...
                </>
              ) : (
                <>
                  <Zap className="w-5 h-5 mr-2" />
                  Analyze Document
                </>
              )}
            </Button>
          </div>

          {/* Sample Documents */}
          <div>
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle>Try Sample Documents</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Click any sample below for an instant demo
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                {sampleDocuments.map((sample, index) => (
                  <div
                    key={index}
                    onClick={() => loadSampleDocument(sample)}
                    className="border rounded-lg p-4 cursor-pointer hover:bg-accent hover:shadow-card transition-all duration-200"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-semibold text-foreground">
                        {sample.title}
                      </h3>
                      <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">
                        {sample.type}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {sample.content.substring(0, 120)}...
                    </p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DocumentUploader;