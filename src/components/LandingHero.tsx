import { Button } from "@/components/ui/button";
import { FileText, Upload, Shield, Zap, Languages } from "lucide-react";
import { useLanguage, languageNames, Language } from "@/contexts/LanguageContext";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface LandingHeroProps {
  onGetStarted: () => void;
}

const LandingHero = ({ onGetStarted }: LandingHeroProps) => {
  const { language, setLanguage, getLanguageName } = useLanguage();
  
  const features = [
    {
      icon: <FileText className="w-6 h-6" />,
      title: "Upload Any Document",
      description: "PDF files or direct text paste - we handle it all"
    },
    {
      icon: <Zap className="w-6 h-6" />,
      title: "Instant Analysis",
      description: "AI-powered breakdown in under 30 seconds"
    },
    {
      icon: <Shield className="w-6 h-6" />,
      title: "Privacy First",
      description: "Documents processed securely with no storage"
    }
  ];

  return (
    <div className="min-h-screen hero-gradient flex items-center justify-center">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          {/* Language Selector */}
          <div className="flex justify-end mb-4">
            <Select value={language} onValueChange={(value) => setLanguage(value as Language)}>
              <SelectTrigger className="w-[180px] bg-primary-foreground/10 border-primary-foreground/20 text-primary-foreground">
                <Languages className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Select Language" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(languageNames).map(([code, name]) => (
                  <SelectItem key={code} value={code}>
                    {name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {/* Main Heading */}
          <div className="mb-8">
            <h1 className="text-5xl md:text-7xl font-bold text-primary-foreground mb-6 leading-tight">
              LawSimple
            </h1>
            <p className="text-xl md:text-2xl text-primary-foreground/80 mb-4">
              AI Document Explainer
            </p>
            <p className="text-lg text-primary-foreground/70 max-w-3xl mx-auto leading-relaxed">
              Transform complex legal documents into plain, understandable language. 
              Upload your contract, agreement, or legal text and get instant AI-powered explanations.
            </p>
          </div>

          {/* CTA Button */}
          <div className="mb-16">
            <Button 
              onClick={onGetStarted}
              size="lg"
              className="bg-primary-foreground text-primary hover:bg-primary-foreground/90 px-8 py-6 text-lg font-semibold shadow-legal hover:shadow-hover transition-all duration-300 hover:scale-105"
            >
              <Upload className="w-5 h-5 mr-2" />
              Upload Document Now
            </Button>
            <p className="text-sm text-primary-foreground/60 mt-3">
              No signup required • Free to try • Privacy guaranteed
            </p>
          </div>

          {/* Features Grid */}
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {features.map((feature, index) => (
              <div 
                key={index}
                className="bg-primary-foreground/10 backdrop-blur-sm rounded-xl p-6 border border-primary-foreground/20 hover:bg-primary-foreground/15 transition-all duration-300"
              >
                <div className="text-primary-foreground mb-4 flex justify-center">
                  {feature.icon}
                </div>
                <h3 className="text-lg font-semibold text-primary-foreground mb-2">
                  {feature.title}
                </h3>
                <p className="text-primary-foreground/70 text-sm">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>

          {/* Demo Hint */}
          <div className="mt-16 text-primary-foreground/60">
            <p className="text-sm">
              ✨ Try our sample documents for an instant demo
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LandingHero;