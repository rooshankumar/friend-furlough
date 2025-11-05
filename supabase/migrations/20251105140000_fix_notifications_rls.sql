-- Fix notifications INSERT policy to restrict to backend service role

-- Drop the overly permissive policy
DROP POLICY IF EXISTS "System can create notifications" ON public.notifications;

-- Create a new policy that restricts to service_role (backend)
CREATE POLICY "System can create notifications" ON public.notifications
  FOR INSERT 
  TO service_role
  WITH CHECK (true);

-- Add comment explaining the policy
COMMENT ON POLICY "System can create notifications" ON public.notifications IS 
'Only the backend service role can create notifications. This prevents users from creating notifications for themselves.';
