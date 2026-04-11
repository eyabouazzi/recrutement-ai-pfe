const http = require('http');
const querystring = require('querystring');

const API_URL = 'http://localhost:3000';

function makeRequest(method, path, data) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => { body += chunk; });
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(body) });
        } catch (e) {
          resolve({ status: res.statusCode, data: body });
        }
      });
    });

    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

async function createAndLogin() {
  try {
    console.log('📝 Creating candidate account...\n');
    
    const signupData = querystring.stringify({
      firstName: 'Jean',
      lastName: 'Dupont',
      email: 'jean.dupont@example.com',
      password: 'Password123!',
      confirmPassword: 'Password123!',
      dob: '1990-05-15',
      role: 'candidat'
    });

    const signupRes = await makeRequest('POST', '/auth/signup', signupData);
    console.log('Signup Response Status:', signupRes.status);
    console.log('Signup Response:', JSON.stringify(signupRes.data, null, 2));

    if (signupRes.status !== 201) {
      console.error('❌ Signup failed!');
      return;
    }

    console.log('\n✅ Candidate account created!\n');
    console.log('🔐 Logging in...\n');

    const loginData = querystring.stringify({
      email: 'jean.dupont@example.com',
      password: 'Password123!'
    });

    const loginRes = await makeRequest('POST', '/auth/login', loginData);
    console.log('Login Response Status:', loginRes.status);
    console.log('Login Response:', JSON.stringify(loginRes.data, null, 2));

    if (loginRes.status === 200 && loginRes.data.token) {
      console.log('\n✨ SUCCESS! Candidate connected!\n');
      console.log('📋 Account Details:');
      console.log('  Email:', 'jean.dupont@example.com');
      console.log('  Password:', 'Password123!');
      console.log('  Role:', loginRes.data.user.role);
      console.log('  Name:', loginRes.data.user.firstName, loginRes.data.user.lastName);
      console.log('\n🔑 Auth Token:');
      console.log('  ', loginRes.data.token);
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

createAndLogin();
