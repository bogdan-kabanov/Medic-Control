CREATE TABLE IF NOT EXISTS reminders (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  student_id TEXT NOT NULL,
  student_name TEXT NOT NULL DEFAULT '',
  medication TEXT NOT NULL,
  dosage TEXT NOT NULL,
  date_time TIMESTAMPTZ NOT NULL,
  notes TEXT DEFAULT '',
  status TEXT NOT NULL DEFAULT 'Pending',
  confirmed_at TIMESTAMPTZ,
  confirmed_by TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS reminder_status_logs (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  reminder_id TEXT NOT NULL,
  previous_status TEXT NOT NULL,
  new_status TEXT NOT NULL,
  changed_by TEXT NOT NULL,
  changed_at TIMESTAMPTZ DEFAULT now(),
  reason TEXT DEFAULT ''
);

CREATE TABLE IF NOT EXISTS inventory_items (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name TEXT NOT NULL,
  unit TEXT NOT NULL,
  current_stock INT DEFAULT 0,
  min_threshold INT DEFAULT 5,
  updated_at TIMESTAMPTZ DEFAULT now()
);

INSERT INTO reminders (student_id, student_name, medication, dosage, date_time, notes, status) VALUES
('placeholder-1', 'Maya Levy', 'Ritalin 10mg', '10mg', '2025-06-10 08:00:00+00', 'Morning dose', 'Done'),
('placeholder-2', 'Yoav Shapiro', 'Concerta 27mg', '27mg', '2025-06-10 13:00:00+00', '', 'Pending'),
('placeholder-3', 'Shira Katz', 'Ventolin inhaler', '2 puffs', '2025-06-10 20:00:00+00', 'Evening dose', 'Pending'),
('placeholder-4', 'Yoav Shapiro', 'Escitalopram 10mg', '10mg', '2025-06-10 21:00:00+00', 'Before bed', 'Pending');

INSERT INTO inventory_items (name, unit, current_stock, min_threshold) VALUES
('Acamol 500mg', 'Tablets', 45, 10),
('Ventolin inhaler', 'Puffs', 12, 5),
('Bandages', 'Pieces', 30, 10),
('Ibuprofen 200mg', 'Tablets', 20, 10),
('Epipen', 'Pieces', 3, 2);
