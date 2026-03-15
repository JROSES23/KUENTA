-- 20240111_fix_groups_delete_rls.sql
-- Allow group creator to delete their own group (needed for rollback on failed member insert)
CREATE POLICY "groups_delete_creator" ON groups FOR DELETE USING (
  auth.uid() = created_by
);
