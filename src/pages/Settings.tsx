
import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Header from '../components/layout/Header';
import Sidebar from '../components/layout/Sidebar';
import { 
  Shield, Moon, Sun, Bell, User, Lock, Key, 
  Clock, Trash2, LogOut, DownloadCloud, Upload
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { toast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider";

const Settings: React.FC = () => {
  const { isAuthenticated, isLoading, user, logout } = useAuth();
  const [darkMode, setDarkMode] = useState(true);
  const [notifications, setNotifications] = useState(true);
  const [autoDeleteTimer, setAutoDeleteTimer] = useState(24); // hours
  const [selfDestructTimer, setSelfDestructTimer] = useState(5); // minutes
  
  // Redirect to login if not authenticated
  if (!isLoading && !isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  const handleLogout = () => {
    logout();
    toast({
      title: "Logged out",
      description: "You've been successfully logged out of OffTheRadar.",
    });
  };
  
  const handleExportKeys = () => {
    // In a real app, this would export encryption keys
    toast({
      title: "Keys exported",
      description: "Your encryption keys have been exported. Store them securely.",
    });
  };
  
  const handleImportKeys = () => {
    // In a real app, this would import encryption keys
    toast({
      title: "Keys imported",
      description: "Your encryption keys have been successfully imported.",
    });
  };
  
  const handleDeleteAccount = () => {
    // In a real app, this would delete the user's account
    toast({
      title: "Account deletion requested",
      description: "Your account will be deleted within 30 days.",
      variant: "destructive"
    });
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
                  <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden">
                    {user?.avatar ? (
                      <img 
                        src={user.avatar} 
                        alt={user.name} 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <User size={36} className="text-primary" />
                    )}
                  </div>
                  <div>
                    <h2 className="text-xl font-medium">{user?.name}</h2>
                    <p className="text-muted-foreground">{user?.email}</p>
                    <Button variant="outline" size="sm" className="mt-2">
                      Change Avatar
                    </Button>
                  </div>
                </div>
                
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <label className="text-sm font-medium text-right">Name</label>
                    <input
                      type="text"
                      placeholder="Your name"
                      defaultValue={user?.name}
                      className="col-span-3 flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <label className="text-sm font-medium text-right">Email</label>
                    <input
                      type="email"
                      placeholder="Your email"
                      defaultValue={user?.email}
                      className="col-span-3 flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <label className="text-sm font-medium text-right">Status Message</label>
                    <input
                      type="text"
                      placeholder="Your status message"
                      defaultValue="Available"
                      className="col-span-3 flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    />
                  </div>
                </div>
                
                <div className="flex justify-end">
                  <Button>Save Profile</Button>
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
                      onClick={handleDeleteAccount}
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
                    
                    <div className="flex space-x-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={handleExportKeys}
                      >
                        <DownloadCloud className="mr-2 h-4 w-4" />
                        Export Keys
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={handleImportKeys}
                      >
                        <Upload className="mr-2 h-4 w-4" />
                        Import Keys
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
                        onValueChange={(values) => setAutoDeleteTimer(values[0])}
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
                        onValueChange={(values) => setSelfDestructTimer(values[0])}
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
                        <Switch defaultChecked={true} />
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Incoming calls</span>
                        <Switch defaultChecked={true} />
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Missed calls</span>
                        <Switch defaultChecked={true} />
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">New contact requests</span>
                        <Switch defaultChecked={true} />
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
                      onCheckedChange={setDarkMode} 
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
    </div>
  );
};

export default Settings;
