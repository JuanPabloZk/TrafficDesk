#!/bin/bash
# ═══════════════════════════════════════════
# TrafficDesk — Deploy para Hostinger
# Execute: bash deploy.sh
# ═══════════════════════════════════════════

echo "🔨 Fazendo build..."
npm run build

echo "📁 Criando pasta hostinger-deploy..."
rm -rf hostinger-deploy
mkdir hostinger-deploy

echo "📦 Copiando arquivos da dist..."
cp -r dist/. hostinger-deploy/

echo "📄 Criando .htaccess..."
cat > hostinger-deploy/.htaccess << 'EOF'
Options -MultiViews
RewriteEngine On
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^ index.html [QSA,L]
EOF

echo ""
echo "✅ Pronto! A pasta 'hostinger-deploy' contém tudo que você precisa."
echo ""
echo "👉 Próximo passo:"
echo "   Faça upload do CONTEÚDO da pasta 'hostinger-deploy' para o public_html"
echo "   (ou para public_html/app se quiser em subpasta)"
echo ""
