const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const dbConfig = {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: 'postgres', // Connect to default DB to create new one
};

const targetDbName = process.env.DB_NAME;

async function setupDatabase() {
    const client = new Client(dbConfig);
    try {
        await client.connect();
        console.log('Connected to postgres database.');

        // Check if database exists
        const res = await client.query(`SELECT 1 FROM pg_database WHERE datname = '${targetDbName}'`);
        if (res.rowCount === 0) {
            console.log(`Database ${targetDbName} does not exist. Creating...`);
            await client.query(`CREATE DATABASE ${targetDbName}`);
            console.log(`Database ${targetDbName} created.`);
        } else {
            console.log(`Database ${targetDbName} already exists.`);
        }
    } catch (err) {
        console.error('Error creating database:', err);
    } finally {
        await client.end();
    }

    // Now connect to the new database and run schema
    const dbClient = new Client({
        ...dbConfig,
        database: targetDbName,
    });

    try {
        await dbClient.connect();
        console.log(`Connected to ${targetDbName}.`);

        const sqlPath = path.join(__dirname, 'database.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');

        // Remove \c command as we are already connected
        const cleanedSql = sql.replace(/\\c lost_found_db;/g, '');

        await dbClient.query(cleanedSql);
        console.log('Schema imported successfully.');

    } catch (err) {
        console.error('Error importing schema:', err);
    } finally {
        await dbClient.end();
    }
}

setupDatabase();
