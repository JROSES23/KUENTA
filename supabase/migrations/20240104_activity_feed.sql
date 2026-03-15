-- 20240104_activity_feed.sql
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

-- Indice para queries del feed por usuario
CREATE INDEX activity_feed_visible_to_idx ON activity_feed USING GIN (visible_to);
CREATE INDEX activity_feed_created_at_idx ON activity_feed (created_at DESC);
