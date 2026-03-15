const axios = require('axios');

const API_URL = 'http://localhost:5000/api/auth';

async function testAuth() {
    console.log('Starting Authentication Test...');

    // 1. Register
    const testUser = {
        username: 'testuser_' + Date.now(),
        email: 'test_' + Date.now() + '@example.com',
        password: 'password123'
    };

    try {
        console.log(`Testing Registration with ${testUser.email}...`);
        const regRes = await axios.post(`${API_URL}/register`, testUser);
        console.log('Registration Success:', regRes.data);
    } catch (error) {
        console.error('Registration Failed:', error.response ? error.response.data : error.message);
        // If registration fails, we might not want to proceed, but let's try login anyway just in case the user already exists (unlikely with timestamp)
    }

    // 2. Login
    try {
        console.log(`Testing Login with ${testUser.email}...`);
        const loginRes = await axios.post(`${API_URL}/login`, {
            email: testUser.email,
            password: testUser.password
        });
        console.log('Login Success:', loginRes.data);
        if (loginRes.data.token) {
            console.log('Token received correctly.');
        } else {
            console.error('Token MISSING in login response.');
        }
    } catch (error) {
        console.error('Login Failed:', error.response ? error.response.data : error.message);
    }
}

testAuth();
