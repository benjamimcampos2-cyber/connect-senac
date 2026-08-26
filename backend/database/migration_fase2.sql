-- backend/database/migration_fase2.sql
-- ============================================================================
-- CONNECT SENAC - MIGRAÇÃO DE HARDENING E CONCORRÊNCIA (FASE 2)
-- Execute este script no SQL Editor do painel Supabase.
-- ============================================================================

-- 1. Trava estrutural contra overflow de vagas (Constraint no PostgreSQL)
-- Garante integridade atômica física mesmo sob concorrência extrema de agendamentos.
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'chk_vagas_limite'
    ) THEN
        ALTER TABLE disponibilidades 
        ADD CONSTRAINT chk_vagas_limite 
        CHECK (vagas_ocupadas <= vagas_totais);
    END IF;
END $$;

-- 2. Função RPC de Agendamento com Bloqueio Pessimista de Linha (Pessimistic Lock)
CREATE OR REPLACE FUNCTION realizar_agendamento_atomico(
    p_usuario_id UUID,
    p_disponibilidade_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_vagas_totais INT;
    v_vagas_ocupadas INT;
    v_novo_agendamento JSONB;
BEGIN
    -- Bloqueia a linha para escrita exclusiva durante a transação
    SELECT vagas_totais, vagas_ocupadas 
    INTO v_vagas_totais, v_vagas_ocupadas
    FROM disponibilidades
    WHERE id = p_disponibilidade_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'HORARIO_NAO_ENCONTRADO';
    END IF;

    IF v_vagas_ocupadas >= v_vagas_totais THEN
        RAISE EXCEPTION 'SEM_VAGAS';
    END IF;

    -- Insere o agendamento (A constraint UNIQUE de usuario_id + disponibilidade_id impede duplicidade)
    INSERT INTO agendamentos (usuario_id, disponibilidade_id, status)
    VALUES (p_usuario_id, p_disponibilidade_id, 'agendado')
    RETURNING to_jsonb(agendamentos.*) INTO v_novo_agendamento;

    -- Incrementa de forma atômica
    UPDATE disponibilidades
    SET vagas_ocupadas = vagas_ocupadas + 1
    WHERE id = p_disponibilidade_id;

    RETURN v_novo_agendamento;
END;
$$;
