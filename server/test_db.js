const { Client } = require('pg');
require('dotenv').config();

const client = new Client({
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: 'postgres', // Connect to default postgres DB to test auth
});

client.connect()
    .then(() => {
        console.log('Connection successful!');
        client.end();
    })
    .catch(err => {
        console.error('Connection failed:', err.message);
        client.end();
    });
