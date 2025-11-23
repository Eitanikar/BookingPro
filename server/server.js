// קובץ: BookingPro/server/server.js - קוד מתוקן
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const db = require('./db'); 

// --- הגדרות השרת והסודות ---
const PORT = 5000;
const JWT_SECRET = 'Haim_Yoni_Yehuda_Eitan_Yosef_Secure_Key'; // חובה לשנות!

const app = express();

app.use(cors());
app.use(express.json()); 

// --------------------------------------------------------------------
// [1] User Authentication Route (Registration - Core Logic)
// --------------------------------------------------------------------
app.post('/api/register', async (req, res) => {
    const { name, email, password, role } = req.body;

    if (!email || !password || !name) {
        return res.status(400).json({ msg: 'נא למלא את כל השדות.' });
    }

    try {
        const salt = await bcrypt.genSalt(10);
        const password_hash = await bcrypt.hash(password, salt);

        const result = await db.query(
            'INSERT INTO users (name, email, password_hash, role) VALUES ($1, $2, $3, $4) RETURNING id, name, email, role',
            [name, email, password_hash, role || 'Client']
        );

        const user = result.rows[0];
        const token = jwt.sign({ userId: user.id, role: user.role }, JWT_SECRET, { expiresIn: '1h' });

        res.json({ token, user });

    } catch (err) {
        if (err.code === '23505') {
            return res.status(400).json({ msg: 'משתמש עם אימייל זה כבר קיים.' });
        }
        console.error(err.message);
        res.status(500).send('שגיאת שרת');
    }
});


// --------------------------------------------------------------------
// [2] User Login Route (התחברות)
// --------------------------------------------------------------------
app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;

    // בדיקה שנשלחו פרטים
    if (!email || !password) {
        return res.status(400).json({ msg: 'נא למלא אימייל וסיסמה' });
    }

    try {
        // 1. בדיקה אם המשתמש קיים ב-DB
        const result = await db.query('SELECT * FROM users WHERE email = $1', [email]);
        
        if (result.rows.length === 0) {
            return res.status(400).json({ msg: 'פרטים שגויים (משתמש לא נמצא)' });
        }

        const user = result.rows[0];

        // 2. בדיקת התאמת סיסמה (השוואה בין מה שהוקלד למה שמוצפן ב-DB)
        const isMatch = await bcrypt.compare(password, user.password_hash);
        
        if (!isMatch) {
            return res.status(400).json({ msg: 'פרטים שגויים (סיסמה לא תואמת)' });
        }

        // 3. יצירת Token והחזרה ללקוח
        const token = jwt.sign({ userId: user.id, role: user.role }, JWT_SECRET, { expiresIn: '1h' });

        res.json({ token, user: { id: user.id, name: user.name, role: user.role } });

    } catch (err) {
        console.error(err.message);
        res.status(500).send('שגיאת שרת');
    }
});

// --------------------------------------------------------------------
// [4] Appointments Route - קבלת התורים של המשתמש
// --------------------------------------------------------------------
app.get('/api/my-appointments', async (req, res) => {
    const userId = req.headers['user-id']; // נשלח את ה-ID מהלקוח

    if (!userId) return res.status(400).json({ msg: 'לא זוהה משתמש' });

    try {
        const query = `
            SELECT 
                a.id, 
                s.service_name, 
                u.name as provider_name, 
                a.start_time, 
                a.status 
            FROM appointments a
            JOIN services s ON a.service_id = s.id
            JOIN users u ON a.provider_id = u.id
            WHERE a.client_id = $1
            ORDER BY a.start_time ASC
        `;
        const result = await db.query(query, [userId]);
        res.json(result.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('שגיאת שרת');
    }
});

// --------------------------------------------------------------------
// [5] Availability Route - בדיקת שעות פנויות (לוגיקה בסיסית)
// --------------------------------------------------------------------
app.get('/api/availability', async (req, res) => {
    const { providerId, date } = req.query; // מקבלים ID של ספק ותאריך

    try {
        // 1. מביאים את כל התורים הקיימים לאותו ספק באותו יום
        const query = `
            SELECT start_time FROM appointments 
            WHERE provider_id = $1 
            AND DATE(start_time) = $2
        `;
        const takenSlots = await db.query(query, [providerId, date]);
        
        // המרה לשעות פשוטות (למשל "10:00") לצורך השוואה
        const takenTimes = takenSlots.rows.map(row => {
            const d = new Date(row.start_time);
            return d.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' });
        });

        // 2. יוצרים רשימת שעות עבודה קבועות (9:00 עד 17:00)
        const allSlots = [
            "09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00"
        ];

        // 3. מסננים: מחזירים רק מה שלא תפוס
        const availableSlots = allSlots.filter(slot => !takenTimes.includes(slot));

        res.json(availableSlots);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('שגיאת שרת');
    }
});

// --------------------------------------------------------------------
// [6] Book Appointment Route - ביצוע ההזמנה
// --------------------------------------------------------------------
app.post('/api/book', async (req, res) => {
    const { clientId, providerId, serviceId, date, time } = req.body;

    try {
        // יצירת אובייקט תאריך מלא (Date + Time)
        // הערה: בפרויקט אמיתי עובדים עם ספריות כמו moment/date-fns, כאן נעשה פשוט
        const startTime = new Date(`${date}T${time}:00`); 
        const endTime = new Date(startTime.getTime() + 30 * 60000); // מוסיף 30 דקות אוטומטית

        const query = `
            INSERT INTO appointments (client_id, provider_id, service_id, start_time, end_time)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING id
        `;
        
        await db.query(query, [clientId, providerId, serviceId, startTime, endTime]);
        res.json({ msg: 'התור נקבע בהצלחה!' });

    } catch (err) {
        console.error(err.message);
        res.status(500).send('שגיאה בקביעת התור (אולי השעה נתפסה הרגע)');
    }
});

// --------------------------------------------------------------------
// [3] Public Data Route - Get All Services (דף הבית)
// --------------------------------------------------------------------
app.get('/api/services', async (req, res) => {
    try {
        // שליפת כל השירותים כולל שם הספק שלהם
        const query = `
            SELECT s.id, s.service_name, s.duration_minutes, s.price, u.name as provider_name 
            FROM services s
            JOIN users u ON s.provider_id = u.id
        `;
        const result = await db.query(query);
        res.json(result.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('שגיאת שרת');
    }
});
// --------------------------------------------------------------------
// [2] הפעלת השרת
// --------------------------------------------------------------------
app.listen(PORT, () => console.log(`שרת Node.js פועל בפורט ${PORT}`)); // זה הפתרון!