-- 20240107_functions_rpc.sql

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
