import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ChatMessage } from "@/components/ChatMessage";
import { ChatInput } from "@/components/ChatInput";
import { UsernameDialog } from "@/components/UsernameDialog";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MessageCircle } from "lucide-react";

interface Message {
  id: string;
  username: string;
  message: string;
  created_at: string;
  room_id: string;
}

interface Room {
  id: string;
  name: string;
}

const Index = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [username, setUsername] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [selectedRoomId, setSelectedRoomId] = useState<string>("");
  const [roomPassword, setRoomPassword] = useState("");
  const [isRoomUnlocked, setIsRoomUnlocked] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setIsAuthenticated(!!session);
      if (!session) {
        setIsLoading(false);
      }
    };

    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setIsAuthenticated(!!session);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!isAuthenticated) return;

    const loadRooms = async () => {
      const { data, error } = await supabase
        .from("rooms")
        .select("id, name")
        .order("created_at", { ascending: true });

      if (error) {
        console.error("Error loading rooms:", error);
      } else {
        setRooms(data || []);
        if (data && data.length > 0) {
          setSelectedRoomId(data[0].id);
        }
      }
      setIsLoading(false);
    };

    loadRooms();
  }, [isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated || !selectedRoomId || !isRoomUnlocked) return;

    const loadMessages = async () => {
      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .eq("room_id", selectedRoomId)
        .order("created_at", { ascending: true });

      if (error) {
        console.error("Error loading messages:", error);
      } else {
        setMessages(data || []);
      }
    };

    loadMessages();

    const channel = supabase
      .channel(`messages-${selectedRoomId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "messages",
          filter: `room_id=eq.${selectedRoomId}`,
        },
        (payload) => {
          if (payload.eventType === "INSERT") {
            setMessages((current) => [...current, payload.new as Message]);
          } else if (payload.eventType === "DELETE") {
            setMessages((current) =>
              current.filter((msg) => msg.id !== payload.old.id)
            );
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isAuthenticated, selectedRoomId, isRoomUnlocked]);

  const handleSendMessage = async (message: string) => {
    if (!message.trim() || !username || !selectedRoomId) return;

    const { error } = await supabase.from("messages").insert({
      username,
      message: message.trim(),
      room_id: selectedRoomId,
    });

    if (error) {
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      });
      console.error("Error sending message:", error);
    }
  };

  const handleUsernameSet = (newUsername: string) => {
    setUsername(newUsername);
    toast({
      title: "Welcome!",
      description: `You're now chatting as ${newUsername}`,
    });
  };

  const handleRoomUnlock = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedRoomId || !roomPassword) {
      toast({
        title: "Error",
        description: "Please select a room and enter password.",
        variant: "destructive",
      });
      return;
    }

    try {
      const { data, error } = await supabase.rpc('verify_room_password', {
        room_id: selectedRoomId,
        password: roomPassword
      });

      if (error) throw error;

      if (data) {
        setIsRoomUnlocked(true);
        toast({
          title: "Success",
          description: "Room unlocked successfully!",
        });
      } else {
        toast({
          title: "Error",
          description: "Incorrect password. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[hsl(var(--primary))] to-[hsl(var(--accent))] p-4">
        <Card className="w-full max-w-md p-8">
          <h1 className="text-2xl font-bold text-center mb-6">Welcome to Group Chat</h1>
          <p className="text-center text-muted-foreground mb-6">
            Please sign up or log in to access the chat rooms.
          </p>
          <div className="space-y-4">
            <Button 
              className="w-full" 
              onClick={() => window.location.href = '/admin'}
            >
              Go to Login
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  if (!isRoomUnlocked) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[hsl(var(--primary))] to-[hsl(var(--accent))] p-4">
        <Card className="w-full max-w-md p-8">
          <h1 className="text-2xl font-bold text-center mb-6">Enter Chat Room</h1>
          <form onSubmit={handleRoomUnlock} className="space-y-4">
            <div>
              <Label htmlFor="room">Select Room</Label>
              <Select value={selectedRoomId} onValueChange={setSelectedRoomId}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a room" />
                </SelectTrigger>
                <SelectContent>
                  {rooms.map((room) => (
                    <SelectItem key={room.id} value={room.id}>
                      {room.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="password">Room Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter password"
                value={roomPassword}
                onChange={(e) => setRoomPassword(e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full">
              Enter Room
            </Button>
          </form>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header */}
      <header className="bg-gradient-to-r from-[hsl(var(--primary))] to-[hsl(var(--secondary))] text-white p-4 shadow-lg">
        <div className="flex items-center gap-3 max-w-6xl mx-auto">
          <MessageCircle className="h-6 w-6" />
          <div>
            <h1 className="text-xl font-bold">
              {rooms.find(r => r.id === selectedRoomId)?.name || 'Group Chat'}
            </h1>
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
