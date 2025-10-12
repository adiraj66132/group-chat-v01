import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Input } from "./ui/input";
import { Button } from "./ui/button";

interface UsernameDialogProps {
  open: boolean;
  onUsernameSet: (username: string) => void;
}

export const UsernameDialog = ({ open, onUsernameSet }: UsernameDialogProps) => {
  const [username, setUsername] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (username.trim()) {
      onUsernameSet(username.trim());
    }
  };

  return (
    <Dialog open={open}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-[hsl(var(--primary))] to-[hsl(var(--secondary))] bg-clip-text text-transparent">
            Welcome to Group Chat
          </DialogTitle>
          <DialogDescription>
            Enter your name to join the conversation
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Your name"
            autoFocus
            maxLength={20}
          />
          <Button 
            type="submit" 
            disabled={!username.trim()}
            className="w-full bg-gradient-to-r from-[hsl(var(--primary))] to-[hsl(var(--secondary))] hover:opacity-90 transition-opacity"
          >
            Join Chat
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};
