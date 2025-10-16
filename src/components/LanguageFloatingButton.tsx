import { Languages } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useLanguage, languages, Language } from "@/contexts/LanguageContext";

interface LanguageFloatingButtonProps {
  onLanguageChange?: () => void;
}

export const LanguageFloatingButton = ({ onLanguageChange }: LanguageFloatingButtonProps) => {
  const { language, setLanguage } = useLanguage();

  const handleLanguageChange = (lang: Language) => {
    setLanguage(lang);
    if (onLanguageChange) {
      onLanguageChange();
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button 
            size="lg" 
            className="rounded-full shadow-lg hover:shadow-xl transition-shadow gap-2"
          >
            <Languages className="h-5 w-5" />
            <span>{languages[language]}</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="bg-background z-50">
          {Object.entries(languages).map(([code, name]) => (
            <DropdownMenuItem
              key={code}
              onClick={() => handleLanguageChange(code as Language)}
              className={language === code ? "bg-accent" : ""}
            >
              {name}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};
