ALTER TABLE "cards"
  ALTER COLUMN "due_date" TYPE date
  USING CASE
    WHEN "due_date" IS NULL THEN NULL
    ELSE ("due_date" AT TIME ZONE 'UTC')::date
  END;
