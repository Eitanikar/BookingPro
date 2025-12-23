// JavaScript source code
// ����: server/initDB.js
const db = require('./db');

const initDB = async () => {
    try {
        console.log(' ���� ������� ������ ���� �������...');

        // 1. ����� ����� �� ���� (�� ��� �� �����)
        // �� ����� ����� �� �� ���� ������ �������
        await db.query(`
            ALTER TABLE appointments 
            ADD COLUMN IF NOT EXISTS client_name VARCHAR(100);
        `);

        // 2. ����� client_id ���������� (DROP NOT NULL)
        // �� ����� ������ ��� ��� ����� ���� ����� ����� ������ ����
        await db.query(`
            ALTER TABLE appointments 
            ALTER COLUMN client_id DROP NOT NULL;
        `);

        // 3. יצירת טבלת שירותים (Services) - אם לא קיימת
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

        console.log('��� ������� ����: ����� appointments ������ ������.');

    } catch (err) {
        console.error('����� ������ ��� �������:', err.message);
    }
};

module.exports = initDB;
