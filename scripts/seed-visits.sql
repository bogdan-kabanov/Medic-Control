CREATE TABLE IF NOT EXISTS visits (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  student_id TEXT,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  grade TEXT NOT NULL,
  arrival_time TEXT NOT NULL,
  complaint TEXT NOT NULL,
  complaint_type TEXT NOT NULL DEFAULT 'Other',
  treatment_given TEXT DEFAULT '',
  scheduled_doctor_appointment BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);
