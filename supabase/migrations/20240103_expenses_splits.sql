-- 20240103_expenses_splits.sql
CREATE TABLE expenses (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id       uuid NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  paid_by        uuid NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  title          text NOT NULL,
  total_amount   integer NOT NULL CHECK (total_amount > 0), -- CLP sin decimales
  split_type     text NOT NULL DEFAULT 'equal'
                   CHECK (split_type IN ('equal', 'percent', 'exact', 'items')),
  receipt_url    text,
  receipt_items  jsonb, -- [{name: string, price: integer, assigned_to: uuid|'all'}]
  notes          text,
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER expenses_updated_at
  BEFORE UPDATE ON expenses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TABLE expense_splits (
  expense_id        uuid NOT NULL REFERENCES expenses(id) ON DELETE CASCADE,
  user_id           uuid NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  amount_owed       integer NOT NULL CHECK (amount_owed >= 0), -- CLP
  is_paid           boolean NOT NULL DEFAULT false,
  paid_at           timestamptz,
  khipu_payment_id  text,
  khipu_payment_url text,
  PRIMARY KEY (expense_id, user_id)
);
