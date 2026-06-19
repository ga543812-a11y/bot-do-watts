import makeWASocket, {
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion,
} from "@whiskeysockets/baileys";
import { Boom } from "@hapi/boom";
import qrcode from "qrcode-terminal";
import QRCode from "qrcode";
import pino from "pino";
import { createServer } from "http";
import { readFileSync, existsSync, rmSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { processarMensagem } from "./handlers.js";
import { iniciarLembretes } from "./lembretes.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const logger = pino({ level: "silent" });

// ── Estado global ─────────────────────────────────────────
let estadoConexao = "desconectado"; // "desconectado" | "aguardando_qr" | "conectado"
let qrCodeAtual = null;
let qrCodeBase64 = null;
let sockAtual = null;
let numeroConectado = null;

// ── Servidor Web (painel de controle) ────────────────────
const painelHTML = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>WhatsApp Bot — Painel</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }

    body {
      font-family: 'Segoe UI', system-ui, sans-serif;
      background: #0a0f1e;
      color: #e8eaf0;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 24px;
    }

    .card {
      background: #131929;
      border: 1px solid #1e2d4a;
      border-radius: 20px;
      padding: 40px 36px;
      width: 100%;
      max-width: 440px;
      text-align: center;
      box-shadow: 0 0 60px rgba(0,200,100,0.05);
    }

    .logo {
      font-size: 2rem;
      margin-bottom: 6px;
    }

    h1 {
      font-size: 1.25rem;
      font-weight: 600;
      color: #fff;
      letter-spacing: -0.3px;
    }

    .subtitle {
      font-size: 0.85rem;
      color: #5a6a88;
      margin-top: 4px;
      margin-bottom: 32px;
    }

    /* Status badge */
    .status-badge {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 8px 18px;
      border-radius: 100px;
      font-size: 0.82rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.6px;
      margin-bottom: 28px;
    }
    .status-badge .dot {
      width: 8px; height: 8px;
      border-radius: 50%;
    }
    .status-conectado  { background: rgba(0,200,100,0.1); color: #00c864; border: 1px solid rgba(0,200,100,0.2); }
    .status-conectado .dot { background: #00c864; box-shadow: 0 0 8px #00c864; animation: pulse 2s infinite; }
    .status-aguardando { background: rgba(255,180,0,0.1); color: #ffb400; border: 1px solid rgba(255,180,0,0.2); }
    .status-aguardando .dot { background: #ffb400; animation: pulse 1.2s infinite; }
    .status-desconectado { background: rgba(255,70,70,0.1); color: #ff4646; border: 1px solid rgba(255,70,70,0.15); }
    .status-desconectado .dot { background: #ff4646; }

    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.3; }
    }

    /* QR Code */
    .qr-container {
      background: #fff;
      border-radius: 16px;
      padding: 16px;
      display: inline-block;
      margin-bottom: 20px;
    }
    .qr-container img { display: block; width: 220px; height: 220px; }

    .qr-hint {
      font-size: 0.8rem;
      color: #5a6a88;
      line-height: 1.6;
      margin-bottom: 24px;
    }
    .qr-hint strong { color: #8899b4; }

    /* Info conectado */
    .info-conectado {
      background: rgba(0,200,100,0.05);
      border: 1px solid rgba(0,200,100,0.1);
      border-radius: 12px;
      padding: 16px 20px;
      margin-bottom: 24px;
      font-size: 0.88rem;
      color: #8899b4;
      text-align: left;
    }
    .info-conectado .numero { color: #00c864; font-weight: 600; font-size: 1rem; }

    /* Placeholder */
    .placeholder {
      width: 220px; height: 220px;
      background: #0d1525;
      border-radius: 12px;
      margin: 0 auto 20px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 3rem;
      border: 2px dashed #1e2d4a;
    }

    /* Botões */
    .btn {
      width: 100%;
      padding: 14px 20px;
      border: none;
      border-radius: 12px;
      font-size: 0.92rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
      margin-bottom: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
    }
    .btn:last-child { margin-bottom: 0; }
    .btn:disabled { opacity: 0.45; cursor: not-allowed; }

    .btn-primary {
      background: #00c864;
      color: #001a0d;
    }
    .btn-primary:not(:disabled):hover { background: #00e070; transform: translateY(-1px); }

    .btn-warning {
      background: rgba(255,180,0,0.12);
      color: #ffb400;
      border: 1px solid rgba(255,180,0,0.2);
    }
    .btn-warning:not(:disabled):hover { background: rgba(255,180,0,0.2); }

    .btn-danger {
      background: rgba(255,70,70,0.1);
      color: #ff6464;
      border: 1px solid rgba(255,70,70,0.15);
    }
    .btn-danger:not(:disabled):hover { background: rgba(255,70,70,0.18); }

    .divider {
      border: none;
      border-top: 1px solid #1e2d4a;
      margin: 20px 0;
    }

    .footer {
      font-size: 0.75rem;
      color: #2e3d55;
      margin-top: 24px;
    }

    /* Toast */
    .toast {
      position: fixed;
      bottom: 24px;
      left: 50%;
      transform: translateX(-50%) translateY(80px);
      background: #1e2d4a;
      color: #e8eaf0;
      border: 1px solid #2a3d5a;
      padding: 12px 22px;
      border-radius: 100px;
      font-size: 0.85rem;
      font-weight: 500;
      transition: transform 0.3s ease;
      z-index: 999;
      white-space: nowrap;
    }
    .toast.show { transform: translateX(-50%) translateY(0); }
  </style>
</head>
<body>

<div class="card" id="painel">
  <div class="logo">🤖</div>
  <h1>WhatsApp Bot</h1>
  <p class="subtitle">Painel de Controle</p>

  <div id="status-badge" class="status-badge"></div>
  <div id="conteudo"></div>

  <hr class="divider">

  <button class="btn btn-warning" id="btn-reconectar" onclick="reconectar()">
    🔄 Reconectar WhatsApp
  </button>
  <button class="btn btn-danger" id="btn-desconectar" onclick="desconectar()">
    ⏏️ Desconectar sessão
  </button>
</div>

<div class="toast" id="toast"></div>
<p class="footer">Atualiza automaticamente a cada 3 segundos</p>

<script>
  let estadoAnterior = null;

  function mostrarToast(msg) {
    const t = document.getElementById('toast');
    t.textContent = msg;
    t.classList.add('show');
    setTimeout(() => t.classList.remove('show'), 3000);
  }

  async function atualizarPainel() {
    try {
      const res = await fetch('/api/status');
      const dados = await res.json();

      // Atualiza badge
      const badge = document.getElementById('status-badge');
      const textos = { conectado: 'Conectado', aguardando_qr: 'Aguardando QR Code', desconectado: 'Desconectado' };
      badge.className = 'status-badge status-' + dados.estado;
      badge.innerHTML = '<span class="dot"></span>' + (textos[dados.estado] || dados.estado);

      // Notifica mudança de estado
      if (estadoAnterior && estadoAnterior !== dados.estado) {
        if (dados.estado === 'conectado') mostrarToast('✅ Bot conectado ao WhatsApp!');
        if (dados.estado === 'aguardando_qr') mostrarToast('📱 Novo QR Code disponível!');
        if (dados.estado === 'desconectado') mostrarToast('⚠️ Bot desconectado');
      }
      estadoAnterior = dados.estado;

      // Atualiza conteúdo
      const conteudo = document.getElementById('conteudo');

      if (dados.estado === 'aguardando_qr' && dados.qr) {
        conteudo.innerHTML = \`
          <div class="qr-container">
            <img src="\${dados.qr}" alt="QR Code WhatsApp">
          </div>
          <p class="qr-hint">
            Abra o WhatsApp → toque em <strong>⋮</strong> →
            <strong>Aparelhos conectados</strong> → <strong>Conectar aparelho</strong>
            e aponte para o QR Code acima.
          </p>
        \`;
      } else if (dados.estado === 'conectado') {
        conteudo.innerHTML = \`
          <div class="placeholder">✅</div>
          <div class="info-conectado">
            <div>Status: <span class="numero">Online e ativo</span></div>
            \${dados.numero ? '<div style="margin-top:6px">Número: <span class="numero">+' + dados.numero + '</span></div>' : ''}
          </div>
        \`;
      } else {
        conteudo.innerHTML = \`
          <div class="placeholder">📵</div>
          <p class="qr-hint">Bot desconectado.<br>Clique em <strong>Reconectar</strong> para gerar um novo QR Code.</p>
        \`;
      }

      // Botões
      document.getElementById('btn-reconectar').disabled = dados.estado === 'aguardando_qr';
      document.getElementById('btn-desconectar').disabled = dados.estado === 'desconectado';

    } catch (e) {
      console.error('Erro ao atualizar painel:', e);
    }
  }

  async function reconectar() {
    document.getElementById('btn-reconectar').disabled = true;
    mostrarToast('🔄 Iniciando reconexão...');
    try {
      await fetch('/api/reconectar', { method: 'POST' });
      setTimeout(atualizarPainel, 1500);
    } catch(e) {
      mostrarToast('Erro ao reconectar');
    }
  }

  async function desconectar() {
    if (!confirm('Tem certeza? Isso encerrará a sessão do WhatsApp e precisará escanear o QR Code novamente.')) return;
    mostrarToast('⏏️ Desconectando...');
    try {
      await fetch('/api/desconectar', { method: 'POST' });
      setTimeout(atualizarPainel, 1500);
    } catch(e) {
      mostrarToast('Erro ao desconectar');
    }
  }

  // Inicia e agenda atualizações
  atualizarPainel();
  setInterval(atualizarPainel, 3000);
</script>
</body>
</html>`;

function iniciarServidorWeb() {
  const PORT = process.env.PORT || 3000;

  const server = createServer(async (req, res) => {
    const url = new URL(req.url, `http://localhost`);

    // API — status atual
    if (url.pathname === "/api/status") {
      res.writeHead(200, { "Content-Type": "application/json" });
      return res.end(
        JSON.stringify({
          estado: estadoConexao,
          qr: qrCodeBase64,
          numero: numeroConectado,
        })
      );
    }

    // API — reconectar (gera novo QR sem apagar sessão)
    if (url.pathname === "/api/reconectar" && req.method === "POST") {
      console.log("🔄 Reconexão solicitada via painel web...");
      await reconectar();
      res.writeHead(200, { "Content-Type": "application/json" });
      return res.end(JSON.stringify({ ok: true }));
    }

    // API — desconectar e apagar sessão
    if (url.pathname === "/api/desconectar" && req.method === "POST") {
      console.log("⏏️  Desconexão solicitada via painel web...");
      await encerrarSessao();
      res.writeHead(200, { "Content-Type": "application/json" });
      return res.end(JSON.stringify({ ok: true }));
    }

    // Painel principal
    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
    res.end(painelHTML);
  });

  server.listen(PORT, () => {
    console.log(`\n🌐 Painel web disponível em: http://localhost:${PORT}`);
    console.log(`   Acesse para ver o QR Code e controlar o bot.\n`);
  });
}

// ── Desconectar e limpar sessão ───────────────────────────
async function encerrarSessao() {
  try {
    if (sockAtual) {
      await sockAtual.logout().catch(() => {});
      sockAtual = null;
    }
  } catch (_) {}

  // Apaga pasta de auth para forçar novo QR
  if (existsSync("./data/auth")) {
    rmSync("./data/auth", { recursive: true, force: true });
  }

  estadoConexao = "desconectado";
  qrCodeAtual = null;
  qrCodeBase64 = null;
  numeroConectado = null;

  console.log("🗑️  Sessão encerrada. Reconectando para gerar novo QR Code...");
  setTimeout(conectar, 1000);
}

// ── Reconectar (tenta sem apagar sessão primeiro) ─────────
async function reconectar() {
  try {
    if (sockAtual) {
      sockAtual.end();
      sockAtual = null;
    }
  } catch (_) {}

  estadoConexao = "desconectado";
  qrCodeAtual = null;
  qrCodeBase64 = null;

  setTimeout(conectar, 500);
}

// ── Conexão principal ─────────────────────────────────────
async function conectar() {
  try {
    const { state, saveCreds } = await useMultiFileAuthState("./data/auth");
    const { version } = await fetchLatestBaileysVersion();

    const sock = makeWASocket({
      version,
      auth: state,
      logger,
      printQRInTerminal: false,
      browser: ["WhatsApp Bot", "Chrome", "1.0.0"],
    });

    sockAtual = sock;

    // ── Eventos de conexão ──────────────────────────────
    sock.ev.on("connection.update", async ({ connection, lastDisconnect, qr }) => {
      // Novo QR Code disponível
      if (qr) {
        estadoConexao = "aguardando_qr";
        qrCodeAtual = qr;

        // Gera versão base64 para o painel web
        try {
          qrCodeBase64 = await QRCode.toDataURL(qr, { width: 280, margin: 2 });
        } catch (_) {}

        // Também mostra no terminal
        console.clear();
        console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
        console.log("  📱 ESCANEIE O QR CODE:");
        console.log("  • No terminal abaixo, OU");
        console.log("  • No painel web (http://localhost:3000)");
        console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
        qrcode.generate(qr, { small: true });
      }

      // Conexão encerrada
      if (connection === "close") {
        const code = new Boom(lastDisconnect?.error)?.output?.statusCode;
        estadoConexao = "desconectado";
        qrCodeBase64 = null;
        sockAtual = null;

        console.log(`\n⚠️  Conexão encerrada (código ${code})`);

        if (code === DisconnectReason.loggedOut) {
          // Sessão expirou — apaga auth e gera novo QR automaticamente
          console.log("🔄 Sessão expirada. Limpando dados e gerando novo QR Code...");
          if (existsSync("./data/auth")) {
            rmSync("./data/auth", { recursive: true, force: true });
          }
          setTimeout(conectar, 2000);
        } else if (code === DisconnectReason.connectionClosed ||
                   code === DisconnectReason.connectionLost ||
                   code === DisconnectReason.timedOut ||
                   code === 428 || code === 408) {
          // Queda de conexão — reconecta automaticamente
          console.log("🔄 Reconectando em 3 segundos...");
          setTimeout(conectar, 3000);
        } else {
          // Outros erros — tenta reconectar após 5s
          console.log(`🔄 Tentando reconectar em 5 segundos...`);
          setTimeout(conectar, 5000);
        }
      }

      // Conectado com sucesso
      if (connection === "open") {
        estadoConexao = "conectado";
        qrCodeAtual = null;
        qrCodeBase64 = null;
        numeroConectado = sock.user?.id?.replace(/:.*@/, "@").replace("@s.whatsapp.net", "") ?? null;

        console.clear();
        console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
        console.log("  ✅ BOT CONECTADO AO WHATSAPP!");
        if (numeroConectado) console.log(`  📞 Número: +${numeroConectado}`);
        console.log("  Aguardando mensagens...");
        console.log("  🌐 Painel: http://localhost:3000");
        console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

        iniciarLembretes(sock);
      }
    });

    sock.ev.on("creds.update", saveCreds);

    // ── Recebe mensagens ──────────────────────────────────
    sock.ev.on("messages.upsert", async ({ messages, type }) => {
      if (type !== "notify") return;

      for (const msg of messages) {
        if (msg.key.fromMe) continue;
        if (msg.key.remoteJid?.endsWith("@g.us")) continue;
        if (msg.key.remoteJid === "status@broadcast") continue;

        const numero = msg.key.remoteJid.replace("@s.whatsapp.net", "");
        const texto =
          msg.message?.conversation ||
          msg.message?.extendedTextMessage?.text ||
          msg.message?.buttonsResponseMessage?.selectedDisplayText ||
          msg.message?.listResponseMessage?.title ||
          "";

        if (!texto) continue;

        console.log(`📨 [${new Date().toLocaleTimeString("pt-BR")}] ${numero}: ${texto}`);

        const enviar = async (resposta) => {
          await sock.sendMessage(msg.key.remoteJid, { text: resposta });
          console.log(`📤 Resposta enviada para ${numero}`);
        };

        try {
          await sock.sendPresenceUpdate("composing", msg.key.remoteJid);
          await new Promise((r) => setTimeout(r, 800));
          await processarMensagem(numero, texto, enviar);
          await sock.sendPresenceUpdate("paused", msg.key.remoteJid);
        } catch (err) {
          console.error("Erro ao processar mensagem:", err);
          await enviar("Ops! Ocorreu um erro. Tente novamente ou digite *atendente*. 🙏");
        }
      }
    });
  } catch (err) {
    console.error("Erro ao conectar:", err);
    console.log("🔄 Tentando novamente em 5 segundos...");
    setTimeout(conectar, 5000);
  }
}

// ── Inicializa ────────────────────────────────────────────
iniciarServidorWeb();
conectar();
