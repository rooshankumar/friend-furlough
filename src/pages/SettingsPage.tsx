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
import { Moon, Sun, Monitor, Bell, Globe, Lock, User, Camera, Loader2, LogOut, Save, X, Plus, Languages, RefreshCw, Trash, Download, Wifi, WifiOff, Clock, Eye, EyeOff } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { useAuthStore } from '@/stores/authStore';
import { useToast } from '@/hooks/use-toast';
import { uploadAvatar } from '@/lib/uploadManager';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '@/components/PageHeader';
import { supabase } from '@/integrations/supabase/client';
import { countries } from '@/data/countries';
import { languages } from '@/data/languages';
import { useQueryClient } from '@tanstack/react-query';
import { clearCacheAndReload, getCacheInfo } from '@/lib/clearCache';
import { useOfflineSync } from '@/hooks/useOfflineSync';
import { formatDistanceToNow } from 'date-fns';
import NotificationSettings from '@/components/NotificationSettings';

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
  const [cacheInfo, setCacheInfo] = useState<{ cacheNames: string[]; serviceWorkers: number; isActive: boolean; indexedDBs: number; localStorageSize: number; sessionStorageSize: number; totalSizeBytes: number; totalSizeFormatted: string } | null>(null);
  
  // Offline sync
  const { isPreloading, hasCache, lastSync, syncNow } = useOfflineSync();
  
  // Notification settings state
  const [notificationSettings, setNotificationSettings] = useState({
    pushEnabled: true,
    messageAlerts: true,
    friendRequests: true,
    soundEnabled: true
  });
  
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
    profession: ''
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
        teaching_experience: profile.teaching_experience || false,
        profession: (profile as any).profession || ''
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

  const handleNotificationSettingChange = (setting: keyof typeof notificationSettings, value: boolean) => {
    setNotificationSettings(prev => ({ ...prev, [setting]: value }));
    
    // Save to localStorage
    const settings = { ...notificationSettings, [setting]: value };
    localStorage.setItem('notificationSettings', JSON.stringify(settings));
    
    toast({
      title: "Settings updated",
      description: `${setting === 'pushEnabled' ? 'Push notifications' : 
                     setting === 'messageAlerts' ? 'Message alerts' : 
                     setting === 'friendRequests' ? 'Friend request notifications' :
                     'Notification sound'} ${value ? 'enabled' : 'disabled'}`,
    });
  };

  // Load notification settings from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('notificationSettings');
    if (saved) {
      setNotificationSettings(JSON.parse(saved));
    }
  }, []);

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

  const addNativeLanguage = () => {
    if (newNativeLang && !nativeLanguages.includes(newNativeLang)) {
      setNativeLanguages([...nativeLanguages, newNativeLang]);
      // Ensure uniqueness between native and learning
      setLearningLanguages(prev => prev.filter(l => l !== newNativeLang));
      setNewNativeLang('');
    }
  };

  const addLearningLanguage = () => {
    if (newLearningLang && !learningLanguages.includes(newLearningLang)) {
      setLearningLanguages([...learningLanguages, newLearningLang]);
      // Ensure uniqueness between learning and native
      setNativeLanguages(prev => prev.filter(l => l !== newLearningLang));
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
      // Normalize profession: first letter uppercase
      const normalizedProfession = formData.profession
        ? formData.profession.trim().charAt(0).toUpperCase() + formData.profession.trim().slice(1)
        : null;

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
          profession: normalizedProfession,
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
      <PageHeader 
        title="Settings" 
        showBack={true}
      />
      
      <div className="p-3 sm:p-4 md:p-8 max-w-5xl mx-auto">

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-3 md:space-y-4">
          <TabsList className="grid w-full grid-cols-2 h-auto">
            <TabsTrigger value="profile" className="text-xs sm:text-sm py-2 sm:py-2.5">
              <User className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
              <span>Profile</span>
            </TabsTrigger>
            <TabsTrigger value="preferences" className="text-xs sm:text-sm py-2 sm:py-2.5">
              <Lock className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
              <span>Preferences</span>
            </TabsTrigger>
          </TabsList>

          {/* Profile & Languages Tab */}
          <TabsContent value="profile" className="space-y-3 md:space-y-4">
            {/* Avatar */}
            <Card>
              <CardHeader className="pb-3 md:pb-6">
                <CardTitle className="flex items-center gap-2 text-base md:text-lg">
                  <User className="h-4 w-4 md:h-5 md:w-5" />
                  Profile Picture
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 md:space-y-4">
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

            {/* Personal Information - first */}
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

            {/* Languages & Preferences - merged */}
            <Card>
              <CardHeader>
                <CardTitle>Languages & Preferences</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Native Languages */}
                <div className="space-y-2">
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

                {/* Learning Languages */}
                <div className="space-y-2">
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

                {/* What are you looking for? */}
                <div className="space-y-2">
                  <Label>What are you looking for?</Label>
                  <Select onValueChange={(value) => handleArrayAdd('looking_for', value)}>
                    <SelectTrigger className="text-base">
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
                    {formData.looking_for.map(item => (
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

                {/* Profession */}
                <div className="space-y-2">
                  <Label htmlFor="profession">Profession</Label>
                  <Input
                    id="profession"
                    value={formData.profession}
                    onChange={(e) => handleInputChange('profession', e.target.value)}
                    placeholder="Your profession"
                    className="text-base"
                  />
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
                  <div className="flex items-center gap-3 flex-1">
                    <Wifi className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <Label>Show Online Status</Label>
                      <p className="text-sm text-muted-foreground">Let others see when you're online</p>
                    </div>
                  </div>
                  <Switch defaultChecked />
                </div>
                <Separator />
                <div className="flex items-center justify-between py-2">
                  <div className="flex items-center gap-3 flex-1">
                    <Eye className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <Label>Profile Visibility</Label>
                      <p className="text-sm text-muted-foreground">Who can view your profile</p>
                    </div>
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
                  <Switch 
                    checked={notificationSettings.pushEnabled}
                    onCheckedChange={(checked) => handleNotificationSettingChange('pushEnabled', checked)}
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between py-2">
                  <div>
                    <Label>Message Alerts</Label>
                    <p className="text-sm text-muted-foreground">Get notified of new messages</p>
                  </div>
                  <Switch 
                    checked={notificationSettings.messageAlerts}
                    onCheckedChange={(checked) => handleNotificationSettingChange('messageAlerts', checked)}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Data & Storage */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <RefreshCw className="h-5 w-5" />
                  Data & Storage
                </CardTitle>
                <CardDescription>
                  Manage your app data and storage
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Offline Access */}
                <div className="space-y-2">
                  <Label>Download for Offline Access</Label>
                  <Button 
                    variant="outline" 
                    onClick={async () => {
                      await syncNow();
                      toast({
                        title: "Download complete",
                        description: "Your data is ready for offline use",
                      });
                    }}
                    disabled={isPreloading}
                    className="w-full min-h-[44px] text-base"
                    size="lg"
                  >
                    {isPreloading ? (
                      <>
                        <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                        Downloading...
                      </>
                    ) : (
                      <>
                        <Download className="h-5 w-5 mr-2" />
                        Download Data
                      </>
                    )}
                  </Button>
                </div>
                
                <Separator />
                
                {/* Clear Cache */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Clear App Cache</Label>
                    {cacheInfo && (
                      <span className="text-xs text-muted-foreground font-medium">
                        {cacheInfo.totalSizeFormatted}
                      </span>
                    )}
                  </div>
                  <Button 
                    variant="outline" 
                    onClick={handleClearCache}
                    disabled={isClearing}
                    className="w-full min-h-[44px] text-base"
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
                        Clear Cache
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
