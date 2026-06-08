-- Remove common sample/test collaborators (review before running)
-- Run this in Supabase SQL editor for your project.

-- 1) Delete by common sample emails used by the project
DELETE FROM colaboradores
WHERE email_pessoal IN (
  'carlos@email.com', 'carlos@novaroma.edu.br',
  'ana@email.com', 'ana@novaroma.edu.br',
  'roberto@email.com', 'roberto@novaroma.edu.br',
  'carlos.silva@email.com', 'carlos.silva@novaroma.edu.br',
  'ana.santos@email.com', 'ana.santos@novaroma.edu.br',
  'roberto.costa@email.com', 'roberto.costa@novaroma.edu.br',
  'fernanda.lima@email.com', 'fernanda.lima@novaroma.edu.br',
  'lucas.ferreira@email.com', 'lucas.ferreira@novaroma.edu.br'
);

DELETE FROM colaboradores
WHERE email_corporativo IN (
  'carlos@email.com', 'carlos@novaroma.edu.br',
  'ana@email.com', 'ana@novaroma.edu.br',
  'roberto@email.com', 'roberto@novaroma.edu.br',
  'carlos.silva@email.com', 'carlos.silva@novaroma.edu.br',
  'ana.santos@email.com', 'ana.santos@novaroma.edu.br',
  'roberto.costa@email.com', 'roberto.costa@novaroma.edu.br',
  'fernanda.lima@email.com', 'fernanda.lima@novaroma.edu.br',
  'lucas.ferreira@email.com', 'lucas.ferreira@novaroma.edu.br'
);

-- 2) Delete by sample matriculas used in seeds
DELETE FROM colaboradores WHERE matricula IN ('MAT-001','MAT-002','MAT-003','MAT-004','MAT-005');

-- 3) Heuristic: delete rows whose name contains 'teste' (case-insensitive)
DELETE FROM colaboradores WHERE nome ILIKE '%teste%';

-- 4) (Optional) Delete ALL colaboradores (uncomment if you want to wipe the table)
-- DELETE FROM colaboradores;

-- Verify counts
SELECT 'Colaboradores remaining', COUNT(*) FROM colaboradores;

-- Note: Run these commands only if you're sure. Keep a backup before mass deletions.
