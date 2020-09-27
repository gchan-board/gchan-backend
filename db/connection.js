// const monk = require('monk');
const { Pool } = require('pg');
const connectionString = process.env.DATABASE_URL || 'localhost/messageboard';
const db = new Pool({
    connectionString: connectionString,
    ssl: {
        rejectUnauthorized: false
    }
});

// const db = monk(connectionString);

module.exports = db;
