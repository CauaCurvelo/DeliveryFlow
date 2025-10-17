# DeliveryFlow

## Instalação e uso rápido

1. **Clone o repositório:**
```bash
git clone https://github.com/CauaCurvelo/DeliveryFlow.git
```

2. **Instale as dependências em cada pasta:**
```bash
cd api
npm install

cd ../painel-admin
npm install

cd ../painel-cliente
npm install
```

3. **Configuração do banco de dados:**
- O backend precisa de um banco MongoDB para funcionar.
- Você pode:
	- Rodar o MongoDB localmente (recomendado para desenvolvimento), **OU**
	- Usar um serviço de MongoDB na nuvem (ex: Atlas, Render, etc).
- No arquivo `.env` da pasta `api`, configure a variável `MONGODB_URI` com a string de conexão do seu banco.
	- Exemplo para local: `MONGODB_URI=mongodb://localhost:27017/deliveryflow`
	- Exemplo para Atlas: `MONGODB_URI=mongodb+srv://<usuario>:<senha>@<cluster>.mongodb.net/deliveryflow`

4. **Rodando o backend:**
```bash
cd api
npm start
```

5. **Rodando painel admin/cliente:**
```bash
cd painel-admin
npm run dev

cd painel-cliente
npm run dev
```

## Comandos WhatsApp (API)

- `npm run clear-session` — Limpa a sessão do WhatsApp (use se der erro de autenticação)
- `npm run fresh-start` — Limpa a sessão e já inicia o backend
- `npm run fix-whatsapp` — Limpeza total: remove sessão, cache, desinstala e reinstala o pacote do WhatsApp. Use se o QR Code não conectar ou ficar travado em "sincronizando".

> Se o WhatsApp não conectar: rode `npm run fix-whatsapp` na pasta `api` e depois `npm start` novamente.

---
