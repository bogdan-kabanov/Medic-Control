CREATE TABLE IF NOT EXISTS students (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id TEXT UNIQUE,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  grade TEXT NOT NULL,
  age INT NOT NULL,
  diseases TEXT[] DEFAULT '{}',
  medications JSONB DEFAULT '[]',
  counselor JSONB DEFAULT '{}',
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

INSERT INTO students (first_name, last_name, grade, age, diseases, medications, counselor) VALUES
('Maya', 'Levy', 'Grade 11B', 16, '{ADHD}', '[{"name":"Ritalin","dosage":"10mg"}]', '{"name":"Tamar Mizrahi","phone":"050-1234567"}'),
('Lior', 'Ben-David', 'Grade 12A', 17, '{Asthma}', '[{"name":"Ventolin inhaler","dosage":"2 puffs"}]', '{"name":"Avi Peretz","phone":"052-3456789"}'),
('Noa', 'Goldstein', 'Grade 10C', 15, '{}', '[]', '{"name":"Miriam Cohen","phone":"054-6677889"}'),
('Ariel', 'Cohen', 'Grade 11A', 16, '{LactoseIntolerance}', '[]', '{"name":"Tamar Mizrahi","phone":"050-1234567"}'),
('Shira', 'Katz', 'Grade 10A', 15, '{Asthma}', '[{"name":"Ventolin","dosage":"2 puffs"},{"name":"Epipen","dosage":"1 shot"}]', '{"name":"Avi Peretz","phone":"052-3456789"}'),
('Yoav', 'Shapiro', 'Grade 12B', 17, '{ADHD,Anxiety}', '[{"name":"Concerta","dosage":"27mg"},{"name":"Escitalopram","dosage":"10mg"}]', '{"name":"Miriam Cohen","phone":"054-6677889"}');
