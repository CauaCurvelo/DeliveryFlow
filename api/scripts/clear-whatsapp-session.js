const fs = require('fs');
const path = require('path');

const authPath = path.join(__dirname, '..', '.wwebjs_auth');

console.log('🧹 Limpando sessão do WhatsApp...');
console.log(`📁 Pasta: ${authPath}`);

try {
  if (fs.existsSync(authPath)) {
    const files = fs.readdirSync(authPath);
    
    if (files.length === 0) {
      console.log('✅ Pasta já está vazia');
      process.exit(0);
    }
    
    console.log(`📂 Encontrados ${files.length} arquivo(s)/pasta(s)`);
    
    for (const file of files) {
      const filePath = path.join(authPath, file);
      const stat = fs.statSync(filePath);
      
      if (stat.isDirectory()) {
        console.log(`🗑️  Removendo pasta: ${file}`);
        fs.rmSync(filePath, { recursive: true, force: true });
      } else {
        console.log(`🗑️  Removendo arquivo: ${file}`);
        fs.unlinkSync(filePath);
      }
    }
    
    console.log('✅ Sessão limpa com sucesso!');
    console.log('💡 Execute "npm start" para iniciar o servidor com uma nova sessão');
  } else {
    console.log('ℹ️  Pasta de autenticação não existe ainda');
    console.log('💡 Isso é normal se for a primeira vez que você está rodando o servidor');
  }
} catch (error) {
  console.error('❌ Erro ao limpar sessão:', error.message);
  process.exit(1);
}
