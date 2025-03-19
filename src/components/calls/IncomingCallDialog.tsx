
import React from 'react';
import { Phone, Video, X } from 'lucide-react';
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";

type IncomingCallDialogProps = {
  isOpen: boolean;
  caller: {
    id: string;
    name: string;
    avatar?: string;
  };
  callType: 'voice' | 'video';
  onAccept: () => void;
  onDecline: () => void;
};

const IncomingCallDialog: React.FC<IncomingCallDialogProps> = ({
  isOpen,
  caller,
  callType,
  onAccept,
  onDecline
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onDecline()}>
      <DialogContent className="sm:max-w-md">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-20 h-20 rounded-full bg-primary/10 animate-pulse flex items-center justify-center">
            {caller.avatar ? (
              <img 
                src={caller.avatar} 
                alt={caller.name} 
                className="w-full h-full rounded-full object-cover"
              />
            ) : (
              <Avatar className="h-20 w-20">
                {caller.name.charAt(0).toUpperCase()}
              </Avatar>
            )}
          </div>
          
          <h3 className="text-xl font-semibold">{caller.name}</h3>
          <p className="text-muted-foreground">
            Incoming {callType === 'video' ? 'video' : 'voice'} call
          </p>
          
          <div className="flex space-x-4 mt-2">
            <Button 
              variant="destructive" 
              size="icon" 
              className="rounded-full h-12 w-12"
              onClick={onDecline}
            >
              <X className="h-5 w-5" />
            </Button>
            
            <Button 
              variant="default" 
              size="icon" 
              className="rounded-full h-12 w-12 bg-green-500 hover:bg-green-600"
              onClick={onAccept}
            >
              {callType === 'video' ? (
                <Video className="h-5 w-5" />
              ) : (
                <Phone className="h-5 w-5" />
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default IncomingCallDialog;
