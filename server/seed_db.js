const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config();

// Connect to 'postgres' database first to create the new database
const initialPool = new Pool({
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: 'postgres',
});

const targetDbName = process.env.DB_NAME;

async function setupDatabase() {
    try {
        const client = await initialPool.connect();

        // Check if database exists
        const res = await client.query(`SELECT 1 FROM pg_database WHERE datname = $1`, [targetDbName]);

        if (res.rowCount === 0) {
            console.log(`Creating database ${targetDbName}...`);
            await client.query(`CREATE DATABASE ${targetDbName}`);
            console.log('Database created.');
        } else {
            console.log(`Database ${targetDbName} already exists.`);
        }

        client.release();
        await initialPool.end();

        // Now connect to the new database
        const dbPool = new Pool({
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            host: process.env.DB_HOST,
            port: process.env.DB_PORT,
            database: targetDbName,
        });

        const dbClient = await dbPool.connect();

        // Read schema
        const schemaPath = path.join(__dirname, 'database.sql');
        let schema = fs.readFileSync(schemaPath, 'utf8');

        // Remove the CREATE DATABASE and \c lines since we handled connection manually
        // This is a naive split, but for our known file it acts as a cleanup
        schema = schema.replace(/CREATE DATABASE.*;/i, '').replace(/\\c .*/i, '');

        console.log('Running schema...');
        await dbClient.query(schema);
        console.log('Schema applied successfully.');

        dbClient.release();
        await dbPool.end();

    } catch (err) {
        console.error('Error setting up database:', err);
    }
}

setupDatabase();
