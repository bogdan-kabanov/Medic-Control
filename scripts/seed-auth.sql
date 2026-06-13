-- Password for all users: 123456
-- Hash: $2a$12$RfJ9ifrwEIQmpQmHDD269ePm4YhKpHAr0PVO.PQPezevfYfcCfrmS

INSERT INTO users (email, password_hash, first_name, last_name, role, student_id, is_active) VALUES
('nurse@medcare.com', '$2a$12$RfJ9ifrwEIQmpQmHDD269ePm4YhKpHAr0PVO.PQPezevfYfcCfrmS', 'Rachel', 'Cohen', 'nurse', NULL, true),
('maya@student.medcare.com', '$2a$12$RfJ9ifrwEIQmpQmHDD269ePm4YhKpHAr0PVO.PQPezevfYfcCfrmS', 'Maya', 'Levy', 'student', 'f03d76a4-2d82-4c1b-96e9-95478f0e0480', true),
('lior@student.medcare.com', '$2a$12$RfJ9ifrwEIQmpQmHDD269ePm4YhKpHAr0PVO.PQPezevfYfcCfrmS', 'Lior', 'Ben-David', 'student', '6c870882-7dc2-4b82-9de1-7e1dc4189750', true),
('yoav@student.medcare.com', '$2a$12$RfJ9ifrwEIQmpQmHDD269ePm4YhKpHAr0PVO.PQPezevfYfcCfrmS', 'Yoav', 'Shapiro', 'student', 'a97d53f3-f8cc-4b49-8fbc-61afec146c22', true),
('shira@student.medcare.com', '$2a$12$RfJ9ifrwEIQmpQmHDD269ePm4YhKpHAr0PVO.PQPezevfYfcCfrmS', 'Shira', 'Katz', 'student', 'f4ae768c-9c20-4359-9910-9a5f38c806ff', true)
ON CONFLICT (email) DO NOTHING;
