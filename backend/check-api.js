const fetch = require('node-fetch');

const API_URL = 'http://localhost:5000/api';

async function testAPI() {
    console.log(`Testing API at ${API_URL}...`);

    try {
        // 1. Test Health Check
        console.log('\n[1/3] Testing Health Check (GET /)...');
        const healthRes = await fetch('http://localhost:5000/');
        if (healthRes.ok) {
            console.log('✅ Backend is reachable!');
            const data = await healthRes.json();
            console.log('   Response:', data);
        } else {
            console.error('❌ Backend returned error:', healthRes.status);
            return;
        }

        // 2. Test Signup (Expect 400 or 201, but connection success)
        console.log('\n[2/3] Testing Signup Endpoint (POST /auth/signup)...');
        const signupRes = await fetch(`${API_URL}/auth/signup`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: 'test@example.com',
                password: 'password123',
                username: 'testu',
                display_name: 'Test User'
            })
        });

        if (signupRes.ok || signupRes.status === 400 || signupRes.status === 409) {
            console.log(`✅ Signup endpoint reachable (Status: ${signupRes.status})`);
            const data = await signupRes.json();
            console.log('   Response:', data);
        } else {
            console.error('❌ Signup endpoint failed:', signupRes.status, signupRes.statusText);
        }

    } catch (error) {
        console.error('\n❌ CRITICAL: Connection Failed!');
        console.error('   ErrorDetails:', error.message);
        console.error('   Possible Causes:');
        console.error('   1. The Backend server is NOT running.');
        console.error('   2. It is running on a different port (not 5000).');
        console.error('   3. Firewall/Network blocking the connection.');
    }
}

testAPI();
