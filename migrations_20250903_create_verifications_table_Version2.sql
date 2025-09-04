-- Create enum type if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'verification_status') THEN
    CREATE TYPE verification_status AS ENUM ('pending', 'approved', 'rejected');
  END IF;
END$$;

CREATE TABLE IF NOT EXISTS verifications (
  id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id varchar NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  full_name varchar NOT NULL,
  id_number varchar,
  phone varchar,
  address text,
  farm_name varchar,
  coordinates varchar,
  id_image_url varchar,
  status verification_status DEFAULT 'pending',
  notes text,
  submitted_at timestamp DEFAULT now(),
  reviewed_at timestamp,
  reviewer_id varchar REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_verifications_user_id ON verifications (user_id);
CREATE INDEX IF NOT EXISTS idx_verifications_status ON verifications (status);