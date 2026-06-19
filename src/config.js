// ============================================================
//  ✏️  PREENCHA OS DADOS DO CLIENTE ANTES DE ENTREGAR
// ============================================================

export const CONFIG = {

  // ── Nome do negócio ──────────────────────────────────────
  nomeNegocio: "NOME DO NEGÓCIO AQUI",

  // ── Mensagem de boas-vindas ──────────────────────────────
  //    Use *negrito* e _itálico_ normalmente
  boasVindas: `Olá! 👋 Bem-vindo(a) ao *NOME DO NEGÓCIO AQUI*!

Como posso te ajudar?

1️⃣ Ver serviços e preços
2️⃣ Fazer agendamento
3️⃣ Solicitar orçamento
4️⃣ Horário de funcionamento
5️⃣ Falar com atendente`,

  // ── Serviços e preços ────────────────────────────────────
  //    Adicione ou remova linhas conforme necessário
  servicos: [
    { nome: "Serviço 1",  preco: "R$ 00" },
    { nome: "Serviço 2",  preco: "R$ 00" },
    { nome: "Serviço 3",  preco: "R$ 00" },
    { nome: "Serviço 4",  preco: "R$ 00" },
    { nome: "Serviço 5",  preco: "R$ 00" },
  ],

  // ── Horários disponíveis para agendamento ────────────────
  horariosDisponiveis: ["9h", "10h", "11h", "13h", "14h", "15h", "16h", "17h"],

  // ── Horário de funcionamento ─────────────────────────────
  horarioFuncionamento: `⏰ *Horário de funcionamento:*

Seg–Sex: 9h às 18h
Sábado: 9h às 13h
Domingo: Fechado`,

  // ── Número do atendente humano ───────────────────────────
  //    Formato: 55 + DDD + número (sem espaços ou símbolos)
  //    Exemplo: 5511999999999
  numeroAtendente: "55XXXXXXXXXXX",

  // ── Chave PIX ────────────────────────────────────────────
  chavePix: "CHAVEPIX@EMAIL.COM",

  // ── Mensagem quando não entende o usuário ───────────────
  naoEntendeu: `Desculpe, não entendi. 😅

Digite o *número* da opção desejada ou uma palavra-chave como:
• *preços* — ver serviços
• *agendar* — fazer agendamento
• *orçamento* — solicitar orçamento
• *horário* — funcionamento
• *atendente* — falar com humano`,

};
