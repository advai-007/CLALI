-- ================================================================
-- CLALI Learning Content Migration
-- Run this in the Supabase SQL Editor (Dashboard > SQL Editor)
-- ================================================================

-- ── 1. learning_modules ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.learning_modules (
    id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    slug         text UNIQUE NOT NULL,
    title        text NOT NULL,
    description  text,
    category     text NOT NULL CHECK (category IN ('math', 'reading', 'object-recognition')),
    min_age      smallint,
    max_age      smallint,
    created_at   timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.learning_modules ENABLE ROW LEVEL SECURITY;

-- All authenticated users can read modules
CREATE POLICY "learning_modules_read_all"
    ON public.learning_modules FOR SELECT
    TO authenticated
    USING (true);

-- Only service role / teachers can insert/update
CREATE POLICY "learning_modules_write_teacher"
    ON public.learning_modules FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid() AND role IN ('teacher', 'admin')
        )
    );

-- ── 2. Seed: Space Cargo Math module ───────────────────────────
INSERT INTO public.learning_modules (slug, title, description, category, min_age, max_age)
VALUES (
    'space-cargo-math',
    'Space Cargo Loader',
    'An adaptive math module where children load fuel cargo into a spaceship by solving addition and subtraction problems.',
    'math',
    5,
    10
)
ON CONFLICT (slug) DO NOTHING;

-- ── 3. content_versions: align module_id type + add FK ─────────
-- content_versions.module_id is varchar; learning_modules.id is uuid.
-- We must cast the column to uuid before creating the FK.
DO $$
BEGIN
    -- Step A: cast varchar → uuid (safe if column is empty or already uuid-shaped)
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'content_versions'
          AND column_name = 'module_id'
          AND data_type = 'character varying'
    ) THEN
        -- Clear any non-uuid stub values that can't be cast
        DELETE FROM public.content_versions
        WHERE module_id !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';

        ALTER TABLE public.content_versions
            ALTER COLUMN module_id TYPE uuid USING module_id::uuid;
    END IF;

    -- Step B: add FK if not already present
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'content_versions_module_id_fkey'
          AND table_name = 'content_versions'
    ) THEN
        ALTER TABLE public.content_versions
            ADD CONSTRAINT content_versions_module_id_fkey
            FOREIGN KEY (module_id) REFERENCES public.learning_modules(id) ON DELETE CASCADE;
    END IF;
END $$;

-- ── 4. Seed: Space Cargo content versions ──────────────────────
-- module_id column is now uuid (cast done above)
INSERT INTO public.content_versions (module_id, adaptation_type, content_text)
SELECT
    id,
    v.adaptation_type,
    v.content_text
FROM public.learning_modules,
LATERAL (
    VALUES
        ('challenging', 'X + ? = Y. Calculate the missing cargo units.'),
        ('standard',    'You have X units loaded. The ship needs Y total. How many more cargo blocks?'),
        ('assisted',    'Count the blocks and drag them into the ship until it''s full!'),
        ('guided',      'Drop blocks into the glowing magnetic dock. Keep going until the fuel gauge turns green!')
) AS v(adaptation_type, content_text)
WHERE slug = 'space-cargo-math';

-- ── 5. learning_progress ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.learning_progress (
    id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id       uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    module_id        uuid NOT NULL REFERENCES public.learning_modules(id) ON DELETE CASCADE,
    session_id       uuid NOT NULL,
    difficulty_stage text NOT NULL CHECK (difficulty_stage IN ('challenging', 'standard', 'assisted', 'guided')),
    score            smallint NOT NULL DEFAULT 0,
    total_questions  smallint NOT NULL DEFAULT 0,
    duration_seconds integer,
    completed_at     timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.learning_progress ENABLE ROW LEVEL SECURITY;

-- Students can insert their own progress
CREATE POLICY "learning_progress_student_insert"
    ON public.learning_progress FOR INSERT
    TO authenticated
    WITH CHECK (student_id = auth.uid());

-- Students can read their own progress
CREATE POLICY "learning_progress_student_read"
    ON public.learning_progress FOR SELECT
    TO authenticated
    USING (student_id = auth.uid());

-- Teachers can read all progress for their students
CREATE POLICY "learning_progress_teacher_read"
    ON public.learning_progress FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid() AND role = 'teacher'
        )
    );

-- ── 6. Helpful indexes ─────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_learning_progress_student
    ON public.learning_progress (student_id);

CREATE INDEX IF NOT EXISTS idx_learning_progress_module
    ON public.learning_progress (module_id);

CREATE INDEX IF NOT EXISTS idx_content_versions_module
    ON public.content_versions (module_id, adaptation_type);
