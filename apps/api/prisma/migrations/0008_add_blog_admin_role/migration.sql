DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_type t
    JOIN pg_enum e ON e.enumtypid = t.oid
    WHERE t.typname = 'UserRole'
      AND e.enumlabel = 'BLOG_ADMIN'
  ) THEN
    ALTER TYPE "UserRole" ADD VALUE 'BLOG_ADMIN';
  END IF;
END $$;

