import mysql from 'mysql2/promise';

async function checkParametre() {
  const connection = await mysql.createConnection({
    host: '127.0.0.1',
    user: 'citrus',
    password: 'citrus21012013',
    database: 'docteur4'
  });

  const [rows] = await connection.query('SELECT * FROM parametre LIMIT 1');
  console.log('Parametre row:', rows[0]);

  await connection.end();
}

checkParametre();
