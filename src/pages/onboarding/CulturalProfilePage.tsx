import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Globe, ArrowRight, ArrowLeft, Upload, Camera } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { Progress } from '@/components/ui/progress';
import { CountrySelector } from '@/components/CountrySelector';
import { LanguageSelector } from '@/components/LanguageSelector';
import { useAuthStore } from '@/stores/authStore';
import { useToast } from '@/hooks/use-toast';

const culturalProfileSchema = z.object({
  country: z.string().min(1, 'Please select your country'),
  city: z.string().min(2, 'City must be at least 2 characters'),
  nativeLanguages: z.array(z.string()).min(1, 'Please select at least one native language'),
  age: z.number().min(16, 'You must be at least 16 years old').max(100, 'Please enter a valid age'),
});

type CulturalProfileFormData = z.infer<typeof culturalProfileSchema>;

const CulturalProfilePage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { profile, updateProfile, setOnboardingStep } = useAuthStore();
  const [selectedCountry, setSelectedCountry] = useState<any>(null);
  
  const form = useForm<CulturalProfileFormData>({
    resolver: zodResolver(culturalProfileSchema),
    defaultValues: {
      country: profile?.country_code || '',
      city: '',
      nativeLanguages: [],
      age: profile?.age || 0,
    },
  });
  
  const watchedNativeLanguages = form.watch('nativeLanguages');
  
  const onSubmit = async (data: CulturalProfileFormData) => {
    if (!selectedCountry) {
      toast({
        title: "Country required",
        description: "Please select your country",
        variant: "destructive",
      });
      return;
    }
    
    try {
      // Update user profile with cultural data
      await updateProfile({
        country_code: data.country,
        country: selectedCountry.name,
        country_flag: selectedCountry.flag,
        age: data.age,
      });
      
      setOnboardingStep(3);
      toast({
        title: "Cultural profile updated! 🌍",
        description: "Now let's set up your language learning goals.",
      });
      navigate('/onboarding/learning-goals');
    } catch (error) {
      toast({
        title: "Update failed",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    }
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-card-cultural to-background">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center space-x-2">
              <Globe className="h-6 w-6 text-primary" />
              <h1 className="text-2xl font-bold text-primary">roshLingua</h1>
            </div>
            <div className="text-sm text-muted-foreground">
              Step 2 of 3
            </div>
          </div>
          
          <Progress value={66} className="mb-8" />
          
          <Card className="card-cultural">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">Share Your Cultural Background</CardTitle>
              <CardDescription>
                Help others learn about your culture and find perfect language exchange partners
              </CardDescription>
            </CardHeader>
            
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  {/* Profile Photo Section */}
                  <div className="text-center">
                    <div className="w-24 h-24 bg-muted rounded-full mx-auto mb-4 flex items-center justify-center">
                      <Camera className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <Button variant="outline" size="sm">
                      <Upload className="mr-2 h-4 w-4" />
                      Upload Photo
                    </Button>
                    <p className="text-xs text-muted-foreground mt-2">
                      Optional: Add a photo to help others connect with you
                    </p>
                  </div>
                  
                  {/* Country Selection */}
                  <FormField
                    control={form.control}
                    name="country"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Country of Origin</FormLabel>
                        <FormControl>
                          <CountrySelector
                            value={field.value}
                            onValueChange={(countryCode, country) => {
                              field.onChange(countryCode);
                              setSelectedCountry(country);
                            }}
                            placeholder="Select your country..."
                          />
                        </FormControl>
                        <FormDescription>
                          This helps others learn about your cultural background
                        </FormDescription>
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
                        <FormLabel>City</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter your city" {...field} />
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
                        <FormLabel>Native Language(s)</FormLabel>
                        <FormControl>
                          <LanguageSelector
                            selectedLanguages={field.value}
                            onLanguagesChange={field.onChange}
                            type="native"
                            placeholder="Add your native languages..."
                            maxSelection={3}
                          />
                        </FormControl>
                        <FormDescription>
                          Languages you speak fluently or grew up speaking
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  {/* Age */}
                  <FormField
                    control={form.control}
                    name="age"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Age</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            placeholder="Enter your age" 
                            {...field}
                            onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                          />
                        </FormControl>
                        <FormDescription>
                          Helps find age-appropriate cultural exchange partners
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  {/* Navigation Buttons */}
                  <div className="flex justify-between pt-6">
                    <Button 
                      type="button" 
                      variant="outline"
                      onClick={() => navigate('/auth/signup')}
                    >
                      <ArrowLeft className="mr-2 h-4 w-4" />
                      Back
                    </Button>
                    
                    <Button 
                      type="submit" 
                      variant="cultural"
                    >
                      Continue to Learning Goals
                      <ArrowRight className="ml-2 h-4 w-4" />
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