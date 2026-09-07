import { createHash } from "node:crypto";

// O refresh token vai cru só pro cookie do cliente; no banco fica o hash.
// Sem isso, quem lê a tabela (backup, acesso indevido) tem sessão válida por
// 7 dias em qualquer conta sem saber senha nenhuma. SHA-256 basta: o token já
// tem 64 bytes aleatórios, não precisa de salt/argon (não é senha fraca).
export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}
