import "dotenv/config";
import app from "./app.js";

if (!process.env.JWT_SECRET) {
  console.error("Critical: JWT_SECRET not defined");
  process.exit(1);
}
const PORT = process.env.PORT || 3333;

app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});
