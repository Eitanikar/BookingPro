const db = require('./db');
require('dotenv').config();

async function checkData() {
    try {
        console.log('--- Checking Recent Appointments ---');
        const appts = await db.query('SELECT id, provider_id, client_id, client_name, start_time FROM appointments ORDER BY id DESC LIMIT 5');
        console.table(appts.rows);

        if (appts.rows.length > 0) {
            const clientIds = appts.rows.map(r => r.client_id).filter(id => id);
            if (clientIds.length > 0) {
                console.log('--- Checking Client Details for these IDs ---');
                // Construct a query for these IDs
                const queryText = `SELECT * FROM client_details WHERE user_id IN (${clientIds.join(',')})`;
                const details = await db.query(queryText);
                console.table(details.rows);
            } else {
                console.log('No client_ids found in recent appointments (Manual bookings?)');
            }
        }

        console.log('--- Checking All Client Details (Limit 5) ---');
        const allDetails = await db.query('SELECT * FROM client_details LIMIT 5');
        console.table(allDetails.rows);

    } catch (err) {
        console.error('Error:', err);
    } finally {
        process.exit();
    }
}

checkData();
