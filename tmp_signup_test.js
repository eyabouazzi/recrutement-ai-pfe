const axios = require('axios');
const FormData = require('form-data');
(async () => {
  try {
    const data = new FormData();
    data.append('firstName', 'Test');
    data.append('lastName', 'User');
    data.append('email', 'testuser@example.com');
    data.append('password', 'Password123!');
    data.append('confirmPassword', 'Password123!');
    data.append('dob', new Date('1990-01-01').toISOString());
    data.append('role', 'candidat');

    const res = await axios.post('http://localhost:3000/auth/signup', data, {
      headers: data.getHeaders()
    });
    console.log('status', res.status, 'data', res.data);
  } catch (err) {
    if (err.response) {
      console.log('status', err.response.status, 'data', err.response.data);
    } else {
      console.error(err);
    }
  }
})();
