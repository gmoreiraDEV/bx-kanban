ALTER TABLE "cards" ADD COLUMN IF NOT EXISTS "assigned_user_id" text;
ALTER TABLE "cards" ADD COLUMN IF NOT EXISTS "due_date" timestamp with time zone;
