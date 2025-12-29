const db = require('./db');

const fixServicesTable = async () => {
    try {
        console.log('--- Fixing Services Table ---');

        // Add 'description' column if it doesn't exist
        await db.query(`
            ALTER TABLE services 
            ADD COLUMN IF NOT EXISTS description TEXT;
        `);
        console.log('Added "description" column to services table.');

        console.log('--- Fix Complete ---');
        process.exit(0);
    } catch (err) {
        console.error('Error fixing services table:', err.message);
        process.exit(1);
    }
};

fixServicesTable();
