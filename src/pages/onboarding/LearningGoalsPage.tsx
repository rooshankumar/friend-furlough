import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Globe, ArrowRight, ArrowLeft, Target, Users, MessageCircle } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
import { LanguageSelector } from '@/components/LanguageSelector';
import { CulturalInterestSelector } from '@/components/CulturalInterestSelector';
import { useAuthStore } from '@/stores/authStore';
import { useToast } from '@/hooks/use-toast';
import { sendWelcomeEmail } from '@/lib/emailService';
import { supabase } from '@/integrations/supabase/client';

const learningGoalsSchema = z.object({
  learningLanguages: z.array(z.string()).min(1, 'Please select at least one language to learn'),
  culturalInterests: z.array(z.string()).min(3, 'Please select at least 3 cultural interests'),
  bio: z.string().min(20, 'Bio must be at least 20 characters').max(300, 'Bio must be less than 300 characters'),
  lookingFor: z.array(z.string()).min(1, 'Please select what you\'re looking for'),
});

type LearningGoalsFormData = z.infer<typeof learningGoalsSchema>;

const lookingForOptions = [
  { id: 'language-exchange', label: 'Language Exchange Partners', icon: MessageCircle },
  { id: 'cultural-friends', label: 'Cultural Friends', icon: Users },
  { id: 'travel-tips', label: 'Travel Tips & Advice', icon: Target },
  { id: 'professional-network', label: 'Professional Networking', icon: Target },
  { id: 'cooking-exchange', label: 'Cooking & Recipe Exchange', icon: Target },
  { id: 'art-collaboration', label: 'Art & Creative Collaboration', icon: Target },
];

const LearningGoalsPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { profile, updateProfile, completeOnboarding } = useAuthStore();
  const [nativeLanguages, setNativeLanguages] = useState<string[]>([]);
  
  const form = useForm<LearningGoalsFormData>({
    resolver: zodResolver(learningGoalsSchema),
    defaultValues: {
      learningLanguages: [],
      culturalInterests: [],
      bio: profile?.bio || '',
      lookingFor: [],
    },
  });
  
  const watchedLookingFor = form.watch('lookingFor');
  
  // Fetch native languages to exclude from learning languages
  useEffect(() => {
    const fetchNativeLanguages = async () => {
      if (profile?.id) {
        const { data } = await supabase
          .from('languages')
          .select('language_name')
          .eq('user_id', profile.id)
          .eq('is_native', true);
        
        if (data) {
          setNativeLanguages(data.map(lang => lang.language_name));
        }
      }
    };
    
    fetchNativeLanguages();
  }, [profile?.id]);
  
  const onSubmit = async (data: LearningGoalsFormData) => {
    if (!profile?.id) {
      toast({
        title: "Error",
        description: "User profile not found. Please try logging in again.",
        variant: "destructive",
      });
      return;
    }
    
    try {
      // Update user profile with bio
      await updateProfile({
        bio: data.bio,
      });
      
      // Save learning languages to languages table
      // First, delete existing learning languages for this user
      await supabase
        .from('languages')
        .delete()
        .eq('user_id', profile.id)
        .eq('is_learning', true);
      
      // Insert new learning languages
      if (data.learningLanguages.length > 0) {
        const languageRecords = data.learningLanguages.map(langName => ({
          user_id: profile.id,
          language_code: langName.toLowerCase().replace(/\s+/g, '_'),
          language_name: langName,
          is_native: false,
          is_learning: true,
          proficiency_level: 'beginner',
        }));
        
        const { error: langError } = await supabase
          .from('languages')
          .insert(languageRecords);
        
        if (langError) {
          console.error('Error saving learning languages:', langError);
          throw langError;
        }
      }
      
      // Save cultural interests to cultural_interests table
      // First, delete existing cultural interests for this user
      await supabase
        .from('cultural_interests')
        .delete()
        .eq('user_id', profile.id);
      
      // Insert new cultural interests
      if (data.culturalInterests.length > 0) {
        const interestRecords = data.culturalInterests.map(interest => ({
          user_id: profile.id,
          interest: interest,
        }));
        
        const { error: interestError } = await supabase
          .from('cultural_interests')
          .insert(interestRecords);
        
        if (interestError) {
          console.error('Error saving cultural interests:', interestError);
          throw interestError;
        }
      }
      
      // Mark onboarding as complete and save looking_for preferences
      await updateProfile({
        onboarding_completed: true,
        looking_for: data.lookingFor,
      });
      
      completeOnboarding();
      
      // Send onboarding completion email asynchronously
      try {
        await sendWelcomeEmail(profile.email || '', profile.name);
        console.log('✅ Onboarding completion email sent');
      } catch (emailError) {
        console.warn('⚠️ Failed to send onboarding email:', emailError);
        // Don't block navigation - email is optional
      }
      
      toast({
        title: "Welcome to roshLingua! 🎉",
        description: "Your cultural profile is complete. Start exploring and connecting!",
      });
      
      navigate('/explore');
    } catch (error) {
      console.error('Onboarding completion error:', error);
      toast({
        title: "Update failed",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
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
              Step 3 of 3
            </div>
          </div>
          
          <Progress value={100} className="mb-4" />
          
          <Card className="card-cultural">
            <CardHeader className="text-center px-3 py-3">
              <CardTitle className="text-lg">Learning Goals</CardTitle>
              <CardDescription className="text-xs">
                What do you want to learn and share?
              </CardDescription>
            </CardHeader>
            
            <CardContent className="px-3 py-3">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
                  {/* Learning Languages */}
                  <FormField
                    control={form.control}
                    name="learningLanguages"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm">Languages to Learn</FormLabel>
                        <FormControl>
                          <LanguageSelector
                            selectedLanguages={field.value}
                            onLanguagesChange={field.onChange}
                            type="learning"
                            placeholder="Add languages..."
                            maxSelection={4}
                            excludeLanguages={nativeLanguages}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  {/* Cultural Interests */}
                  <FormField
                    control={form.control}
                    name="culturalInterests"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm">Cultural Interests</FormLabel>
                        <FormControl>
                          <CulturalInterestSelector
                            selectedInterests={field.value}
                            onInterestsChange={field.onChange}
                            placeholder="Add interests..."
                            maxSelection={8}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  {/* Bio */}
                  <FormField
                    control={form.control}
                    name="bio"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm">About You</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Tell us about yourself and what you're excited to learn..."
                            className="min-h-[80px] text-sm"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription className="text-xs">
                          {field.value?.length || 0}/300 characters
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  {/* Looking For */}
                  <FormField
                    control={form.control}
                    name="lookingFor"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm">I'm looking for</FormLabel>
                        <FormControl>
                          <div className="space-y-2">
                            {lookingForOptions.map((option) => (
                              <div key={option.id} className="flex items-center space-x-2">
                                <Checkbox
                                  id={option.id}
                                  checked={field.value.includes(option.id)}
                                  onCheckedChange={(checked) => {
                                    if (checked) {
                                      field.onChange([...field.value, option.id]);
                                    } else {
                                      field.onChange(field.value.filter(item => item !== option.id));
                                    }
                                  }}
                                />
                                <label 
                                  htmlFor={option.id}
                                  className="text-xs font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer flex items-center"
                                >
                                  <option.icon className="h-3 w-3 mr-1 text-muted-foreground" />
                                  {option.label}
                                </label>
                              </div>
                            ))}
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  {/* Navigation Buttons */}
                  <div className="flex justify-between pt-3">
                    <Button 
                      type="button" 
                      variant="outline"
                      onClick={() => navigate('/onboarding/cultural-profile')}
                      size="sm"
                    >
                      <ArrowLeft className="mr-1 h-3 w-3" />
                      Back
                    </Button>
                    
                    <Button 
                      type="submit" 
                      variant="cultural"
                      size="sm"
                    >
                      Complete
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

export default LearningGoalsPage;