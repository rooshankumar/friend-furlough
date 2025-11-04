import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useTheme } from '@/components/ThemeProvider';
import { Moon, Sun, Monitor, Bell, Globe, Lock, User, Camera, Loader2, LogOut, Save, X, Plus, Languages, MapPin, Heart } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { useAuthStore } from '@/stores/authStore';
import { useToast } from '@/hooks/use-toast';
import { uploadAvatar } from '@/lib/storage';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { countries } from '@/data/countries';
import { languages } from '@/data/languages';

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const { user, profile, updateProfile, signOut } = useAuthStore();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');
  
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
    teaching_experience: false
  });

  const [nativeLanguages, setNativeLanguages] = useState<string[]>([]);
  const [learningLanguages, setLearningLanguages] = useState<string[]>([]);
  const [newNativeLang, setNewNativeLang] = useState('');
  const [newLearningLang, setNewLearningLang] = useState('');
  const [newLookingFor, setNewLookingFor] = useState('');
  const [newLanguageGoal, setNewLanguageGoal] = useState('');
  const [newCountryVisited, setNewCountryVisited] = useState('');

  // Load profile data
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

  // Load languages
  useEffect(() => {
    loadLanguages();
  }, [user]);

  const loadLanguages = async () => {
    if (!user?.id) return;
    
    const { data } = await supabase
      .from('languages')
      .select('language_name, is_native, is_learning')
      .eq('user_id', user.id);
    
    if (data) {
      setNativeLanguages(data.filter(l => l.is_native).map(l => l.language_name));
      setLearningLanguages(data.filter(l => l.is_learning).map(l => l.language_name));
    }
  };

  const handleLogout = () => {
    signOut();
    toast({
      title: "Logged out successfully",
      description: "See you soon!",
    });
    navigate('/');
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleArrayAdd = (field: string, value: string) => {
    const currentValue = formData[field as keyof typeof formData];
    if (value && Array.isArray(currentValue) && !currentValue.includes(value)) {
      setFormData(prev => ({
        ...prev,
        [field]: [...currentValue, value]
      }));
    }
  };

  const handleArrayRemove = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: (prev[field as keyof typeof prev] as string[]).filter(item => item !== value)
    }));
  };

  const addNativeLanguage = () => {
    if (newNativeLang && !nativeLanguages.includes(newNativeLang)) {
      setNativeLanguages([...nativeLanguages, newNativeLang]);
      setNewNativeLang('');
    }
  };

  const addLearningLanguage = () => {
    if (newLearningLang && !learningLanguages.includes(newLearningLang)) {
      setLearningLanguages([...learningLanguages, newLearningLang]);
      setNewLearningLang('');
    }
  };

  const removeNativeLanguage = (lang: string) => {
    setNativeLanguages(nativeLanguages.filter(l => l !== lang));
  };

  const removeLearningLanguage = (lang: string) => {
    setLearningLanguages(learningLanguages.filter(l => l !== lang));
  };

  const handleSaveProfile = async () => {
    if (!user?.id) return;

    setIsSaving(true);
    try {
      // Update profile
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          name: formData.name,
          bio: formData.bio,
          country: formData.country,
          city: formData.city,
          age: formData.age ? parseInt(formData.age) : null,
          gender: formData.gender || null,
          looking_for: formData.looking_for,
          language_goals: formData.language_goals,
          countries_visited: formData.countries_visited,
          teaching_experience: formData.teaching_experience,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (profileError) throw profileError;

      // Update languages
      await supabase.from('languages').delete().eq('user_id', user.id);
      
      const languageInserts = [
        ...nativeLanguages.map(lang => ({
          user_id: user.id,
          language_name: lang,
          is_native: true,
          is_learning: false
        })),
        ...learningLanguages.map(lang => ({
          user_id: user.id,
          language_name: lang,
          is_native: false,
          is_learning: true
        }))
      ];

      if (languageInserts.length > 0) {
        await supabase.from('languages').insert(languageInserts);
      }

      // Fetch and update the complete profile data
      const { data: updatedProfile, error: fetchError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (!fetchError && updatedProfile) {
        await updateProfile(updatedProfile);
      }

      toast({
        title: "Profile updated! ✨",
        description: "Your changes have been saved successfully."
      });
    } catch (error: any) {
      toast({
        title: "Update failed",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) =>{
    const file = e.target.files?.[0];
    if (!file || !user?.id) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid file type",
        description: "Please select an image file (JPG, PNG, etc.)",
        variant: "destructive"
      });
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Image must be smaller than 5MB",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsUploading(true);
      
      toast({
        title: "Uploading...",
        description: "Compressing and uploading your avatar"
      });
      
      console.log('Uploading avatar for user:', user.id);
      const avatarUrl = await uploadAvatar(file, user.id);
      console.log('Avatar uploaded, URL:', avatarUrl);
      
      await updateProfile({ avatar_url: avatarUrl });
      console.log('Profile updated with avatar URL');
      
      toast({
        title: "Avatar updated! ✨",
        description: "Your profile photo has been updated successfully."
      });
      
      // Reload the page to fetch updated profile
      setTimeout(() => window.location.reload(), 1000);
    } catch (error: any) {
      console.error('Avatar upload error:', error);
      toast({
        title: "Upload failed",
        description: error.message || "Failed to upload avatar. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
    }
  };


  return (
    <div className="min-h-screen md:ml-16 bg-gradient-subtle pb-16 md:pb-0 overflow-auto">
      <div className="p-3 md:p-8 max-w-5xl mx-auto">
        {/* Header - Hidden on Mobile */}
        <div className="hidden md:block mb-6">
          <h1 className="text-3xl font-bold">Settings</h1>
          <p className="text-muted-foreground">
            Manage your profile and preferences
          </p>
        </div>

        {/* Tabbed Interface */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-4 lg:grid-cols-5">
            <TabsTrigger value="profile" className="text-xs md:text-sm">
              <User className="h-4 w-4 mr-0 md:mr-2" />
              <span className="hidden md:inline">Profile</span>
            </TabsTrigger>
            <TabsTrigger value="languages" className="text-xs md:text-sm">
              <Languages className="h-4 w-4 mr-0 md:mr-2" />
              <span className="hidden md:inline">Languages</span>
            </TabsTrigger>
            <TabsTrigger value="appearance" className="text-xs md:text-sm">
              <Sun className="h-4 w-4 mr-0 md:mr-2" />
              <span className="hidden md:inline">Appearance</span>
            </TabsTrigger>
            <TabsTrigger value="privacy" className="text-xs md:text-sm">
              <Lock className="h-4 w-4 mr-0 md:mr-2" />
              <span className="hidden md:inline">Privacy</span>
            </TabsTrigger>
            <TabsTrigger value="account" className="text-xs md:text-sm">
              <LogOut className="h-4 w-4 mr-0 md:mr-2" />
              <span className="hidden md:inline">Account</span>
            </TabsTrigger>
          </TabsList>

          {/* Profile Tab */}
          <TabsContent value="profile" className="space-y-4">
        {/* Avatar Upload Only */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Avatar
            </CardTitle>
            <CardDescription>
              Update your profile picture
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Avatar Upload */}
            <div className="flex items-center gap-4">
              <Avatar className="h-20 w-20">
                <AvatarImage src={profile?.avatar_url || user?.user_metadata?.avatar_url} />
                <AvatarFallback className="bg-gradient-cultural text-white text-lg">
                  {profile?.name?.[0] || user?.email?.[0]?.toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="space-y-2">
                <Label htmlFor="avatar" className="cursor-pointer">
                  <Button variant="outline" size="sm" asChild>
                    <span>
                      {isUploading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Uploading...
                        </>
                      ) : (
                        <>
                          <Camera className="mr-2 h-4 w-4" />
                          Change Avatar
                        </>
                      )}
                    </span>
                  </Button>
                </Label>
                <input
                  id="avatar"
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                  onChange={handleAvatarUpload}
                  className="hidden"
                  disabled={isUploading}
                  style={{ display: 'none' }}
                />
                <p className="text-xs text-muted-foreground">
                  JPG, PNG or GIF. Max size 5MB.
                </p>
              </div>
            </div>

          </CardContent>
        </Card>

            {/* Profile Information */}
            <Card>
              <CardHeader>
                <CardTitle>Profile Information</CardTitle>
                <CardDescription>Update your personal details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Name</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      placeholder="Your name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="age">Age</Label>
                    <Input
                      id="age"
                      type="number"
                      value={formData.age}
                      onChange={(e) => handleInputChange('age', e.target.value)}
                      placeholder="Age"
                    />
                  </div>
                </div>
                <div className="space-y-2">
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
                  <div className="space-y-2">
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
                  <div className="space-y-2">
                    <Label htmlFor="country">Country</Label>
                    <Select value={formData.country} onValueChange={(value) => handleInputChange('country', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select country" />
                      </SelectTrigger>
                      <SelectContent>
                        {countries.map(country => (
                          <SelectItem key={country.code} value={country.name}>{country.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    value={formData.city}
                    onChange={(e) => handleInputChange('city', e.target.value)}
                    placeholder="Your city"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Save Button */}
            <Button onClick={handleSaveProfile} disabled={isSaving} className="w-full">
              {isSaving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
              Save Changes
            </Button>

          </TabsContent>

          {/* Languages Tab */}
          <TabsContent value="languages" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Languages</CardTitle>
                <CardDescription>Manage your native and learning languages</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Native Languages</Label>
                  <div className="flex gap-2 mt-2 flex-wrap">
                    {nativeLanguages.map(lang => (
                      <Badge key={lang} variant="secondary">
                        {lang}
                        <X className="h-3 w-3 ml-1 cursor-pointer" onClick={() => removeNativeLanguage(lang)} />
                      </Badge>
                    ))}
                  </div>
                  <div className="flex gap-2 mt-2">
                    <Select value={newNativeLang} onValueChange={setNewNativeLang}>
                      <SelectTrigger className="flex-1">
                        <SelectValue placeholder="Add native language" />
                      </SelectTrigger>
                      <SelectContent>
                        {languages.map(lang => (
                          <SelectItem key={lang.code} value={lang.name}>{lang.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button onClick={addNativeLanguage} size="sm">
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <Separator />
                <div>
                  <Label>Learning Languages</Label>
                  <div className="flex gap-2 mt-2 flex-wrap">
                    {learningLanguages.map(lang => (
                      <Badge key={lang} variant="secondary">
                        {lang}
                        <X className="h-3 w-3 ml-1 cursor-pointer" onClick={() => removeLearningLanguage(lang)} />
                      </Badge>
                    ))}
                  </div>
                  <div className="flex gap-2 mt-2">
                    <Select value={newLearningLang} onValueChange={setNewLearningLang}>
                      <SelectTrigger className="flex-1">
                        <SelectValue placeholder="Add learning language" />
                      </SelectTrigger>
                      <SelectContent>
                        {languages.map(lang => (
                          <SelectItem key={lang.code} value={lang.name}>{lang.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button onClick={addLearningLanguage} size="sm">
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Button onClick={handleSaveProfile} disabled={isSaving} className="w-full">
              {isSaving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
              Save Changes
            </Button>
          </TabsContent>

          {/* Appearance Tab */}
          <TabsContent value="appearance" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sun className="h-5 w-5" />
                  Theme
                </CardTitle>
                <CardDescription>Choose your preferred theme</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex gap-4">
                  <Button
                    variant={theme === 'light' ? 'default' : 'outline'}
                    onClick={() => setTheme('light')}
                    className="flex-1"
                  >
                    <Sun className="h-4 w-4 mr-2" />
                    Light
                  </Button>
                  <Button
                    variant={theme === 'dark' ? 'default' : 'outline'}
                    onClick={() => setTheme('dark')}
                    className="flex-1"
                  >
                    <Moon className="h-4 w-4 mr-2" />
                    Dark
                  </Button>
                  <Button
                    variant={theme === 'system' ? 'default' : 'outline'}
                    onClick={() => setTheme('system')}
                    className="flex-1"
                  >
                    <Monitor className="h-4 w-4 mr-2" />
                    System
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Privacy Tab */}
          <TabsContent value="privacy" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5" />
                  Notifications
                </CardTitle>
                <CardDescription>Configure notification preferences</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>New Messages</Label>
                    <p className="text-sm text-muted-foreground">Get notified about new messages</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Friend Requests</Label>
                    <p className="text-sm text-muted-foreground">Get notified about friend requests</p>
                  </div>
                  <Switch defaultChecked />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lock className="h-5 w-5" />
                  Privacy
                </CardTitle>
                <CardDescription>Manage privacy settings</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Profile Visibility</Label>
                    <p className="text-sm text-muted-foreground">Make profile visible to everyone</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Show Online Status</Label>
                    <p className="text-sm text-muted-foreground">Let others see when you're online</p>
                  </div>
                  <Switch defaultChecked />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Account Tab */}
          <TabsContent value="account" className="space-y-4">
            <Card className="border-destructive/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-destructive">
                  <LogOut className="h-5 w-5" />
                  Sign Out
                </CardTitle>
                <CardDescription>Sign out of your account</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  You will be redirected to the home page.
                </p>
                <Button 
                  variant="destructive" 
                  onClick={handleLogout}
                  className="w-full sm:w-auto"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign Out
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
