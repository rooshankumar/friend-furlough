import { useState } from 'react';
import { Check, ChevronDown, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Country } from '@/types';

interface CountrySelectorProps {
  value?: string;
  onValueChange: (countryCode: string, country: Country) => void;
  placeholder?: string;
  className?: string;
}

export const CountrySelector = ({ 
  value, 
  onValueChange, 
  placeholder = "Select your country...",
  className 
}: CountrySelectorProps) => {
  const [open, setOpen] = useState(false);
  
  const countries: Country[] = [
    { code: "US", name: "United States", flag: "🇺🇸", region: "Americas" },
    { code: "GB", name: "United Kingdom", flag: "🇬🇧", region: "Europe" },
    { code: "CA", name: "Canada", flag: "🇨🇦", region: "Americas" },
    { code: "AU", name: "Australia", flag: "🇦🇺", region: "Oceania" },
    { code: "IN", name: "India", flag: "🇮🇳", region: "Asia" },
    { code: "MX", name: "Mexico", flag: "🇲🇽", region: "Americas" },
    { code: "BR", name: "Brazil", flag: "🇧🇷", region: "Americas" },
    { code: "ES", name: "Spain", flag: "🇪🇸", region: "Europe" },
    { code: "FR", name: "France", flag: "🇫🇷", region: "Europe" },
    { code: "DE", name: "Germany", flag: "🇩🇪", region: "Europe" },
    { code: "IT", name: "Italy", flag: "🇮🇹", region: "Europe" },
    { code: "PT", name: "Portugal", flag: "🇵🇹", region: "Europe" },
    { code: "CN", name: "China", flag: "🇨🇳", region: "Asia" },
    { code: "JP", name: "Japan", flag: "🇯🇵", region: "Asia" },
    { code: "KR", name: "South Korea", flag: "🇰🇷", region: "Asia" },
  ];
  const selectedCountry = countries.find(country => country.code === value);
  
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("w-full justify-between", className)}
        >
          {selectedCountry ? (
            <div className="flex items-center space-x-2">
              <span className="text-lg">{selectedCountry.flag}</span>
              <span>{selectedCountry.name}</span>
            </div>
          ) : (
            placeholder
          )}
          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0" align="start">
        <Command>
          <CommandInput placeholder="Search countries..." className="h-9" inputMode="none" />
          <CommandEmpty>No country found.</CommandEmpty>
          <CommandGroup className="max-h-[300px] overflow-auto">
            {countries.map((country) => (
              <CommandItem
                key={country.code}
                value={`${country.name} ${country.code}`}
                onSelect={() => {
                  onValueChange(country.code, country);
                  setOpen(false);
                }}
              >
                <div className="flex items-center space-x-2">
                  <span className="text-lg">{country.flag}</span>
                  <span>{country.name}</span>
                  <span className="text-xs text-muted-foreground">({country.region})</span>
                </div>
                <Check
                  className={cn(
                    "ml-auto h-4 w-4",
                    value === country.code ? "opacity-100" : "opacity-0"
                  )}
                />
              </CommandItem>
            ))}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  );
};