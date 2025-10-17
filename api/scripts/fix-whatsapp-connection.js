const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔧 SCRIPT DE CORREÇÃO COMPLETA DO WHATSAPP');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

// Passo 1: Limpar sessão do WhatsApp
console.log('1️⃣ Limpando sessão do WhatsApp...');
const authPath = path.join(__dirname, '..', '.wwebjs_auth');
const cachePath = path.join(__dirname, '..', '.wwebjs_cache');

try {
  if (fs.existsSync(authPath)) {
    fs.rmSync(authPath, { recursive: true, force: true });
    console.log('   ✅ Pasta .wwebjs_auth removida');
  }
  if (fs.existsSync(cachePath)) {
    fs.rmSync(cachePath, { recursive: true, force: true });
    console.log('   ✅ Pasta .wwebjs_cache removida');
  }
} catch (error) {
  console.warn('   ⚠️ Erro ao limpar pastas:', error.message);
}

// Passo 2: Limpar cache do npm
console.log('\n2️⃣ Limpando cache do npm...');
try {
  execSync('npm cache clean --force', { stdio: 'inherit' });
  console.log('   ✅ Cache do npm limpo');
} catch (error) {
  console.warn('   ⚠️ Erro ao limpar cache npm:', error.message);
}

// Passo 3: Desinstalar whatsapp-web.js
console.log('\n3️⃣ Desinstalando whatsapp-web.js...');
try {
  execSync('npm uninstall whatsapp-web.js qrcode-terminal', { stdio: 'inherit' });
  console.log('   ✅ Pacotes desinstalados');
} catch (error) {
  console.warn('   ⚠️ Erro ao desinstalar:', error.message);
}

// Passo 4: Reinstalar whatsapp-web.js
console.log('\n4️⃣ Reinstalando whatsapp-web.js...');
try {
  execSync('npm install whatsapp-web.js@latest qrcode-terminal@latest', { stdio: 'inherit' });
  console.log('   ✅ Pacotes reinstalados');
} catch (error) {
  console.error('   ❌ Erro ao reinstalar:', error.message);
  process.exit(1);
}

console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('✅ CORREÇÃO COMPLETA FINALIZADA!');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('\n💡 Agora você pode rodar: npm start');
console.log('   O WhatsApp deve conectar normalmente!\n');
