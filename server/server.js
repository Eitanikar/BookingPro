// קובץ: BookingPro/server/server.js - קוד מתוקן
const express = require('express');
const crypto = require('crypto'); // Built-in module for token generation
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const db = require('./db');
const initDB = require('./initDB');

// --- הגדרות השרת והסודות ---
const PORT = 5000;
const JWT_SECRET = 'Haim_Yoni_Yehuda_Eitan_Yosef_Secure_Key'; // חובה לשנות!

const app = express();

app.use(cors());
app.use(express.json({ limit: '10mb' })); // תמיכה ב-JSON בגודל עד 10MB 
// --- Middleware לאימות Token ---
const authenticateToken = (req, res, next) => {
    // הלקוח צריך לשלוח כותרת: Authorization: Bearer <TOKEN>
    const authHeader = req.headers['authorization'];
    // מפרידים את המילה Bearer מהטוקן עצמו
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ msg: 'אין הרשאה (חסר טוקן)' });
    }

    jwt.verify(token, JWT_SECRET, (err, userPayload) => {
        if (err) {
            return res.status(403).json({ msg: 'הטוקן אינו תקין או פג תוקף' });
        }
        // אם הכל תקין, שומרים את פרטי המשתמש בתוך האובייקט req
        req.user = userPayload;
        next(); // ממשיכים לפונקציה הבאה (הנתיב עצמו)
    });
};

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
// [2.5] Forgot Password Route - בקשת איפוס סיסמה
// --------------------------------------------------------------------
app.post('/api/forgot-password', async (req, res) => {
    const { email } = req.body;
    if (!email) {
        return res.status(400).json({ msg: 'נא למלא כתובת אימייל' });
    }

    try {
        // 1. בדיקה שהמשתמש קיים
        const userRes = await db.query('SELECT * FROM users WHERE email = $1', [email]);
        if (userRes.rows.length === 0) {
            // מבחינת אבטחה עדיף להחזיר הודעה כללית, אבל לצורך הפיתוח נחזיר הודעה ספציפית
            return res.status(404).json({ msg: 'משתמש לא נמצא' });
        }

        const user = userRes.rows[0];

        // 2. יצירת טוקן רנדומלי
        const resetToken = crypto.randomBytes(20).toString('hex');

        // 3. שמירת הטוקן וזמן התפוגה (שעה אחת מעכשיו)
        const passwordExpires = Date.now() + 3600000; // 1 hour

        await db.query(
            'UPDATE users SET reset_password_token = $1, reset_password_expires = $2 WHERE id = $3',
            [resetToken, passwordExpires, user.id]
        );

        // 4. סימולציה: הדפסת הלינק לקונסול (במקום שליחת מייל)
        const resetUrl = `http://localhost:3000/reset-password/${resetToken}`;
        console.log('----------------------------------------------------');
        console.log(`Password Reset Link for ${email}:`);
        console.log(resetUrl);
        console.log('----------------------------------------------------');

        res.json({ msg: 'הוראות לאיפוס סיסמה נשלחו לכתובת המייל שלך (בדוק בקונסול השרת)' });

    } catch (err) {
        console.error(err.message);
        res.status(500).send('שגיאת שרת');
    }
});

// --------------------------------------------------------------------
// [2.6] Reset Password Route - ביצוע האיפוס עם הטוקן
// --------------------------------------------------------------------
app.post('/api/reset-password', async (req, res) => {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
        return res.status(400).json({ msg: 'חסרים נתונים' });
    }

    try {
        // 1. חיפוש משתמש עם הטוקן הזה ושהתוקף שלו לא פג
        const query = `
            SELECT * FROM users 
            WHERE reset_password_token = $1 
            AND reset_password_expires > $2
        `;
        // Date.now() returns number, comparison works if column is BIGINT
        const userRes = await db.query(query, [token, Date.now()]);

        if (userRes.rows.length === 0) {
            return res.status(400).json({ msg: 'הטוקן אינו תקין או שפג תוקפו' });
        }

        const user = userRes.rows[0];

        // 2. הצפנת הסיסמה החדשה
        const salt = await bcrypt.genSalt(10);
        const password_hash = await bcrypt.hash(newPassword, salt);

        // 3. עדכון הסיסמה וניקוי הטוקן
        await db.query(
            'UPDATE users SET password_hash = $1, reset_password_token = NULL, reset_password_expires = NULL WHERE id = $2',
            [password_hash, user.id]
        );

        res.json({ msg: 'הסיסמה שונתה בהצלחה! כעת ניתן להתחבר.' });

    } catch (err) {
        console.error(err.message);
        res.status(500).send('שגיאת שרת');
    }
});


// --------------------------------------------------------------------
// [4] Appointments Route - קבלת התורים של המשתמש
// --------------------------------------------------------------------
app.get('/api/my-appointments', authenticateToken, async (req, res) => {
    const userId = req.user.userId;
    const role = req.user.role;

    try {
        let query;
        let params = [userId];

        if (role === 'Service Provider') {
            // For providers: show appointments where they are the provider
            // We join with users twice: u1 for provider info (not really needed but consistent), u2 for client name lookup if needed
            query = `
                SELECT 
                    a.id, 
                    s.service_name, 
                    COALESCE(u.name, a.client_name) as client_name, 
                    a.start_time, 
                    a.status,
                    s.price
                FROM appointments a
                JOIN services s ON a.service_id = s.id
                LEFT JOIN users u ON a.client_id = u.id
                WHERE a.provider_id = $1
                ORDER BY a.start_time DESC
            `;
        } else {
            // For clients: show appointments where they are the client
            query = `
                SELECT 
                    a.id, 
                    s.service_name, 
                    u.name as provider_name, 
                    a.start_time, 
                    a.status, 
                    s.price
                FROM appointments a
                JOIN services s ON a.service_id = s.id
                JOIN users u ON a.provider_id = u.id
                WHERE a.client_id = $1
                ORDER BY a.start_time ASC
            `;
        }

        const result = await db.query(query, params);
        res.json(result.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('שגיאת שרת');
    }
});

// --------------------------------------------------------------------
// [5] Availability Route - בדיקת שעות פנויות (לוגיקה בסיסית)
// --------------------------------------------------------------------
// --------------------------------------------------------------------
// [5] Availability Route - בדיקת שעות פנויות (לוגיקה מתקדמת)
// --------------------------------------------------------------------

// 1. הוספת זמינות (ספק)
app.post('/api/provider/availability', authenticateToken, async (req, res) => {
    const { start, end } = req.body;
    const providerId = req.user.userId;

    try {
        // מחיקת חפיפות (פשוט מוחקים כל מה שבטווח ומכניסים חדש - אפשר לשכלל)
        // לצורך הפשטות נניח שהמשתמש שולח Block נקי
        const query = `
            INSERT INTO provider_availability (provider_id, start_time, end_time)
            VALUES ($1, $2, $3)
            RETURNING id, start_time, end_time
        `;
        const result = await db.query(query, [providerId, start, end]);
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('שגיאה בשמירת הזמינות');
    }
});

// 2. קבלת זמינות (ספק - לצורך תצוגה בלוח השנה שלו)
app.get('/api/provider/availability/:providerId', async (req, res) => {
    const { providerId } = req.params;
    try {
        const query = `SELECT id, start_time, end_time FROM provider_availability WHERE provider_id = $1`;
        const result = await db.query(query, [providerId]);
        res.json(result.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('שגיאה בטעינת הזמינות');
    }
});

// 3. מחיקת זמינות
app.delete('/api/provider/availability/:id', authenticateToken, async (req, res) => {
    const { id } = req.params;
    try {
        await db.query('DELETE FROM provider_availability WHERE id = $1', [id]);
        res.json({ msg: 'נמחק בהצלחה' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('שגיאה במחיקה');
    }
});

// ====================================================================
// [5B] NEW Schedule API - שעות עבודה קבועות (ראשון עד שבת)
// ====================================================================

// GET /api/provider/schedule/:providerId - קבלת לוח שעות
app.get('/api/provider/schedule/:providerId', async (req, res) => {
    const { providerId } = req.params;
    try {
        const query = `
            SELECT day_of_week, start_time, end_time 
            FROM provider_schedule 
            WHERE provider_id = $1
            ORDER BY 
                CASE day_of_week
                    WHEN 'Sunday' THEN 0
                    WHEN 'Monday' THEN 1
                    WHEN 'Tuesday' THEN 2
                    WHEN 'Wednesday' THEN 3
                    WHEN 'Thursday' THEN 4
                    WHEN 'Friday' THEN 5
                    WHEN 'Saturday' THEN 6
                END
        `;
        const result = await db.query(query, [providerId]);
        res.json(result.rows);
    } catch (err) {
        console.error('Schedule fetch error:', err.message);
        res.status(500).json({ msg: 'שגיאה בטעינת לוח השעות' });
    }
});

// POST /api/provider/schedule - שמירת לוח שעות חדש
app.post('/api/provider/schedule', authenticateToken, async (req, res) => {
    const { availability } = req.body;
    const providerId = req.user.userId;

    // בדיקות יסודיות
    if (!Array.isArray(availability)) {
        return res.status(400).json({ msg: 'תבנית שגויה: צפוי array של ימים' });
    }

    try {
        // 1. מחיקה של כל השעות הישנות של הספק הזה
        await db.query('DELETE FROM provider_schedule WHERE provider_id = $1', [providerId]);

        // 2. הכנסה של השעות החדשות
        for (const day of availability) {
            const { day_of_week, start_time, end_time } = day;

            // בדיקות
            if (!day_of_week || !start_time || !end_time) {
                return res.status(400).json({ msg: 'נא למלא את כל השדות עבור כל יום' });
            }

            if (start_time >= end_time) {
                return res.status(400).json({ msg: `שעת ההתחלה חייבת להיות לפני שעת הסיום ביום ${day_of_week}` });
            }

            const query = `
                INSERT INTO provider_schedule (provider_id, day_of_week, start_time, end_time)
                VALUES ($1, $2, $3, $4)
            `;
            await db.query(query, [providerId, day_of_week, start_time, end_time]);
        }

        res.json({ msg: 'לוח השעות נשמר בהצלחה!' });
    } catch (err) {
        console.error('Schedule save error:', err.message);
        res.status(500).json({ msg: 'שגיאה בשמירת לוח השעות: ' + err.message });
    }
});

// DELETE /api/provider/schedule/:day - מחיקת יום עבודה
app.delete('/api/provider/schedule/:day', authenticateToken, async (req, res) => {
    const { day } = req.params;
    const providerId = req.user.userId;

    try {
        await db.query(
            'DELETE FROM provider_schedule WHERE provider_id = $1 AND day_of_week = $2',
            [providerId, day]
        );
        res.json({ msg: 'יום עבודה נמחק בהצלחה' });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ msg: 'שגיאה במחיקה' });
    }
});

// --------------------------------------------------------------------
// [12] Blocked Times Management (חסימת זמנים / חופשות)
// --------------------------------------------------------------------

// 1. הוספת זמן חסום
app.post('/api/blocked-times', authenticateToken, async (req, res) => {
    const { start, end, reason } = req.body;
    const providerId = req.user.userId;

    if (!start || !end) {
        return res.status(400).json({ msg: 'נא למלא תאריך התחלה וסיום' });
    }

    try {
        const query = `
            INSERT INTO blocked_times (provider_id, start_time, end_time, reason)
            VALUES ($1, $2, $3, $4)
            RETURNING *
        `;
        const result = await db.query(query, [providerId, start, end, reason]);
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('שגיאה בשמירת החסימה');
    }
});

// 2. מחיקת זמן חסום
app.delete('/api/blocked-times/:id', authenticateToken, async (req, res) => {
    const { id } = req.params;
    const providerId = req.user.userId;

    try {
        const result = await db.query(
            'DELETE FROM blocked_times WHERE id = $1 AND provider_id = $2 RETURNING *',
            [id, providerId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ msg: 'החסימה לא נמצאה או שאין הרשאה' });
        }
        res.json({ msg: 'החסימה הוסרה' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('שגיאה במחיקת החסימה');
    }
});

// 3. שליפת זמנים חסומים (לצורך הצגה ביומן) - הועבר לתוך ה-Calendar Route אבל נשאיר גם כאן אם צריך
app.get('/api/blocked-times/:providerId', async (req, res) => {
    const { providerId } = req.params;
    try {
        const result = await db.query(
            'SELECT * FROM blocked_times WHERE provider_id = $1 ORDER BY start_time ASC',
            [providerId]
        );
        res.json(result.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('שגיאה בטעינת חסימות');
    }
});

// 4. בדיקת שעות פנויות (לקוח)
app.get('/api/availability', async (req, res) => {
    const { providerId, date } = req.query; // date format: YYYY-MM-DD

    try {
        // 1. פרסום התאריך לעדיפות לבודקה
        const dateObj = new Date(date);
        const dayOfWeek = dateObj.toLocaleDateString('en-US', { weekday: 'long' }); // e.g., "Monday"

        // 2. בדיקה שהביום הזה בעל העסק עובד
        const scheduleQuery = `
            SELECT start_time, end_time 
            FROM provider_schedule 
            WHERE provider_id = $1 
            AND day_of_week = $2
        `;
        const scheduleResult = await db.query(scheduleQuery, [providerId, dayOfWeek]);
        
        if (scheduleResult.rows.length === 0) {
            return res.json([]); // בעל העסק לא עובד ביום הזה
        }

        const scheduleRange = scheduleResult.rows[0];
        const [schedStartHour, schedStartMin] = scheduleRange.start_time.split(':').map(Number);
        const [schedEndHour, schedEndMin] = scheduleRange.end_time.split(':').map(Number);

        // 3. שליפת התורים הקיימים באותו יום
        const apptQuery = `
            SELECT start_time, end_time 
            FROM appointments 
            WHERE provider_id = $1 
            AND DATE(start_time) = $2
        `;
        const apptResult = await db.query(apptQuery, [providerId, date]);
        const appointments = apptResult.rows;

        // 4. שליפת זמנים חסומים באותו יום
        const blockedQuery = `
            SELECT start_time, end_time 
            FROM blocked_times 
            WHERE provider_id = $1 
            AND DATE(start_time) = $2
        `;
        const blockedResult = await db.query(blockedQuery, [providerId, date]);
        const blockedTimes = blockedResult.rows;

        // מיזוג של תורים + חסימות
        const busySlots = [...appointments, ...blockedTimes];

        // 5. יצירת סלוטים פנויים (30 דקות כל אחד)
        const slots = [];
        
        // יצירת שעות עבודה מהלוח הקבוע
        const baseDate = new Date(date);
        let current = new Date(baseDate);
        current.setHours(schedStartHour, schedStartMin, 0, 0);
        
        const end = new Date(baseDate);
        end.setHours(schedEndHour, schedEndMin, 0, 0);

        while (current < end) {
            const slotEnd = new Date(current.getTime() + 30 * 60000); // +30 דקות

            // בדיקה אם הסלוט תפוס
            const isTaken = busySlots.some(appt => {
                const apptStart = new Date(appt.start_time);
                const apptEnd = new Date(appt.end_time);
                return (current < apptEnd && slotEnd > apptStart);
            });

            if (!isTaken) {
                slots.push(current.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' }));
            }

            current = slotEnd;
        }

        const uniqueSlots = [...new Set(slots)].sort();
        res.json(uniqueSlots);

    } catch (err) {
        console.error('Availability error:', err.message);
        res.status(500).json({ msg: 'שגיאה בחישוב זמינות: ' + err.message });
    }
});

// --------------------------------------------------------------------
// [6] Book Appointment Route - ביצוע ההזמנה
// --------------------------------------------------------------------
app.post('/api/book', async (req, res) => {
    const { clientId, providerId, serviceId, date, time } = req.body;

    try {
        // וידוא שכל הפרמטרים קיימים
        if (!clientId || !providerId || !serviceId || !date || !time) {
            return res.status(400).json({ msg: 'חסרים פרטים לקביעת התור' });
        }

        // יצירת אובייקט תאריך מלא (Date + Time)
        const startTime = new Date(`${date}T${time}:00`);
        
        // בדיקה שהתאריך לא בעבר
        const now = new Date();
        if (startTime < now) {
            return res.status(400).json({ msg: 'לא ניתן להזמין תור בתאריך שעבר' });
        }

        const endTime = new Date(startTime.getTime() + 30 * 60000); // מוסיף 30 דקות אוטומטית

        // בדיקה אם התור כבר קיים בשעה זו
        const checkQuery = `
            SELECT id FROM appointments 
            WHERE provider_id = $1 
            AND DATE(start_time) = $2
            AND start_time = $3
        `;
        const checkResult = await db.query(checkQuery, [providerId, date, startTime]);
        
        if (checkResult.rows.length > 0) {
            return res.status(400).json({ msg: 'השעה הזו כבר תפוסה! בחר שעה אחרת.' });
        }

        // הוספת התור
        const query = `
            INSERT INTO appointments (client_id, provider_id, service_id, start_time, end_time)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING id
        `;

        const result = await db.query(query, [clientId, providerId, serviceId, startTime, endTime]);
        
        if (result.rows.length === 0) {
            return res.status(500).json({ msg: 'שגיאה בשמירת התור' });
        }

        res.json({ msg: 'התור נקבע בהצלחה!', id: result.rows[0].id });

    } catch (err) {
        console.error('Booking error:', err.message);
        res.status(500).json({ msg: 'שגיאה בקביעת התור: ' + err.message });
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
// [7] Create Business Profile - יצירת פרופיל עסקי
// --------------------------------------------------------------------
app.post('/api/business-profile', async (req, res) => {
    const { userId, businessName, address, phone, description } = req.body;

    if (!userId || !businessName) {
        return res.status(400).json({ msg: 'חובה למלא מזהה משתמש ושם עסק' });
    }

    try {
        // בדיקה אם כבר קיים פרופיל למשתמש הזה
        const checkExisting = await db.query('SELECT * FROM businesses WHERE user_id = $1', [userId]);
        if (checkExisting.rows.length > 0) {
            return res.status(400).json({ msg: 'כבר קיים פרופיל עסקי למשתמש זה' });
        }

        const query = `
            INSERT INTO businesses (user_id, business_name, address, phone, description)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING *
        `;
        const result = await db.query(query, [userId, businessName, address, phone, description]);

        res.json({ msg: 'הפרופיל העסקי נוצר בהצלחה!', business: result.rows[0] });

    } catch (err) {
        console.error(err.message);
        res.status(500).send('שגיאת שרת ביצירת פרופיל עסק');
    }
});


// --------------------------------------------------------------------
// [3] Get Provider Calendar Appointments - שליפת תורים ליומן (מעודכן)
// תומך גם במשתמשים רשומים וגם בתורים ידניים
// --------------------------------------------------------------------
app.get('/api/calendar/provider/:providerId', authenticateToken, async (req, res) => {
    const providerId = req.params.providerId;
    const { start, end } = req.query;

    // --- בדיקות אבטחה ---
    if (req.user.role !== 'Service Provider') {
        return res.status(403).json({ msg: 'גישה נדחתה: משתמש זה אינו ספק שירות.' });
    }
    if (parseInt(req.user.userId) !== parseInt(providerId)) {
        return res.status(403).json({ msg: 'אין לך הרשאה לצפות ביומן של ספק אחר.' });
    }

    if (!start || !end) {
        return res.status(400).json({ msg: 'נדרש טווח תאריכים (start, end).' });
    }

    try {
        // השינוי הגדול: LEFT JOIN ושימוש ב-COALESCE לשם הלקוח
        const query = `
            SELECT
                a.id,
                a.start_time,
                a.end_time,
                s.service_name,
                COALESCE(u.name, a.client_name) AS client_name,
                a.client_id
            FROM appointments a
            JOIN services s ON a.service_id = s.id
            LEFT JOIN users u ON a.client_id = u.id
            WHERE a.provider_id = $1
                AND a.start_time >= $2
                AND a.start_time <= $3
            ORDER BY a.start_time ASC
        `;

        const appointmentsResult = await db.query(query, [providerId, start, end]);

        // שליפת חסימות בטווח התאריכים
        const blockedQuery = `
            SELECT 
                id, 
                start_time, 
                end_time, 
                reason as title 
            FROM blocked_times 
            WHERE provider_id = $1 
            AND start_time >= $2 
            AND start_time <= $3
        `;
        const blockedResult = await db.query(blockedQuery, [providerId, start, end]);

        // עיצוב החסימות שיראו כמו אירועים אבל אחרת
        const blockedEvents = blockedResult.rows.map(block => ({
            id: `block-${block.id}`, // מזהה ייחודי כדי שנבדיל בקלינט
            real_id: block.id,
            start_time: block.start_time,
            end_time: block.end_time,
            title: `⛔ ${block.title || 'חסום'}`,
            is_blocked: true, // דגל לזיהוי בקלינט
            color: '#808080', // אפור
            client_name: null,
            service_name: 'חסימה'
        }));

        res.json([...appointmentsResult.rows, ...blockedEvents]);

    } catch (err) {
        console.error('Error fetching provider calendar:', err.message);
        res.status(500).send('שגיאת שרת בשליפת היומן.');
    }
});


// --------------------------------------------------------------------
// [7.5] Update Business Profile - עדכון פרטי עסק קיים
// --------------------------------------------------------------------
app.put('/api/business-profile', authenticateToken, async (req, res) => {
    // אנחנו מצפים לקבל את השדות האלו מהטופס בצד לקוח
    const { businessName, address, phone, description } = req.body;
    
    // את ה-ID אנחנו לוקחים מהטוקן (כדי שרק בעל העסק יוכל לערוך את עצמו)
    const userId = req.user.userId;

    try {
        const query = `
            UPDATE businesses 
            SET business_name = $1, address = $2, phone = $3, description = $4
            WHERE user_id = $5
            RETURNING *
        `;
        
        // הרצת השאילתה
        const result = await db.query(query, [businessName, address, phone, description, userId]);

        // בדיקה אם בכלל היה מה לעדכן
        if (result.rows.length === 0) {
            return res.status(404).json({ msg: 'לא נמצא פרופיל עסק למשתמש זה (יש ליצור פרופיל קודם)' });
        }

        res.json({ msg: 'העסק עודכן בהצלחה', business: result.rows[0] });

    } catch (err) {
        console.error('Update error:', err.message);
        res.status(500).send('שגיאה בעדכון פרטי העסק');
    }
});


// --------------------------------------------------------------------
// [8] Gallery Management - ניהול גלריה
// --------------------------------------------------------------------

// הוספת תמונה חדשה לגלריה
app.post('/api/photos', async (req, res) => {
    const { userId, imageUrl } = req.body;
    try {
        const result = await db.query(
            'INSERT INTO business_photos (user_id, image_url) VALUES ($1, $2) RETURNING *',
            [userId, imageUrl]
        );
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('שגיאה בשמירת התמונה');
    }
});

// שליפת כל התמונות של עסק מסוים
app.get('/api/photos/:userId', async (req, res) => {
    const { userId } = req.params;
    try {
        const result = await db.query(
            'SELECT * FROM business_photos WHERE user_id = $1 ORDER BY created_at DESC',
            [userId]
        );
        res.json(result.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('שגיאה בטעינת התמונות');
    }
});

// DELETE /api/photos/:photoId - מחיקת תמונה
app.delete('/api/photos/:photoId', authenticateToken, async (req, res) => {
    const { photoId } = req.params;
    const userId = req.user.userId;

    try {
        // בדיקה שהתמונה שייכת למשתמש הנוכחי
        const result = await db.query(
            'SELECT * FROM business_photos WHERE id = $1 AND user_id = $2',
            [photoId, userId]
        );

        if (result.rows.length === 0) {
            return res.status(403).json({ msg: 'אין הרשאה למחוק תמונה זו' });
        }

        // מחיקה מהדטאבייס
        await db.query('DELETE FROM business_photos WHERE id = $1', [photoId]);

        res.json({ msg: 'התמונה נמחקה בהצלחה' });
    } catch (err) {
        console.error('Delete photo error:', err.message);
        res.status(500).json({ msg: 'שגיאה במחיקת התמונה: ' + err.message });
    }
});

// --------------------------------------------------------------------
// [2.1] Manual Booking Route - קביעת תור ידנית (לספקים)
// --------------------------------------------------------------------
app.post('/api/appointments/manual', authenticateToken, async (req, res) => {
    const { providerId, serviceId, date, time, clientName } = req.body;

    // 1. בדיקת הרשאות: רק ספק שירות יכול לקבוע תור ידני
    if (req.user.role !== 'Service Provider') {
        return res.status(403).json({ msg: 'רק ספק שירות יכול לקבוע תורים ידניים.' });
    }

    // 2. בדיקת קלט
    if (!providerId || !serviceId || !date || !time || !clientName) {
        return res.status(400).json({ msg: 'נא למלא את כל הפרטים (כולל שם הלקוח)' });
    }

    try {
        // חישוב זמנים (אותו דבר כמו בתור רגיל)
        const startTime = new Date(`${date}T${time}`);
        const endTime = new Date(startTime.getTime() + 30 * 60000); // ברירת מחדל: 30 דקות

        // 3. הכנסה לטבלה - שים לב: client_id נשאר ריק (NULL), ושומרים את client_name
        const query = `
            INSERT INTO appointments 
            (provider_id, service_id, start_time, end_time, client_name, client_id, status)
            VALUES ($1, $2, $3, $4, $5, NULL, 'booked')
            RETURNING id
        `;

        await db.query(query, [providerId, serviceId, startTime, endTime, clientName]);

        res.json({ msg: 'התור הידני נקבע בהצלחה!' });

    } catch (err) {
        console.error(err.message);
        res.status(500).send('שגיאה בקביעת התור הידני');
    }
});

// --------------------------------------------------------------------
// [9] Get All Businesses - שליפת רשימת עסקים + תמונה ראשית
// --------------------------------------------------------------------
app.get('/api/businesses', async (req, res) => {
    try {
        // השאילתה החדשה:
        // אנחנו שולפים את כל פרטי העסק (b.*)
        // ומוסיפים עמודה חדשה (image_url) ע"י תת-שאילתה שלוקחת תמונה אחת מטבלת התמונות
        const query = `
            SELECT b.*, 
            (SELECT image_url FROM business_photos bp WHERE bp.user_id = b.user_id LIMIT 1) as image_url
            FROM businesses b
            ORDER BY b.id DESC
        `;

        const result = await db.query(query);
        res.json(result.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// --------------------------------------------------------------------
// [10] Services Management (ניהול שירותים)
// --------------------------------------------------------------------

// 1. הוספת שירות חדש (רק לנותני שירות מחוברים)
app.post('/api/services', authenticateToken, async (req, res) => {
    const { name, description, price, duration } = req.body;
    const providerId = req.user.userId; // המזהה מגיע מהטוקן המאובטח

    // בדיקת הרשאות
    if (req.user.role !== 'Service Provider') {
        return res.status(403).json({ msg: 'רק נותני שירות יכולים להוסיף שירותים' });
    }

    try {
        const query = `
            INSERT INTO services (provider_id, service_name, description, price, duration_minutes)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING *
        `;
        const result = await db.query(query, [providerId, name, description, price, duration]);

        res.json(result.rows[0]); // מחזירים את השירות החדש שנוצר
    } catch (err) {
        console.error(err.message);
        res.status(500).send('שגיאה ביצירת השירות');
    }
});

// 2. קבלת כל השירותים של ספק ספציפי (למשל: כדי להציג בטופס הניהול או ללקוח)
app.get('/api/services/provider/:providerId', async (req, res) => {
    const { providerId } = req.params;
    try {
        const result = await db.query(
            'SELECT * FROM services WHERE provider_id = $1 ORDER BY id ASC',
            [providerId]
        );
        res.json(result.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('שגיאה בטעינת שירותים');
    }
});

// 3. מחיקת שירות (רק למי שיצר אותו)
app.delete('/api/services/:id', authenticateToken, async (req, res) => {
    const serviceId = req.params.id;
    const providerId = req.user.userId;

    try {
        // מחיקה רק אם ה-ID של השירות תואם ל-ID של הספק (אבטחה)
        const result = await db.query(
            'DELETE FROM services WHERE id = $1 AND provider_id = $2 RETURNING *',
            [serviceId, providerId]
        );

        if (result.rows.length === 0) {
            return res.status(403).json({ msg: 'אין הרשאה למחוק את השירות או שהוא לא קיים' });
        }

        res.json({ msg: 'השירות נמחק בהצלחה' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('שגיאה במחיקת השירות');
    }
});

// --------------------------------------------------------------------
// [11] Cancel Appointment - ביטול תור (לקוח או ספק)
// --------------------------------------------------------------------
app.delete('/api/appointments/:id', authenticateToken, async (req, res) => {
    const appointmentId = req.params.id;
    const userId = req.user.userId;
    const userRole = req.user.role;

    try {
        // שלב 1: בדיקה שהתור קיים
        const checkQuery = 'SELECT * FROM appointments WHERE id = $1';
        const checkResult = await db.query(checkQuery, [appointmentId]);

        if (checkResult.rows.length === 0) {
            return res.status(404).json({ msg: 'התור לא נמצא.' });
        }

        const appointment = checkResult.rows[0];

        // שלב 2: בדיקת הרשאות
        // ספק יכול לבטל תורים שלו
        // לקוח יכול לבטל רק את התורים שלו
        if (userRole === 'Service Provider' && appointment.provider_id !== userId) {
            return res.status(403).json({ msg: 'אינך יכול לבטל תור של ספק אחר.' });
        } else if (userRole === 'Client' && appointment.client_id !== userId) {
            return res.status(403).json({ msg: 'אינך יכול לבטל תור של לקוח אחר.' });
        }

        // שלב 3: מחיקת התור
        await db.query('DELETE FROM appointments WHERE id = $1', [appointmentId]);

        res.json({ msg: 'התור בוטל ונמחק בהצלחה.' });

    } catch (err) {
        console.error('Cancel error:', err.message);
        res.status(500).json({ msg: 'שגיאה בביטול התור: ' + err.message });
    }
});

// --------------------------------------------------------------------
// [2] הפעלת השרת
// --------------------------------------------------------------------
initDB().then(() => {
    app.listen(PORT, () => console.log(`שרת Node.js פועל בפורט ${PORT}`));
});

