import mysql from 'mysql2/promise';

async function checkUsers() {
  const connection = await mysql.createConnection({
    host: '127.0.0.1',
    user: 'citrus',
    password: 'citrus21012013',
    database: 'docteur4'
  });

  const [users] = await connection.query('SELECT USERNAME, PASSWORD, PASS_MOB, TYPE, ID_USER, FONCTION FROM users');
  console.log('Users in DB docteur4:', users);

  await connection.end();
}

checkUsers();
