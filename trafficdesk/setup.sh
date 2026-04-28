#!/bin/bash
# ─────────────────────────────────────────────
# TrafficDesk — Script de Setup Rápido
# Execute: bash setup.sh
# ─────────────────────────────────────────────

echo ""
echo "🚀 TrafficDesk — Setup"
echo "──────────────────────"

# Verifica se Node está instalado
if ! command -v node &> /dev/null; then
  echo "❌ Node.js não encontrado. Instale em: https://nodejs.org"
  exit 1
fi

# Cria .env se não existir
if [ ! -f ".env" ]; then
  cp .env.example .env
  echo "✅ Arquivo .env criado — abra e cole sua Publishable Key do Supabase"
  echo ""
  echo "   VITE_SUPABASE_URL=https://yhfehztvdbvfghxzwelb.supabase.co"
  echo "   VITE_SUPABASE_ANON_KEY=sb_publishable_..."
  echo ""
else
  echo "✅ .env já existe"
fi

# Instala dependências
echo "📦 Instalando dependências..."
npm install

echo ""
echo "✅ Tudo pronto! Rode:"
echo "   npm run dev"
echo ""
