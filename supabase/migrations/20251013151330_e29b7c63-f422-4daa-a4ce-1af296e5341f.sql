-- Create function to create a room with password hashing
CREATE OR REPLACE FUNCTION public.create_room(room_name text, room_password text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_room_id uuid;
BEGIN
  INSERT INTO public.rooms (name, password_hash)
  VALUES (room_name, crypt(room_password, gen_salt('bf')))
  RETURNING id INTO new_room_id;
  
  RETURN new_room_id;
END;
$$;

-- Create function to verify room password
CREATE OR REPLACE FUNCTION public.verify_room_password(room_id uuid, password text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  stored_hash text;
BEGIN
  SELECT password_hash INTO stored_hash
  FROM public.rooms
  WHERE id = room_id;
  
  IF stored_hash IS NULL THEN
    RETURN false;
  END IF;
  
  RETURN stored_hash = crypt(password, stored_hash);
END;
$$;