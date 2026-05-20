-- 
-- SUPABASE MIGRATION SCRIPT - TREINO FOFO
-- Created: 2026-05-20
-- 
-- This SQL script contains the exact schema needed to integrate the "TREINO FOFO" 
-- database with Supabase. It includes automated UUIDs, foreign keys, cascading deletions, 
-- and indices for optimal query performance.
--

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==========================================
-- 1. TABLES DEFINITIONS
-- ==========================================

-- Table: Students
CREATE TABLE IF NOT EXISTS public.students (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    pin VARCHAR(10) NOT NULL,
    avatar TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Table: Groups (Muscle groups, e.g., "Perna", "Ombros")
CREATE TABLE IF NOT EXISTS public.groups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES public.students(id) ON DELETE CASCADE NOT NULL,
    name VARCHAR(255) NOT NULL,
    image TEXT, -- Optional group illustration / photo URL
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Table: Exercises
CREATE TABLE IF NOT EXISTS public.exercises (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES public.students(id) ON DELETE CASCADE NOT NULL,
    group_id UUID REFERENCES public.groups(id) ON DELETE CASCADE NOT NULL,
    name VARCHAR(255) NOT NULL,
    sets INTEGER NOT NULL DEFAULT 3,
    reps VARCHAR(50) NOT NULL DEFAULT '10',
    image TEXT, -- For custom photo uploads
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Table: Workout Plans (Schedules a specific Muscle Group to a specific Weekday per Student)
CREATE TABLE IF NOT EXISTS public.workout_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES public.students(id) ON DELETE CASCADE NOT NULL,
    day_of_week VARCHAR(50) NOT NULL, -- e.g., 'Segunda', 'Terça', 'Quarta', etc.
    group_id UUID REFERENCES public.groups(id) ON DELETE SET NULL, -- Nullable to allow offdays
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT unique_student_day UNIQUE (student_id, day_of_week),
    CONSTRAINT chk_day_of_week CHECK (day_of_week IN ('Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'))
);

-- Table: Workout Logs (Tracks overall daily status, e.g., if workout was completed)
CREATE TABLE IF NOT EXISTS public.workout_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES public.students(id) ON DELETE CASCADE NOT NULL,
    date DATE NOT NULL, -- Format: YYYY-MM-DD
    finished BOOLEAN DEFAULT FALSE NOT NULL,
    finished_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT unique_student_date UNIQUE (student_id, date)
);

-- Table: Workout Log Exercises (Tracks individual check/uncheck state of each exercise completed within a day's workout log)
CREATE TABLE IF NOT EXISTS public.workout_log_exercises (
    log_id UUID REFERENCES public.workout_logs(id) ON DELETE CASCADE NOT NULL,
    exercise_id UUID REFERENCES public.exercises(id) ON DELETE CASCADE NOT NULL,
    done BOOLEAN DEFAULT TRUE NOT NULL,
    PRIMARY KEY (log_id, exercise_id)
);


-- ==========================================
-- 2. INDEX OPTIMIZATIONS
-- ==========================================

-- Indices for rapid filtering by active student ID
CREATE INDEX IF NOT EXISTS idx_groups_student ON public.groups(student_id);
CREATE INDEX IF NOT EXISTS idx_exercises_student ON public.exercises(student_id);
CREATE INDEX IF NOT EXISTS idx_exercises_group ON public.exercises(group_id);
CREATE INDEX IF NOT EXISTS idx_workout_plans_student ON public.workout_plans(student_id);
CREATE INDEX IF NOT EXISTS idx_workout_logs_student_date ON public.workout_logs(student_id, date);


-- ==========================================
-- 3. AUTOMATIC TIMESTAMPS FOR UPDATES
-- ==========================================

CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_workout_plans_changetime
    BEFORE UPDATE ON public.workout_plans
    FOR EACH ROW
    EXECUTE FUNCTION update_modified_column();


-- ==========================================
-- 4. ROW LEVEL SECURITY (RLS) POLICIES
-- ==========================================

-- Enabled on all tables so your student data remains isolated and protected:
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_log_exercises ENABLE ROW LEVEL SECURITY;

-- 4.1 Permissive Policies for quick prototyping / integration:
-- Note: Replace key-based auth with your preferred supabase authentication handles e.g. auth.uid() when using Supabase Auth.
-- By default, these policies allow anyone to read/write, ideal for app-side student PIN validation.

CREATE POLICY "Allow public read and write access on public.students" 
ON public.students FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow public read and write access on public.groups" 
ON public.groups FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow public read and write access on public.exercises" 
ON public.exercises FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow public read and write access on public.workout_plans" 
ON public.workout_plans FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow public read and write access on public.workout_logs" 
ON public.workout_logs FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow public read and write access on public.workout_log_exercises" 
ON public.workout_log_exercises FOR ALL USING (true) WITH CHECK (true);


-- ==========================================
-- 5. BOOTSTRAP FUNCTION FOR NEW STUDENTS
-- ==========================================
-- This database function automatically creates default muscle groups, exercise lists, 
-- and a basic weekly workout plan when a new Student joins! Extremely convenient!

CREATE OR REPLACE FUNCTION public.handle_new_student_bootstrap()
RETURNS TRIGGER AS $$
DECLARE
    group_perna_id UUID;
    group_peito_id UUID;
    group_costas_id UUID;
    group_ombros_id UUID;
BEGIN
    -- 1. Create default Groups
    INSERT INTO public.groups (student_id, name)
    VALUES (NEW.id, 'Perna') RETURNING id INTO group_perna_id;

    INSERT INTO public.groups (student_id, name)
    VALUES (NEW.id, 'Peito e Tríceps') RETURNING id INTO group_peito_id;

    INSERT INTO public.groups (student_id, name)
    VALUES (NEW.id, 'Costas e Bíceps') RETURNING id INTO group_costas_id;

    INSERT INTO public.groups (student_id, name)
    VALUES (NEW.id, 'Ombros') RETURNING id INTO group_ombros_id;

    -- 2. Create default Exercises
    INSERT INTO public.exercises (student_id, group_id, name, sets, reps) 
    VALUES 
    (NEW.id, group_perna_id, 'Agachamento Barra', 4, '8-10'),
    (NEW.id, group_perna_id, 'Leg Press 45', 3, '12'),
    (NEW.id, group_peito_id, 'Supino Reto', 4, '8'),
    (NEW.id, group_peito_id, 'Tríceps Polia', 3, '12'),
    (NEW.id, group_costas_id, 'Puxada Frente', 4, '10');

    -- 3. Create default Weekly Plan
    INSERT INTO public.workout_plans (student_id, day_of_week, group_id)
    VALUES
    (NEW.id, 'Segunda', group_perna_id),
    (NEW.id, 'Terça', group_peito_id),
    (NEW.id, 'Quarta', group_costas_id),
    (NEW.id, 'Quinta', group_ombros_id),
    (NEW.id, 'Sexta', group_perna_id),
    (NEW.id, 'Sábado', group_peito_id),
    (NEW.id, 'Domingo', NULL);

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to execute bootstrap automatically on student creation:
CREATE TRIGGER trigger_bootstrap_new_student
    AFTER INSERT ON public.students
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_student_bootstrap();

-- ==========================================
-- END OF MIGRATION SCRIPT
-- ==========================================
