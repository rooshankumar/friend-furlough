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
import { Moon, Sun, Monitor, Bell, Globe, Lock, User, Camera, Loader2, LogOut, Save, X, Plus, Languages, RefreshCw, Trash } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { useAuthStore } from '@/stores/authStore';
import { useToast } from '@/hooks/use-toast';
import { uploadAvatar } from '@/lib/uploadManager';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { countries } from '@/data/countries';
import { languages } from '@/data/languages';
import { useQueryClient } from '@tanstack/react-query';
import { clearCacheAndReload, getCacheInfo } from '@/lib/clearCache';

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const { user, profile, updateProfile, signOut } = useAuthStore();
  const { toast } = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');
  const [isClearing, setIsClearing] = useState(false);
  const [cacheInfo, setCacheInfo] = useState<{ cacheNames: string[]; serviceWorkers: number; isActive: boolean } | null>(null);
  
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

  const handleClearCache = async () => {
    setIsClearing(true);
    try {
      toast({
        title: "Clearing cache...",
        description: "This will reload the page with fresh code",
      });
      await clearCacheAndReload();
    } catch (error) {
      console.error('Failed to clear cache:', error);
      toast({
        title: "Failed to clear cache",
        description: "Please try manually: Settings > Clear browsing data",
        variant: "destructive"
      });
      setIsClearing(false);
    }
  };

  const loadCacheInfo = async () => {
    const info = await getCacheInfo();
    setCacheInfo(info);
  };

  useEffect(() => {
    if (activeTab === 'preferences') {
      loadCacheInfo();
    }
  }, [activeTab]);

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
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
          language_code: lang.toLowerCase().replace(/\s+/g, '-'),
          language_name: lang,
          is_native: true,
          is_learning: false
        })),
        ...learningLanguages.map(lang => ({
          user_id: user.id,
          language_code: lang.toLowerCase().replace(/\s+/g, '-'),
          language_name: lang,
          is_native: false,
          is_learning: true
        }))
      ];

      if (languageInserts.length > 0) {
        await supabase.from('languages').insert(languageInserts);
      }

      // Fetch and update profile
      const { data: updatedProfile, error: fetchError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (!fetchError && updatedProfile) {
        const profileUpdate: any = { ...updatedProfile };
        await updateProfile(profileUpdate);
        
        // Invalidate caches to force refresh
        queryClient.invalidateQueries({ queryKey: ['profile', user.id] });
        queryClient.invalidateQueries({ queryKey: ['languages', user.id] });
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

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user?.id) return;

    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid file type",
        description: "Please select an image file",
        variant: "destructive"
      });
      return;
    }

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
      
      const avatarUrl = await uploadAvatar(user.id, file, (progress) => {
        if (progress === 100) {
          toast({ title: "Avatar uploaded! ✨" });
        }
      });
      
      await updateProfile({ avatar_url: avatarUrl });
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    } catch (error: any) {
      toast({
        title: "Upload failed",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="min-h-screen md:ml-16 bg-gradient-subtle pb-20 md:pb-4 overflow-auto">
      <div className="p-4 md:p-8 max-w-5xl mx-auto">
        <div className="hidden md:block mb-6">
          <h1 className="text-3xl font-bold">Settings</h1>
          <p className="text-muted-foreground">Manage your profile and preferences</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="profile" className="text-sm">
              <User className="h-4 w-4 mr-2" />
              Profile & Languages
            </TabsTrigger>
            <TabsTrigger value="preferences" className="text-sm">
              <Lock className="h-4 w-4 mr-2" />
              Preferences
            </TabsTrigger>
          </TabsList>

          {/* Profile & Languages Tab */}
          <TabsContent value="profile" className="space-y-4">
            {/* Avatar */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Profile Picture
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4">
                  <Avatar className="h-20 w-20">
                    <AvatarImage src={profile?.avatar_url || user?.user_metadata?.avatar_url} />
                    <AvatarFallback className="bg-gradient-cultural text-white text-lg">
                      {profile?.name?.[0] || user?.email?.[0]?.toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <Label htmlFor="avatar" className="cursor-pointer">
                      <Button variant="outline" size="sm" asChild disabled={isUploading}>
                        <span>
                          {isUploading ? (
                            <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Uploading...</>
                          ) : (
                            <><Camera className="mr-2 h-4 w-4" />Change Photo</>
                          )}
                        </span>
                      </Button>
                    </Label>
                    <input
                      id="avatar"
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarUpload}
                      style={{ display: 'none' }}
                      disabled={isUploading}
                    />
                    <p className="text-xs text-muted-foreground mt-1">JPG, PNG or GIF. Max 5MB.</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Profile Info */}
            <Card>
              <CardHeader>
                <CardTitle>Personal Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Name *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      placeholder="Your name"
                      className="text-base"
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
                      className="text-base"
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
                    className="text-base resize-none"
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="gender">Gender</Label>
                    <Select value={formData.gender} onValueChange={(value) => handleInputChange('gender', value)}>
                      <SelectTrigger className="text-base">
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
                      <SelectTrigger className="text-base">
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
                    className="text-base"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Languages */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Languages className="h-5 w-5" />
                  Languages
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Native Languages</Label>
                  <div className="flex gap-2 mt-2 flex-wrap">
                    {nativeLanguages.map(lang => (
                      <Badge key={lang} variant="secondary" className="gap-1">
                        {lang}
                        <X className="h-3 w-3 cursor-pointer" onClick={() => removeNativeLanguage(lang)} />
                      </Badge>
                    ))}
                  </div>
                  <div className="flex gap-2 mt-2">
                    <Select value={newNativeLang} onValueChange={setNewNativeLang}>
                      <SelectTrigger className="text-base">
                        <SelectValue placeholder="Add native language" />
                      </SelectTrigger>
                      <SelectContent>
                        {languages.map(lang => (
                          <SelectItem key={lang.code} value={lang.name}>{lang.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button onClick={addNativeLanguage} size="sm" className="min-w-[44px] min-h-[44px]">
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <Separator />

                <div>
                  <Label>Learning Languages</Label>
                  <div className="flex gap-2 mt-2 flex-wrap">
                    {learningLanguages.map(lang => (
                      <Badge key={lang} variant="outline" className="gap-1">
                        {lang}
                        <X className="h-3 w-3 cursor-pointer" onClick={() => removeLearningLanguage(lang)} />
                      </Badge>
                    ))}
                  </div>
                  <div className="flex gap-2 mt-2">
                    <Select value={newLearningLang} onValueChange={setNewLearningLang}>
                      <SelectTrigger className="text-base">
                        <SelectValue placeholder="Add learning language" />
                      </SelectTrigger>
                      <SelectContent>
                        {languages.map(lang => (
                          <SelectItem key={lang.code} value={lang.name}>{lang.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button onClick={addLearningLanguage} size="sm" className="min-w-[44px] min-h-[44px]">
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Save Button */}
            <Button 
              onClick={handleSaveProfile} 
              disabled={isSaving} 
              className="w-full min-h-[44px] text-base"
              size="lg"
            >
              {isSaving ? <Loader2 className="h-5 w-5 mr-2 animate-spin" /> : <Save className="h-5 w-5 mr-2" />}
              Save Profile & Languages
            </Button>
          </TabsContent>

          {/* Preferences Tab */}
          <TabsContent value="preferences" className="space-y-4">
            {/* Appearance */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sun className="h-5 w-5" />
                  Appearance
                </CardTitle>
                <CardDescription>Customize how the app looks</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Theme</Label>
                    <p className="text-sm text-muted-foreground">Choose your preferred theme</p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant={theme === 'light' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setTheme('light')}
                      className="min-w-[44px] min-h-[44px]"
                    >
                      <Sun className="h-4 w-4" />
                    </Button>
                    <Button
                      variant={theme === 'dark' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setTheme('dark')}
                      className="min-w-[44px] min-h-[44px]"
                    >
                      <Moon className="h-4 w-4" />
                    </Button>
                    <Button
                      variant={theme === 'system' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setTheme('system')}
                      className="min-w-[44px] min-h-[44px]"
                    >
                      <Monitor className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Privacy */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lock className="h-5 w-5" />
                  Privacy & Security
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between py-2">
                  <div>
                    <Label>Show Online Status</Label>
                    <p className="text-sm text-muted-foreground">Let others see when you're online</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <Separator />
                <div className="flex items-center justify-between py-2">
                  <div>
                    <Label>Profile Visibility</Label>
                    <p className="text-sm text-muted-foreground">Who can view your profile</p>
                  </div>
                  <Switch defaultChecked />
                </div>
              </CardContent>
            </Card>

            {/* Notifications */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5" />
                  Notifications
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between py-2">
                  <div>
                    <Label>Push Notifications</Label>
                    <p className="text-sm text-muted-foreground">Receive notifications on this device</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <Separator />
                <div className="flex items-center justify-between py-2">
                  <div>
                    <Label>Message Alerts</Label>
                    <p className="text-sm text-muted-foreground">Get notified of new messages</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <Separator />
                <div className="flex items-center justify-between py-2">
                  <div>
                    <Label>Friend Requests</Label>
                    <p className="text-sm text-muted-foreground">Notifications for friend requests</p>
                  </div>
                  <Switch defaultChecked />
                </div>
              </CardContent>
            </Card>

            {/* Developer Tools */}
            <Card className="border-blue-500/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <RefreshCw className="h-5 w-5" />
                  Developer Tools
                </CardTitle>
                <CardDescription>
                  Troubleshooting tools for mobile issues
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Clear App Cache</Label>
                  <p className="text-sm text-muted-foreground">
                    Use this if you're experiencing issues with attachments or stale code on mobile
                  </p>
                  {cacheInfo && (
                    <div className="text-xs text-muted-foreground space-y-1 mt-2 p-2 bg-muted rounded">
                      <div>Caches: {cacheInfo.cacheNames.length}</div>
                      <div>Service Workers: {cacheInfo.serviceWorkers}</div>
                      <div>Status: {cacheInfo.isActive ? '🟢 Active' : '⚪ Inactive'}</div>
                    </div>
                  )}
                  <Button 
                    variant="outline" 
                    onClick={handleClearCache}
                    disabled={isClearing}
                    className="w-full min-h-[44px] text-base mt-2"
                    size="lg"
                  >
                    {isClearing ? (
                      <>
                        <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                        Clearing...
                      </>
                    ) : (
                      <>
                        <Trash className="h-5 w-5 mr-2" />
                        Clear Cache & Reload
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Sign Out */}
            <Card className="border-destructive/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-destructive">
                  <LogOut className="h-5 w-5" />
                  Account
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Button 
                  variant="destructive" 
                  onClick={handleLogout} 
                  className="w-full min-h-[44px] text-base"
                  size="lg"
                >
                  <LogOut className="h-5 w-5 mr-2" />
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
