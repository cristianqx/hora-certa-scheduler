-- Adiciona coluna slug na tabela profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS slug TEXT UNIQUE;

-- Cria índice para busca eficiente por slug
CREATE INDEX IF NOT EXISTS idx_profiles_slug ON profiles(slug);

-- Atualiza slugs existentes baseado no nome
UPDATE profiles 
SET slug = LOWER(
  REGEXP_REPLACE(
    REGEXP_REPLACE(
      REGEXP_REPLACE(
        name,
        '[áàâãéèêíïóôõöúçñ]',
        '',
        'g'
      ),
      '[^a-z0-9\s-]',
      '',
      'g'
    ),
    '\s+',
    '-',
    'g'
  )
)
WHERE slug IS NULL; 