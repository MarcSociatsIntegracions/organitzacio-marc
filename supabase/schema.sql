-- Supabase Schema for Personal Organization App

-- Reset (if needed, but usually Supabase starts fresh)
-- DROP TABLE IF EXISTS public.time_entries CASCADE;
-- DROP TABLE IF EXISTS public.overrides CASCADE;
-- DROP TABLE IF EXISTS public.templates CASCADE;
-- DROP TABLE IF EXISTS public.task_schedule CASCADE;
-- DROP TABLE IF EXISTS public.tasks CASCADE;
-- DROP TABLE IF EXISTS public.objectives CASCADE;
-- DROP TABLE IF EXISTS public.categories CASCADE;
-- DROP TABLE IF EXISTS public.profiles CASCADE;

-- 1. PROFILES (Linked to auth.users)
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  avatar_url TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. CATEGORIES
CREATE TABLE public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT DEFAULT '#3b82f6', -- default blue
  icon TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. OBJECTIVES
CREATE TABLE public.objectives (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'archived')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. TASKS
CREATE TABLE public.tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  objective_id UUID REFERENCES public.objectives(id) ON DELETE SET NULL,
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'backlog' CHECK (status IN ('backlog', 'todo', 'done')),
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('high', 'medium', 'low')),
  due_date DATE,
  estimated_duration INTEGER DEFAULT 30, -- In minutes
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. TASK_SCHEDULE (Scheduled instances of tasks on the calendar)
CREATE TABLE public.task_schedule (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  duration INTEGER NOT NULL, -- In minutes
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6. TEMPLATES (Weekly fixed blocks)
CREATE TABLE public.templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  title TEXT NOT NULL, -- e.g., "Feina", "Gimnàs"
  day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6), -- 0=Sunday, 1=Monday...
  start_time TIME NOT NULL, -- e.g., '09:00:00'
  end_time TIME NOT NULL, -- e.g., '17:00:00'
  effective_from DATE DEFAULT CURRENT_DATE,
  effective_to DATE, -- Optional end date for a template rule
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 7. OVERRIDES (Exceptions to templates for specific dates)
CREATE TABLE public.overrides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  template_id UUID REFERENCES public.templates(id) ON DELETE CASCADE, -- if linked to a template
  date DATE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('modify', 'delete', 'add')),
  title TEXT, -- For modified or newly added blocks
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  start_time TIME,
  end_time TIME,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 8. TIME_ENTRIES (Real timer tracking)
CREATE TABLE public.time_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  task_id UUID REFERENCES public.tasks(id) ON DELETE SET NULL,
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE,
  duration INTEGER, -- In minutes, calculated when stopped
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ENABLE RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.objectives ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_schedule ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.overrides ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.time_entries ENABLE ROW LEVEL SECURITY;

-- RLS POLICIES

-- Profiles: Users can see and edit their own profile
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Common logic for other tables: user_id = auth.uid()
CREATE POLICY "Users can manage own records" ON public.categories FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own records" ON public.objectives FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own records" ON public.tasks FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own records" ON public.task_schedule FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own records" ON public.templates FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own records" ON public.overrides FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own records" ON public.time_entries FOR ALL USING (auth.uid() = user_id);

-- INDEXES
CREATE INDEX idx_categories_user_id ON public.categories(user_id);
CREATE INDEX idx_objectives_user_id ON public.objectives(user_id);
CREATE INDEX idx_tasks_user_id ON public.tasks(user_id);
CREATE INDEX idx_tasks_objective_id ON public.tasks(objective_id);
CREATE INDEX idx_task_schedule_user_id ON public.task_schedule(user_id);
CREATE INDEX idx_task_schedule_start_time ON public.task_schedule(start_time);
CREATE INDEX idx_templates_user_id_day ON public.templates(user_id, day_of_week);
CREATE INDEX idx_overrides_user_id_date ON public.overrides(user_id, date);
CREATE INDEX idx_time_entries_user_id ON public.time_entries(user_id);

-- SEED DEFAULT CATEGORIES (optional function or manual SQL)
-- These would be per user, so they should be inserted after registration.
-- For now, we'll just have the table ready.

-- AUTOMATIC PROFILE CREATION ON SIGNUP
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url)
  VALUES (new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url');
  
  -- Insert default categories for the new user
  INSERT INTO public.categories (user_id, name, color) VALUES 
    (new.id, 'Feina', '#3b82f6'),
    (new.id, 'Gimnàs', '#10b981'),
    (new.id, 'Estudi', '#f59e0b'),
    (new.id, 'Personal', '#8b5cf6');
    
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
