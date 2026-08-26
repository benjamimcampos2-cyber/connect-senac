// backend/cron/notificador.js
const cron = require('node-cron');
const supabase = require('../config/database');

// Expressão CRON: '* * * * *' significa "Executar a cada minuto"
// Na vida real, poderíamos usar '0 * * * *' (a cada hora) ou '0 8 * * *' (todos os dias às 08h00)
// Cache em memória para evitar múltiplos disparos no mesmo ciclo/dia
const lembretesEnviados = new Set(); // Chaves: `${agendamentoId}_24h`, `${agendamentoId}_3h`

if (process.env.NODE_ENV !== 'test') {
    cron.schedule('* * * * *', async () => {
    try {
        const agora = new Date();

        // Calcula o limite: daqui a 25 horas para cobrir a janela de 24h
        const daquiA25Horas = new Date(agora.getTime() + (25 * 60 * 60 * 1000));
        const limiteInferior = agora.toISOString();
        const limiteSuperior = daquiA25Horas.toISOString();

        // 1. Procurar agendamentos confirmados
        const { data: agendamentos, error } = await supabase
            .from('agendamentos')
            .select(`
                id,
                status,
                usuarios ( nome, email, telefone ),
                disponibilidades!inner ( data_hora, cursos ( nome ) )
            `)
            .eq('status', 'agendado')
            .gt('disponibilidades.data_hora', limiteInferior)
            .lt('disponibilidades.data_hora', limiteSuperior);

        if (error) throw error;

        if (!agendamentos || agendamentos.length === 0) {
            return;
        }

        // 2. Disparar os avisos com tolerância a atrasos de ciclo
        agendamentos.forEach(ag => {
            if (!ag.disponibilidades || !ag.disponibilidades.data_hora) {
                return;
            }

            const dataCurso = new Date(ag.disponibilidades.data_hora);
            const diferencaEmMinutos = Math.floor((dataCurso - agora) / (1000 * 60));

            let tipoLembrete = null;
            // Janela de 24h (entre 23h50 e 24h10)
            if (diferencaEmMinutos >= 1430 && diferencaEmMinutos <= 1450) {
                tipoLembrete = '24h';
            }
            // Janela de 3h (entre 2h50 e 3h10)
            else if (diferencaEmMinutos >= 170 && diferencaEmMinutos <= 190) {
                tipoLembrete = '3h';
            }

            if (tipoLembrete) {
                const chaveIdempotencia = `${ag.id}_${tipoLembrete}`;
                if (lembretesEnviados.has(chaveIdempotencia)) {
                    return; // Já enviado nesta sessão
                }

                lembretesEnviados.add(chaveIdempotencia);

                const curso = ag.disponibilidades.cursos?.nome || 'Curso';
                const cliente = ag.usuarios?.nome || 'Aluno';
                const horaFormatada = dataCurso.toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });

                console.log(`\n📧 [EMAIL ENVIADO - LEMBRETE ${tipoLembrete.toUpperCase()}] Para: ${ag.usuarios?.email || 'Sem e-mail'}`);
                console.log(`Olá, ${cliente}! Lembramos que o seu agendamento para o curso "${curso}" está marcado para ${horaFormatada}.`);
                console.log(`Em caso de imprevistos, cancele na plataforma com no mínimo 2 horas de antecedência.\n`);
            }
        });

    } catch (error) {
        console.error('❌ [CRON ERRO] Falha ao varrer notificações:', error.message);
    }
    });

    console.log('⏳ Motor de Notificações (CRON) ativado e a aguardar...');
}