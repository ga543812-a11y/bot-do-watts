import cron from "node-cron";
import { todosAgendamentos } from "./db.js";
import { CONFIG } from "./config.js";

// Formata número para JID do WhatsApp
function toJid(numero) {
  const limpo = numero.replace(/\D/g, "");
  return limpo.includes("@") ? limpo : `${limpo}@s.whatsapp.net`;
}

export function iniciarLembretes(sock) {
  // Roda todo dia às 9h — envia lembretes para agendamentos de amanhã
  cron.schedule("0 9 * * *", async () => {
    console.log("⏰ Verificando lembretes do dia...");
    const amanha = new Date();
    amanha.setDate(amanha.getDate() + 1);
    const dataAmanha = amanha.toLocaleDateString("pt-BR");

    const agendamentos = todosAgendamentos();
    for (const ag of agendamentos) {
      if (ag.status !== "confirmado") continue;
      // Verifica se o agendamento é para amanhã (comparação simples por texto)
      if (ag.data === dataAmanha || ag.data.includes(dataAmanha)) {
        try {
          await sock.sendMessage(toJid(ag.numero), {
            text: `🔔 *Lembrete de agendamento!*\n\nOlá, *${ag.nome}*! 😊\n\nSeu agendamento é *amanhã*:\n\n💇 ${ag.servico}\n📅 ${ag.data} às ${ag.horario}\n📍 ${CONFIG.nomeNegocio}\n\nConfirma sua presença?\n✅ Digite *confirmo*\n❌ Digite *cancelar ${ag.id}*`
          });
          console.log(`✅ Lembrete enviado para ${ag.nome} (${ag.numero})`);
        } catch (err) {
          console.error(`Erro ao enviar lembrete para ${ag.numero}:`, err.message);
        }
      }
    }
  });

  // Roda a cada hora — lembrete 2h antes
  cron.schedule("0 * * * *", async () => {
    const agora = new Date();
    const em2h = new Date(agora.getTime() + 2 * 60 * 60 * 1000);
    const horaAlvo = `${em2h.getHours()}h`;
    const dataHoje = agora.toLocaleDateString("pt-BR");

    const agendamentos = todosAgendamentos();
    for (const ag of agendamentos) {
      if (ag.status !== "confirmado") continue;
      if ((ag.data === dataHoje || ag.data.includes(dataHoje)) && ag.horario === horaAlvo) {
        try {
          await sock.sendMessage(toJid(ag.numero), {
            text: `⏰ Seu agendamento é em *2 horas*!\n\n💇 ${ag.servico} às ${ag.horario}\n📍 ${CONFIG.nomeNegocio}\n\nTe esperamos! 🌟`
          });
        } catch (err) {
          console.error(`Erro ao enviar lembrete 2h para ${ag.numero}:`, err.message);
        }
      }
    }
  });

  console.log("✅ Sistema de lembretes automáticos ativado!");
}
