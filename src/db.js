import fs from "fs";

const DB_FILE = "./data/db.json";

function load() {
  if (!fs.existsSync("./data")) fs.mkdirSync("./data");
  if (!fs.existsSync(DB_FILE)) fs.writeFileSync(DB_FILE, JSON.stringify({ agendamentos: [], clientes: {} }));
  return JSON.parse(fs.readFileSync(DB_FILE, "utf-8"));
}

function save(db) {
  fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
}

// ── Clientes ──────────────────────────────────────────────

export function getCliente(numero) {
  const db = load();
  return db.clientes[numero] || null;
}

export function salvarCliente(numero, dados) {
  const db = load();
  db.clientes[numero] = { ...db.clientes[numero], ...dados, numero, updatedAt: new Date().toISOString() };
  save(db);
}

export function getEstado(numero) {
  const c = getCliente(numero);
  return c?.estado || "inicio";
}

export function setEstado(numero, estado, extra = {}) {
  salvarCliente(numero, { estado, ...extra });
}

// ── Agendamentos ──────────────────────────────────────────

export function criarAgendamento(dados) {
  const db = load();
  const ag = { id: Date.now(), ...dados, criadoEm: new Date().toISOString(), status: "confirmado" };
  db.agendamentos.push(ag);
  save(db);
  return ag;
}

export function getAgendamentos(numero) {
  const db = load();
  return db.agendamentos.filter(a => a.numero === numero && a.status !== "cancelado");
}

export function cancelarAgendamento(id) {
  const db = load();
  const ag = db.agendamentos.find(a => a.id === Number(id));
  if (ag) { ag.status = "cancelado"; save(db); }
  return ag;
}

export function todosAgendamentos() {
  return load().agendamentos;
}
