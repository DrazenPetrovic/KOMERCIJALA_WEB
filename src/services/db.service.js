import mysql from 'mysql2/promise';
import { dbConfig } from '../config/db.js';
console.log('DB CONFIG:', dbConfig);

// export const getConnection = async () => {
//   return mysql.createConnection(dbConfig);
// };


export const getConnection = async () => {
  try {
    //console.log('Pokušaj konektovanja na:', dbConfig.host, dbConfig.port);
    const connection = await mysql.createConnection(dbConfig);
    //console.log('✅ Uspješna konekcija!');
    return connection;
  } catch (error) {
    console.error('❌ Greška pri konektovanju:', error.message);
    throw error;
  }
  
};


// Helper: uvijek zatvori konekciju
export const withConnection = async (fn) => {
  const connection = await getConnection();
  try {
    return await fn(connection);
  } finally {
    await connection.end();
  }
};