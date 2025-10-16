# WhatsApp Connection - Guia de Solução de Problemas

## 🔧 Problema: QR Code não conecta ou bot não funciona após desconectar

### Solução Rápida

Se o WhatsApp não está conectando ou o QR Code não funciona:

```bash
# 1. Pare o servidor (Ctrl+C)

# 2. Limpe a sessão antiga
npm run clear-session

# 3. Inicie o servidor novamente
npm start

# OU use o comando combinado:
npm run fresh-start
```

### O que foi corrigido?

1. **Limpeza automática de sessão corrompida**
   - Quando houver falha de autenticação, a sessão antiga é limpa automaticamente
   - Até 3 tentativas automáticas antes de desistir

2. **Timeout do QR Code**
   - QR Code expira após 60 segundos
   - Após 3 QR Codes sem escaneamento, reinicia automaticamente

3. **Reconexão automática**
   - Se desconectar, tenta reconectar automaticamente após 5 segundos
   - Limpa sessão e tenta novamente se necessário

4. **Removida restrição de número**
   - Bot agora aceita mensagens de QUALQUER número
   - Não há mais filtro por número específico

5. **Rotas API para gerenciar conexão**
   ```bash
   # Limpar sessão via API
   POST http://localhost:4000/whatsapp/clear-session
   
   # Reconectar (limpa sessão e reinicia)
   POST http://localhost:4000/whatsapp/reconnect
   
   # Verificar status
   GET http://localhost:4000/whatsapp/status
   ```

### Processo de Conexão

1. **Servidor inicia** → Gera QR Code no terminal e no painel admin
2. **Escaneie o QR Code** com seu WhatsApp (60 segundos para escanear)
3. **Autenticação** → Sessão salva em `.wwebjs_auth/`
4. **Pronto!** → Bot ativo e funcionando

### Dicas

- ✅ Use `npm run fresh-start` sempre que tiver problemas de conexão
- ✅ QR Code aparece tanto no terminal quanto no painel admin
- ✅ Você tem 60 segundos para escanear cada QR Code
- ✅ Se não conectar em 3 tentativas, use `npm run fresh-start`
- ✅ Bot agora aceita mensagens de qualquer número do WhatsApp

### Logs Importantes

Fique atento aos logs no console:
- 🔑 `QR Code #X` → QR Code gerado, escaneie agora!
- 🔒 `AUTENTICADO` → WhatsApp autenticado com sucesso
- ✅ `CONECTADO e PRONTO` → Tudo funcionando!
- ❌ `FALHA na autenticação` → Limpando sessão automaticamente...
- 🔄 `Tentando reconectar` → Reconexão automática em progresso

### Estrutura de Arquivos

```
api/
├── .wwebjs_auth/          # Sessão do WhatsApp (auto-gerado)
├── scripts/
│   └── clear-whatsapp-session.js  # Script de limpeza
├── services/
│   └── whatsappService.js  # Serviço melhorado
└── package.json           # Scripts: clear-session, fresh-start
```

### Se ainda não funcionar

1. Delete manualmente a pasta `.wwebjs_auth`
2. Reinicie o computador
3. Tente usar uma URL de cache diferente (automático após 3 falhas)
4. Verifique se o WhatsApp no celular está atualizado
