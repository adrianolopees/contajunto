-- A partir desta versão o backend grava só o SHA-256 do refresh token. As
-- linhas existentes estão em texto puro e nunca mais casariam com uma busca
-- por hash — mas ficariam expostas no banco até expirar (7 dias). Apagar agora
-- fecha a janela; o único efeito pro usuário é logar de novo uma vez.
DELETE FROM "RefreshToken";
