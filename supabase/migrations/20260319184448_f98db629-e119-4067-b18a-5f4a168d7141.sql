-- Create alumnos table
CREATE TABLE public.alumnos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre TEXT NOT NULL,
  alumno_id TEXT NOT NULL UNIQUE,
  telefono_padre TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create registros table
CREATE TABLE public.registros (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  alumno_id UUID NOT NULL REFERENCES public.alumnos(id) ON DELETE CASCADE,
  fecha DATE NOT NULL DEFAULT CURRENT_DATE,
  hora_entrada TIMESTAMP WITH TIME ZONE,
  hora_salida TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(alumno_id, fecha)
);

-- Enable RLS
ALTER TABLE public.alumnos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.registros ENABLE ROW LEVEL SECURITY;

-- Public read/write policies (no auth required for this school app)
CREATE POLICY "Allow all access to alumnos" ON public.alumnos FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to registros" ON public.registros FOR ALL USING (true) WITH CHECK (true);

-- Index for fast attendance lookups
CREATE INDEX idx_registros_alumno_fecha ON public.registros(alumno_id, fecha);
CREATE INDEX idx_alumnos_alumno_id ON public.alumnos(alumno_id);