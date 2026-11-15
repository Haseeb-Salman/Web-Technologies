-- ClassPick multi-semester migration
-- Run this ONCE in the EXISTING Supabase project after taking a backup.

-- 1) Add a semester column. Existing records are assigned to BS-IT 5th Semester.
ALTER TABLE public.students
ADD COLUMN IF NOT EXISTS class_name text;

UPDATE public.students
SET class_name = 'BS-IT 5th Semester'
WHERE class_name IS NULL;

ALTER TABLE public.students
ALTER COLUMN class_name SET DEFAULT 'BS-IT 5th Semester';

ALTER TABLE public.students
ALTER COLUMN class_name SET NOT NULL;

-- 2) Remove the old UNIQUE(roll) constraint so different semesters can reuse roll numbers.
DO $$
DECLARE c record;
BEGIN
  FOR c IN
    SELECT conname
    FROM pg_constraint
    WHERE conrelid = 'public.students'::regclass
      AND contype = 'u'
      AND pg_get_constraintdef(oid) = 'UNIQUE (roll)'
  LOOP
    EXECUTE format('ALTER TABLE public.students DROP CONSTRAINT %I', c.conname);
  END LOOP;
END $$;

-- 3) Roll numbers must be unique only inside each semester.
CREATE UNIQUE INDEX IF NOT EXISTS students_class_name_roll_uidx
ON public.students (class_name, roll);

-- 4) Replace a previously-created global 50-student trigger, if present.
DROP TRIGGER IF EXISTS student_limit_trigger ON public.students;
DROP FUNCTION IF EXISTS public.enforce_student_limit();

CREATE OR REPLACE FUNCTION public.enforce_student_limit_per_class()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE student_total integer;
BEGIN
  SELECT count(*) INTO student_total
  FROM public.students
  WHERE class_name = NEW.class_name;

  IF student_total >= 50 THEN
    RAISE EXCEPTION 'Maximum limit of 50 students reached for %.', NEW.class_name;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER student_limit_trigger
BEFORE INSERT ON public.students
FOR EACH ROW
EXECUTE FUNCTION public.enforce_student_limit_per_class();

-- Existing RLS policies remain enabled and unchanged.
