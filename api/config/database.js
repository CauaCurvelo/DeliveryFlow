const mongoose = require('mongoose');

let mongoConnected = false;

async function connectMongo(mongoUri = 'mongodb://localhost:27017/deliveryflow') {
  try {
    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 5000
    });
    console.log('✅ MongoDB conectado');
    mongoConnected = true;
  } catch (err) {
    console.log('⚠️  MongoDB não disponível, usando memória RAM');
    mongoConnected = false;
  }
  return mongoConnected;
}

function isMongoConnected() {
  return mongoConnected;
}

module.exports = {
  mongoose,
  connectMongo,
  isMongoConnected
};
