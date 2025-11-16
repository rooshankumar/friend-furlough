import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from '@/components/ui/command';
import { Check, X, Filter, Users, Sparkles, Globe, Clock, Search } from 'lucide-react';
import { COUNTRIES, LANGUAGES, GENDER_OPTIONS } from '@/constants/filterOptions';

interface FilterState {
  onlineOnly: boolean;
  gender: string[];
  ageRange: [number, number];
  countries: string[];
  nativeLanguages: string[];
  learningLanguages: string[];
}

interface ModernFiltersProps {
  filters: FilterState;
  onFiltersChange: (filters: Partial<FilterState>) => void;
  onClearFilters: () => void;
  activeView: 'all' | 'new' | 'online';
  onViewChange: (view: 'all' | 'new' | 'online') => void;
  showFilters: boolean;
  onToggleFilters: () => void;
  searchTerm: string;
  onSearchChange: (term: string) => void;
}

export function ModernFilters({
  filters,
  onFiltersChange,
  onClearFilters,
  activeView,
  onViewChange,
  showFilters,
  onToggleFilters,
  searchTerm,
  onSearchChange
}: ModernFiltersProps) {
  const [openPopovers, setOpenPopovers] = useState({
    country: false,
    native: false,
    learning: false
  });

  const hasActiveFilters = 
    filters.onlineOnly || 
    filters.gender.length > 0 || 
    filters.countries.length > 0 || 
    filters.nativeLanguages.length > 0 || 
    filters.learningLanguages.length > 0 || 
    filters.ageRange[0] !== 18 || 
    filters.ageRange[1] !== 65;

  const viewOptions = [
    { key: 'all', label: 'All', icon: Users },
    { key: 'new', label: 'New', icon: Sparkles },
    { key: 'online', label: 'Online', icon: Globe }
  ] as const;

  return (
    <div>
      {/* Fixed Filter Bar for Mobile */}
      <div className="sticky top-0 z-20 bg-background/95 backdrop-blur-sm border-b shadow-sm">
        {/* Search Bar */}
        <div className="px-4 pt-3 pb-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-10 h-9 text-sm"
              style={{ fontSize: '16px' }}
            />
          </div>
        </div>
        
        {/* Filter Tabs */}
        <div className="flex items-center justify-between px-4 pb-3">
          <div className="flex gap-1">
            {viewOptions.map(({ key, label, icon: Icon }) => (
              <Button
                key={key}
                variant={activeView === key ? "default" : "ghost"}
                size="sm"
                onClick={() => onViewChange(key)}
                className="h-8 px-3 text-sm"
              >
                <Icon className="h-3 w-3 mr-1" />
                {label}
              </Button>
            ))}
          </div>

          <Button
            variant="ghost"
            onClick={onToggleFilters}
            className="h-8 px-3 text-sm"
          >
            <Filter className="h-3 w-3 mr-1" />
            More
          </Button>
        </div>
      </div>

      {/* Filter Panel */}
      {showFilters && (
        <Card className="p-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            {/* Gender Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Gender</label>
              <div className="flex gap-1">
                {GENDER_OPTIONS.map((g) => (
                  <Button
                    key={g.value}
                    size="sm"
                    variant={filters.gender.includes(g.value) ? "default" : "outline"}
                    onClick={() => {
                      const newGenders = filters.gender.includes(g.value)
                        ? filters.gender.filter(x => x !== g.value)
                        : [...filters.gender, g.value];
                      onFiltersChange({ gender: newGenders });
                    }}
                    className="flex-1 h-9 px-2"
                  >
                    <img src={g.icon} alt={g.value} className="h-4 w-4" />
                  </Button>
                ))}
              </div>
            </div>

            {/* Age Range */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Age Range</label>
              <div className="flex gap-2">
                <Input
                  type="number"
                  min={18}
                  max={65}
                  value={filters.ageRange[0]}
                  onChange={(e) => onFiltersChange({ 
                    ageRange: [parseInt(e.target.value) || 18, filters.ageRange[1]] 
                  })}
                  className="h-9 text-sm"
                  placeholder="Min"
                />
                <Input
                  type="number"
                  min={18}
                  max={65}
                  value={filters.ageRange[1]}
                  onChange={(e) => onFiltersChange({ 
                    ageRange: [filters.ageRange[0], parseInt(e.target.value) || 65] 
                  })}
                  className="h-9 text-sm"
                  placeholder="Max"
                />
              </div>
            </div>

            {/* Country Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Country</label>
              <Popover 
                open={openPopovers.country} 
                onOpenChange={(open) => setOpenPopovers(prev => ({ ...prev, country: open }))}
              >
                <PopoverTrigger asChild>
                  <Button variant="outline" className="h-9 w-full justify-between text-sm">
                    {filters.countries.length > 0 ? `${filters.countries.length} selected` : 'Any country'}
                    <Filter className="ml-2 h-3 w-3" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[250px] p-0">
                  <Command>
                    <CommandInput placeholder="Search country..." className="h-9" />
                    <CommandEmpty>No country found.</CommandEmpty>
                    <CommandGroup className="max-h-64 overflow-auto">
                      {COUNTRIES.map((country) => (
                        <CommandItem
                          key={country}
                          onSelect={() => {
                            const newCountries = filters.countries.includes(country)
                              ? filters.countries.filter(c => c !== country)
                              : [...filters.countries, country];
                            onFiltersChange({ countries: newCountries });
                          }}
                        >
                          <Check className={`mr-2 h-4 w-4 ${
                            filters.countries.includes(country) ? 'opacity-100' : 'opacity-0'
                          }`} />
                          {country}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

            {/* Native Languages */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Speaks</label>
              <Popover 
                open={openPopovers.native} 
                onOpenChange={(open) => setOpenPopovers(prev => ({ ...prev, native: open }))}
              >
                <PopoverTrigger asChild>
                  <Button variant="outline" className="h-9 w-full justify-between text-sm">
                    {filters.nativeLanguages.length > 0 ? `${filters.nativeLanguages.length} selected` : 'Any language'}
                    <Filter className="ml-2 h-3 w-3" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[250px] p-0">
                  <Command>
                    <CommandInput placeholder="Search language..." className="h-9" />
                    <CommandEmpty>No language found.</CommandEmpty>
                    <CommandGroup className="max-h-64 overflow-auto">
                      {LANGUAGES.map((lang) => (
                        <CommandItem
                          key={lang}
                          onSelect={() => {
                            const newLangs = filters.nativeLanguages.includes(lang)
                              ? filters.nativeLanguages.filter(l => l !== lang)
                              : [...filters.nativeLanguages, lang];
                            onFiltersChange({ nativeLanguages: newLangs });
                          }}
                        >
                          <Check className={`mr-2 h-4 w-4 ${
                            filters.nativeLanguages.includes(lang) ? 'opacity-100' : 'opacity-0'
                          }`} />
                          {lang}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Quick Filters & Active Filters */}
          <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-border/50">
            <Button
              size="sm"
              variant={filters.onlineOnly ? "default" : "outline"}
              onClick={() => onFiltersChange({ onlineOnly: !filters.onlineOnly })}
              className="h-8"
            >
              <div className={`w-2 h-2 rounded-full mr-2 ${
                filters.onlineOnly ? 'bg-white' : 'bg-green-500'
              }`} />
              Online Only
            </Button>

            {/* Active Filter Badges */}
            {filters.gender.map((g) => (
              <Badge key={g} variant="secondary" className="h-7 px-2 text-xs">
                {g}
                <X 
                  className="ml-1 h-3 w-3 cursor-pointer hover:text-destructive" 
                  onClick={() => onFiltersChange({ 
                    gender: filters.gender.filter(x => x !== g) 
                  })}
                />
              </Badge>
            ))}
            
            {filters.countries.map((c) => (
              <Badge key={c} variant="secondary" className="h-7 px-2 text-xs">
                {c}
                <X 
                  className="ml-1 h-3 w-3 cursor-pointer hover:text-destructive" 
                  onClick={() => onFiltersChange({ 
                    countries: filters.countries.filter(x => x !== c) 
                  })}
                />
              </Badge>
            ))}
            
            {filters.nativeLanguages.map((l) => (
              <Badge key={l} variant="secondary" className="h-7 px-2 text-xs">
                🗣️ {l}
                <X 
                  className="ml-1 h-3 w-3 cursor-pointer hover:text-destructive" 
                  onClick={() => onFiltersChange({ 
                    nativeLanguages: filters.nativeLanguages.filter(x => x !== l) 
                  })}
                />
              </Badge>
            ))}
            
            {(filters.ageRange[0] !== 18 || filters.ageRange[1] !== 65) && (
              <Badge variant="secondary" className="h-7 px-2 text-xs">
                Age: {filters.ageRange[0]}-{filters.ageRange[1]}
                <X 
                  className="ml-1 h-3 w-3 cursor-pointer hover:text-destructive" 
                  onClick={() => onFiltersChange({ ageRange: [18, 65] })}
                />
              </Badge>
            )}
          </div>
        </Card>
      )}
    </div>
  );
}
