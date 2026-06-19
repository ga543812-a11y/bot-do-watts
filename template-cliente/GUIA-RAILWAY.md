# 🚀 Como colocar o bot no Railway (funciona 24h)

## O que é o Railway?
É um servidor na nuvem gratuito. O bot fica rodando
lá mesmo com o computador desligado.

---

## PASSO 1 — Preparar o GitHub

1. Acesse: https://github.com
2. Clique em **"New repository"** (botão verde)
3. Nome: `bot-whatsapp` (ou qualquer nome)
4. Deixe **Privado** (Private) — segurança dos clientes
5. Clique em **"Create repository"**
6. Suba os arquivos desta pasta para lá

### Arquivos que DEVEM subir:
```
src/
  index.js
  config.js
  handlers.js
  lembretes.js
  db.js
package.json
railway.json
.gitignore
```

### Arquivos que NÃO devem subir:
```
node_modules/   ← nunca suba essa pasta
data/           ← nunca suba essa pasta
CHECKLIST-VENDEDOR.txt  ← só para você, não precisa subir
```

---

## PASSO 2 — Criar conta no Railway

1. Acesse: https://railway.app
2. Clique em **"Login"**
3. Escolha **"Login with GitHub"**
4. Autorize o acesso

---

## PASSO 3 — Criar o projeto no Railway

1. Clique em **"New Project"**
2. Escolha **"Deploy from GitHub repo"**
3. Selecione o repositório do bot
4. Clique em **"Deploy Now"**
5. Aguarde o deploy terminar (fica verde quando ok)

---

## PASSO 4 — Configurar volume para salvar a sessão

⚠️ IMPORTANTE: sem isso o bot perde a sessão toda vez que reiniciar!

1. No projeto, clique em **"Add Service"**
2. Escolha **"Volume"**
3. Em "Mount Path" coloque: `/app/data`
4. Clique em **"Add"**

---

## PASSO 5 — Pegar o link do painel web

1. Clique no serviço do bot
2. Vá em **"Settings"**
3. Em **"Networking"** clique em **"Generate Domain"**
4. Vai gerar um link tipo: `bot-whatsapp.up.railway.app`
5. Acesse esse link no navegador — é o painel do bot!

---

## PASSO 6 — Escanear o QR Code

1. Acesse o link gerado no passo 5
2. Escaneie o QR Code com o WhatsApp
3. ✅ Pronto! O bot está no ar 24h!

---

## ⚠️ Limite gratuito do Railway

- Plano gratuito: **500 horas/mês** (~20 dias)
- Para 30 dias completos: plano pago ~**U$ 5/mês** (R$ 25)
- Para cada cliente novo: crie um projeto separado no Railway

---

## 💡 Para cada cliente novo

1. Edite o `src/config.js` com os dados do cliente
2. Suba em um repositório GitHub separado
3. Crie um novo projeto no Railway
4. Configure o volume `/app/data`
5. Gere o domínio e entregue o link para o cliente

---

## 📞 Problemas?

- Bot não conecta → acesse o painel e clique em "Reconectar"
- Sessão perdida → clique em "Desconectar" e escaneie o QR de novo
- Deploy com erro → verifique se o `package.json` está correto
