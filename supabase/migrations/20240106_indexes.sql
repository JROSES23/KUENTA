-- 20240106_indexes.sql
CREATE INDEX groups_created_by_idx ON groups (created_by);
CREATE INDEX group_members_user_id_idx ON group_members (user_id);
CREATE INDEX group_members_phone_guest_idx ON group_members (phone_guest)
  WHERE phone_guest IS NOT NULL;
CREATE INDEX expenses_group_id_idx ON expenses (group_id);
CREATE INDEX expenses_paid_by_idx ON expenses (paid_by);
CREATE INDEX expenses_created_at_idx ON expenses (created_at DESC);
CREATE INDEX expense_splits_user_id_idx ON expense_splits (user_id);
CREATE INDEX expense_splits_unpaid_idx ON expense_splits (user_id, is_paid)
  WHERE is_paid = false;
CREATE INDEX users_phone_idx ON users (phone);
