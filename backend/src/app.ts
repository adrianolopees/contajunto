import express from 'express'
import helmet from 'helmet'
import cors from 'cors'
import cookieParser from 'cookie-parser'

const app = express()

// Segurança: adiciona headers HTTP de proteção
app.use(helmet())

// Permite requisições do frontend (porta 5173 = Vite dev server)
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true, // necessário para enviar/receber cookies
}))

// Lê o corpo das requisições como JSON
app.use(express.json())

// Lê cookies das requisições (necessário para JWT em cookie)
app.use(cookieParser())

// Rota de health check — confirma que o servidor está vivo
app.get('/health', (_req, res) => {
  res.json({ status: 'ok' })
})

export default app
