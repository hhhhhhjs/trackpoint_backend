import mysql from 'mysql2/promise';

const pool = await mysql.createPool({
    host: 'localhost',
    user: 'root',
    port: 3306,
    password: process.env.databasePassword,
    database: '埋点系统',
});

export default pool