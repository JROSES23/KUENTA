-- 20240108_plan_usage.sql
CREATE TABLE plan_usage (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type        text NOT NULL CHECK (type IN ('scan', 'group_created')),
  created_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE plan_usage ENABLE ROW LEVEL SECURITY;
CREATE POLICY "plan_usage_select_own" ON plan_usage FOR SELECT
  USING (user_id = auth.uid());
-- INSERT solo via Edge Functions con service_role key

CREATE INDEX plan_usage_user_month_idx ON plan_usage (user_id, type, created_at DESC);
