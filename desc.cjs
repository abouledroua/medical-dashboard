const mysql = require('mysql2/promise');
async function run() {
  const p = mysql.createPool({host:'127.0.0.1', user:'citrus', password:'citrus21012013', database:'docteur5'});
  const [f] = await p.query('SHOW COLUMNS FROM forme');
  const [d] = await p.query('SHOW COLUMNS FROM dosage');
  const [fm] = await p.query('SHOW COLUMNS FROM forme_medicament');
  console.log("FORME:", f);
  console.log("DOSAGE:", d);
  console.log("FORME_MEDICAMENT:", fm);
  process.exit(0);
}
run();
