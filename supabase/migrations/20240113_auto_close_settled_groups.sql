-- 20240113_auto_close_settled_groups.sql
-- Auto-close groups when ALL expense_splits in the group are paid (is_paid = true)
-- Triggers on UPDATE of expense_splits.is_paid

CREATE OR REPLACE FUNCTION check_group_settled()
RETURNS TRIGGER AS $$
DECLARE
  v_group_id uuid;
  v_unpaid_count integer;
BEGIN
  -- Get the group_id from the expense that owns this split
  SELECT e.group_id INTO v_group_id
  FROM expenses e
  WHERE e.id = NEW.expense_id;

  IF v_group_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Count unpaid splits in this group
  SELECT COUNT(*) INTO v_unpaid_count
  FROM expense_splits es
  JOIN expenses e ON e.id = es.expense_id
  WHERE e.group_id = v_group_id
    AND es.is_paid = false;

  -- If zero unpaid splits remain, close the group
  IF v_unpaid_count = 0 THEN
    UPDATE groups
    SET is_active = false, updated_at = now()
    WHERE id = v_group_id AND is_active = true;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fire only when is_paid changes to true
DROP TRIGGER IF EXISTS trg_check_group_settled ON expense_splits;
CREATE TRIGGER trg_check_group_settled
  AFTER UPDATE OF is_paid ON expense_splits
  FOR EACH ROW
  WHEN (NEW.is_paid = true AND OLD.is_paid = false)
  EXECUTE FUNCTION check_group_settled();

-- Also allow group creator to DELETE their groups (for manual delete)
DROP POLICY IF EXISTS "groups_delete_creator" ON groups;
CREATE POLICY "groups_delete_creator" ON groups
  FOR DELETE USING (created_by = auth.uid());
