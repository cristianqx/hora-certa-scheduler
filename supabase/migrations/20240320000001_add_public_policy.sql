-- Adiciona política de segurança para permitir leitura pública dos perfis pelo slug
CREATE POLICY "Permitir leitura pública de perfis pelo slug"
ON profiles
FOR SELECT
USING (true);

-- Adiciona política de segurança para permitir leitura pública dos serviços
CREATE POLICY "Permitir leitura pública de serviços"
ON services
FOR SELECT
USING (true);

-- Adiciona política de segurança para permitir leitura pública dos bloqueios
CREATE POLICY "Permitir leitura pública de bloqueios"
ON blocked_times
FOR SELECT
USING (true);

-- Adiciona política de segurança para permitir leitura pública dos agendamentos
CREATE POLICY "Permitir leitura pública de agendamentos"
ON appointments
FOR SELECT
USING (true); 