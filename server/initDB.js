// JavaScript source code
// קובץ: server/initDB.js
const db = require('./db');

const initDB = async () => {
    try {
        console.log(' בודק עדכונים נדרשים במסד הנתונים...');

        // 1. הוספת עמודת שם לקוח (אם היא לא קיימת)
        // זה מאפשר לשמור שם של לקוח שהתקשר טלפונית
        await db.query(`
            ALTER TABLE appointments 
            ADD COLUMN IF NOT EXISTS client_name VARCHAR(100);
        `);

        // 2. הפיכת client_id לאופציונלי (DROP NOT NULL)
        // זה מאפשר להכניס תור בלי שיהיה חייב להיות מקושר למשתמש רשום
        await db.query(`
            ALTER TABLE appointments 
            ALTER COLUMN client_id DROP NOT NULL;
        `);

        console.log('מסד הנתונים מוכן: הטבלה appointments עודכנה בהצלחה.');

    } catch (err) {
        console.error('שגיאה בעדכון מסד הנתונים:', err.message);
    }
};

module.exports = initDB;
