-- 20240102_groups_members.sql
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

CREATE TABLE group_members (
  group_id     uuid NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  user_id      uuid REFERENCES users(id) ON DELETE SET NULL,
  phone_guest  text,
  guest_name   text,
  role         text NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'member')),
  joined_at    timestamptz NOT NULL DEFAULT now(),
  -- Un miembro es o usuario registrado o guest con telefono
  CONSTRAINT member_identity CHECK (
    (user_id IS NOT NULL AND phone_guest IS NULL) OR
    (user_id IS NULL AND phone_guest IS NOT NULL AND guest_name IS NOT NULL)
  ),
  PRIMARY KEY (group_id, COALESCE(user_id::text, phone_guest))
);
