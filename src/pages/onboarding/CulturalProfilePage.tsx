import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Globe, ArrowRight, ArrowLeft, Upload, Camera } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { CountrySelector } from '@/components/CountrySelector';
import { LanguageSelector } from '@/components/LanguageSelector';
import { useAuthStore } from '@/stores/authStore';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

const culturalProfileSchema = z.object({
  country: z.string().min(1, 'Please select your country'),
  city: z.string().optional(),
  nativeLanguages: z.array(z.string()).optional(),
  age: z.number().min(16, 'You must be at least 16 years old').max(100, 'Please enter a valid age'),
  gender: z.string().min(1, 'Please select your gender'),
});

type CulturalProfileFormData = z.infer<typeof culturalProfileSchema>;

const CulturalProfilePage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { profile, updateProfile, setOnboardingStep, onboardingCompleted } = useAuthStore();
  const [selectedCountry, setSelectedCountry] = useState<any>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(profile?.avatar_url || null);
  const [isUploading, setIsUploading] = useState(false);

  // Redirect if onboarding already completed
  useEffect(() => {
    if (onboardingCompleted) {
      navigate('/explore');
    }
  }, [onboardingCompleted, navigate]);

  const form = useForm<CulturalProfileFormData>({
    resolver: zodResolver(culturalProfileSchema),
    defaultValues: {
      country: profile?.country_code || localStorage.getItem('onboarding_country') || '',
      city: (profile as any)?.city || localStorage.getItem('onboarding_city') || '',
      nativeLanguages: [],
      age: profile?.age || (localStorage.getItem('onboarding_age') ? parseInt(localStorage.getItem('onboarding_age')!) : undefined),
      gender: (profile?.gender as string) || localStorage.getItem('onboarding_gender') || '',
    },
  });

  const watchedNativeLanguages = form.watch('nativeLanguages');

  // Load existing native languages from database
  useEffect(() => {
    const loadNativeLanguages = async () => {
      if (profile?.id) {
        const { data, error } = await supabase
          .from('languages')
          .select('language_name')
          .eq('user_id', profile.id)
          .eq('is_native', true);

        if (data && data.length > 0) {
          const languageNames = data.map(lang => lang.language_name);
          form.setValue('nativeLanguages', languageNames);
        }
      }
    };

    loadNativeLanguages();
  }, [profile?.id]);

  // Set selected country if profile has country data or from localStorage
  useEffect(() => {
    if (profile?.country && profile?.country_code && profile?.country_flag) {
      setSelectedCountry({
        code: profile.country_code,
        name: profile.country,
        flag: profile.country_flag
      });
    } else {
      const savedCountry = localStorage.getItem('onboarding_country_data');
      if (savedCountry) {
        try {
          setSelectedCountry(JSON.parse(savedCountry));
        } catch (e) {
          console.error('Failed to parse saved country');
        }
      }
    }
  }, [profile]);

  // Save form data to localStorage on change
  useEffect(() => {
    const subscription = form.watch((value) => {
      if (value.country) localStorage.setItem('onboarding_country', value.country);
      if (value.city) localStorage.setItem('onboarding_city', value.city);
      if (value.age) localStorage.setItem('onboarding_age', value.age.toString());
      if (value.gender) localStorage.setItem('onboarding_gender', value.gender);
      if (selectedCountry) localStorage.setItem('onboarding_country_data', JSON.stringify(selectedCountry));
    });
    return () => subscription.unsubscribe();
  }, [form, selectedCountry]);

  const onSubmit = async (data: CulturalProfileFormData) => {
    if (!selectedCountry) {
      toast({
        title: "Country required",
        description: "Please select your country",
        variant: "destructive",
      });
      return;
    }

    if (!profile?.id) {
      toast({
        title: "Error",
        description: "User profile not found. Please try logging in again.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsUploading(true);

      // Upload avatar if selected
      let avatarUrl = profile?.avatar_url;
      if (avatarFile) {
        const fileExt = avatarFile.name.split('.').pop();
        const fileName = `${profile?.id}-${Date.now()}.${fileExt}`;

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(fileName, avatarFile, {
            cacheControl: '3600',
            upsert: true
          });

        if (uploadError) {
          console.error('Avatar upload error:', uploadError);
          toast({
            title: "Avatar upload failed",
            description: "Continuing without avatar. You can add it later.",
            variant: "destructive"
          });
        } else {
          const { data: { publicUrl } } = supabase.storage
            .from('avatars')
            .getPublicUrl(fileName);
          avatarUrl = publicUrl;
        }
      }

      // Update user profile with cultural data
      await updateProfile({
        country_code: data.country,
        country: selectedCountry.name,
        country_flag: selectedCountry.flag,
        city: data.city,
        age: data.age,
        gender: data.gender as any,
        avatar_url: avatarUrl
      });

      // Save native languages to languages table (optional)
      if (data.nativeLanguages && data.nativeLanguages.length > 0) {
        // First, delete existing native languages for this user
        await supabase
          .from('languages')
          .delete()
          .eq('user_id', profile.id)
          .eq('is_native', true);

        const languageRecords = data.nativeLanguages.map(langName => ({
          user_id: profile.id,
          language_code: langName.toLowerCase().replace(/\s+/g, '_'),
          language_name: langName,
          is_native: true,
          is_learning: false,
          proficiency_level: 'native',
        }));

        const { error: langError } = await supabase
          .from('languages')
          .insert(languageRecords);

        if (langError) {
          console.error('Error saving languages:', langError);
          // Don't throw - languages are optional
        }
      }

      // Clear localStorage after successful save
      localStorage.removeItem('onboarding_country');
      localStorage.removeItem('onboarding_city');
      localStorage.removeItem('onboarding_age');
      localStorage.removeItem('onboarding_gender');
      localStorage.removeItem('onboarding_country_data');

      // Mark onboarding as complete - core fields are done
      await updateProfile({
        onboarding_completed: true
      });

      toast({
        title: "Welcome to roshLingua! 🎉",
        description: "Your profile is complete. Start exploring!",
      });
      navigate('/explore');
    } catch (error) {
      console.error('Onboarding error:', error);
      toast({
        title: "Update failed",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-card-cultural to-background">
      <div className="container mx-auto px-3 py-3">
        {/* Header */}
        <div className="max-w-lg mx-auto">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              <Globe className="h-5 w-5 text-primary" />
              <h1 className="text-lg font-bold text-primary">roshLingua</h1>
            </div>
            <div className="text-xs text-muted-foreground">
              Step 2 of 3
            </div>
          </div>

          <Progress value={66} className="mb-4" />

          <Card className="card-cultural">
            <CardHeader className="text-center px-3 py-3">
              <CardTitle className="text-lg">Your Cultural Profile</CardTitle>
              <CardDescription className="text-xs">
                Tell us about yourself
              </CardDescription>
            </CardHeader>

            <CardContent className="px-3 py-3">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
                  {/* Profile Photo Section - Compact */}
                  <div className="text-center">
                    <div className="relative w-16 h-16 mx-auto mb-2">
                      {avatarPreview ? (
                        <img
                          src={avatarPreview}
                          alt="Profile"
                          className="w-16 h-16 rounded-full object-cover border-2 border-primary"
                        />
                      ) : (
                        <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center">
                          <Camera className="h-6 w-6 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                    <input
                      type="file"
                      id="avatar-upload"
                      accept="image/*"
                      className="hidden"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          if (file.size > 5 * 1024 * 1024) {
                            toast({
                              title: "File too large",
                              description: "Please select an image under 5MB",
                              variant: "destructive"
                            });
                            return;
                          }
                          setAvatarFile(file);
                          const preview = URL.createObjectURL(file);
                          setAvatarPreview(preview);
                        }
                      }}
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      type="button"
                      onClick={() => document.getElementById('avatar-upload')?.click()}
                      disabled={isUploading}
                      className="h-7 text-xs"
                    >
                      <Upload className="mr-1 h-3 w-3" />
                      {avatarPreview ? 'Change' : 'Add Photo'}
                    </Button>
                  </div>

                  {/* Country Selection */}
                  <FormField
                    control={form.control}
                    name="country"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm">Country *</FormLabel>
                        <FormControl>
                          <CountrySelector
                            value={field.value}
                            onValueChange={(countryCode, country) => {
                              field.onChange(countryCode);
                              setSelectedCountry(country);
                            }}
                            placeholder="Select country..."
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* City */}
                  <FormField
                    control={form.control}
                    name="city"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm">City (optional)</FormLabel>
                        <FormControl>
                          <Input placeholder="Your city" {...field} className="h-9" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Native Languages */}
                  <FormField
                    control={form.control}
                    name="nativeLanguages"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm">Native Language(s) (optional)</FormLabel>
                        <FormControl>
                          <LanguageSelector
                            selectedLanguages={field.value}
                            onLanguagesChange={field.onChange}
                            type="native"
                            placeholder="Add languages..."
                            maxSelection={3}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Age and Gender - Side by Side */}
                  <div className="grid grid-cols-2 gap-2">
                    <FormField
                      control={form.control}
                      name="age"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm">Age *</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              placeholder="Age"
                              {...field}
                              value={field.value || ''}
                              onChange={(e) => {
                                const val = e.target.value;
                                field.onChange(val === '' ? undefined : parseInt(val) || undefined);
                              }}
                              className="h-9"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="gender"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm">Gender *</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger className="h-9">
                                <SelectValue placeholder="Select" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="male">Male</SelectItem>
                              <SelectItem value="female">Female</SelectItem>
                              <SelectItem value="non-binary">Non-binary</SelectItem>
                              <SelectItem value="prefer-not-to-say">Prefer not to say</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Navigation Buttons */}
                  <div className="flex justify-between pt-3">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => navigate('/onboarding/welcome')}
                      size="sm"
                    >
                      <ArrowLeft className="mr-1 h-3 w-3" />
                      Back
                    </Button>

                    <Button
                      type="submit"
                      variant="cultural"
                      disabled={isUploading}
                      size="sm"
                    >
                      {isUploading ? 'Saving...' : 'Continue'}
                      <ArrowRight className="ml-1 h-3 w-3" />
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default CulturalProfilePage;