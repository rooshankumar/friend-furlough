import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { X, Plus, Edit, Loader2, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuthStore } from '@/stores/authStore';
import { supabase } from '@/integrations/supabase/client';
import { countries } from '@/data/countries';
import { languages } from '@/data/languages';
import { validateProfileForm, getFieldError } from '@/lib/validation';

interface EditProfileModalProps {
  trigger?: React.ReactNode;
}

export const EditProfileModal: React.FC<EditProfileModalProps> = ({ trigger }) => {
  const { user, profile, updateProfile } = useAuthStore();
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Array<{ field: string; message: string }>>([]);
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    bio: '',
    country: '',
    city: '',
    age: '',
    gender: '',
    looking_for: [] as string[],
    language_goals: [] as string[],
    countries_visited: [] as string[],
    teaching_experience: false,
  });

  // Initialize form data when profile changes
  useEffect(() => {
    if (profile) {
      setFormData({
        name: profile.name || '',
        bio: profile.bio || '',
        country: profile.country || '',
        city: profile.city || '',
        age: profile.age?.toString() || '',
        gender: profile.gender || '',
        looking_for: profile.looking_for || [],
        language_goals: profile.language_goals || [],
        countries_visited: profile.countries_visited || [],
        teaching_experience: profile.teaching_experience || false
      });
    }
  }, [profile]);

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleArrayAdd = (field: string, value: string) => {
    if (value) {
      const currentArray = formData[field as keyof typeof formData] as string[];
      if (Array.isArray(currentArray) && !currentArray.includes(value)) {
        setFormData(prev => ({
          ...prev,
          [field]: [...currentArray, value]
        }));
      }
    }
  };

  const handleArrayRemove = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: (prev[field as keyof typeof prev] as string[]).filter(item => item !== value)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    // Validate form
    const validation = validateProfileForm({
      name: formData.name,
      bio: formData.bio,
      age: formData.age,
      city: formData.city,
      country: formData.country,
    });

    if (!validation.valid) {
      setValidationErrors(validation.errors);
      toast({
        title: "Validation failed",
        description: "Please fix the errors below",
        variant: "destructive"
      });
      return;
    }

    setValidationErrors([]);
    setIsLoading(true);
    try {
      const updateData = {
        ...formData,
        age: formData.age ? parseInt(formData.age) : null,
        gender: formData.gender ? (formData.gender as 'male' | 'female' | 'non-binary' | 'prefer-not-to-say') : undefined,
        updated_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', user.id);

      if (error) throw error;

      // Update local state
      await updateProfile(updateData);

      toast({
        title: "Profile updated successfully!",
        description: "Your changes have been saved.",
      });

      setIsOpen(false);
    } catch (error: any) {
      console.error('Profile update error:', error);
      toast({
        title: "Failed to update profile",
        description: error.message || "Please try again",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const defaultTrigger = (
    <Button variant="outline" size="sm">
      <Edit className="h-4 w-4 mr-2" />
      Edit Profile
    </Button>
  );

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || defaultTrigger}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Profile</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Validation Errors Summary */}
          {validationErrors.length > 0 && (
            <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-4">
              <div className="flex gap-2 items-start">
                <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="font-medium text-destructive mb-2">Please fix the following errors:</p>
                  <ul className="list-disc list-inside space-y-1">
                    {validationErrors.map((error, idx) => (
                      <li key={idx} className="text-sm text-destructive">
                        {error.message}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Basic Information</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className={getFieldError(validationErrors, 'name') ? 'border-destructive' : ''}
                  required
                />
                {getFieldError(validationErrors, 'name') && (
                  <p className="text-xs text-destructive mt-1">{getFieldError(validationErrors, 'name')}</p>
                )}
              </div>
              
              <div>
                <Label htmlFor="age">Age</Label>
                <Input
                  id="age"
                  type="number"
                  min="13"
                  max="120"
                  value={formData.age}
                  onChange={(e) => handleInputChange('age', e.target.value)}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="bio">Bio</Label>
              <Textarea
                id="bio"
                value={formData.bio}
                onChange={(e) => handleInputChange('bio', e.target.value)}
                placeholder="Tell us about yourself..."
                rows={3}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="country">Country</Label>
                <Select value={formData.country} onValueChange={(value) => handleInputChange('country', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select country" />
                  </SelectTrigger>
                  <SelectContent>
                    {countries.map((country) => (
                      <SelectItem key={country.code} value={country.name}>
                        {country.flag} {country.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  value={formData.city}
                  onChange={(e) => handleInputChange('city', e.target.value)}
                  placeholder="Your city"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="gender">Gender</Label>
              <Select value={formData.gender} onValueChange={(value) => handleInputChange('gender', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select gender" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="female">Female</SelectItem>
                  <SelectItem value="non-binary">Non-binary</SelectItem>
                  <SelectItem value="prefer-not-to-say">Prefer not to say</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Language Goals */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Language Goals</h3>
            <div>
              <Label>Languages you want to learn</Label>
              <Select onValueChange={(value) => handleArrayAdd('language_goals', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Add a language" />
                </SelectTrigger>
                <SelectContent>
                  {languages.map((lang) => (
                    <SelectItem key={lang.code} value={lang.name}>
                      {lang.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="flex flex-wrap gap-2 mt-2">
                {formData.language_goals.map((lang) => (
                  <Badge key={lang} variant="secondary" className="flex items-center gap-1">
                    {lang}
                    <X 
                      className="h-3 w-3 cursor-pointer" 
                      onClick={() => handleArrayRemove('language_goals', lang)}
                    />
                  </Badge>
                ))}
              </div>
            </div>
          </div>

          {/* Looking For */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">What are you looking for?</h3>
            <div>
              <Select onValueChange={(value) => handleArrayAdd('looking_for', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Add what you're looking for" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Language Exchange">Language Exchange</SelectItem>
                  <SelectItem value="Cultural Exchange">Cultural Exchange</SelectItem>
                  <SelectItem value="Travel Buddies">Travel Buddies</SelectItem>
                  <SelectItem value="Friendship">Friendship</SelectItem>
                  <SelectItem value="Professional Networking">Professional Networking</SelectItem>
                  <SelectItem value="Study Partners">Study Partners</SelectItem>
                </SelectContent>
              </Select>
              <div className="flex flex-wrap gap-2 mt-2">
                {formData.looking_for.map((item) => (
                  <Badge key={item} variant="secondary" className="flex items-center gap-1">
                    {item}
                    <X 
                      className="h-3 w-3 cursor-pointer" 
                      onClick={() => handleArrayRemove('looking_for', item)}
                    />
                  </Badge>
                ))}
              </div>
            </div>
          </div>

          {/* Countries Visited */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Countries Visited</h3>
            <div>
              <Select onValueChange={(value) => handleArrayAdd('countries_visited', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Add a country you've visited" />
                </SelectTrigger>
                <SelectContent>
                  {countries.map((country) => (
                    <SelectItem key={country.code} value={country.name}>
                      {country.flag} {country.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="flex flex-wrap gap-2 mt-2">
                {formData.countries_visited.map((country) => (
                  <Badge key={country} variant="secondary" className="flex items-center gap-1">
                    {countries.find(c => c.name === country)?.flag} {country}
                    <X 
                      className="h-3 w-3 cursor-pointer" 
                      onClick={() => handleArrayRemove('countries_visited', country)}
                    />
                  </Badge>
                ))}
              </div>
            </div>
          </div>


          {/* Teaching Experience */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Teaching Experience</h3>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="teaching_experience"
                checked={formData.teaching_experience}
                onChange={(e) => handleInputChange('teaching_experience', e.target.checked)}
                className="rounded border-gray-300"
              />
              <Label htmlFor="teaching_experience">I have teaching experience</Label>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Save Changes
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
