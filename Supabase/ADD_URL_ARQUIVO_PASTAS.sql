-- Add url_arquivo to pastas_documentos if missing
ALTER TABLE public.pastas_documentos
  ADD COLUMN IF NOT EXISTS url_arquivo text DEFAULT '';

-- Ensure storage bucket guidance:
-- Create a bucket named 'documentos' (or set SUPABASE_STORAGE_BUCKET env var) and make it public
-- Example (Supabase UI): Storage -> New bucket -> Name: documentos -> Public: yes
