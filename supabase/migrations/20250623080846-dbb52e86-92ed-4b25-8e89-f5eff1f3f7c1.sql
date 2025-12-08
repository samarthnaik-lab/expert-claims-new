
-- Insert sample departments
INSERT INTO public.departments (id, name, description, manager_id) VALUES
('550e8400-e29b-41d4-a716-446655440001', 'Engineering', 'Software development and technical operations', NULL),
('550e8400-e29b-41d4-a716-446655440002', 'Human Resources', 'Employee relations and talent management', NULL),
('550e8400-e29b-41d4-a716-446655440003', 'Finance', 'Financial planning and accounting', NULL),
('550e8400-e29b-41d4-a716-446655440004', 'Customer Support', 'Customer service and support operations', NULL),
('550e8400-e29b-41d4-a716-446655440005', 'Legal', 'Legal compliance and contract management', NULL);

-- Insert sample profiles (employees and customers)
INSERT INTO public.profiles (id, full_name, email, role, department, department_id, phone) VALUES
-- Admin
('550e8400-e29b-41d4-a716-446655440010', 'Admin User', 'admin@company.com', 'admin', 'Engineering', '550e8400-e29b-41d4-a716-446655440001', '+1-555-0100'),
-- Engineering Team
('550e8400-e29b-41d4-a716-446655440011', 'John Smith', 'john.smith@company.com', 'employee', 'Engineering', '550e8400-e29b-41d4-a716-446655440001', '+1-555-0101'),
('550e8400-e29b-41d4-a716-446655440012', 'Emily Chen', 'emily.chen@company.com', 'employee', 'Engineering', '550e8400-e29b-41d4-a716-446655440001', '+1-555-0102'),
-- HR Team
('550e8400-e29b-41d4-a716-446655440013', 'Sarah Johnson', 'sarah.johnson@company.com', 'employee', 'Human Resources', '550e8400-e29b-41d4-a716-446655440002', '+1-555-0103'),
('550e8400-e29b-41d4-a716-446655440014', 'Michael Davis', 'michael.davis@company.com', 'employee', 'Human Resources', '550e8400-e29b-41d4-a716-446655440002', '+1-555-0104'),
-- Finance Team
('550e8400-e29b-41d4-a716-446655440015', 'Lisa Wilson', 'lisa.wilson@company.com', 'employee', 'Finance', '550e8400-e29b-41d4-a716-446655440003', '+1-555-0105'),
('550e8400-e29b-41d4-a716-446655440016', 'Robert Brown', 'robert.brown@company.com', 'employee', 'Finance', '550e8400-e29b-41d4-a716-446655440003', '+1-555-0106'),
-- Customer Support Team
('550e8400-e29b-41d4-a716-446655440017', 'Emma Anderson', 'emma.anderson@company.com', 'employee', 'Customer Support', '550e8400-e29b-41d4-a716-446655440004', '+1-555-0107'),
('550e8400-e29b-41d4-a716-446655440018', 'David Miller', 'david.miller@company.com', 'employee', 'Customer Support', '550e8400-e29b-41d4-a716-446655440004', '+1-555-0108'),
-- Legal Team
('550e8400-e29b-41d4-a716-446655440019', 'Jennifer Taylor', 'jennifer.taylor@company.com', 'employee', 'Legal', '550e8400-e29b-41d4-a716-446655440005', '+1-555-0109'),
-- Customers
('550e8400-e29b-41d4-a716-446655440020', 'Alex Thompson', 'alex.thompson@gmail.com', 'customer', NULL, NULL, '+1-555-0201'),
('550e8400-e29b-41d4-a716-446655440021', 'Maria Garcia', 'maria.garcia@yahoo.com', 'customer', NULL, NULL, '+1-555-0202'),
('550e8400-e29b-41d4-a716-446655440022', 'James Wilson', 'james.wilson@outlook.com', 'customer', NULL, NULL, '+1-555-0203'),
('550e8400-e29b-41d4-a716-446655440023', 'Rachel Kim', 'rachel.kim@gmail.com', 'customer', NULL, NULL, '+1-555-0204'),
('550e8400-e29b-41d4-a716-446655440024', 'Thomas Lee', 'thomas.lee@hotmail.com', 'customer', NULL, NULL, '+1-555-0205');

-- Update departments with manager IDs
UPDATE public.departments SET manager_id = '550e8400-e29b-41d4-a716-446655440011' WHERE name = 'Engineering';
UPDATE public.departments SET manager_id = '550e8400-e29b-41d4-a716-446655440013' WHERE name = 'Human Resources';
UPDATE public.departments SET manager_id = '550e8400-e29b-41d4-a716-446655440015' WHERE name = 'Finance';
UPDATE public.departments SET manager_id = '550e8400-e29b-41d4-a716-446655440017' WHERE name = 'Customer Support';
UPDATE public.departments SET manager_id = '550e8400-e29b-41d4-a716-446655440019' WHERE name = 'Legal';

-- Insert task categories
INSERT INTO public.task_categories (id, name, description, color) VALUES
('550e8400-e29b-41d4-a716-446655440030', 'Bug Fix', 'Software bugs and technical issues', '#ef4444'),
('550e8400-e29b-41d4-a716-446655440031', 'Feature Request', 'New feature development', '#3b82f6'),
('550e8400-e29b-41d4-a716-446655440032', 'Insurance Claim', 'Insurance claim processing', '#f59e0b'),
('550e8400-e29b-41d4-a716-446655440033', 'Legal Review', 'Legal document and contract review', '#8b5cf6'),
('550e8400-e29b-41d4-a716-446655440034', 'Financial Analysis', 'Financial reports and analysis', '#10b981'),
('550e8400-e29b-41d4-a716-446655440035', 'Customer Support', 'Customer service requests', '#06b6d4'),
('550e8400-e29b-41d4-a716-446655440036', 'HR Request', 'Human resources related tasks', '#f97316');

-- Insert sample tasks
INSERT INTO public.tasks (id, task_id, title, description, task_summary, current_status, ticket_stage, priority, created_by, assigned_to, customer_id, reviewer_id, approver_id, category_id, due_date) VALUES
-- Engineering tasks
('550e8400-e29b-41d4-a716-446655440040', 'TSK-001', 'Fix login authentication bug', 'Users are experiencing issues with login authentication not working properly on mobile devices', 'Critical bug affecting mobile users login functionality', 'in-progress', 'analysis', 'urgent', '550e8400-e29b-41d4-a716-446655440011', '550e8400-e29b-41d4-a716-446655440012', '550e8400-e29b-41d4-a716-446655440020', '550e8400-e29b-41d4-a716-446655440013', '550e8400-e29b-41d4-a716-446655440010', '550e8400-e29b-41d4-a716-446655440030', NOW() + INTERVAL '2 days'),
('550e8400-e29b-41d4-a716-446655440041', 'TSK-002', 'Implement new dashboard analytics', 'Create comprehensive analytics dashboard for admin users with real-time metrics', 'New feature request for admin dashboard enhancement', 'new', 'analysis', 'high', '550e8400-e29b-41d4-a716-446655440010', '550e8400-e29b-41d4-a716-446655440011', NULL, '550e8400-e29b-41d4-a716-446655440012', '550e8400-e29b-41d4-a716-446655440010', '550e8400-e29b-41d4-a716-446655440031', NOW() + INTERVAL '14 days'),
-- Insurance claims
('550e8400-e29b-41d4-a716-446655440042', 'TSK-003', 'Process auto insurance claim #12345', 'Vehicle accident claim for customer Maria Garcia - rear-end collision on Highway 101', 'Auto insurance claim processing for vehicle damage assessment', 'new', 'analysis', 'urgent', '550e8400-e29b-41d4-a716-446655440017', '550e8400-e29b-41d4-a716-446655440018', '550e8400-e29b-41d4-a716-446655440021', '550e8400-e29b-41d4-a716-446655440015', '550e8400-e29b-41d4-a716-446655440010', '550e8400-e29b-41d4-a716-446655440032', NOW() + INTERVAL '5 days'),
('550e8400-e29b-41d4-a716-446655440043', 'TSK-004', 'Home insurance claim assessment', 'Water damage claim for customer James Wilson - basement flooding due to pipe burst', 'Home insurance claim for water damage assessment and repair estimates', 'in-progress', 'review', 'high', '550e8400-e29b-41d4-a716-446655440017', '550e8400-e29b-41d4-a716-446655440018', '550e8400-e29b-41d4-a716-446655440022', '550e8400-e29b-41d4-a716-446655440015', '550e8400-e29b-41d4-a716-446655440010', '550e8400-e29b-41d4-a716-446655440032', NOW() + INTERVAL '7 days'),
-- Legal tasks
('550e8400-e29b-41d4-a716-446655440044', 'TSK-005', 'Review vendor contract terms', 'Legal review of new vendor partnership agreement for software licensing', 'Contract review for new software vendor partnership agreement', 'new', 'review', 'medium', '550e8400-e29b-41d4-a716-446655440015', '550e8400-e29b-41d4-a716-446655440019', NULL, '550e8400-e29b-41d4-a716-446655440010', '550e8400-e29b-41d4-a716-446655440010', '550e8400-e29b-41d4-a716-446655440033', NOW() + INTERVAL '10 days'),
-- Financial tasks
('550e8400-e29b-41d4-a716-446655440045', 'TSK-006', 'Q4 financial analysis report', 'Prepare comprehensive financial analysis report for Q4 performance review', 'Quarterly financial performance analysis and reporting', 'closed', 'approval', 'medium', '550e8400-e29b-41d4-a716-446655440015', '550e8400-e29b-41d4-a716-446655440016', NULL, '550e8400-e29b-41d4-a716-446655440010', '550e8400-e29b-41d4-a716-446655440010', '550e8400-e29b-41d4-a716-446655440034', NOW() - INTERVAL '5 days'),
-- Customer support tasks
('550e8400-e29b-41d4-a716-446655440046', 'TSK-007', 'Customer complaint resolution', 'Resolve billing dispute for customer Rachel Kim regarding overcharged premium', 'Customer billing dispute requiring investigation and resolution', 'in-progress', 'analysis', 'high', '550e8400-e29b-41d4-a716-446655440017', '550e8400-e29b-41d4-a716-446655440018', '550e8400-e29b-41d4-a716-446655440023', '550e8400-e29b-41d4-a716-446655440015', '550e8400-e29b-41d4-a716-446655440017', '550e8400-e29b-41d4-a716-446655440035', NOW() + INTERVAL '3 days'),
-- HR tasks
('550e8400-e29b-41d4-a716-446655440047', 'TSK-008', 'Employee onboarding process', 'Complete onboarding process for new hire in Engineering department', 'New employee onboarding and orientation setup', 'new', 'waiting', 'low', '550e8400-e29b-41d4-a716-446655440013', '550e8400-e29b-41d4-a716-446655440014', NULL, '550e8400-e29b-41d4-a716-446655440011', '550e8400-e29b-41d4-a716-446655440013', '550e8400-e29b-41d4-a716-446655440036', NOW() + INTERVAL '21 days');

-- Insert task comments
INSERT INTO public.task_comments (id, task_id, created_by, comment_text, is_internal) VALUES
('550e8400-e29b-41d4-a716-446655440050', '550e8400-e29b-41d4-a716-446655440040', '550e8400-e29b-41d4-a716-446655440012', 'I have identified the issue with OAuth integration on mobile Safari. Working on a fix.', true),
('550e8400-e29b-41d4-a716-446655440051', '550e8400-e29b-41d4-a716-446655440040', '550e8400-e29b-41d4-a716-446655440020', 'Thank you for looking into this. The issue is quite urgent for our mobile users.', false),
('550e8400-e29b-41d4-a716-446655440052', '550e8400-e29b-41d4-a716-446655440042', '550e8400-e29b-41d4-a716-446655440018', 'Received all necessary documentation from the customer. Proceeding with damage assessment.', true),
('550e8400-e29b-41d4-a716-446655440053', '550e8400-e29b-41d4-a716-446655440043', '550e8400-e29b-41d4-a716-446655440022', 'I have additional photos of the water damage. Should I upload them to the system?', false),
('550e8400-e29b-41d4-a716-446655440054', '550e8400-e29b-41d4-a716-446655440046', '550e8400-e29b-41d4-a716-446655440018', 'Reviewed the billing history. Found discrepancy in premium calculation. Preparing adjustment.', true);

-- Insert task stakeholders
INSERT INTO public.task_stakeholders (id, task_id, stakeholder_id, stakeholder_name, role, contact) VALUES
('550e8400-e29b-41d4-a716-446655440060', '550e8400-e29b-41d4-a716-446655440042', '550e8400-e29b-41d4-a716-446655440021', 'Maria Garcia', 'Claimant', 'maria.garcia@yahoo.com'),
('550e8400-e29b-41d4-a716-446655440061', '550e8400-e29b-41d4-a716-446655440043', '550e8400-e29b-41d4-a716-446655440022', 'James Wilson', 'Claimant', 'james.wilson@outlook.com'),
('550e8400-e29b-41d4-a716-446655440062', '550e8400-e29b-41d4-a716-446655440046', '550e8400-e29b-41d4-a716-446655440023', 'Rachel Kim', 'Customer', 'rachel.kim@gmail.com'),
('550e8400-e29b-41d4-a716-446655440063', '550e8400-e29b-41d4-a716-446655440044', NULL, 'TechVendor Solutions', 'Vendor', 'contracts@techvendor.com'),
('550e8400-e29b-41d4-a716-446655440064', '550e8400-e29b-41d4-a716-446655440042', NULL, 'AutoRepair Center', 'Service Provider', 'claims@autorepair.com');

-- Insert task status history
INSERT INTO public.task_status_history (id, task_id, changed_by, previous_status, new_status, previous_stage, new_stage, change_reason) VALUES
('550e8400-e29b-41d4-a716-446655440070', '550e8400-e29b-41d4-a716-446655440040', '550e8400-e29b-41d4-a716-446655440012', 'new', 'in-progress', 'analysis', 'analysis', 'Started investigating the authentication issue'),
('550e8400-e29b-41d4-a716-446655440071', '550e8400-e29b-41d4-a716-446655440043', '550e8400-e29b-41d4-a716-446655440018', 'new', 'in-progress', 'analysis', 'review', 'Initial assessment completed, moving to review stage'),
('550e8400-e29b-41d4-a716-446655440072', '550e8400-e29b-41d4-a716-446655440045', '550e8400-e29b-41d4-a716-446655440016', 'in-progress', 'closed', 'review', 'approval', 'Financial analysis completed and approved'),
('550e8400-e29b-41d4-a716-446655440073', '550e8400-e29b-41d4-a716-446655440046', '550e8400-e29b-41d4-a716-446655440018', 'new', 'in-progress', 'analysis', 'analysis', 'Started investigating billing discrepancy');

-- Insert employee leaves
INSERT INTO public.employee_leaves (id, employee_id, leave_type, from_date, to_date, reason, status, applied_at, reviewed_by, reviewed_at) VALUES
('550e8400-e29b-41d4-a716-446655440080', '550e8400-e29b-41d4-a716-446655440011', 'Annual Leave', '2024-07-15', '2024-07-19', 'Summer vacation with family', 'approved', NOW() - INTERVAL '10 days', '550e8400-e29b-41d4-a716-446655440013', NOW() - INTERVAL '8 days'),
('550e8400-e29b-41d4-a716-446655440081', '550e8400-e29b-41d4-a716-446655440012', 'Sick Leave', '2024-06-20', '2024-06-22', 'Medical appointment and recovery', 'approved', NOW() - INTERVAL '20 days', '550e8400-e29b-41d4-a716-446655440013', NOW() - INTERVAL '18 days'),
('550e8400-e29b-41d4-a716-446655440082', '550e8400-e29b-41d4-a716-446655440015', 'Personal Leave', '2024-08-01', '2024-08-03', 'Family emergency', 'pending', NOW() - INTERVAL '2 days', NULL, NULL),
('550e8400-e29b-41d4-a716-446655440083', '550e8400-e29b-41d4-a716-446655440017', 'Annual Leave', '2024-09-10', '2024-09-20', 'Extended vacation to Europe', 'pending', NOW() - INTERVAL '1 day', NULL, NULL),
('550e8400-e29b-41d4-a716-446655440084', '550e8400-e29b-41d4-a716-446655440019', 'Maternity Leave', '2024-10-01', '2024-12-01', 'Maternity leave for new child', 'approved', NOW() - INTERVAL '30 days', '550e8400-e29b-41d4-a716-446655440013', NOW() - INTERVAL '25 days');

-- Insert employee expenses
INSERT INTO public.employee_expenses (id, employee_id, expense_type, amount, expense_date, description, status, submitted_at, reviewed_by, reviewed_at, receipt_path) VALUES
('550e8400-e29b-41d4-a716-446655440090', '550e8400-e29b-41d4-a716-446655440011', 'Travel', 450.75, '2024-06-15', 'Business trip to client site in San Francisco', 'approved', NOW() - INTERVAL '15 days', '550e8400-e29b-41d4-a716-446655440015', NOW() - INTERVAL '12 days', '/receipts/travel_receipt_001.pdf'),
('550e8400-e29b-41d4-a716-446655440091', '550e8400-e29b-41d4-a716-446655440012', 'Equipment', 1200.00, '2024-06-10', 'New MacBook Pro for development work', 'approved', NOW() - INTERVAL '18 days', '550e8400-e29b-41d4-a716-446655440015', NOW() - INTERVAL '15 days', '/receipts/equipment_receipt_001.pdf'),
('550e8400-e29b-41d4-a716-446655440092', '550e8400-e29b-41d4-a716-446655440017', 'Meals', 85.50, '2024-06-25', 'Client lunch meeting', 'pending', NOW() - INTERVAL '5 days', NULL, NULL, '/receipts/meal_receipt_001.pdf'),
('550e8400-e29b-41d4-a716-446655440093', '550e8400-e29b-41d4-a716-446655440019', 'Training', 350.00, '2024-06-20', 'Legal compliance training course', 'approved', NOW() - INTERVAL '10 days', '550e8400-e29b-41d4-a716-446655440015', NOW() - INTERVAL '7 days', '/receipts/training_receipt_001.pdf'),
('550e8400-e29b-41d4-a716-446655440094', '550e8400-e29b-41d4-a716-446655440016', 'Office Supplies', 125.30, '2024-06-28', 'Printer cartridges and office materials', 'pending', NOW() - INTERVAL '3 days', NULL, NULL, '/receipts/supplies_receipt_001.pdf');

-- Insert employee payslips
INSERT INTO public.employee_payslips (id, employee_id, month, gross_pay, net_pay, payslip_file, compensation_letter) VALUES
('550e8400-e29b-41d4-a716-446655440100', '550e8400-e29b-41d4-a716-446655440010', '2024-06', 9500.00, 7600.00, '/payslips/admin_june_2024.pdf', '/compensation/admin_compensation_2024.pdf'),
('550e8400-e29b-41d4-a716-446655440101', '550e8400-e29b-41d4-a716-446655440011', '2024-06', 8200.00, 6560.00, '/payslips/john_june_2024.pdf', '/compensation/john_compensation_2024.pdf'),
('550e8400-e29b-41d4-a716-446655440102', '550e8400-e29b-41d4-a716-446655440012', '2024-06', 7800.00, 6240.00, '/payslips/emily_june_2024.pdf', '/compensation/emily_compensation_2024.pdf'),
('550e8400-e29b-41d4-a716-446655440103', '550e8400-e29b-41d4-a716-446655440013', '2024-06', 7500.00, 6000.00, '/payslips/sarah_june_2024.pdf', '/compensation/sarah_compensation_2024.pdf'),
('550e8400-e29b-41d4-a716-446655440104', '550e8400-e29b-41d4-a716-446655440015', '2024-06', 8000.00, 6400.00, '/payslips/lisa_june_2024.pdf', '/compensation/lisa_compensation_2024.pdf'),
('550e8400-e29b-41d4-a716-446655440105', '550e8400-e29b-41d4-a716-446655440017', '2024-06', 6500.00, 5200.00, '/payslips/emma_june_2024.pdf', '/compensation/emma_compensation_2024.pdf'),
('550e8400-e29b-41d4-a716-446655440106', '550e8400-e29b-41d4-a716-446655440019', '2024-06', 9000.00, 7200.00, '/payslips/jennifer_june_2024.pdf', '/compensation/jennifer_compensation_2024.pdf');

-- Insert task attachments
INSERT INTO public.task_attachments (id, task_id, uploaded_by, file_name, file_path, file_size, file_type) VALUES
('550e8400-e29b-41d4-a716-446655440110', '550e8400-e29b-41d4-a716-446655440042', '550e8400-e29b-41d4-a716-446655440021', 'accident_photos.zip', '/attachments/accident_photos_001.zip', 2458000, 'application/zip'),
('550e8400-e29b-41d4-a716-446655440111', '550e8400-e29b-41d4-a716-446655440042', '550e8400-e29b-41d4-a716-446655440018', 'police_report.pdf', '/attachments/police_report_001.pdf', 156000, 'application/pdf'),
('550e8400-e29b-41d4-a716-446655440112', '550e8400-e29b-41d4-a716-446655440043', '550e8400-e29b-41d4-a716-446655440022', 'water_damage_photos.zip', '/attachments/water_damage_001.zip', 3200000, 'application/zip'),
('550e8400-e29b-41d4-a716-446655440113', '550e8400-e29b-41d4-a716-446655440044', '550e8400-e29b-41d4-a716-446655440019', 'vendor_contract_draft.pdf', '/attachments/contract_draft_001.pdf', 450000, 'application/pdf'),
('550e8400-e29b-41d4-a716-446655440114', '550e8400-e29b-41d4-a716-446655440040', '550e8400-e29b-41d4-a716-446655440012', 'mobile_login_screenshots.png', '/attachments/mobile_bug_001.png', 125000, 'image/png');
