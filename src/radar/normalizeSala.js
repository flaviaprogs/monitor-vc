export function normalizeSala(sala = "") {
  return sala
    .toUpperCase()
    .trim()
    .replace(/\s+/g, " ");
}
