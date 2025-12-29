const db = require('./db');

const fixDB = async () => {
    try {
        console.log('--- Fixing Database Schema ---');

        // Create 'businesses' table
        await db.query(`
            CREATE TABLE IF NOT EXISTS businesses (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                business_name VARCHAR(100) NOT NULL,
                address VARCHAR(255),
                phone VARCHAR(50),
                description TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
        console.log('Checked/Created "businesses" table.');

        // Create 'business_photos' table
        await db.query(`
            CREATE TABLE IF NOT EXISTS business_photos (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                image_url TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
        console.log('Checked/Created "business_photos" table.');

        console.log('--- Schema Fix Complete ---');
        process.exit(0);
    } catch (err) {
        console.error('Error fixing DB:', err.message);
        process.exit(1);
    }
};

fixDB();
