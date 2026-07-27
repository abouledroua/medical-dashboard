import http from 'http';

function post(path, body) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify(body);
    const req = http.request(`http://localhost:3001${path}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload)
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, body: JSON.parse(data) }));
    });

    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

async function testLogin() {
  console.log('Testing admin login:');
  const adminRes = await post('/api/login', { username: 'admin', password: 'admin' });
  console.log('Admin response:', adminRes);

  console.log('\nTesting rec login:');
  const recRes = await post('/api/login', { username: 'rec', password: '1234' });
  console.log('Rec response:', recRes);

  console.log('\nTesting citrus login:');
  const citrusRes = await post('/api/login', { username: 'citrus', password: 'citrus21012013' });
  console.log('Citrus response:', citrusRes);

  console.log('\nTesting invalid login:');
  const invalidRes = await post('/api/login', { username: 'wrong', password: 'wrong' });
  console.log('Invalid response:', invalidRes);
}

testLogin();
