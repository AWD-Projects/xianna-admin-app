-- Migration: Add telefono column to user_details table
-- Purpose: Enable WhatsApp newsletter functionality with plain text messages
-- Date: 2025-12-05
-- Author: Xianna Team
-- NOTE: The column name is 'telefono' (with 'p' at the end) as it already exists in the database

-- Step 1: Add telefono column if it doesn't exist (it may already exist)
ALTER TABLE user_details
ADD COLUMN IF NOT EXISTS telefono VARCHAR(20);

-- Step 2: Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_user_details_telefono
ON user_details(telefono);

-- Step 3: Add column comment for documentation
COMMENT ON COLUMN user_details.telefono IS 'Número de teléfono del usuario en formato internacional sin espacios ni guiones (ej: 5215551234567 para México)';

-- Step 4: Verify the column exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'user_details'
    AND column_name = 'telefono'
  ) THEN
    RAISE NOTICE 'Column "telefono" exists in table "user_details"';
  ELSE
    RAISE EXCEPTION 'Column "telefono" does not exist in table "user_details"';
  END IF;
END $$;

-- ============================================
-- OPTIONAL: Example data updates
-- ============================================
-- Uncomment and modify these examples to update existing users with phone numbers

-- Example 1: Update a single user
-- UPDATE user_details
-- SET telefono = '5215551234567'
-- WHERE correo = 'usuario@ejemplo.com';

-- Example 2: Update multiple users with CASE
-- UPDATE user_details
-- SET telefono = CASE
--   WHEN correo = 'usuario1@ejemplo.com' THEN '5215551234567'
--   WHEN correo = 'usuario2@ejemplo.com' THEN '5215559876543'
--   WHEN correo = 'usuario3@ejemplo.com' THEN '5215555555555'
-- END
-- WHERE correo IN ('usuario1@ejemplo.com', 'usuario2@ejemplo.com', 'usuario3@ejemplo.com');

-- Example 3: Bulk update from a temporary table
-- CREATE TEMP TABLE temp_phone_updates (
--   correo VARCHAR(255),
--   telefono VARCHAR(20)
-- );
--
-- INSERT INTO temp_phone_updates (correo, telefono) VALUES
--   ('usuario1@ejemplo.com', '5215551234567'),
--   ('usuario2@ejemplo.com', '5215559876543'),
--   ('usuario3@ejemplo.com', '5215555555555');
--
-- UPDATE user_details u
-- SET telefono = t.telefono
-- FROM temp_phone_updates t
-- WHERE u.correo = t.correo;
--
-- DROP TABLE temp_phone_updates;

-- ============================================
-- Verification queries
-- ============================================

-- Count users with phone numbers
-- SELECT
--   COUNT(*) FILTER (WHERE telefono IS NOT NULL AND telefono != '') as users_with_phone,
--   COUNT(*) FILTER (WHERE telefono IS NULL OR telefono = '') as users_without_phone,
--   COUNT(*) as total_users
-- FROM user_details;

-- Show sample of users with phone numbers
-- SELECT id, nombre, correo, telefono
-- FROM user_details
-- WHERE telefono IS NOT NULL AND telefono != ''
-- LIMIT 10;
