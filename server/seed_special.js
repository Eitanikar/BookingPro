const db = require('./db');
const bcrypt = require('bcryptjs');

async function seedSpecial() {
    console.log('🌱 Starting special seed...');
    try {
        const email = 'testprovider_' + Date.now() + '@test.com';
        const password = await bcrypt.hash('123456', 10);

        // 1. Create User
        const userRes = await db.query(
            `INSERT INTO users (name, email, password_hash, role) VALUES ($1, $2, $3, $4) RETURNING id`,
            ['Test Provider', email, password, 'Service Provider']
        );
        const userId = userRes.rows[0].id;
        console.log('Created User ID:', userId);

        // 2. Create Business
        const bizName = 'AutoTest Business ' + Date.now();
        await db.query(
            `INSERT INTO businesses (user_id, business_name, description, address, phone) VALUES ($1, $2, $3, $4, $5)`,
            [userId, bizName, 'Automated Test Business', 'Test St 1', '0500000000']
        );
        console.log('Created Business:', bizName);

        // 3. Create Service
        const serviceName = 'Test Handshake';
        const serviceRes = await db.query(
            `INSERT INTO services (provider_id, service_name, description, duration_minutes, price) VALUES ($1, $2, $3, $4, $5) RETURNING id`,
            [userId, serviceName, 'Best service ever', 30, 100]
        );
        console.log('Created Service:', serviceName);

        // 4. Create Availability (Schedule)
        // We need to add schedule for Today and Tomorrow so the test can find slots.
        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const dayNames = [
            days[today.getDay()],
            days[tomorrow.getDay()]
        ];

        // Unique days only
        const uniqueDays = [...new Set(dayNames)];

        for (const dayName of uniqueDays) {
            await db.query(
                `INSERT INTO provider_schedule (provider_id, day_of_week, start_time, end_time) 
                 VALUES ($1, $2, $3, $4)
                 ON CONFLICT (provider_id, day_of_week) DO NOTHING`,
                [userId, dayName, '08:00', '20:00']
            );
        }
        console.log('Created Schedule for:', uniqueDays);

    } catch (err) {
        console.error('Seed failed:', err);
        process.exit(1);
    } finally {
        console.log('Done.');
        process.exit(0);
    }
}

seedSpecial();
