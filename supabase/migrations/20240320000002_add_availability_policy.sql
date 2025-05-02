-- Adiciona política de segurança para permitir leitura pública da disponibilidade
CREATE POLICY "Permitir leitura pública de disponibilidade"
ON availability
FOR SELECT
USING (true); 