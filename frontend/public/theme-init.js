// Roda antes do primeiro paint para evitar flash de tema errado.
// Arquivo externo (não inline) porque o CSP do helmet em produção
// bloqueia <script> inline (script-src 'self').
(function () {
  var saved = localStorage.getItem("theme");
  var preferDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  var theme = saved || (preferDark ? "dark" : "light");

  if (theme === "dark") {
    document.documentElement.classList.add("dark");
  }
})();
