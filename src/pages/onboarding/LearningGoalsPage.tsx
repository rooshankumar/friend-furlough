import { useState } from 'react';
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
  
  const onSubmit = async (data: LearningGoalsFormData) => {
    try {
      // Update user profile with learning goals
      await updateProfile({
        bio: data.bio,
      });
      
      completeOnboarding();
      
      toast({
        title: "Welcome to roshLingua! 🎉",
        description: "Your cultural profile is complete. Start exploring and connecting!",
      });
      
      navigate('/explore');
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
              Step 3 of 3
            </div>
          </div>
          
          <Progress value={100} className="mb-8" />
          
          <Card className="card-cultural">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">Set Your Learning Goals</CardTitle>
              <CardDescription>
                Tell us what you want to learn and share so we can find your perfect cultural exchange partners
              </CardDescription>
            </CardHeader>
            
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  {/* Learning Languages */}
                  <FormField
                    control={form.control}
                    name="learningLanguages"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Languages You Want to Learn</FormLabel>
                        <FormControl>
                          <LanguageSelector
                            selectedLanguages={field.value}
                            onLanguagesChange={field.onChange}
                            type="learning"
                            placeholder="Add languages you want to learn..."
                            maxSelection={4}
                          />
                        </FormControl>
                        <FormDescription>
                          Select languages you're currently learning or want to start learning
                        </FormDescription>
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
                        <FormLabel>Cultural Interests</FormLabel>
                        <FormControl>
                          <CulturalInterestSelector
                            selectedInterests={field.value}
                            onInterestsChange={field.onChange}
                            placeholder="Add your cultural interests..."
                            maxSelection={8}
                          />
                        </FormControl>
                        <FormDescription>
                          Choose topics you're passionate about to connect with like-minded people
                        </FormDescription>
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
                        <FormLabel>Cultural Bio</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Share something about your cultural background, what you love about your culture, and what you're excited to learn about others..."
                            className="min-h-[100px]"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
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
                        <FormLabel>What are you looking for?</FormLabel>
                        <FormDescription className="mb-4">
                          Select all that apply to help us match you with the right people
                        </FormDescription>
                        <FormControl>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
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
                                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer flex items-center"
                                >
                                  <option.icon className="h-4 w-4 mr-2 text-muted-foreground" />
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
                  <div className="flex justify-between pt-6">
                    <Button 
                      type="button" 
                      variant="outline"
                      onClick={() => navigate('/onboarding/cultural-profile')}
                    >
                      <ArrowLeft className="mr-2 h-4 w-4" />
                      Back
                    </Button>
                    
                    <Button 
                      type="submit" 
                      variant="cultural"
                    >
                      Complete Setup
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

export default LearningGoalsPage;