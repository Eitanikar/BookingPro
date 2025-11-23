// קובץ: BookingPro/server/db.js - הקוד המתוקן
const { Pool } = require('pg');

// **** חובה לשנות את הפרטים! ****
const pool = new Pool({
    user: 'postgres', 
    host: 'localhost',
    database: 'bookingpro_db',
    password: '123456', 
    port: 5432, 
});

// ייצוא הפונקציה query בצורה נכונה
module.exports = {
    query: (text, params) => pool.query(text, params),
};