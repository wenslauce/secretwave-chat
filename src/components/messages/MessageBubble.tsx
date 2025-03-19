
import React, { useState } from 'react';
import { Check, Lock, Image, File, Trash, Clock } from 'lucide-react';
import Timer from '../ui/Timer';

type MessageStatus = 'sending' | 'sent' | 'delivered' | 'read' | 'failed';

type Attachment = {
  id: string;
  type: 'image' | 'file';
  url: string;
  name: string;
  size?: number;
};

type MessageProps = {
  id: string;
  content: string;
  timestamp: Date;
  isSender: boolean;
  status?: MessageStatus;
  selfDestruct?: number; // seconds until self-destruct
  attachments?: Attachment[];
  onDelete?: () => void;
};

const MessageBubble: React.FC<MessageProps> = ({
  id,
  content,
  timestamp,
  isSender,
  status = 'read',
  selfDestruct,
  attachments,
  onDelete
}) => {
  const [isHovered, setIsHovered] = useState(false);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'sending':
        return <Clock className="w-3 h-3" />;
      case 'sent':
        return <Check className="w-3 h-3" />;
      case 'delivered':
        return <div className="flex"><Check className="w-3 h-3" /><Check className="w-3 h-3 -ml-1" /></div>;
      case 'read':
        return <div className="flex text-blue-500"><Check className="w-3 h-3" /><Check className="w-3 h-3 -ml-1" /></div>;
      case 'failed':
        return <span className="text-xs text-destructive">!</span>;
      default:
        return null;
    }
  };

  const getAttachmentIcon = (type: string) => {
    switch (type) {
      case 'image':
        return <Image className="w-4 h-4" />;
      default:
        return <File className="w-4 h-4" />;
    }
  };

  // Format file size
  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div
      className={`max-w-xs md:max-w-md group relative message-appear ${
        isSender ? 'ml-auto' : 'mr-auto'
      }`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className={`relative flex flex-col rounded-2xl p-3 ${
        isSender
          ? 'bg-primary text-primary-foreground'
          : 'glass-card'
      }`}>
        {/* Lock icon showing encryption */}
        <div className={`absolute -top-3 ${isSender ? 'right-3' : 'left-3'} p-0.5 rounded-full ${
          isSender ? 'bg-primary' : 'bg-background'
        }`}>
          <Lock className="w-3 h-3" />
        </div>

        {/* Attachments */}
        {attachments && attachments.length > 0 && (
          <div className="mb-2 space-y-2">
            {attachments.map(attachment => (
              <div key={attachment.id} className={`rounded-lg overflow-hidden ${
                attachment.type === 'image' ? 'bg-transparent' : 'bg-black/5 p-2'
              }`}>
                {attachment.type === 'image' ? (
                  <img 
                    src={attachment.url} 
                    alt={attachment.name}
                    className="w-full h-auto rounded-lg"
                    loading="lazy"
                  />
                ) : (
                  <div className="flex items-center gap-2">
                    {getAttachmentIcon(attachment.type)}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm truncate">{attachment.name}</p>
                      {attachment.size && (
                        <p className="text-xs opacity-70">{formatFileSize(attachment.size)}</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Message content */}
        <p className="text-sm break-words">{content}</p>

        {/* Self-destruct timer */}
        {selfDestruct && (
          <div className="mt-1">
            <Timer 
              duration={selfDestruct}
              size="sm"
              onComplete={onDelete}
            />
          </div>
        )}

        {/* Time and status */}
        <div className={`flex items-center gap-1 mt-1 text-xs ${
          isSender ? 'text-primary-foreground/70 justify-end' : 'text-muted-foreground'
        }`}>
          <span>{formatTime(timestamp)}</span>
          {isSender && getStatusIcon()}
        </div>
      </div>

      {/* Delete action */}
      {onDelete && isHovered && (
        <button
          onClick={onDelete}
          className={`absolute -top-2 ${isSender ? '-left-2' : '-right-2'} p-1.5 bg-destructive text-destructive-foreground rounded-full opacity-0 group-hover:opacity-100 transition-opacity`}
          aria-label="Delete message"
        >
          <Trash className="w-3 h-3" />
        </button>
      )}
    </div>
  );
};

export default MessageBubble;
