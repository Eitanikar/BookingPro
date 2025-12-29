const db = require('./db');

const fixAvailabilityTable = async () => {
    try {
        console.log('--- Creating provider_availability Table ---');

        await db.query(`
            CREATE TABLE IF NOT EXISTS provider_availability (
                id SERIAL PRIMARY KEY,
                provider_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                start_time TIMESTAMP NOT NULL,
                end_time TIMESTAMP NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
        console.log('Created "provider_availability" table.');

        console.log('--- Fix Complete ---');
        process.exit(0);
    } catch (err) {
        console.error('Error creating table:', err.message);
        process.exit(1);
    }
};

fixAvailabilityTable();
