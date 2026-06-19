import { CONFIG } from "./config.js";
import { getEstado, setEstado, criarAgendamento, getAgendamentos, cancelarAgendamento } from "./db.js";

// ── Helpers ───────────────────────────────────────────────

function listarServicos() {
  return CONFIG.servicos.map(s => `• ${s.nome} — *${s.preco}*`).join("\n");
}

function listarHorarios() {
  return CONFIG.horariosDisponiveis.map(h => `• ${h}`).join("\n");
}

// ── Roteador principal ────────────────────────────────────

export async function processarMensagem(numero, texto, enviar) {
  const msg = texto.trim().toLowerCase();
  const estado = getEstado(numero);

  // ── Sempre disponíveis ────────────────────────────────
  if (["oi", "olá", "ola", "boa tarde", "bom dia", "boa noite", "menu", "inicio", "início"].some(p => msg.includes(p))) {
    setEstado(numero, "inicio");
    return enviar(CONFIG.boasVindas);
  }

  if (msg.includes("atendente") || msg === "5") {
    setEstado(numero, "inicio");
    return enviar(`👤 Vou te conectar com um atendente!\n\nClique para chamar: https://wa.me/${CONFIG.numeroAtendente}\n\nOu aguarde, em breve retornaremos. ⏳`);
  }

  // ── Menu principal ────────────────────────────────────
  if (estado === "inicio" || estado === "menu") {
    if (msg === "1" || msg.includes("preço") || msg.includes("serviço") || msg.includes("valor")) {
      setEstado(numero, "inicio");
      return enviar(`💇 *Nossos serviços:*\n\n${listarServicos()}\n\nDigite *agendar* para marcar um horário ou *orçamento* para uma proposta personalizada.`);
    }

    if (msg === "2" || msg.includes("agendar") || msg.includes("agendamento") || msg.includes("marcar")) {
      setEstado(numero, "ag_nome");
      return enviar(`📅 *Vamos agendar!*\n\nPrimeiro, me diga seu *nome completo*:`);
    }

    if (msg === "3" || msg.includes("orçamento") || msg.includes("orcamento")) {
      setEstado(numero, "orc_servico");
      return enviar(`📋 *Orçamento personalizado*\n\nQual serviço você precisa?\n\n${listarServicos()}\n\nDigite o nome do serviço:`);
    }

    if (msg === "4" || msg.includes("horário") || msg.includes("horario") || msg.includes("funcionamento")) {
      setEstado(numero, "inicio");
      return enviar(CONFIG.horarioFuncionamento);
    }

    if (msg.includes("meus agendamentos") || msg.includes("meus pedidos")) {
      const ags = getAgendamentos(numero);
      if (!ags.length) return enviar("Você não tem agendamentos ativos. Digite *agendar* para marcar um horário! 😊");
      const lista = ags.map(a => `📅 ${a.data} às ${a.horario} — ${a.servico} (ID: ${a.id})`).join("\n");
      return enviar(`*Seus agendamentos:*\n\n${lista}\n\nPara cancelar, digite: *cancelar ID* (ex: cancelar ${ags[0].id})`);
    }

    if (msg.startsWith("cancelar ")) {
      const id = msg.replace("cancelar ", "").trim();
      const ag = cancelarAgendamento(id);
      if (ag) return enviar(`✅ Agendamento cancelado com sucesso!\n\n_${ag.servico} em ${ag.data} às ${ag.horario}_\n\nLamentamos! Se mudar de ideia, é só digitar *agendar*. 😊`);
      return enviar(`Não encontrei agendamento com ID *${id}*. Verifique digitando *meus agendamentos*.`);
    }
  }

  // ── Fluxo de agendamento ──────────────────────────────

  if (estado === "ag_nome") {
    setEstado(numero, "ag_servico", { nomeCliente: texto.trim() });
    return enviar(`Olá, *${texto.trim()}*! 😊\n\nQual serviço deseja?\n\n${listarServicos()}\n\nDigite o nome do serviço:`);
  }

  if (estado === "ag_servico") {
    const servicoEncontrado = CONFIG.servicos.find(s => msg.includes(s.nome.toLowerCase()));
    const servico = servicoEncontrado ? servicoEncontrado.nome : texto.trim();
    setEstado(numero, "ag_data", { servicoEscolhido: servico });
    return enviar(`Ótima escolha! 🌟\n\nAgora me diga a *data* desejada:\n(ex: 12/06, segunda-feira, amanhã)`);
  }

  if (estado === "ag_data") {
    setEstado(numero, "ag_horario", { dataEscolhida: texto.trim() });
    return enviar(`📅 Data: *${texto.trim()}*\n\nQual horário prefere?\n\n${listarHorarios()}`);
  }

  if (estado === "ag_horario") {
    const cliente = await getEstadoCompleto(numero);
    const ag = criarAgendamento({
      numero,
      nome: cliente.nomeCliente || "Cliente",
      servico: cliente.servicoEscolhido || "Serviço",
      data: cliente.dataEscolhida || "A combinar",
      horario: texto.trim(),
    });
    setEstado(numero, "inicio");
    return enviar(`✅ *Agendamento confirmado!*\n\n📋 ID: ${ag.id}\n👤 Nome: ${ag.nome}\n💇 Serviço: ${ag.servico}\n📅 Data: ${ag.data}\n🕐 Horário: ${ag.horario}\n\nVocê receberá um lembrete 1 dia antes. Até lá! 🎉\n\nPara cancelar: *cancelar ${ag.id}*`);
  }

  // ── Fluxo de orçamento ────────────────────────────────

  if (estado === "orc_servico") {
    const servicoEncontrado = CONFIG.servicos.find(s => msg.includes(s.nome.toLowerCase()));
    if (servicoEncontrado) {
      setEstado(numero, "inicio");
      return enviar(`📋 *Orçamento — ${servicoEncontrado.nome}*\n\nValor estimado: *${servicoEncontrado.preco}*\n\n⚠️ O valor final pode variar conforme avaliação presencial.\n\nDeseja agendar? Digite *agendar* 😊`);
    }
    setEstado(numero, "orc_detalhe", { servicoOrcamento: texto.trim() });
    return enviar(`Entendido! Para um orçamento de *${texto.trim()}*, preciso de mais detalhes.\n\nDescreva o que você precisa:`);
  }

  if (estado === "orc_detalhe") {
    setEstado(numero, "inicio");
    return enviar(`📋 Orçamento solicitado com sucesso!\n\nDetalhes enviados para nossa equipe. Retornaremos em até *2 horas* com os valores.\n\nDúvidas? Digite *atendente* para falar conosco. 😊`);
  }

  // ── Cobrança / PIX ────────────────────────────────────
  if (msg.includes("pagar") || msg.includes("pagamento") || msg.includes("pix") || msg.includes("boleto")) {
    setEstado(numero, "inicio");
    return enviar(`💰 *Formas de pagamento:*\n\n💚 *PIX* (preferencial)\nChave: *${CONFIG.chavePix}*\n\n💳 *Cartão* — aceitamos no local\n💵 *Dinheiro* — aceitamos no local\n\nApós o PIX, envie o comprovante aqui! 🙏`);
  }

  // ── Fallback ──────────────────────────────────────────
  return enviar(CONFIG.naoEntendeu);
}

// busca dados salvos do cliente (estado + campos extras)
async function getEstadoCompleto(numero) {
  const { getCliente } = await import("./db.js");
  return getCliente(numero) || {};
}
