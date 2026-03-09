// Copia o arquivo wasm do sql.js para a raiz da API,
// para o loader achar sem servidor estático extra.
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const src = path.join(__dirname, "..", "node_modules", "sql.js", "dist", "sql-wasm.wasm");
const dst = path.join(__dirname, "..", "sql-wasm.wasm");

try {
  if (!fs.existsSync(src)) {
    console.error("sql-wasm.wasm não encontrado em:", src);
    process.exit(0);
  }
  fs.copyFileSync(src, dst);
  console.log("Copiado:", src, "=>", dst);
} catch (e) {
  console.error("Falha ao copiar wasm:", e.message);
}
