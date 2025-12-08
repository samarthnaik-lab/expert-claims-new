
-- Delete all data from tables in the correct order to avoid foreign key constraint issues

-- Delete task-related data first
DELETE FROM public.task_comments;
DELETE FROM public.task_attachments;
DELETE FROM public.task_stakeholders;
DELETE FROM public.task_status_history;
DELETE FROM public.tasks;

-- Delete employee-related data
DELETE FROM public.employee_leaves;
DELETE FROM public.employee_expenses;
DELETE FROM public.employee_payslips;

-- Delete task categories
DELETE FROM public.task_categories;

-- Delete profiles (except authentication-related ones)
DELETE FROM public.profiles WHERE email != 'test1';

-- Delete departments
DELETE FROM public.departments;
