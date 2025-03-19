
import React, { useState, useRef } from 'react';
import { Paperclip, Clock, Send, Smile, Lock, X, TimerReset } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

type ChatInputProps = {
  onSendMessage: (content: string, selfDestruct?: number) => void;
  onSendAttachment?: (file: File) => void;
};

const ChatInput: React.FC<ChatInputProps> = ({ 
  onSendMessage,
  onSendAttachment
}) => {
  const [message, setMessage] = useState('');
  const [isSelfDestructEnabled, setIsSelfDestructEnabled] = useState(false);
  const [selfDestructTime, setSelfDestructTime] = useState(60); // 60 seconds default
  const [showSelfDestructMenu, setShowSelfDestructMenu] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleSendMessage = () => {
    const trimmedMessage = message.trim();
    if (!trimmedMessage) return;
    
    onSendMessage(
      trimmedMessage, 
      isSelfDestructEnabled ? selfDestructTime : undefined
    );
    setMessage('');
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || !files.length) return;
    
    const file = files[0];
    // Max file size: 10MB
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Maximum file size is 10MB",
        variant: "destructive",
      });
      return;
    }

    if (onSendAttachment) {
      onSendAttachment(file);
    }
    
    // Reset the input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const toggleSelfDestruct = () => {
    setIsSelfDestructEnabled(!isSelfDestructEnabled);
    setShowSelfDestructMenu(false);
  };

  const handleSelfDestructTimeChange = (seconds: number) => {
    setSelfDestructTime(seconds);
    setIsSelfDestructEnabled(true);
    setShowSelfDestructMenu(false);
  };

  return (
    <div className="relative p-3">
      <input 
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
        accept="image/*,.pdf,.doc,.docx,.txt"
      />
      
      {/* Self-destruct menu */}
      {showSelfDestructMenu && (
        <div className="absolute bottom-full mb-2 right-4 glass-card rounded-lg shadow-lg p-2 animate-fade-in">
          <div className="p-2 border-b border-border mb-1">
            <h4 className="text-sm font-medium">Self-destruct timer</h4>
          </div>
          <div className="space-y-1">
            <button
              onClick={() => handleSelfDestructTimeChange(30)}
              className="w-full text-left text-sm px-3 py-1 rounded hover:bg-secondary/50 transition-colors"
            >
              30 seconds
            </button>
            <button
              onClick={() => handleSelfDestructTimeChange(60)}
              className="w-full text-left text-sm px-3 py-1 rounded hover:bg-secondary/50 transition-colors"
            >
              1 minute
            </button>
            <button
              onClick={() => handleSelfDestructTimeChange(300)}
              className="w-full text-left text-sm px-3 py-1 rounded hover:bg-secondary/50 transition-colors"
            >
              5 minutes
            </button>
            <button
              onClick={() => handleSelfDestructTimeChange(3600)}
              className="w-full text-left text-sm px-3 py-1 rounded hover:bg-secondary/50 transition-colors"
            >
              1 hour
            </button>
            <button
              onClick={() => toggleSelfDestruct()}
              className="w-full text-left text-sm px-3 py-1 rounded hover:bg-secondary/50 transition-colors text-destructive"
            >
              {isSelfDestructEnabled ? 'Turn off' : 'Cancel'}
            </button>
          </div>
        </div>
      )}

      <div className="flex items-end gap-2 glass-card p-2 rounded-2xl">
        <button
          onClick={() => fileInputRef.current?.click()}
          className="p-2 rounded-full hover:bg-secondary/50 transition-colors"
          aria-label="Attach file"
        >
          <Paperclip className="w-5 h-5" />
        </button>
        
        <div className="relative flex-1">
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a secure message..."
            className="w-full text-sm resize-none bg-transparent border-0 focus:ring-0 min-h-[44px] max-h-[150px] py-3 px-3 outline-none"
            rows={1}
          />
          
          {/* Encryption indicator */}
          <div className="absolute bottom-1 right-1 flex items-center text-xs text-muted-foreground">
            <Lock className="w-3 h-3 mr-1" />
            <span>End-to-end encrypted</span>
          </div>
        </div>

        <div className="flex items-center gap-1">
          {/* Emoji button */}
          <button
            className="p-2 rounded-full hover:bg-secondary/50 transition-colors"
            aria-label="Add emoji"
          >
            <Smile className="w-5 h-5" />
          </button>
          
          {/* Self-destruct timer button */}
          <button
            onClick={() => setShowSelfDestructMenu(!showSelfDestructMenu)}
            className={`p-2 rounded-full transition-colors ${
              isSelfDestructEnabled 
                ? 'bg-primary text-primary-foreground' 
                : 'hover:bg-secondary/50'
            }`}
            aria-label="Set self-destruct timer"
          >
            <TimerReset className="w-5 h-5" />
          </button>
          
          {/* Send button */}
          <button
            onClick={handleSendMessage}
            disabled={!message.trim()}
            className={`p-2 rounded-full transition-colors ${
              message.trim() 
                ? 'bg-primary text-primary-foreground' 
                : 'bg-muted text-muted-foreground cursor-not-allowed'
            }`}
            aria-label="Send message"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
      
      {/* Show active self-destruct timer */}
      {isSelfDestructEnabled && (
        <div className="mt-2 flex items-center justify-end gap-2 text-xs text-muted-foreground">
          <Clock className="w-3 h-3" />
          <span>
            Message will self-destruct after {selfDestructTime === 60 
              ? '1 minute' 
              : selfDestructTime === 3600 
                ? '1 hour' 
                : `${selfDestructTime} seconds`}
          </span>
          <button 
            onClick={() => setIsSelfDestructEnabled(false)}
            className="p-1 hover:text-foreground transition-colors"
            aria-label="Disable self-destruct"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      )}
    </div>
  );
};

export default ChatInput;
