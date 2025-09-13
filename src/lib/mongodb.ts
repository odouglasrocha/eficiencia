import mongoose from 'mongoose';

const MONGODB_URI = 'mongodb+srv://orlanddouglas_db_user:TqtwMu2HTPBszmv7@banco.asm5oa1.mongodb.net/?retryWrites=true&w=majority&appName=Banco';

if (!MONGODB_URI) {
  throw new Error('Por favor, defina a variável MONGODB_URI no arquivo .env');
}

/**
 * Global é usado aqui para manter uma instância em cache da conexão do MongoDB
 * através de hot reloads em desenvolvimento. Isso previne conexões sendo criadas
 * a cada mudança de arquivo.
 */
let cached = (global as any).mongoose;

if (!cached) {
  cached = (global as any).mongoose = { conn: null, promise: null };
}

async function connectDB() {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
    };

    cached.promise = mongoose.connect(MONGODB_URI, opts).then((mongoose) => {
      console.log('✅ Conectado ao MongoDB Atlas');
      return mongoose;
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    console.error('❌ Erro ao conectar ao MongoDB:', e);
    throw e;
  }

  return cached.conn;
}

export default connectDB;