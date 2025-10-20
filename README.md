# DeliveryFlow

>Sistema de entregas com integração WhatsApp, painel admin, painel cliente e API backend.

## Instalação Rápida

```bash
# Clone o projeto
 git clone https://github.com/CauaCurvelo/DeliveryFlow.git
 cd DeliveryFlow

# Instale dependências
 npm install

# Configure o banco (opcional)
 cd api
 echo MONGODB_URI=mongodb://localhost:27017/deliveryflow > .env
 echo PORT=3000 >> .env

# Inicie os serviços
 cd ..
 npm run dev:all
```

- Painel Admin: http://localhost:5173
- Painel Cliente: http://localhost:5174
- API: http://localhost:3000

## Conectar WhatsApp
Abra o Painel Admin e escaneie o QR Code com o WhatsApp.

## Problemas comuns
- Sem MongoDB? O sistema roda em modo memória (dados temporários).
- WhatsApp não conecta? Rode:
  ```bash
  cd api
  npm run clear-session
  npm start
  ```

## Scripts úteis
- `npm run dev:all` — Inicia tudo
- `npm run dev:api` — Só API
- `npm run dev:admin` — Só painel admin
- `npm run dev:cliente` — Só painel cliente

---
Feito por [CauaCurvelo](https://github.com/CauaCurvelo)
