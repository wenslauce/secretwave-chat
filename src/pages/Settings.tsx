
import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Header from '../components/layout/Header';
import Sidebar from '../components/layout/Sidebar';
import { 
  Shield, Moon, Sun, Bell, User, Lock, Key, 
  Clock, Trash2, LogOut, DownloadCloud, Upload,
  Save, Loader2
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { toast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { initPresence, cleanupPresence } from '@/services/presenceService';
import { supabase } from '@/integrations/supabase/client';

const Settings: React.FC = () => {
  const { user, profile, isAuthenticated, isLoading, logout, updateProfile, generateEncryptionKeys } = useAuth();
  const [darkMode, setDarkMode] = useState(() => {
    return document.documentElement.classList.contains('dark');
  });
  const [notifications, setNotifications] = useState(true);
  const [autoDeleteTimer, setAutoDeleteTimer] = useState(24); // hours
  const [selfDestructTimer, setSelfDestructTimer] = useState(5); // minutes
  const [name, setName] = useState('');
  const [statusMessage, setStatusMessage] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  
  // Initialize user data
  useEffect(() => {
    if (profile) {
      setName(profile.name || '');
      setStatusMessage(profile.status || '');
      setAvatarUrl(profile.avatar_url || null);
    }
  }, [profile]);

  // Redirect to login if not authenticated
  if (!isLoading && !isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Toggle dark mode
  const handleDarkModeToggle = () => {
    if (darkMode) {
      document.documentElement.classList.remove('dark');
    } else {
      document.documentElement.classList.add('dark');
    }
    setDarkMode(!darkMode);
    
    toast({
      title: darkMode ? "Light mode activated" : "Dark mode activated",
      description: "Your theme preference has been updated.",
    });
  };
  
  // Handle logout
  const handleLogout = async () => {
    // Clean up presence tracking before logout
    cleanupPresence();
    
    await logout();
    toast({
      title: "Logged out",
      description: "You've been successfully logged out of OffTheRadar.",
    });
  };
  
  // Handle avatar change
  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      // Create a preview URL
      const objectUrl = URL.createObjectURL(file);
      setAvatarUrl(objectUrl);
      setAvatarFile(file);
    }
  };
  
  // Handle profile update
  const handleProfileUpdate = async () => {
    if (!user) return;
    
    setIsUpdating(true);
    
    try {
      // First upload avatar if there's a new one
      let newAvatarUrl = profile?.avatar_url;
      
      if (avatarFile) {
        const fileExt = avatarFile.name.split('.').pop();
        const fileName = `${user.id}-${Math.random().toString(36).substring(2)}.${fileExt}`;
        const filePath = `${fileName}`;
        
        const { error: uploadError, data } = await supabase
          .storage
          .from('avatars')
          .upload(filePath, avatarFile, {
            upsert: true
          });
          
        if (uploadError) {
          throw uploadError;
        }
        
        const { data: { publicUrl } } = supabase
          .storage
          .from('avatars')
          .getPublicUrl(filePath);
          
        newAvatarUrl = publicUrl;
      }
      
      // Update profile
      await updateProfile({
        name,
        status: statusMessage,
        avatar_url: newAvatarUrl
      });
      
      toast({
        title: "Profile updated",
        description: "Your profile has been successfully updated.",
      });
    } catch (error: any) {
      console.error('Error updating profile:', error);
      toast({
        title: "Error updating profile",
        description: error.message || "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };
  
  const handleExportKeys = () => {
    if (!user) return;
    
    try {
      const keyPairString = localStorage.getItem(`encryption_keypair_${user.id}`);
      if (!keyPairString) {
        throw new Error('No encryption keys found');
      }
      
      // Create a download link
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(keyPairString);
      const downloadAnchorNode = document.createElement('a');
      downloadAnchorNode.setAttribute("href", dataStr);
      downloadAnchorNode.setAttribute("download", `offtheradar-keys-${user.id}.json`);
      document.body.appendChild(downloadAnchorNode);
      downloadAnchorNode.click();
      downloadAnchorNode.remove();
      
      toast({
        title: "Keys exported",
        description: "Your encryption keys have been exported. Store them securely.",
      });
    } catch (error: any) {
      console.error('Error exporting keys:', error);
      toast({
        title: "Error exporting keys",
        description: error.message || "An unexpected error occurred",
        variant: "destructive",
      });
    }
  };
  
  const handleImportKeys = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!user || !e.target.files || !e.target.files[0]) return;
    
    try {
      const file = e.target.files[0];
      const text = await file.text();
      const keyPair = JSON.parse(text);
      
      // Validate the imported keys structure
      if (!keyPair.publicKey || !keyPair.privateKey) {
        throw new Error('Invalid key file format');
      }
      
      // Store the imported keys
      localStorage.setItem(`encryption_keypair_${user.id}`, JSON.stringify(keyPair));
      
      // Update the public key in the database
      await supabase
        .from('encryption_keys')
        .upsert({ 
          user_id: user.id, 
          public_key: keyPair.publicKey,
          updated_at: new Date().toISOString()
        });
      
      toast({
        title: "Keys imported",
        description: "Your encryption keys have been successfully imported.",
      });
    } catch (error: any) {
      console.error('Error importing keys:', error);
      toast({
        title: "Error importing keys",
        description: error.message || "An unexpected error occurred",
        variant: "destructive",
      });
    }
    
    // Clear the input
    e.target.value = '';
  };
  
  const handleGenerateNewKeys = async () => {
    if (!user) return;
    
    try {
      await generateEncryptionKeys();
      
      toast({
        title: "New keys generated",
        description: "Your encryption keys have been regenerated.",
      });
    } catch (error: any) {
      console.error('Error generating keys:', error);
      toast({
        title: "Error generating keys",
        description: error.message || "An unexpected error occurred",
        variant: "destructive",
      });
    }
  };
  
  const handleAutoDeleteTimerChange = (value: number[]) => {
    setAutoDeleteTimer(value[0]);
    
    toast({
      title: "Auto-delete timer updated",
      description: `Messages will now be deleted after ${value[0]} hours.`,
    });
  };
  
  const handleSelfDestructTimerChange = (value: number[]) => {
    setSelfDestructTimer(value[0]);
    
    toast({
      title: "Self-destruct timer updated",
      description: `Default self-destruct timer set to ${value[0]} minutes.`,
    });
  };
  
  const handleDeleteAccount = async () => {
    if (!user) return;
    
    if (deleteConfirmText !== 'delete my account') {
      toast({
        title: "Confirmation failed",
        description: "Please type 'delete my account' to confirm.",
        variant: "destructive",
      });
      return;
    }
    
    try {
      // In a real app, you'd implement the actual account deletion here
      // For now, we'll just show a toast
      
      // Clean up presence tracking
      cleanupPresence();
      
      toast({
        title: "Account deletion requested",
        description: "Your account and all your data will be permanently deleted.",
        variant: "destructive"
      });
      
      // Close the dialog and redirect to login
      setIsDeleteDialogOpen(false);
      await logout();
    } catch (error: any) {
      console.error('Error deleting account:', error);
      toast({
        title: "Error deleting account",
        description: error.message || "An unexpected error occurred",
        variant: "destructive",
      });
    }
  };
  
  return (
    <div className="flex flex-col h-screen">
      <Header />
      
      <main className="flex flex-1 overflow-hidden">
        <Sidebar activeLink="settings" />
        
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-4xl mx-auto p-6">
            <h1 className="text-2xl font-semibold mb-6">Settings</h1>
            
            <Tabs defaultValue="profile" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="profile">Profile</TabsTrigger>
                <TabsTrigger value="privacy">Privacy & Security</TabsTrigger>
                <TabsTrigger value="notifications">Notifications</TabsTrigger>
                <TabsTrigger value="appearance">Appearance</TabsTrigger>
              </TabsList>
              
              {/* Profile Tab */}
              <TabsContent value="profile" className="space-y-6 mt-6">
                <div className="flex items-center space-x-4">
                  <div className="relative">
                    <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden">
                      {avatarUrl ? (
                        <img 
                          src={avatarUrl} 
                          alt={profile?.name || 'Avatar'} 
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <User size={36} className="text-primary" />
                      )}
                    </div>
                    <label 
                      htmlFor="avatar-upload" 
                      className="absolute bottom-0 right-0 w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center cursor-pointer shadow-md"
                    >
                      <Upload size={16} />
                    </label>
                    <input 
                      id="avatar-upload" 
                      type="file" 
                      accept="image/*" 
                      className="hidden" 
                      onChange={handleAvatarChange}
                    />
                  </div>
                  <div>
                    <h2 className="text-xl font-medium">{profile?.name || user?.email}</h2>
                    <p className="text-muted-foreground">{user?.email}</p>
                  </div>
                </div>
                
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="name" className="text-right">Name</Label>
                    <Input
                      id="name"
                      placeholder="Your name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="col-span-3"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="email" className="text-right">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={user?.email || ''}
                      disabled
                      className="col-span-3 bg-muted"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="status" className="text-right">Status Message</Label>
                    <Input
                      id="status"
                      placeholder="What's on your mind?"
                      value={statusMessage}
                      onChange={(e) => setStatusMessage(e.target.value)}
                      className="col-span-3"
                    />
                  </div>
                </div>
                
                <div className="flex justify-end">
                  <Button onClick={handleProfileUpdate} disabled={isUpdating}>
                    {isUpdating ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        Save Profile
                      </>
                    )}
                  </Button>
                </div>
                
                <div className="border-t border-border pt-6 mt-6">
                  <h3 className="text-lg font-medium mb-4">Account Actions</h3>
                  
                  <div className="space-y-4">
                    <Button 
                      variant="outline" 
                      className="w-full justify-start"
                      onClick={handleLogout}
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      Logout
                    </Button>
                    
                    <Button 
                      variant="destructive" 
                      className="w-full justify-start"
                      onClick={() => setIsDeleteDialogOpen(true)}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete Account
                    </Button>
                  </div>
                </div>
              </TabsContent>
              
              {/* Privacy & Security Tab */}
              <TabsContent value="privacy" className="space-y-6 mt-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <div className="flex items-center">
                        <Lock className="h-5 w-5 mr-2 text-primary" />
                        <h3 className="font-medium">End-to-End Encryption</h3>
                      </div>
                      <p className="text-sm text-muted-foreground">All your messages are encrypted by default</p>
                    </div>
                    <Switch checked={true} disabled />
                  </div>
                  
                  <div className="border-t border-border pt-4">
                    <div className="flex items-center">
                      <Key className="h-5 w-5 mr-2 text-primary" />
                      <h3 className="font-medium">Encryption Keys</h3>
                    </div>
                    <p className="text-sm text-muted-foreground mt-0.5 mb-3">Backup or restore your encryption keys</p>
                    
                    <div className="flex space-x-2 flex-wrap gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={handleExportKeys}
                      >
                        <DownloadCloud className="mr-2 h-4 w-4" />
                        Export Keys
                      </Button>
                      
                      <label htmlFor="import-keys">
                        <Button 
                          variant="outline" 
                          size="sm"
                          asChild
                        >
                          <div className="cursor-pointer">
                            <Upload className="mr-2 h-4 w-4" />
                            Import Keys
                          </div>
                        </Button>
                      </label>
                      <input
                        id="import-keys"
                        type="file"
                        accept="application/json"
                        className="hidden"
                        onChange={handleImportKeys}
                      />
                      
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={handleGenerateNewKeys}
                      >
                        <Key className="mr-2 h-4 w-4" />
                        Generate New Keys
                      </Button>
                    </div>
                  </div>
                  
                  <div className="border-t border-border pt-4">
                    <div className="flex items-center">
                      <Clock className="h-5 w-5 mr-2 text-primary" />
                      <h3 className="font-medium">Auto-Delete Messages</h3>
                    </div>
                    <p className="text-sm text-muted-foreground mt-0.5 mb-3">Messages older than this will be automatically deleted</p>
                    
                    <div className="space-y-4">
                      <div className="flex justify-between">
                        <span className="text-sm">Timer: {autoDeleteTimer} hours</span>
                        <span className="text-sm text-muted-foreground">{autoDeleteTimer === 0 ? 'Disabled' : ''}</span>
                      </div>
                      <Slider
                        value={[autoDeleteTimer]}
                        max={72}
                        step={1}
                        onValueChange={handleAutoDeleteTimerChange}
                      />
                    </div>
                  </div>
                  
                  <div className="border-t border-border pt-4">
                    <div className="flex items-center">
                      <Shield className="h-5 w-5 mr-2 text-primary" />
                      <h3 className="font-medium">Default Self-Destruct Timer</h3>
                    </div>
                    <p className="text-sm text-muted-foreground mt-0.5 mb-3">Set the default timer for self-destructing messages</p>
                    
                    <div className="space-y-4">
                      <div className="flex justify-between">
                        <span className="text-sm">Timer: {selfDestructTimer} minutes</span>
                        <span className="text-sm text-muted-foreground">{selfDestructTimer === 0 ? 'Disabled' : ''}</span>
                      </div>
                      <Slider
                        value={[selfDestructTimer]}
                        max={60}
                        step={1}
                        onValueChange={handleSelfDestructTimerChange}
                      />
                    </div>
                  </div>
                </div>
              </TabsContent>
              
              {/* Notifications Tab */}
              <TabsContent value="notifications" className="space-y-6 mt-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <div className="flex items-center">
                        <Bell className="h-5 w-5 mr-2 text-primary" />
                        <h3 className="font-medium">Push Notifications</h3>
                      </div>
                      <p className="text-sm text-muted-foreground">Receive notifications when you're not using the app</p>
                    </div>
                    <Switch 
                      checked={notifications} 
                      onCheckedChange={setNotifications} 
                    />
                  </div>
                  
                  <div className="border-t border-border pt-4">
                    <h3 className="font-medium mb-3">Notification Settings</h3>
                    
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">New message</span>
                        <Switch defaultChecked={true} disabled={!notifications} />
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Incoming calls</span>
                        <Switch defaultChecked={true} disabled={!notifications} />
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Missed calls</span>
                        <Switch defaultChecked={true} disabled={!notifications} />
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">New contact requests</span>
                        <Switch defaultChecked={true} disabled={!notifications} />
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>
              
              {/* Appearance Tab */}
              <TabsContent value="appearance" className="space-y-6 mt-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <div className="flex items-center">
                        {darkMode ? 
                          <Moon className="h-5 w-5 mr-2 text-primary" /> : 
                          <Sun className="h-5 w-5 mr-2 text-primary" />
                        }
                        <h3 className="font-medium">Dark Mode</h3>
                      </div>
                      <p className="text-sm text-muted-foreground">Toggle between light and dark themes</p>
                    </div>
                    <Switch 
                      checked={darkMode} 
                      onCheckedChange={handleDarkModeToggle} 
                    />
                  </div>
                  
                  <div className="border-t border-border pt-4">
                    <h3 className="font-medium mb-3">Message Bubble Style</h3>
                    
                    <div className="grid grid-cols-3 gap-3">
                      <div className="border border-border rounded-md p-3 flex items-center justify-center cursor-pointer bg-primary/10">
                        <span className="text-sm">Modern</span>
                      </div>
                      <div className="border border-border rounded-md p-3 flex items-center justify-center cursor-pointer">
                        <span className="text-sm">Classic</span>
                      </div>
                      <div className="border border-border rounded-md p-3 flex items-center justify-center cursor-pointer">
                        <span className="text-sm">Minimal</span>
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </main>
      
      {/* Delete Account Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-destructive">Delete Your Account</DialogTitle>
            <DialogDescription>
              This action cannot be undone. All your data will be permanently deleted.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <p className="mb-4 text-sm">
              To confirm, please type <span className="font-semibold">delete my account</span> below:
            </p>
            <Input
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              placeholder="delete my account"
            />
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDeleteAccount}
              disabled={deleteConfirmText !== 'delete my account'}
            >
              I understand, delete my account
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Settings;
