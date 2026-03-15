-- Allow group creator (admin) to insert other members
-- Replaces the previous policy that was too restrictive
DROP POLICY IF EXISTS "members_insert_allowed" ON group_members;
DROP POLICY IF EXISTS "members_insert" ON group_members;

CREATE POLICY "members_insert" ON group_members
FOR INSERT WITH CHECK (
  -- Users can insert themselves
  user_id = auth.uid()
  -- OR group creator can insert anyone
  OR EXISTS (
    SELECT 1 FROM groups
    WHERE id = group_id AND created_by = auth.uid()
  )
);
