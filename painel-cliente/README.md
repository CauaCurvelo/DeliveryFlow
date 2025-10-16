# DeliveryFlow - Interface do Cliente

Frontend web para clientes fazerem pedidos diretamente pelo navegador.

## Funcionalidades

- **Pedido No Local**: Selecione sua mesa (1-20) e faça pedidos direto do estabelecimento
- **Delivery**: Peça com entrega em casa
- **Retirada**: Busque no local e economize
- **Cardápio Completo**: Navegue por categorias
- **Carrinho Inteligente**: Gerencie quantidades e veja o total
- **Dados do Cliente**: Nome e WhatsApp salvos no banco de dados
- **Rastreamento**: Acompanhe seu pedido em tempo real

## Instalação

```bash
cd client
npm install
npm run dev
```

O frontend estará disponível em `http://localhost:5174`

## Integração

Este front se conecta automaticamente ao backend em `http://localhost:4000` e compartilha o mesmo banco de dados de clientes e pedidos que o painel administrativo.

Pedidos "No Local" aparecem no painel admin com o ícone de loja e o número da mesa no lugar do endereço.
