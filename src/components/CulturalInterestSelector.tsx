import { useState } from 'react';
import { X, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CulturalBadge } from '@/components/CulturalBadge';
import { culturalInterests } from '@/data/culturalInterests';

interface CulturalInterestSelectorProps {
  selectedInterests: string[];
  onInterestsChange: (interests: string[]) => void;
  placeholder?: string;
  maxSelection?: number;
  className?: string;
}

export const CulturalInterestSelector = ({ 
  selectedInterests, 
  onInterestsChange, 
  placeholder = "Add cultural interests...",
  maxSelection = 8,
  className 
}: CulturalInterestSelectorProps) => {
  const [open, setOpen] = useState(false);
  
  const availableInterests = culturalInterests;
  
  const getInterestById = (id: string) => {
    return availableInterests.find(i => i.id === id);
  };
  
  const handleInterestSelect = (interestId: string) => {
    if (selectedInterests.length < maxSelection) {
      onInterestsChange([...selectedInterests, interestId]);
    }
    setOpen(false);
  };
  
  const handleInterestRemove = (interestId: string) => {
    onInterestsChange(selectedInterests.filter(id => id !== interestId));
  };
  
  return (
    <div className={cn("space-y-3", className)}>
      {/* Selected Interests */}
      {selectedInterests.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedInterests.map((interestId) => {
            const interest = getInterestById(interestId);
            if (!interest) return null;
            
            return (
              <CulturalBadge
                key={interestId}
                type="interest"
                className="group cursor-pointer"
              >
                <span className="mr-1">{interest.emoji}</span>
                <span>{interest.name}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-4 w-4 p-0 ml-1 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => handleInterestRemove(interestId)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </CulturalBadge>
            );
          })}
        </div>
      )}
      
      {/* Add Interest Button */}
      {selectedInterests.length < maxSelection && (
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" className="w-full justify-start">
              <Plus className="mr-2 h-4 w-4" />
              {placeholder}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-full p-0" align="start">
            <Command>
              <CommandInput placeholder="Search interests..." className="h-9" inputMode="none" />
              <CommandEmpty>No interest found.</CommandEmpty>
              <CommandGroup className="max-h-[300px] overflow-auto">
                {availableInterests.map((interest) => (
                  <CommandItem
                    key={interest.id}
                    value={interest.name}
                    onSelect={() => handleInterestSelect(interest.id)}
                  >
                    <div className="flex items-center space-x-2">
                      <span>{interest.emoji}</span>
                      <span>{interest.name}</span>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            </Command>
          </PopoverContent>
        </Popover>
      )}
      
      {selectedInterests.length >= maxSelection && (
        <p className="text-xs text-muted-foreground">
          Maximum {maxSelection} interests allowed
        </p>
      )}
    </div>
  );
};
