import mysql from 'mysql2/promise';

async function checkConsultation() {
  const connection = await mysql.createConnection({
    host: '127.0.0.1',
    user: 'citrus',
    password: 'citrus21012013',
    database: 'docteur4'
  });

  const [cols] = await connection.query('DESCRIBE `consultation`');
  console.log('consultation table structure:');
  console.log(cols.map(c => `${c.Field} (${c.Type})`).join('\n'));

  const [sample] = await connection.query('SELECT * FROM `consultation` LIMIT 3');
  console.log('\nSample consultation:', sample);

  await connection.end();
}

checkConsultation();
