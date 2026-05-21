-- COPIE E COLE ESTE SCRIPT NO SQL EDITOR DO SEU PAINEL NEON (https://console.neon.tech)
-- ISSO IRÁ CRIAR TODAS AS TABELAS NECESSÁRIAS COM INTEGRIDADE REFERENCIAL E DE CHAVE ESTRANGEIRA.

-- 1. Tabela de Alunos (Students)
CREATE TABLE IF NOT EXISTS public.students (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    pin VARCHAR(4) NOT NULL,
    avatar TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Tabela de Grupos Musculares (Groups)
CREATE TABLE IF NOT EXISTS public.groups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    image TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Tabela de Exercícios (Exercises)
CREATE TABLE IF NOT EXISTS public.exercises (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    sets INT NOT NULL DEFAULT 3,
    reps VARCHAR(50) NOT NULL DEFAULT '10',
    image TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. Cronograma de Treino Semanal (Workout Plans)
CREATE TABLE IF NOT EXISTS public.workout_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    day_of_week VARCHAR(20) NOT NULL,
    group_id UUID REFERENCES public.groups(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_student_day UNIQUE(student_id, day_of_week)
);

-- 5. Logs/Sessões de Treino por Dia (Workout Logs)
CREATE TABLE IF NOT EXISTS public.workout_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    finished BOOLEAN NOT NULL DEFAULT FALSE,
    finished_at VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_student_date UNIQUE(student_id, date)
);

-- 6. Detalhe de Exercícios Concluídos no Log (Workout Log Exercises Relations)
CREATE TABLE IF NOT EXISTS public.workout_log_exercises (
    log_id UUID NOT NULL REFERENCES public.workout_logs(id) ON DELETE CASCADE,
    exercise_id UUID NOT NULL REFERENCES public.exercises(id) ON DELETE CASCADE,
    done BOOLEAN NOT NULL DEFAULT TRUE,
    PRIMARY KEY (log_id, exercise_id)
);

-- Índices Secundários para Otimização de Consultas de Busca
CREATE INDEX IF NOT EXISTS idx_groups_student_id ON public.groups(student_id);
CREATE INDEX IF NOT EXISTS idx_exercises_student_id ON public.exercises(student_id);
CREATE INDEX IF NOT EXISTS idx_workout_plans_student_id ON public.workout_plans(student_id);
CREATE INDEX IF NOT EXISTS idx_workout_logs_student_id ON public.workout_logs(student_id);
