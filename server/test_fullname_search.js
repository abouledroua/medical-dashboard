import http from 'http';

function get(path) {
  return new Promise((resolve, reject) => {
    http.get(`http://localhost:3001${path}`, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(JSON.parse(data)));
    }).on('error', reject);
  });
}

async function testFullNameSearch() {
  try {
    console.log('Testing full name search "BOUAZIZ SIDRET ELMOUNTAHA":');
    const res1 = await get('/api/patients?search=BOUAZIZ%20SIDRET%20ELMOUNTAHA');
    console.log(`Found ${res1.length} matches:`, res1.map(p => `${p.lastName} ${p.firstName} (${p.id})`));

    console.log('\nTesting full name search "SIDRET ELMOUNTAHA BOUAZIZ":');
    const res2 = await get('/api/patients?search=SIDRET%20ELMOUNTAHA%20BOUAZIZ');
    console.log(`Found ${res2.length} matches:`, res2.map(p => `${p.lastName} ${p.firstName} (${p.id})`));
  } catch (err) {
    console.error('Test error:', err);
  }
}

testFullNameSearch();
