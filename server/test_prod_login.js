const axios = require('axios');

async function testLogin() {
    const URL = 'https://lost-and-found-api-dewt.onrender.com/api/auth/login';
    const credentials = {
        email: 'aakshna122005@gmail.com',
        password: 'Password@123'
    };

    try {
        console.log(`Attempting login for ${credentials.email}...`);
        const res = await axios.post(URL, credentials);
        console.log('Login Success:', res.data.success);
        console.log('User Role:', res.data.user.role);
    } catch (err) {
        console.error('Login Failed:', err.response?.data || err.message);
    }
}

testLogin();
