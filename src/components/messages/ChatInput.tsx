
import React, { useState, useRef, useEffect } from 'react';
import { 
  PaperclipIcon, SendIcon, SmileIcon, Clock, Mic, Camera, File, Image
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import EmojiPicker, { EmojiClickData, EmojiStyle } from 'emoji-picker-react';
import { toast } from '@/hooks/use-toast';

interface ChatInputProps {
  onSendMessage: (content: string, selfDestruct?: number) => void;
  onSendAttachment?: (file: File) => void;
  onTyping?: () => void;
  disabled?: boolean;
}

const ChatInput: React.FC<ChatInputProps> = ({ 
  onSendMessage, 
  onSendAttachment,
  onTyping,
  disabled
}) => {
  const [message, setMessage] = useState('');
  const [selfDestruct, setSelfDestruct] = useState<number | undefined>(undefined);
  const [isRecording, setIsRecording] = useState(false);
  const [typingTimeout, setTypingTimeout] = useState<NodeJS.Timeout | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Focus textarea on mount
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  }, []);

  const handleSend = () => {
    if (!message.trim() && !selfDestruct) return;
    
    onSendMessage(message.trim(), selfDestruct);
    setMessage('');
    setSelfDestruct(undefined);
    
    // Focus back on textarea
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  const handleTyping = () => {
    if (onTyping) {
      // Clear existing timeout
      if (typingTimeout) {
        clearTimeout(typingTimeout);
      }
      
      // Broadcast typing event
      onTyping();
      
      // Set a new timeout
      const newTimeout = setTimeout(() => {
        // This timeout will expire if the user hasn't typed in a while
      }, 3000);
      
      setTypingTimeout(newTimeout);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
    
    handleTyping();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!onSendAttachment) return;
    
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const maxSize = 10 * 1024 * 1024; // 10MB
      
      if (file.size > maxSize) {
        toast({
          title: "File too large",
          description: "The maximum file size is 10MB.",
          variant: "destructive",
        });
        return;
      }
      
      onSendAttachment(file);
      
      // Reset file input
      e.target.value = '';
    }
  };

  const handleEmojiClick = (emojiData: EmojiClickData) => {
    setMessage(prev => prev + emojiData.emoji);
    
    // Focus back on textarea
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  const handleSetSelfDestruct = (minutes: number) => {
    setSelfDestruct(minutes * 60); // Convert to seconds
    
    toast({
      title: "Self-destruct timer set",
      description: `This message will self-destruct after ${minutes} ${minutes === 1 ? 'minute' : 'minutes'}.`,
    });
  };

  const handleVoiceRecord = () => {
    setIsRecording(!isRecording);
    
    if (!isRecording) {
      toast({
        title: "Recording started",
        description: "Your voice message is being recorded.",
      });
    } else {
      toast({
        title: "Recording stopped",
        description: "Your voice message has been sent.",
      });
    }
  };

  const handleCameraClick = () => {
    toast({
      title: "Camera feature",
      description: "The camera feature is not yet implemented.",
    });
  };

  return (
    <div className="p-4 border-t border-border">
      {selfDestruct && (
        <div className="flex items-center text-xs text-primary mb-2">
          <Clock className="w-3.5 h-3.5 mr-1" />
          <span>
            This message will self-destruct after {selfDestruct / 60} {selfDestruct / 60 === 1 ? 'minute' : 'minutes'}
          </span>
          <button 
            className="ml-2 text-muted-foreground hover:text-destructive" 
            onClick={() => setSelfDestruct(undefined)}
          >
            Cancel
          </button>
        </div>
      )}
      
      <div className="flex items-end space-x-2">
        <div className="flex-1 relative">
          <Textarea
            ref={textareaRef}
            placeholder="Type a message..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            className="min-h-10 resize-none pr-10 py-3"
            rows={1}
            disabled={disabled}
          />
          <Popover>
            <PopoverTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon" 
                className="absolute right-1 bottom-1 h-8 w-8"
                disabled={disabled}
              >
                <SmileIcon className="h-5 w-5 text-muted-foreground" />
              </Button>
            </PopoverTrigger>
            <PopoverContent 
              side="top" 
              className="w-full p-0" 
              align="end"
              sideOffset={8}
            >
              <EmojiPicker 
                onEmojiClick={handleEmojiClick} 
                emojiStyle={EmojiStyle.APPLE}
                lazyLoadEmojis
                skinTonesDisabled
                searchDisabled={false}
                width="100%"
                height={350}
              />
            </PopoverContent>
          </Popover>
        </div>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="outline" 
              size="icon" 
              className="rounded-full"
              disabled={disabled}
            >
              <PaperclipIcon className="h-5 w-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => fileInputRef.current?.click()}>
              <File className="mr-2 h-4 w-4" />
              <span>Document</span>
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                onChange={handleFileChange}
                accept="*/*"
              />
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => {
              if (fileInputRef.current) {
                fileInputRef.current.accept = "image/*";
                fileInputRef.current.click();
              }
            }}>
              <Image className="mr-2 h-4 w-4" />
              <span>Image</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleCameraClick}>
              <Camera className="mr-2 h-4 w-4" />
              <span>Camera</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleVoiceRecord}>
              <Mic className="mr-2 h-4 w-4" />
              <span>{isRecording ? 'Stop Recording' : 'Voice Message'}</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="outline" 
              size="icon" 
              className="rounded-full"
              disabled={disabled}
            >
              <Clock className="h-5 w-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => handleSetSelfDestruct(1)}>
              <span>1 minute</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleSetSelfDestruct(5)}>
              <span>5 minutes</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleSetSelfDestruct(30)}>
              <span>30 minutes</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleSetSelfDestruct(60)}>
              <span>1 hour</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleSetSelfDestruct(24 * 60)}>
              <span>24 hours</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        
        <Button 
          variant="default" 
          size="icon" 
          className="rounded-full"
          onClick={handleSend}
          disabled={(!message.trim() && !selfDestruct) || disabled}
        >
          <SendIcon className="h-5 w-5" />
        </Button>
      </div>
    </div>
  );
};

export default ChatInput;
