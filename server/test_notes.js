import mysql from 'mysql2/promise';

async function checkDetails() {
  const connection = await mysql.createConnection({
    host: '127.0.0.1',
    user: 'citrus',
    password: 'citrus21012013',
    database: 'docteur4'
  });

  for (const table of ['motifs_consult', 'obs_malade', 'diag_malade']) {
    const [cols] = await connection.query(`DESCRIBE \`${table}\``);
    console.log(`\n${table} table structure:`);
    console.log(cols.map(c => `${c.Field} (${c.Type})`).join(', '));
    const [sample] = await connection.query(`SELECT * FROM \`${table}\` LIMIT 2`);
    console.log(`Sample in ${table}:`, sample);
  }

  await connection.end();
}

checkDetails();
