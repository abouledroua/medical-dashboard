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

async function runTests() {
  try {
    const stats = await get('/api/stats');
    console.log('API /api/stats response:', stats);

    const patients = await get('/api/patients?limit=3');
    console.log(`API /api/patients returned ${patients.length} patients:`, patients[0]);

    const appointments = await get('/api/appointments');
    console.log(`API /api/appointments returned ${appointments.length} appointments:`, appointments[0]);
  } catch (err) {
    console.error('API Test error:', err);
  }
}

runTests();
