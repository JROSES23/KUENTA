-- 20240105_rls_policies.sql

-- USERS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_select_all" ON users FOR SELECT USING (true);
CREATE POLICY "users_update_own" ON users FOR UPDATE USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Trigger para proteger columna plan desde el cliente
CREATE OR REPLACE FUNCTION protect_plan_column()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.plan IS DISTINCT FROM OLD.plan
     AND current_setting('role') != 'service_role' THEN
    NEW.plan := OLD.plan;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER protect_plan_update
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION protect_plan_column();

-- GROUPS
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
CREATE POLICY "groups_select_member" ON groups FOR SELECT USING (
  id IN (SELECT group_id FROM group_members WHERE user_id = auth.uid())
);
CREATE POLICY "groups_insert_auth" ON groups FOR INSERT
  WITH CHECK (auth.uid() = created_by);
CREATE POLICY "groups_update_admin" ON groups FOR UPDATE USING (
  id IN (
    SELECT group_id FROM group_members
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- GROUP_MEMBERS
ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "members_select_same_group" ON group_members FOR SELECT USING (
  group_id IN (SELECT group_id FROM group_members WHERE user_id = auth.uid())
);
CREATE POLICY "members_insert_admin" ON group_members FOR INSERT
  WITH CHECK (
    group_id IN (
      SELECT group_id FROM group_members
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- EXPENSES
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "expenses_select_member" ON expenses FOR SELECT USING (
  group_id IN (SELECT group_id FROM group_members WHERE user_id = auth.uid())
);
CREATE POLICY "expenses_insert_member" ON expenses FOR INSERT
  WITH CHECK (
    group_id IN (SELECT group_id FROM group_members WHERE user_id = auth.uid())
    AND auth.uid() = paid_by
  );
CREATE POLICY "expenses_update_payer" ON expenses FOR UPDATE USING (
  auth.uid() = paid_by
);

-- EXPENSE_SPLITS
ALTER TABLE expense_splits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "splits_select_member" ON expense_splits FOR SELECT USING (
  expense_id IN (
    SELECT e.id FROM expenses e
    JOIN group_members gm ON gm.group_id = e.group_id
    WHERE gm.user_id = auth.uid()
  )
);
CREATE POLICY "splits_update_own" ON expense_splits FOR UPDATE USING (
  user_id = auth.uid()
) WITH CHECK (user_id = auth.uid());

-- ACTIVITY_FEED
ALTER TABLE activity_feed ENABLE ROW LEVEL SECURITY;
CREATE POLICY "feed_select_visible" ON activity_feed FOR SELECT USING (
  auth.uid() = ANY(visible_to)
);
