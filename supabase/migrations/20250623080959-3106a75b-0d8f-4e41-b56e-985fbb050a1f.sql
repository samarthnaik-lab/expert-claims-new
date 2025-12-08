
-- First, let's update the department name from Engineering to Employee
UPDATE public.departments 
SET name = 'Employee', description = 'Employee management and operations' 
WHERE name = 'Engineering';

-- Update profiles that were in Engineering department
UPDATE public.profiles 
SET department = 'Employee' 
WHERE department = 'Engineering';

-- Update existing task categories to insurance-focused ones (keeping the same IDs to avoid foreign key issues)
UPDATE public.task_categories 
SET name = 'Life Insurance', description = 'Life insurance policies and claims', color = '#ef4444'
WHERE id = '550e8400-e29b-41d4-a716-446655440030';

UPDATE public.task_categories 
SET name = 'Non-Life Insurance', description = 'Auto, home, health and other non-life insurance', color = '#3b82f6'
WHERE id = '550e8400-e29b-41d4-a716-446655440031';

UPDATE public.task_categories 
SET name = 'Claims Processing', description = 'Insurance claims processing and assessment', color = '#f59e0b'
WHERE id = '550e8400-e29b-41d4-a716-446655440032';

UPDATE public.task_categories 
SET name = 'Policy Review', description = 'Insurance policy reviews and updates', color = '#8b5cf6'
WHERE id = '550e8400-e29b-41d4-a716-446655440033';

UPDATE public.task_categories 
SET name = 'Underwriting', description = 'Insurance underwriting and risk assessment', color = '#10b981'
WHERE id = '550e8400-e29b-41d4-a716-446655440034';

UPDATE public.task_categories 
SET name = 'Customer Service', description = 'Insurance customer service and support', color = '#06b6d4'
WHERE id = '550e8400-e29b-41d4-a716-446655440035';

UPDATE public.task_categories 
SET name = 'Compliance', description = 'Insurance regulatory compliance tasks', color = '#f97316'
WHERE id = '550e8400-e29b-41d4-a716-446655440036';

-- Update existing tasks to use appropriate insurance categories
-- Change bug fix tasks to Claims Processing
UPDATE public.tasks 
SET category_id = '550e8400-e29b-41d4-a716-446655440032'
WHERE category_id = '550e8400-e29b-41d4-a716-446655440030';

-- Change feature request tasks to Policy Review  
UPDATE public.tasks 
SET category_id = '550e8400-e29b-41d4-a716-446655440033'
WHERE category_id = '550e8400-e29b-41d4-a716-446655440031';

-- Insurance claim tasks stay as Claims Processing
UPDATE public.tasks 
SET category_id = '550e8400-e29b-41d4-a716-446655440032'
WHERE category_id = '550e8400-e29b-41d4-a716-446655440032';

-- Legal review tasks become Compliance
UPDATE public.tasks 
SET category_id = '550e8400-e29b-41d4-a716-446655440036'
WHERE category_id = '550e8400-e29b-41d4-a716-446655440033';

-- Financial analysis tasks become Underwriting
UPDATE public.tasks 
SET category_id = '550e8400-e29b-41d4-a716-446655440034'
WHERE category_id = '550e8400-e29b-41d4-a716-446655440034';

-- Customer support tasks stay as Customer Service
UPDATE public.tasks 
SET category_id = '550e8400-e29b-41d4-a716-446655440035'
WHERE category_id = '550e8400-e29b-41d4-a716-446655440035';

-- HR tasks become Compliance
UPDATE public.tasks 
SET category_id = '550e8400-e29b-41d4-a716-446655440036'
WHERE category_id = '550e8400-e29b-41d4-a716-446655440036';
