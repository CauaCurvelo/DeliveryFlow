# DeliveryFlow

## Instalação e uso rápido

1. **Clone o repositório:**
```bash
git clone https://github.com/CauaCurvelo/DeliveryFlow.git
```

2. **Instale as dependências:**
```bash
npm install
cd api
npm install
cd ..
```

3. **Configuração do banco de dados:**
- Certifique-se de ter o MongoDB rodando localmente ou configure a string de conexão no arquivo `.env` da pasta `api`.

4. **Rodando o backend:**
```bash
cd api
npm start
```

5. **Rodando painel admin/cliente:**
```bash
cd painel-admin
npm install
npm run dev

cd painel-cliente
npm install
npm run dev
```

## Comandos WhatsApp (API)

- `npm run clear-session` — Limpa a sessão do WhatsApp (use se der erro de autenticação)
- `npm run fresh-start` — Limpa a sessão e já inicia o backend
- `npm run fix-whatsapp` — Limpeza total: remove sessão, cache, desinstala e reinstala o pacote do WhatsApp. Use se o QR Code não conectar ou ficar travado em "sincronizando".

> Se o WhatsApp não conectar: rode `npm run fix-whatsapp` na pasta `api` e depois `npm start` novamente.

---