import mysql from "mysql2/promise";

const pool = mysql.createPool({
  host: process.env.DB_HOST || "127.0.0.1",
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD ?? "root",
  database: process.env.DB_NAME || "db_etecscore",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

export async function testarConexao() {
  try {
    const conn = await pool.getConnection();
    await conn.ping();
    console.log("Conexão com o MySQL bem-sucedida!");
    conn.release();
    return true;
  } catch (erro) {
    console.error("Falha ao conectar com o MySQL:", erro.message);
    return false;
  }
}

export default pool;
