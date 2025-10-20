# DeliveryFlow

>Sistema completo para gestão de entregas com integração WhatsApp, painel administrativo, painel do cliente e API backend.

## 🚀 Instalação Rápida

```bash
# Clone o projeto
git clone https://github.com/CauaCurvelo/DeliveryFlow.git
cd DeliveryFlow

# Instale dependências
npm install
```

### ⚠️ IMPORTANTE: Inicie os serviços nesta ordem

**1. Terminal 1 - API (INICIAR PRIMEIRO):**
```bash
cd api
npm start
```
⏳ **Aguarde a mensagem "Backend rodando em http://localhost:3000"**

**2. Terminal 2 - Painel Admin:**
```bash
cd painel-admin
npm run dev
```

**3. Terminal 3 - Painel Cliente:**
```bash
cd painel-cliente
npm run dev
```

**Acesse:**
- Painel Admin: http://localhost:5173
- Painel Cliente: http://localhost:5174
- API: http://localhost:3000

## 📱 Conectar WhatsApp
Abra o Painel Admin e escaneie o QR Code que aparece na tela.

## 🗂️ Banco de Dados
- Sem MongoDB? O sistema roda em modo memória (dados temporários).
- Para MongoDB na nuvem, use [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) grátis e configure o `.env` na pasta `api/`.

## 🐛 Problemas comuns
WhatsApp não conecta? Rode:
```bash
cd api
npm run clear-session
npm start
```

---
Feito por [CauaCurvelo](https://github.com/CauaCurvelo)
