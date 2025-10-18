# DeliveryFlow

Sistema de gerenciamento de entregas com integração WhatsApp. Inclui painel administrativo, painel do cliente e API backend.

## Quick Start

### 1. Instalação
```bash
git clone https://github.com/CauaCurvelo/DeliveryFlow.git
npm install  # ou instale manualmente: api, painel-admin, painel-cliente
```

### 2. Banco de dados
Configure MongoDB no arquivo `.env` da pasta `api`:
```
MONGODB_URI=mongodb://localhost:27017/deliveryflow
```
Alternativas: MongoDB Atlas, Render, etc.

### 3. Iniciar
```bash
# Terminal 1 (Backend)
cd api && npm start

# Terminal 2 (Painel Admin)
cd painel-admin && npm run dev

# Terminal 3 (Painel Cliente)
cd painel-cliente && npm run dev
```

Acesse:
- **Painel Admin**: http://localhost:5173
- **Painel Cliente**: http://localhost:5174
- **API**: http://localhost:3000

## Problemas com WhatsApp
Na pasta `api`:
- `npm run fix-whatsapp` — Se QR code não conectar
- `npm run clear-session` — Se der erro de autenticação
- `npm run fresh-start` — Limpa e inicia o backend
