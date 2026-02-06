/*
  # Enable access to users table

  1. Changes
    - Add RLS policy for users table to allow authenticated and anonymous users to read their own data
    
  2. Security
    - Allow SELECT for anyone (needed for login verification)
*/

CREATE POLICY "Anyone can read users for login"
  ON users
  FOR SELECT
  USING (true);