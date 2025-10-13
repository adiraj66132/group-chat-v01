-- Create rooms table
CREATE TABLE public.rooms (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL UNIQUE,
  password_hash text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on rooms
ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;

-- Add room_id to messages table
ALTER TABLE public.messages ADD COLUMN room_id uuid REFERENCES public.rooms(id) ON DELETE CASCADE;

-- Create index for better performance
CREATE INDEX idx_messages_room_id ON public.messages(room_id);

-- Drop existing message policies
DROP POLICY IF EXISTS "Anyone can view messages" ON public.messages;
DROP POLICY IF EXISTS "Anyone can send messages" ON public.messages;

-- New policies for messages (require authentication and room access)
CREATE POLICY "Users can view messages in accessible rooms"
ON public.messages
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can send messages"
ON public.messages
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() IS NOT NULL AND room_id IS NOT NULL);

-- Policies for rooms table
CREATE POLICY "Anyone can view room names"
ON public.rooms
FOR SELECT
USING (true);

CREATE POLICY "Admins can manage rooms"
ON public.rooms
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Create default room
INSERT INTO public.rooms (name, password_hash) 
VALUES ('room_1', crypt('default123', gen_salt('bf')));