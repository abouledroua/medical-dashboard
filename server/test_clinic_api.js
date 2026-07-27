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

async function testClinicAPI() {
  try {
    const clinicData = await get('/api/clinic');
    console.log('API /api/clinic response:', clinicData);
  } catch (err) {
    console.error('Test error:', err);
  }
}

testClinicAPI();
