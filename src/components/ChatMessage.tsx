import { cn } from "@/lib/utils";

interface ChatMessageProps {
  username: string;
  message: string;
  timestamp: string;
  isOwnMessage: boolean;
}

export const ChatMessage = ({ username, message, timestamp, isOwnMessage }: ChatMessageProps) => {
  return (
    <div className={cn(
      "flex w-full animate-fade-in",
      isOwnMessage ? "justify-end" : "justify-start"
    )}>
      <div className={cn(
        "max-w-[75%] md:max-w-[60%] rounded-2xl px-4 py-2 shadow-sm",
        isOwnMessage 
          ? "bg-[hsl(var(--chat-bubble-sent))] text-white rounded-br-md" 
          : "bg-[hsl(var(--chat-bubble-received))] text-foreground rounded-bl-md"
      )}>
        {!isOwnMessage && (
          <p className="text-xs font-semibold mb-1 text-primary">{username}</p>
        )}
        <p className="text-sm break-words">{message}</p>
        <p className={cn(
          "text-xs mt-1",
          isOwnMessage ? "text-white/70" : "text-muted-foreground"
        )}>
          {new Date(timestamp).toLocaleTimeString([], { 
            hour: '2-digit', 
            minute: '2-digit' 
          })}
        </p>
      </div>
    </div>
  );
};
