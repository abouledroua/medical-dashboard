import mysql from 'mysql2/promise';

async function inspectKeyTables() {
  try {
    const connection = await mysql.createConnection({
      host: '127.0.0.1',
      user: 'citrus',
      password: 'citrus21012013',
      database: 'docteur4'
    });

    const targetTables = ['malade', 'rdv', 'users', 'parametre', 'antecedent', 'malade_antecedent'];
    const [allTables] = await connection.query('SHOW TABLES');
    const tableNames = allTables.map(t => Object.values(t)[0]);
    console.log('Total tables count:', tableNames.length);

    const consultTables = tableNames.filter(t => t.toLowerCase().includes('consult'));
    console.log('Consultation related tables:', consultTables);

    const maladeTables = tableNames.filter(t => t.toLowerCase().includes('malade'));
    console.log('Malade related tables:', maladeTables);

    for (const t of ['malade', 'rdv', 'users', 'parametre']) {
      if (tableNames.includes(t)) {
        const [cnt] = await connection.query(`SELECT COUNT(*) as count FROM \`${t}\``);
        const [cols] = await connection.query(`DESCRIBE \`${t}\``);
        console.log(`\nTable ${t} (Count: ${cnt[0].count}):`);
        console.log(cols.map(c => `${c.Field} (${c.Type})`).join(', '));

        const [sample] = await connection.query(`SELECT * FROM \`${t}\` LIMIT 2`);
        console.log(`Sample row in ${t}:`, sample);
      }
    }

    await connection.end();
  } catch (err) {
    console.error('Error inspecting:', err);
  }
}

inspectKeyTables();
