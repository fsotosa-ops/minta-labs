/**
 * minta-labs · Entregables
 *
 * La capa que le faltaba al IDE: el análisis ya vive aquí, y ahora el
 * entregable también. Un interruptor decide a quién le hablas —academia o
 * negocio— y los comandos llaman al motor de Python, que es donde vive todo
 * lo que ya estaba construido y probado.
 */
const vscode = require("vscode");
const path = require("path");
const { Entregables } = require("./entregables");
const { describir } = require("./proyecto");
const slides = require("./slides");

function ajustes() {
  return vscode.workspace.getConfiguration("mintaLabs");
}

function terminal() {
  const existente = vscode.window.terminals.find((t) => t.name === "minta-labs");
  return existente || vscode.window.createTerminal("minta-labs");
}

async function cambiarAudiencia() {
  const cfg = ajustes();
  const actual = cfg.get("audiencia");
  const nueva = actual === "academia" ? "negocio" : "academia";
  await cfg.update("audiencia", nueva, vscode.ConfigurationTarget.Workspace);
  vscode.window.setStatusBarMessage(
    nueva === "academia"
      ? "minta-labs · construyendo para academia (PDF con citas)"
      : "minta-labs · construyendo para negocio (deck editable)",
    4000
  );
}

function construir() {
  const p = describir();
  if (!p.ok) {
    vscode.window.showErrorMessage(p.motivo);
    return;
  }
  const audiencia = ajustes().get("audiencia");
  const python = ajustes().get("python") || "uv run";
  const t = terminal();
  t.show(true);

  if (audiencia === "academia") {
    t.sendText(
      `${python} minta-labs render "${p.academico}" --salida "${p.entrega}"`
    );
  } else {
    t.sendText(`${python} python "${p.negocio}"`);
  }
}

function abrirTema() {
  const t = terminal();
  t.show(true);
  t.sendText(`${ajustes().get("python") || "uv run"} minta-labs theme`);
}

function activate(contexto) {
  const arbol = new Entregables();
  contexto.subscriptions.push(
    vscode.window.registerTreeDataProvider("mintaLabs.entregables", arbol),
    vscode.commands.registerCommand("mintaLabs.cambiarAudiencia", async () => {
      await cambiarAudiencia();
      arbol.refrescar();
    }),
    vscode.commands.registerCommand("mintaLabs.construir", construir),
    vscode.commands.registerCommand("mintaLabs.abrirSlides", () => slides.abrir(contexto)),
    vscode.commands.registerCommand("mintaLabs.abrirTema", abrirTema),
    vscode.commands.registerCommand("mintaLabs.refrescar", () => arbol.refrescar()),
    vscode.workspace.onDidChangeConfiguration((e) => {
      if (e.affectsConfiguration("mintaLabs")) arbol.refrescar();
    })
  );
}

function deactivate() {}

module.exports = { activate, deactivate };
