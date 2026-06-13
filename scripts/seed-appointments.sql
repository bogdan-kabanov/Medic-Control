CREATE TABLE IF NOT EXISTS appointments (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  student_id TEXT NOT NULL,
  student_name TEXT NOT NULL,
  doctor_type TEXT NOT NULL,
  reason TEXT NOT NULL,
  date_time TIMESTAMPTZ NOT NULL,
  priority TEXT NOT NULL DEFAULT 'Medium',
  status TEXT NOT NULL DEFAULT 'Pending',
  created_at TIMESTAMPTZ DEFAULT now()
);

INSERT INTO appointments (student_id, student_name, doctor_type, reason, date_time, priority, status) VALUES
('placeholder-1', 'Lior Ben-David', 'FamilyDoctor', 'High fever and sore throat', '2025-06-11 09:00:00+00', 'Emergency', 'Pending'),
('placeholder-2', 'Shira Katz', 'Pediatrician', 'Asthma check up after recent episodes', '2025-06-13 11:00:00+00', 'High', 'Approved'),
('placeholder-3', 'Maya Levy', 'Neurologist', 'Frequent headaches past two weeks', '2025-06-18 14:00:00+00', 'Medium', 'Pending'),
('placeholder-4', 'Ariel Cohen', 'Gastroenterologist', 'Recurring stomach pain', '2025-05-30 10:00:00+00', 'Low', 'Completed');
