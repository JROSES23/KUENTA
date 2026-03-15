-- ============================================================
-- KUENTA — Schema completo de Supabase
-- Ejecutar en orden en el SQL Editor de Supabase Dashboard
-- (https://supabase.com/dashboard → tu proyecto → SQL Editor)
-- ============================================================


-- ============================================================
-- 1. TABLA: users
-- ============================================================
CREATE TABLE users (
  id                  uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  phone               text,  -- nullable para Google OAuth
  display_name        text NOT NULL,
  avatar_url          text,
  push_token          text,
  plan                text NOT NULL DEFAULT 'free' CHECK (plan IN ('free', 'premium')),
  plan_expires_at     timestamptz,
  stripe_customer_id  text,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);

-- Unique parcial: solo enforza uniqueness cuando phone no es null/vacio
CREATE UNIQUE INDEX users_phone_unique_idx ON users (phone)
  WHERE phone IS NOT NULL AND phone != '';


-- ============================================================
-- 2. TRIGGER: updated_at automatico (reutilizable)
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();


-- ============================================================
-- 3. TRIGGER: crear perfil automaticamente al registrarse
--    (soporta Phone OTP y Google OAuth)
-- ============================================================
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, phone, display_name, avatar_url)
  VALUES (
    NEW.id,
    NULLIF(COALESCE(NEW.phone, ''), ''),
    COALESCE(
      NEW.raw_user_meta_data->>'full_name',
      NEW.raw_user_meta_data->>'display_name',
      NEW.raw_user_meta_data->>'name',
      split_part(COALESCE(NEW.email, ''), '@', 1),
      'Usuario'
    ),
    NEW.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (id) DO UPDATE SET
    display_name = COALESCE(
      EXCLUDED.display_name,
      users.display_name
    ),
    avatar_url = COALESCE(
      EXCLUDED.avatar_url,
      users.avatar_url
    );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();


-- ============================================================
-- 4. TABLA: groups
-- ============================================================
CREATE TABLE groups (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by  uuid NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  name        text NOT NULL,
  emoji       text NOT NULL DEFAULT '',
  description text,
  is_active   boolean NOT NULL DEFAULT true,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER groups_updated_at
  BEFORE UPDATE ON groups
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();


-- ============================================================
-- 5. TABLA: group_members
-- ============================================================
CREATE TABLE group_members (
  id           bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  group_id     uuid NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  user_id      uuid REFERENCES users(id) ON DELETE SET NULL,
  phone_guest  text,
  guest_name   text,
  role         text NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'member')),
  joined_at    timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT member_identity CHECK (
    (user_id IS NOT NULL AND phone_guest IS NULL) OR
    (user_id IS NULL AND phone_guest IS NOT NULL AND guest_name IS NOT NULL)
  ),
  CONSTRAINT unique_user_per_group UNIQUE (group_id, user_id),
  CONSTRAINT unique_guest_per_group UNIQUE (group_id, phone_guest)
);


-- ============================================================
-- 6. TABLA: expenses
-- ============================================================
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


-- ============================================================
-- 7. TABLA: expense_splits
-- ============================================================
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


-- ============================================================
-- 8. TABLA: activity_feed
-- ============================================================
CREATE TABLE activity_feed (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id    uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type        text NOT NULL CHECK (type IN (
                'expense_created',
                'payment_made',
                'payment_requested',
                'group_created',
                'member_joined'
              )),
  payload     jsonb NOT NULL DEFAULT '{}',
  visible_to  uuid[] NOT NULL DEFAULT '{}',
  created_at  timestamptz NOT NULL DEFAULT now()
);


-- ============================================================
-- 9. TABLA: plan_usage
-- ============================================================
CREATE TABLE plan_usage (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type        text NOT NULL CHECK (type IN ('scan', 'group_created')),
  created_at  timestamptz NOT NULL DEFAULT now()
);


-- ============================================================
-- 10. ROW LEVEL SECURITY (RLS)
-- ============================================================

-- USERS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_select_all" ON users FOR SELECT USING (true);
CREATE POLICY "users_update_own" ON users FOR UPDATE USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Proteger columna plan desde el cliente
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

-- PLAN_USAGE
ALTER TABLE plan_usage ENABLE ROW LEVEL SECURITY;
CREATE POLICY "plan_usage_select_own" ON plan_usage FOR SELECT
  USING (user_id = auth.uid());
-- INSERT solo via Edge Functions con service_role key


-- ============================================================
-- 11. INDEXES
-- ============================================================
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
CREATE INDEX activity_feed_visible_to_idx ON activity_feed USING GIN (visible_to);
CREATE INDEX activity_feed_created_at_idx ON activity_feed (created_at DESC);
CREATE INDEX plan_usage_user_month_idx ON plan_usage (user_id, type, created_at DESC);


-- ============================================================
-- 12. FUNCIONES RPC
-- ============================================================

-- Crear gasto + splits en una sola transaccion atomica
CREATE OR REPLACE FUNCTION create_expense_with_splits(
  p_group_id    uuid,
  p_paid_by     uuid,
  p_title       text,
  p_total       integer,
  p_split_type  text,
  p_splits      jsonb, -- [{user_id: uuid, amount_owed: integer}]
  p_receipt_url text DEFAULT NULL,
  p_receipt_items jsonb DEFAULT NULL,
  p_notes       text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_expense_id uuid;
  v_split      jsonb;
  v_user_ids   uuid[];
BEGIN
  -- Verificar que el pagador es miembro del grupo
  IF NOT EXISTS (
    SELECT 1 FROM group_members
    WHERE group_id = p_group_id AND user_id = p_paid_by
  ) THEN
    RAISE EXCEPTION 'El pagador no es miembro del grupo';
  END IF;

  -- Verificar que el total coincide con la suma de splits
  IF (SELECT SUM((s->>'amount_owed')::integer) FROM jsonb_array_elements(p_splits) s)
     != p_total THEN
    RAISE EXCEPTION 'La suma de splits no coincide con el total';
  END IF;

  -- Insertar el gasto
  INSERT INTO expenses (group_id, paid_by, title, total_amount, split_type, receipt_url, receipt_items, notes)
  VALUES (p_group_id, p_paid_by, p_title, p_total, p_split_type, p_receipt_url, p_receipt_items, p_notes)
  RETURNING id INTO v_expense_id;

  -- Insertar los splits
  FOR v_split IN SELECT * FROM jsonb_array_elements(p_splits)
  LOOP
    INSERT INTO expense_splits (expense_id, user_id, amount_owed)
    VALUES (
      v_expense_id,
      (v_split->>'user_id')::uuid,
      (v_split->>'amount_owed')::integer
    );
  END LOOP;

  -- Construir array de user_ids para el feed
  SELECT array_agg(DISTINCT (s->>'user_id')::uuid)
  INTO v_user_ids
  FROM jsonb_array_elements(p_splits) s;

  -- Insertar evento en activity_feed
  INSERT INTO activity_feed (actor_id, type, payload, visible_to)
  VALUES (
    p_paid_by,
    'expense_created',
    jsonb_build_object(
      'expense_id', v_expense_id,
      'group_id', p_group_id,
      'title', p_title,
      'total_amount', p_total,
      'split_count', jsonb_array_length(p_splits)
    ),
    v_user_ids
  );

  RETURN v_expense_id;
END;
$$;

-- Calcular balance neto de un usuario en todos sus grupos
CREATE OR REPLACE FUNCTION get_user_balance(p_user_id uuid)
RETURNS TABLE (
  total_owed_to_user  bigint,
  total_user_owes     bigint,
  net_balance         bigint
)
LANGUAGE sql
STABLE
AS $$
  SELECT
    COALESCE(SUM(CASE WHEN e.paid_by = p_user_id AND es.user_id != p_user_id AND NOT es.is_paid
                      THEN es.amount_owed ELSE 0 END), 0) AS total_owed_to_user,
    COALESCE(SUM(CASE WHEN es.user_id = p_user_id AND e.paid_by != p_user_id AND NOT es.is_paid
                      THEN es.amount_owed ELSE 0 END), 0) AS total_user_owes,
    COALESCE(SUM(CASE WHEN e.paid_by = p_user_id AND es.user_id != p_user_id AND NOT es.is_paid
                      THEN es.amount_owed
                      WHEN es.user_id = p_user_id AND e.paid_by != p_user_id AND NOT es.is_paid
                      THEN -es.amount_owed
                      ELSE 0 END), 0) AS net_balance
  FROM expense_splits es
  JOIN expenses e ON e.id = es.expense_id
  JOIN group_members gm ON gm.group_id = e.group_id AND gm.user_id = p_user_id;
$$;


-- ============================================================
-- FIN DEL SCHEMA
-- ============================================================
