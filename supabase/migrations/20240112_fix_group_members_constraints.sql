-- 20240112_fix_group_members_constraints.sql
-- Fix: remove any stray UNIQUE constraint on guest_name
-- The only unique constraints should be on (group_id, user_id) and (group_id, phone_guest)

-- Step 1: Check existing constraints (run this SELECT first to see what exists)
-- SELECT conname, contype, pg_get_constraintdef(oid)
-- FROM pg_constraint
-- WHERE conrelid = 'group_members'::regclass;

-- Step 2: Drop any UNIQUE constraint that includes guest_name alone
-- (Replace 'constraint_name_here' with the actual name from Step 1 if needed)
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT conname
    FROM pg_constraint
    WHERE conrelid = 'group_members'::regclass
      AND contype = 'u'
      AND pg_get_constraintdef(oid) LIKE '%guest_name%'
      AND pg_get_constraintdef(oid) NOT LIKE '%phone_guest%'
  LOOP
    EXECUTE 'ALTER TABLE group_members DROP CONSTRAINT IF EXISTS ' || quote_ident(r.conname);
    RAISE NOTICE 'Dropped constraint: %', r.conname;
  END LOOP;
END $$;

-- Ensure correct constraints exist
ALTER TABLE group_members DROP CONSTRAINT IF EXISTS unique_user_per_group;
ALTER TABLE group_members DROP CONSTRAINT IF EXISTS unique_guest_per_group;

-- These are the only unique constraints we want:
-- (group_id, user_id) - one entry per registered user per group
-- (group_id, phone_guest) - one entry per guest phone per group
-- Note: These may fail if they already exist as part of the PK, which is fine
DO $$
BEGIN
  BEGIN
    ALTER TABLE group_members ADD CONSTRAINT unique_user_per_group UNIQUE (group_id, user_id);
  EXCEPTION WHEN duplicate_table THEN NULL;
  END;
  BEGIN
    ALTER TABLE group_members ADD CONSTRAINT unique_guest_per_group UNIQUE (group_id, phone_guest);
  EXCEPTION WHEN duplicate_table THEN NULL;
  END;
END $$;
