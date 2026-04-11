const axios = require('axios');
const FormData = require('form-data');

const API_URL = 'http://localhost:3000';

async function createAndLoginCandidate() {
  try {
    console.log('📝 Creating candidate account...');
    
    // Create FormData for signup
    const formData = new FormData();
    formData.append('firstName', 'Jean');
    formData.append('lastName', 'Dupont');
    formData.append('email', 'jean.dupont@example.com');
    formData.append('password', 'Password123!');
    formData.append('confirmPassword', 'Password123!');
    formData.append('dob', '1990-05-15');
    formData.append('role', 'candidat');

    // Signup
    const signupRes = await axios.post(`${API_URL}/auth/signup`, formData, {
      headers: formData.getHeaders()
    });

    console.log('✅ Candidate account created successfully!');
    console.log('📊 Signup Response:', JSON.stringify(signupRes.data, null, 2));

    // Now login
    console.log('\n🔐 Logging in...');
    const loginRes = await axios.post(`${API_URL}/auth/login`, {
      email: 'jean.dupont@example.com',
      password: 'Password123!'
    });

    console.log('✅ Login successful!');
    console.log('📊 Login Response:', JSON.stringify(loginRes.data, null, 2));
    
    // Store credentials
    console.log('\n✨ Credentials:');
    console.log('Email:', 'jean.dupont@example.com');
    console.log('Password:', 'Password123!');
    console.log('Token:', loginRes.data.token);
    console.log('User ID:', loginRes.data.user._id);

    return { token: loginRes.data.token, user: loginRes.data.user };
  } catch (error) {
    if (error.response) {
      console.error('❌ Error:', error.response.status, error.response.data);
    } else {
      console.error('❌ Error:', error.message);
    }
    process.exit(1);
  }
}

createAndLoginCandidate();
