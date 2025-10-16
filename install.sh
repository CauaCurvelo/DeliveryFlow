#!/bin/bash

# 🚀 Script de Instalação - DeliveryFlow

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🍕 DeliveryFlow - Instalação Automática"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Verificar Node.js
echo "📦 Verificando Node.js..."
if ! command -v node &> /dev/null
then
    echo "❌ Node.js não encontrado!"
    echo "   Instale Node.js: https://nodejs.org/"
    exit 1
fi

NODE_VERSION=$(node -v)
echo "✅ Node.js encontrado: $NODE_VERSION"
echo ""

# Verificar npm
echo "📦 Verificando npm..."
if ! command -v npm &> /dev/null
then
    echo "❌ npm não encontrado!"
    exit 1
fi

NPM_VERSION=$(npm -v)
echo "✅ npm encontrado: $NPM_VERSION"
echo ""

# Instalar dependências do backend
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📦 Instalando dependências do BACKEND..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
cd backend
npm install
if [ $? -eq 0 ]; then
    echo "✅ Dependências do backend instaladas!"
else
    echo "❌ Erro ao instalar dependências do backend"
    exit 1
fi
cd ..
echo ""

# Instalar dependências do frontend
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📦 Instalando dependências do FRONTEND..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
npm install
if [ $? -eq 0 ]; then
    echo "✅ Dependências do frontend instaladas!"
else
    echo "❌ Erro ao instalar dependências do frontend"
    exit 1
fi
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🎉 INSTALAÇÃO CONCLUÍDA COM SUCESSO!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "🚀 Para iniciar o sistema:"
echo ""
echo "   1. Backend:"
echo "      cd backend"
echo "      npm start"
echo ""
echo "   2. Frontend (em outro terminal):"
echo "      npm run dev"
echo ""
echo "   3. Acesse: http://localhost:5173"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📱 Para conectar WhatsApp:"
echo "   - Aguarde o QR Code aparecer no terminal do backend"
echo "   - Escaneie com seu WhatsApp"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
