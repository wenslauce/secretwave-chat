
import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Header from '../components/layout/Header';
import Sidebar from '../components/layout/Sidebar';
import { 
  Phone, Video, User, Clock, Info, X, Mic, MicOff, 
  VideoOff, Volume2, Volume1, VolumeX, Search, Filter, 
  PhoneIncoming, PhoneOutgoing, PhoneMissed
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Avatar } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from '@/hooks/use-toast';

// Mock call history data
const mockCallHistory = [
  {
    id: '1',
    contactId: '1',
    contactName: 'Alice Smith',
    contactAvatar: '',
    type: 'incoming',
    callType: 'voice',
    timestamp: new Date(Date.now() - 1800000), // 30 mins ago
    duration: '12:45',
    status: 'completed',
  },
  {
    id: '2',
    contactId: '2',
    contactName: 'Bob Johnson',
    contactAvatar: '',
    type: 'outgoing',
    callType: 'video',
    timestamp: new Date(Date.now() - 5400000), // 1.5 hours ago
    duration: '08:32',
    status: 'completed',
  },
  {
    id: '3',
    contactId: '4',
    contactName: 'Diana Prince',
    contactAvatar: '',
    type: 'missed',
    callType: 'voice',
    timestamp: new Date(Date.now() - 86400000), // 1 day ago
    duration: '00:00',
    status: 'missed',
  },
  {
    id: '4',
    contactId: '5',
    contactName: 'Ethan Hunt',
    contactAvatar: '',
    type: 'outgoing',
    callType: 'voice',
    timestamp: new Date(Date.now() - 172800000), // 2 days ago
    duration: '03:18',
    status: 'completed',
  },
  {
    id: '5',
    contactId: '3',
    contactName: 'Charlie Brown',
    contactAvatar: '',
    type: 'incoming',
    callType: 'video',
    timestamp: new Date(Date.now() - 259200000), // 3 days ago
    duration: '15:21',
    status: 'completed',
  }
];

const Calls: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [isCallActive, setIsCallActive] = useState(false);
  const [activeCall, setActiveCall] = useState<any>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [callDuration, setCallDuration] = useState(0);
  
  // Redirect to login if not authenticated
  if (!isLoading && !isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Filter calls based on search query
  const filteredCalls = mockCallHistory.filter(call => 
    call.contactName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Format timestamp
  const formatTime = (date: Date) => {
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else {
      return date.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });
    }
  };

  // Format call duration
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleStartCall = (contactId: string, isVideo: boolean) => {
    // Find contact in our mock data
    const contact = mockCallHistory.find(call => call.contactId === contactId);
    
    if (contact) {
      setActiveCall({
        contactId: contact.contactId,
        contactName: contact.contactName,
        contactAvatar: contact.contactAvatar,
        callType: isVideo ? 'video' : 'voice',
        startTime: new Date()
      });
      
      setIsVideoEnabled(isVideo);
      setIsMuted(false);
      setIsCallActive(true);
      setCallDuration(0);
      
      // Start timer
      const timer = setInterval(() => {
        setCallDuration(prev => prev + 1);
      }, 1000);
      
      // Store timer ID so we can clear it later
      setActiveCall(prev => ({...prev, timerId: timer}));
      
      toast({
        title: isVideo ? "Video call started" : "Voice call started",
        description: `Connected with ${contact.contactName}`,
      });
    }
  };

  const handleEndCall = () => {
    if (activeCall && activeCall.timerId) {
      clearInterval(activeCall.timerId);
    }
    
    setIsCallActive(false);
    toast({
      title: "Call ended",
      description: `Call with ${activeCall?.contactName} ended. Duration: ${formatDuration(callDuration)}`,
    });
    
    // Reset states
    setActiveCall(null);
    setCallDuration(0);
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
    toast({
      title: isMuted ? "Microphone unmuted" : "Microphone muted",
      description: isMuted ? "Others can now hear you" : "Others can't hear you",
    });
  };

  const toggleVideo = () => {
    setIsVideoEnabled(!isVideoEnabled);
    toast({
      title: isVideoEnabled ? "Camera turned off" : "Camera turned on",
      description: isVideoEnabled ? "Others can't see you" : "Others can now see you",
    });
  };

  return (
    <div className="flex flex-col h-screen">
      <Header />
      
      <main className="flex flex-1 overflow-hidden">
        <Sidebar activeLink="calls" />
        
        <div className="flex-1 flex flex-col">
          {/* Calls header */}
          <div className="flex items-center justify-between p-4 border-b border-border">
            <h1 className="text-xl font-semibold">Calls</h1>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search calls..."
                  className="w-[250px] pl-8"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Button 
                variant="outline" 
                size="icon"
                title="Filter calls"
              >
                <Filter className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          <div className="flex-1 overflow-hidden">
            <Tabs defaultValue="all" className="w-full h-full flex flex-col">
              <div className="px-4 pt-4">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="all">All</TabsTrigger>
                  <TabsTrigger value="missed">Missed</TabsTrigger>
                  <TabsTrigger value="recorded">Recorded</TabsTrigger>
                </TabsList>
              </div>
              
              <TabsContent value="all" className="flex-1 overflow-y-auto p-4 space-y-1">
                {filteredCalls.length > 0 ? (
                  filteredCalls.map(call => (
                    <div 
                      key={call.id}
                      className="flex items-center justify-between p-3 rounded-md hover:bg-secondary/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          {call.contactAvatar ? (
                            <img 
                              src={call.contactAvatar} 
                              alt={call.contactName} 
                              className="w-10 h-10 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                              <User className="w-5 h-5 text-primary" />
                            </div>
                          )}
                        </div>
                        <div>
                          <p className="font-medium">{call.contactName}</p>
                          <div className="flex items-center text-xs text-muted-foreground">
                            {call.type === 'incoming' ? (
                              <PhoneIncoming className="w-3 h-3 mr-1 text-green-500" />
                            ) : call.type === 'outgoing' ? (
                              <PhoneOutgoing className="w-3 h-3 mr-1 text-blue-500" />
                            ) : (
                              <PhoneMissed className="w-3 h-3 mr-1 text-red-500" />
                            )}
                            <span>
                              {call.type === 'missed' ? 'Missed call' : call.duration}
                              {call.callType === 'video' && ' • Video'}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center">
                        <span className="text-xs text-muted-foreground mr-4">
                          {formatTime(call.timestamp)}
                        </span>
                        <div className="flex gap-1">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8"
                            onClick={() => handleStartCall(call.contactId, false)}
                            title="Voice call"
                          >
                            <Phone className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8"
                            onClick={() => handleStartCall(call.contactId, true)}
                            title="Video call"
                          >
                            <Video className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8"
                            title="Call info"
                          >
                            <Info className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="flex flex-col items-center justify-center p-8 text-center h-full">
                    <Phone className="w-12 h-12 text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">No calls found</p>
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="missed" className="flex-1 overflow-y-auto p-4">
                {filteredCalls.filter(call => call.type === 'missed').length > 0 ? (
                  filteredCalls
                    .filter(call => call.type === 'missed')
                    .map(call => (
                      <div 
                        key={call.id}
                        className="flex items-center justify-between p-3 rounded-md hover:bg-secondary/50 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="relative">
                            {call.contactAvatar ? (
                              <img 
                                src={call.contactAvatar} 
                                alt={call.contactName} 
                                className="w-10 h-10 rounded-full object-cover"
                              />
                            ) : (
                              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                                <User className="w-5 h-5 text-primary" />
                              </div>
                            )}
                          </div>
                          <div>
                            <p className="font-medium text-red-500">{call.contactName}</p>
                            <div className="flex items-center text-xs text-muted-foreground">
                              <PhoneMissed className="w-3 h-3 mr-1 text-red-500" />
                              <span>Missed call{call.callType === 'video' && ' • Video'}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center">
                          <span className="text-xs text-muted-foreground mr-4">
                            {formatTime(call.timestamp)}
                          </span>
                          <div className="flex gap-1">
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8"
                              onClick={() => handleStartCall(call.contactId, false)}
                              title="Voice call"
                            >
                              <Phone className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8"
                              onClick={() => handleStartCall(call.contactId, true)}
                              title="Video call"
                            >
                              <Video className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))
                ) : (
                  <div className="flex flex-col items-center justify-center p-8 text-center h-full">
                    <PhoneMissed className="w-12 h-12 text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">No missed calls</p>
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="recorded" className="flex-1 overflow-y-auto p-4">
                <div className="flex flex-col items-center justify-center p-8 text-center h-full">
                  <Clock className="w-12 h-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No recorded calls</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Recorded calls will appear here
                  </p>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </main>
      
      {/* Active Call Dialog */}
      <Dialog open={isCallActive} onOpenChange={(open) => !open && handleEndCall()}>
        <DialogContent className="sm:max-w-md">
          <div className="flex flex-col items-center space-y-4">
            <div className="relative w-full h-64 bg-black rounded-lg mb-2 overflow-hidden">
              {activeCall?.callType === 'video' && isVideoEnabled ? (
                <div className="absolute inset-0 flex items-center justify-center">
                  {/* This would be the video stream in a real app */}
                  <div className="text-white">Camera not connected</div>
                </div>
              ) : (
                <div className="absolute inset-0 flex items-center justify-center bg-primary/5">
                  <Avatar className="h-24 w-24">
                    <User className="h-12 w-12" />
                  </Avatar>
                </div>
              )}
              
              {/* Self view (small picture-in-picture) */}
              {activeCall?.callType === 'video' && (
                <div className="absolute bottom-2 right-2 w-32 h-24 bg-black/50 rounded-md overflow-hidden border border-border">
                  <div className="absolute inset-0 flex items-center justify-center">
                    {isVideoEnabled ? (
                      <div className="text-xs text-white">Your camera</div>
                    ) : (
                      <div className="h-full w-full flex items-center justify-center bg-primary/10">
                        <VideoOff className="h-5 w-5 text-white" />
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              {/* Call info overlay */}
              <div className="absolute top-2 left-2 right-2 flex items-center justify-between">
                <div className="bg-black/50 rounded-full px-3 py-1 text-white text-xs">
                  {formatDuration(callDuration)}
                </div>
                <div className="bg-black/50 rounded-full px-3 py-1 text-white text-xs flex items-center">
                  <div className={`w-2 h-2 rounded-full mr-1.5 ${isMuted ? 'bg-red-500' : 'bg-green-500'}`}></div>
                  {isMuted ? 'Muted' : 'Live'}
                </div>
              </div>
            </div>
            
            <h3 className="text-xl font-semibold">{activeCall?.contactName}</h3>
            <p className="text-sm text-muted-foreground">
              {activeCall?.callType === 'video' ? 'Video call' : 'Voice call'} • {formatDuration(callDuration)}
            </p>
            
            <div className="flex items-center justify-center space-x-4 mt-4">
              <Button 
                variant="outline" 
                size="icon" 
                className={`rounded-full h-12 w-12 ${isMuted ? 'bg-destructive/10 text-destructive' : ''}`}
                onClick={toggleMute}
                title={isMuted ? "Unmute" : "Mute"}
              >
                {isMuted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
              </Button>
              
              {activeCall?.callType === 'video' && (
                <Button 
                  variant="outline" 
                  size="icon" 
                  className={`rounded-full h-12 w-12 ${!isVideoEnabled ? 'bg-destructive/10 text-destructive' : ''}`}
                  onClick={toggleVideo}
                  title={isVideoEnabled ? "Turn off camera" : "Turn on camera"}
                >
                  {isVideoEnabled ? <Video className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
                </Button>
              )}
              
              <Button 
                variant="outline" 
                size="icon" 
                className="rounded-full h-12 w-12"
                title="Toggle speaker"
              >
                <Volume2 className="h-5 w-5" />
              </Button>
              
              <Button 
                variant="destructive" 
                size="icon" 
                className="rounded-full h-12 w-12"
                onClick={handleEndCall}
                title="End call"
              >
                <Phone className="h-5 w-5 rotate-135" />
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Calls;
