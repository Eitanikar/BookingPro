// JavaScript source code
// File: server/initDB.js
const db = require('./db');

const initDB = async () => {
    try {
        console.log('Setting up database tables...');

        // 1. Add client_name column to appointments if it doesn't exist
        await db.query(`
            ALTER TABLE appointments 
            ADD COLUMN IF NOT EXISTS client_name VARCHAR(100);
        `);

        // 2. Make client_id optional (DROP NOT NULL)
        await db.query(`
            ALTER TABLE appointments 
            ALTER COLUMN client_id DROP NOT NULL;
        `);

        // 3. Create services table if it doesn't exist
        await db.query(`
            CREATE TABLE IF NOT EXISTS services (
                id SERIAL PRIMARY KEY,
                provider_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                service_name VARCHAR(100) NOT NULL,
                description TEXT,
                price DECIMAL(10, 2) NOT NULL,
                duration_minutes INTEGER NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        // 4. Add password reset columns to users table
        await db.query(`
            ALTER TABLE users 
            ADD COLUMN IF NOT EXISTS reset_password_token VARCHAR(255),
            ADD COLUMN IF NOT EXISTS reset_password_expires BIGINT; 
        `);

        // 5. Create blocked_times table for vacations/breaks
        await db.query(`
            CREATE TABLE IF NOT EXISTS blocked_times (
                id SERIAL PRIMARY KEY,
                provider_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                start_time TIMESTAMP NOT NULL,
                end_time TIMESTAMP NOT NULL,
                reason VARCHAR(255),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        // 6. Create provider_availability table
        await db.query(`
            CREATE TABLE IF NOT EXISTS provider_availability (
                id SERIAL PRIMARY KEY,
                provider_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                start_time TIMESTAMP NOT NULL,
                end_time TIMESTAMP NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        // 7. Create provider_schedule table (new - for recurring weekly schedule)
        await db.query(`
            CREATE TABLE IF NOT EXISTS provider_schedule (
                id SERIAL PRIMARY KEY,
                provider_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                day_of_week VARCHAR(20) NOT NULL,
                start_time TIME NOT NULL,
                end_time TIME NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(provider_id, day_of_week)
            );
        `);

        console.log('Database initialization complete.');

    } catch (err) {
        console.error('Error during database initialization:', err.message);
    }
};

module.exports = initDB;

