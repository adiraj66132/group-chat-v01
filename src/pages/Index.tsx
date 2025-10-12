import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ChatMessage } from "@/components/ChatMessage";
import { ChatInput } from "@/components/ChatInput";
import { UsernameDialog } from "@/components/UsernameDialog";
import { useToast } from "@/hooks/use-toast";
import { MessageCircle } from "lucide-react";

interface Message {
  id: string;
  username: string;
  message: string;
  created_at: string;
}

const Index = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [username, setUsername] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // Load initial messages
    const loadMessages = async () => {
      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .order("created_at", { ascending: true });

      if (error) {
        console.error("Error loading messages:", error);
        toast({
          title: "Error",
          description: "Failed to load messages",
          variant: "destructive",
        });
      } else {
        setMessages(data || []);
      }
      setIsLoading(false);
    };

    loadMessages();

    // Subscribe to new messages
    const channel = supabase
      .channel("messages")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
        },
        (payload) => {
          setMessages((current) => [...current, payload.new as Message]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [toast]);

  const handleSendMessage = async (message: string) => {
    const { error } = await supabase.from("messages").insert({
      username,
      message,
    });

    if (error) {
      console.error("Error sending message:", error);
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive",
      });
    }
  };

  const handleUsernameSet = (newUsername: string) => {
    setUsername(newUsername);
    toast({
      title: "Welcome!",
      description: `You joined as ${newUsername}`,
    });
  };

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header */}
      <header className="bg-gradient-to-r from-[hsl(var(--primary))] to-[hsl(var(--secondary))] text-white p-4 shadow-lg">
        <div className="flex items-center gap-3 max-w-6xl mx-auto">
          <MessageCircle className="h-6 w-6" />
          <div>
            <h1 className="text-xl font-bold">Group Chat</h1>
            <p className="text-sm text-white/80">
              {username ? `Chatting as ${username}` : "Real-time messaging"}
            </p>
          </div>
        </div>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 max-w-6xl w-full mx-auto">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-muted-foreground">Loading messages...</p>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-muted-foreground">No messages yet. Start the conversation!</p>
          </div>
        ) : (
          messages.map((msg) => (
            <ChatMessage
              key={msg.id}
              username={msg.username}
              message={msg.message}
              timestamp={msg.created_at}
              isOwnMessage={msg.username === username}
            />
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="max-w-6xl w-full mx-auto">
        <ChatInput onSendMessage={handleSendMessage} disabled={!username} />
      </div>

      {/* Username Dialog */}
      <UsernameDialog open={!username} onUsernameSet={handleUsernameSet} />
    </div>
  );
};

export default Index;
