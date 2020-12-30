const { Pool } = require('pg');
const connectionString = process.env.DATABASE_URL;
const db = new Pool({
    connectionString: connectionString,
    ssl: {
        rejectUnauthorized: false
    }
});
module.exports = db;
