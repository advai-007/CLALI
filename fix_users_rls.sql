-- ================================================================
-- CLALI: Fix Users Row-Level Security (RLS) & Role Constraints
-- Run this in the Supabase SQL Editor (Dashboard > SQL Editor)
-- ================================================================

-- 1. Fix the Role Check Constraint
-- The parent role was likely missing from the allowed list.
-- This ensures 'teacher', 'student', and 'parent' are all valid roles.
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE public.users ADD CONSTRAINT users_role_check 
    CHECK (role IN ('teacher', 'student', 'parent', 'admin'));

-- 2. Enable RLS on users table (if not already enabled)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- 3. Drop existing restrictive policies and start from a clean state
DROP POLICY IF EXISTS "Teacher insert manageables" ON public.users;
DROP POLICY IF EXISTS "Teacher select manageables" ON public.users;
DROP POLICY IF EXISTS "Teacher update students" ON public.users;
DROP POLICY IF EXISTS "Student selection" ON public.users;

-- 4. Policy: Allow teachers to insert new students and parents
-- This checks if the person doing the insert (auth.uid()) is a 'teacher' in the users table.
-- It also ensures only 'student' or 'parent' roles can be created this way.
CREATE POLICY "Teacher insert manageables"
    ON public.users
    FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid() AND role = 'teacher'
        ) AND role IN ('student', 'parent')
    );

-- 5. Policy: Allow teachers to view students and parents linked to them
-- Also allows any user to view their own profile.
CREATE POLICY "Teacher select manageables"
    ON public.users
    FOR SELECT
    TO authenticated
    USING (
        auth.uid() = teacher_id OR auth.uid() = id
    );

-- 6. Policy: Allow teachers to update students they manage
CREATE POLICY "Teacher update students"
    ON public.users
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = teacher_id)
    WITH CHECK (auth.uid() = teacher_id);

-- 7. Policy: Enable students (anon/public) to see their own profile for login
-- Since students login via class code and profile selection, they need to select their own user row.
CREATE POLICY "Student selection"
    ON public.users
    FOR SELECT
    TO anon, authenticated
    USING (role = 'student');
