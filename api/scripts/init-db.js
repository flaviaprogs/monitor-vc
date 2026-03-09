// Opcional: cria arquivo vazio de banco, se não existir.
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dataDir = path.join(__dirname, "..", "data");
const dbFile = path.join(dataDir, "painel.sqlite");

if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

if (!fs.existsSync(dbFile)) {
  fs.writeFileSync(dbFile, Buffer.from([]));
  console.log("Banco criado vazio em:", dbFile);
} else {
  console.log("Banco já existe:", dbFile);
}
