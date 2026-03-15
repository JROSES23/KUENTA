-- 20240110_fix_group_members_rls.sql
-- Fix: allow group creator to add themselves as first member
-- The old policy only allowed existing admins to add members,
-- which blocked the creator from joining their own new group.

-- Drop the old insert policy
DROP POLICY IF EXISTS "members_insert_admin" ON group_members;

-- New policy: allow insert if user is admin OR is the group creator adding themselves
CREATE POLICY "members_insert_allowed" ON group_members FOR INSERT
  WITH CHECK (
    -- Existing admin can add members
    group_id IN (
      SELECT gm.group_id FROM group_members gm
      WHERE gm.user_id = auth.uid() AND gm.role = 'admin'
    )
    OR
    -- Group creator can add themselves as first member
    (
      user_id = auth.uid()
      AND group_id IN (
        SELECT g.id FROM groups g WHERE g.created_by = auth.uid()
      )
    )
  );
