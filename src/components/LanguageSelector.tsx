import { useState } from 'react';
import { X, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CulturalBadge } from '@/components/CulturalBadge';

interface LanguageSelectorProps {
  selectedLanguages: string[];
  onLanguagesChange: (languages: string[]) => void;
  type: 'native' | 'learning';
  placeholder?: string;
  maxSelection?: number;
  className?: string;
}

export const LanguageSelector = ({ 
  selectedLanguages, 
  onLanguagesChange, 
  type,
  placeholder = "Add languages...",
  maxSelection = 5,
  className 
}: LanguageSelectorProps) => {
  const [open, setOpen] = useState(false);
  
    // TODO: Fetch availableLanguages from Supabase or API
    const availableLanguages = [];
  
  const handleLanguageSelect = (languageName: string) => {
    if (selectedLanguages.length < maxSelection) {
      onLanguagesChange([...selectedLanguages, languageName]);
    }
    setOpen(false);
  };
  
  const handleLanguageRemove = (languageName: string) => {
    onLanguagesChange(selectedLanguages.filter(lang => lang !== languageName));
  };
  
  const badgeType = type === 'native' ? 'language-native' : 'language-learning';
  
  return (
    <div className={cn("space-y-3", className)}>
      {/* Selected Languages */}
      {selectedLanguages.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedLanguages.map((language) => (
            <CulturalBadge
              key={language}
              type={badgeType}
              className="group cursor-pointer"
            >
              <span>{language}</span>
              <Button
                variant="ghost"
                size="icon"
                className="h-4 w-4 p-0 ml-1 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => handleLanguageRemove(language)}
              >
                <X className="h-3 w-3" />
              </Button>
            </CulturalBadge>
          ))}
        </div>
      )}
      
      {/* Add Language Button */}
      {selectedLanguages.length < maxSelection && (
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" className="w-full justify-start">
              <Plus className="mr-2 h-4 w-4" />
              {placeholder}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-full p-0" align="start">
            <Command>
              <CommandInput placeholder="Search languages..." className="h-9" />
              <CommandEmpty>No language found.</CommandEmpty>
              <CommandGroup className="max-h-[300px] overflow-auto">
                {availableLanguages.map((language) => (
                  <CommandItem
                    key={language.code}
                    value={`${language.name} ${language.nativeName}`}
                    onSelect={() => handleLanguageSelect(language.name)}
                  >
                    <div className="flex items-center space-x-2">
                      <span>{language.name}</span>
                      <span className="text-xs text-muted-foreground">
                        ({language.nativeName})
                      </span>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            </Command>
          </PopoverContent>
        </Popover>
      )}
      
      {selectedLanguages.length >= maxSelection && (
        <p className="text-xs text-muted-foreground">
          Maximum {maxSelection} languages allowed
        </p>
      )}
    </div>
  );
};