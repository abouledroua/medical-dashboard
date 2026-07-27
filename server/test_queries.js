import mysql from 'mysql2/promise';

async function testQueries() {
  try {
    const connection = await mysql.createConnection({
      host: '127.0.0.1',
      user: 'citrus',
      password: 'citrus21012013',
      database: 'docteur4'
    });

    console.log('Testing stats query:');
    const [totPat] = await connection.query('SELECT COUNT(*) as total FROM malade');
    const [totRdv] = await connection.query('SELECT COUNT(*) as total FROM rdv');
    console.log(`Total Patients: ${totPat[0].total}, Total Appointments: ${totRdv[0].total}`);

    console.log('\nTesting patients query (limit 5):');
    const [patients] = await connection.query(`
      SELECT 
        CODE_BARRE, CODE_MALADE, NOM, PRENOM, DATE_NAISSANCE, AGE, TEL, EMAIL, SEXE, DIAGNOSTIQUE, GS
      FROM malade 
      ORDER BY CODE_BARRE DESC 
      LIMIT 5
    `);
    console.log('Patients sample:', patients);

    console.log('\nTesting RDV query joined with malade (limit 5):');
    const [rdvs] = await connection.query(`
      SELECT 
        r.ID_RDV, r.ID_MALADE, r.DATE_RDV, r.HEURE_RDV, r.HEURE_ARRIVEE, r.ETAT_RDV,
        m.NOM, m.PRENOM, m.CODE_BARRE
      FROM rdv r
      LEFT JOIN malade m ON (r.ID_MALADE = m.CODE_MALADE OR r.ID_MALADE = m.CODE_BARRE)
      ORDER BY r.ID_RDV DESC
      LIMIT 5
    `);
    console.log('RDVs sample:', rdvs);

    await connection.end();
  } catch (err) {
    console.error('Query test failed:', err);
  }
}

testQueries();
