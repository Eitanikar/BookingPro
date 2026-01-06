// קובץ: BookingPro/server/server.js - קוד מתוקן
const express = require('express');
const crypto = require('crypto'); // Built-in module for token generation
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const db = require('./db');
const initDB = require('./initDB');
const { sendEmail } = require('./emailService');
const { startReminderScheduler } = require('./reminderService');

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
    const { email, password, loginAs } = req.body; // loginAs: 'Client' | 'Service Provider'

    // בדיקה שנשלחו פרטים
    if (!email || !password) {
        return res.status(400).json({ msg: 'נא למלא אימייל וסיסמה' });
    }

    console.log('Login request:', { email, loginAs });

    // Default to 'Client' if not specified (backward compatibility)
    const requestedRole = loginAs || 'Client';

    try {
        // 1. בדיקה אם המשתמש קיים ב-DB
        const result = await db.query('SELECT * FROM users WHERE email = $1', [email]);

        if (result.rows.length === 0) {
            return res.status(400).json({ msg: 'פרטים שגויים (משתמש לא נמצא)' });
        }

        const user = result.rows[0];

        // 2. בדיקת התאמת סיסמה
        const isMatch = await bcrypt.compare(password, user.password_hash);

        if (!isMatch) {
            return res.status(400).json({ msg: 'פרטים שגויים (סיסמה לא תואמת)' });
        }

        // 3. בדיקת הרשאות לפי Context
        if (requestedRole === 'Service Provider') {
            if (user.role !== 'Service Provider') {
                return res.status(403).json({ msg: 'אין לך הרשאה להיכנס כעסק. אנא הרשם כספק שירות.' });
            }
        }
        // אם requestedRole === 'Client', כולם יכולים להיכנס (גם ספקים)

        // 4. יצירת Token עם התפקיד *הנבחר* לאותו סשן
        // הסשן הזה יתנהג לפי התפקיד שנבחר בכניסה
        const token = jwt.sign(
            { userId: user.id, role: requestedRole },
            JWT_SECRET,
            { expiresIn: '1h' }
        );

        res.json({
            token,
            user: {
                id: user.id,
                name: user.name,
                role: requestedRole,     // Active role for this session
                originalRole: user.role  // Persist original capability
            }
        });

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
// [4] Appointments Route - קבלת התורים של המשתמש (מעודכן לביקורות)
// --------------------------------------------------------------------
app.get('/api/my-appointments', authenticateToken, async (req, res) => {
    const userId = req.user.userId;
    const role = req.user.role;

    try {
        let query;
        let params = [userId];

        // --- בדיקה: האם המשתמש הוא ספק או לקוח? ---
        if (role === 'Service Provider') {
            // ============================================================
            // לוגיקה לספקים (לא השתנה - נשאר בדיוק כמו בקובץ המקורי שלך)
            // ============================================================
            query = `
                SELECT 
                    a.id, 
                    s.service_name, 
                    COALESCE(u.name, a.client_name) as client_name, 
                    a.client_id,
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
            // ============================================================
            // לוגיקה ללקוחות (מעודכן! הוספנו את business_id לדירוג)
            // ============================================================
            query = `
                SELECT 
                    a.id, 
                    s.service_name, 
                    u.name as provider_name, 
                    a.start_time, 
                    a.status, 
                    s.price,
                    b.id as business_id,    -- שדה חובה לדירוג
                    b.business_name         -- שדה לנוחות תצוגה
                FROM appointments a
                JOIN services s ON a.service_id = s.id
                JOIN users u ON a.provider_id = u.id
                LEFT JOIN businesses b ON u.id = b.user_id -- חיבור לקבלת פרטי העסק
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

    // התחלת טרנזקציה (כדי שאם משהו נכשל, הכל יבוטל)
    const client = await db.query('BEGIN');

    try {
        // וידוא שכל הפרמטרים קיימים
        if (!clientId || !providerId || !serviceId || !date || !time) {
            await db.query('ROLLBACK');
            return res.status(400).json({ msg: 'חסרים פרטים לקביעת התור' });
        }

        // יצירת אובייקט תאריך מלא (Date + Time)
        const startTime = new Date(`${date}T${time}:00`);

        // בדיקה שהתאריך לא בעבר
        const now = new Date();
        if (startTime < now) {
            await db.query('ROLLBACK');
            return res.status(400).json({ msg: 'לא ניתן להזמין תור בתאריך שעבר' });
        }

        const endTime = new Date(startTime.getTime() + 30 * 60000); // מוסיף 30 דקות אוטומטית

        // בדיקה אם התור כבר קיים בשעה זו עם LOCK
        const checkQuery = `
            SELECT id FROM appointments 
            WHERE provider_id = $1 
            AND start_time = $2
            FOR UPDATE
        `;
        const checkResult = await db.query(checkQuery, [providerId, startTime]);

        if (checkResult.rows.length > 0) {
            await db.query('ROLLBACK');
            return res.status(400).json({ msg: 'השעה הזו כבר תפוסה! בחר שעה אחרת.' });
        }

        // הוספת התור (בתוך הטרנזקציה)
        const query = `
            INSERT INTO appointments (client_id, provider_id, service_id, start_time, end_time)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING id
        `;

        const result = await db.query(query, [clientId, providerId, serviceId, startTime, endTime]);

        if (result.rows.length === 0) {
            await db.query('ROLLBACK');
            return res.status(500).json({ msg: 'שגיאה בשמירת התור' });
        }

        // שמירה סופית בדאטה בייס
        await db.query('COMMIT');

        // ==========================================
        // חדש: שליחת מייל לבעל העסק + ללקוח (אחרי שהתור נשמר בהצלחה)
        // ==========================================
        try {
            // 1. שליפת הפרטים: ספק (בעל העסק) + עסק + לקוח
            // נשלוף את שם העסק מהטבלה businesses
            const providerQuery = `
                SELECT u.email, u.name, b.business_name 
                FROM users u
                LEFT JOIN businesses b ON u.id = b.user_id
                WHERE u.id = $1
            `;
            const providerRes = await db.query(providerQuery, [providerId]);
            const provider = providerRes.rows[0];

            // שליפת המייל ושם הלקוח
            // אם המשתמש רשום, נשלוף מהטבלה. אם לא, יכול להיות שאין לנו אימייל (אלא אם הוספנו תמיכה לאורחים, כרגע זה רשומים בלבד)
            let clientEmail = null;
            let clientName = 'לקוח';

            if (clientId) {
                const clientRes = await db.query('SELECT email, name FROM users WHERE id = $1', [clientId]);
                if (clientRes.rows.length > 0) {
                    clientEmail = clientRes.rows[0].email;
                    clientName = clientRes.rows[0].name;
                }
            }

            // A. שליחה לבעל העסק (ספק)
            if (provider && provider.email) {
                const subject = `📅 תור חדש נקבע: ${date} בשעה ${time}`;
                const htmlBody = `
                    <div style="direction: rtl; font-family: Arial, sans-serif; color: #333;">
                        <h2 style="color: #2196F3;">היי ${provider.name},</h2>
                        <p>שמחים לעדכן שנקבע תור חדש בעסק שלך!</p>
                        <div style="background-color: #f9f9f9; padding: 15px; border-radius: 8px; border: 1px solid #eee;">
                            <p style="margin: 5px 0;"><strong>👤 לקוח:</strong> ${clientName}</p>
                            <p style="margin: 5px 0;"><strong>📅 תאריך:</strong> ${date}</p>
                            <p style="margin: 5px 0;"><strong>⏰ שעה:</strong> ${time}</p>
                        </div>
                        <p>התור כבר מופיע ביומן שלך.</p>
                        <br>
                        <p style="font-size: 0.9em; color: #777;">בברכה,<br>צוות BookingPro</p>
                    </div>
                `;
                sendEmail(provider.email, subject, htmlBody);
            }

            // B. שליחה ללקוח (אישור הזמנה)
            if (clientEmail) {
                const businessName = provider.business_name || 'BookPro Business';
                const subjectClient = `✅ אישור הזמנת תור ל-${businessName}`;
                const htmlBodyClient = `
                    <div style="direction: rtl; font-family: Arial, sans-serif; color: #333;">
                        <h2 style="color: #4CAF50;">היי ${clientName},</h2>
                        <p>התור שלך ל-<strong>${businessName}</strong> נקבע בהצלחה!</p>
                        <div style="background-color: #f9f9f9; padding: 15px; border-radius: 8px; border: 1px solid #eee;">
                            <p style="margin: 5px 0;"><strong>📅 תאריך:</strong> ${date}</p>
                            <p style="margin: 5px 0;"><strong>⏰ שעה:</strong> ${time}</p>
                            <p style="margin: 5px 0;"><strong>🏢 עסק:</strong> ${businessName}</p>
                        </div>
                        <p>נתראה בקרוב!</p>
                        <br>
                        <p style="font-size: 0.9em; color: #777;">בברכה,<br>צוות BookingPro</p>
                    </div>
                `;
                console.log(`Sending client confirmation to: ${clientEmail}`);
                sendEmail(clientEmail, subjectClient, htmlBodyClient);
            }

        } catch (emailErr) {
            console.error('⚠️ Failed to send notification email:', emailErr);
            // אנחנו לא עוצרים את התהליך, ההזמנה הצליחה גם אם המייל נכשל
        }
        // ==========================================

        res.json({ msg: 'התור נקבע בהצלחה!', id: result.rows[0].id });

    } catch (err) {
        await db.query('ROLLBACK');
        console.error('Booking error:', err.message);

        if (err.code === '23505') {
            return res.status(400).json({ msg: 'תור זה כבר תפוס! בחר שעה אחרת.' });
        }

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
// [9] Get All Businesses - שליפת עסקים + תמונה + דירוג ממוצע + סינון
// --------------------------------------------------------------------
app.get('/api/businesses', async (req, res) => {
    console.log("🔥🔥🔥 IM THE NEW CODE! 🔥🔥🔥");
    try {
        const { name, city } = req.query; // קבלת פרמטרים לחיפוש (אם יש)
        const params = [];
        const conditions = [];

        // 1. בניית השאילתה
        // אנו שולפים את פרטי העסק, תמונה אחת (תת-שאילתה), ומחשבים ממוצע (AVG)
        let query = `
            SELECT 
                b.*, 
                (SELECT image_url FROM business_photos bp WHERE bp.user_id = b.user_id LIMIT 1) as image_url,
                COALESCE(ROUND(AVG(r.rating), 1), 0) as average_rating,
                COUNT(r.id) as review_count
            FROM businesses b
            LEFT JOIN reviews r ON b.id = r.business_id
        `;

        // 2. הוספת תנאים דינמיים (למנוע החיפוש)
        if (name) {
            conditions.push(`b.business_name ILIKE $${params.length + 1}`);
            params.push(`%${name}%`);
        }
        if (city) {
            conditions.push(`b.address ILIKE $${params.length + 1}`);
            params.push(`%${city}%`);
        }

        if (conditions.length > 0) {
            query += ' WHERE ' + conditions.join(' AND ');
        }

        // 3. חובה להשתמש ב-GROUP BY כשעושים AVG/COUNT
        query += ' GROUP BY b.id';
        
        // 4. סידור התוצאות (חדשים קודם)
        query += ' ORDER BY b.id DESC';

        const result = await db.query(query, params);

        // 5. המרת המספרים (Postgres מחזיר אותם כמחרוזת לפעמים)
        const formattedRows = result.rows.map(row => ({
            ...row,
            average_rating: parseFloat(row.average_rating),
            review_count: parseInt(row.review_count)
        }));

        res.json(formattedRows);

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
// [13] Client Personal Details Management
// --------------------------------------------------------------------

// GET client details
app.get('/api/client-details', authenticateToken, async (req, res) => {
    const userId = req.user.userId;

    try {
        const result = await db.query(
            'SELECT * FROM client_details WHERE user_id = $1',
            [userId]
        );

        if (result.rows.length === 0) {
            return res.json({ user_id: userId });
        }

        res.json(result.rows[0]);
    } catch (err) {
        console.error('Error fetching client details:', err.message);
        res.status(500).json({ msg: 'שגיאה בטעינת הפרטים' });
    }
});

// POST/UPDATE client details
app.post('/api/client-details', authenticateToken, async (req, res) => {
    const userId = req.user.userId;
    const { phone, email, full_name, notes } = req.body;

    try {
        // בדיקה אם קיים רשומה כבר
        const existing = await db.query(
            'SELECT id FROM client_details WHERE user_id = $1',
            [userId]
        );

        let result;
        if (existing.rows.length === 0) {
            // הכנסה חדשה
            result = await db.query(
                `INSERT INTO client_details (user_id, phone, email, full_name, notes, updated_at)
                 VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)
                 RETURNING *`,
                [userId, phone, email, full_name, notes]
            );
        } else {
            // עדכון קיים
            result = await db.query(
                `UPDATE client_details 
                 SET phone = $2, email = $3, full_name = $4, notes = $5, updated_at = CURRENT_TIMESTAMP
                 WHERE user_id = $1
                 RETURNING *`,
                [userId, phone, email, full_name, notes]
            );
        }

        res.json({
            msg: 'הפרטים נשמרו בהצלחה',
            details: result.rows[0]
        });
    } catch (err) {
        console.error('Error saving client details:', err.message);
        res.status(500).json({ msg: 'שגיאה בשמירת הפרטים: ' + err.message });
    }
});

// GET client details by user ID (for providers to see appointment client details)
app.get('/api/client-details/:userId', async (req, res) => {
    const { userId } = req.params;

    try {
        const result = await db.query(
            'SELECT phone, email, full_name, notes FROM client_details WHERE user_id = $1',
            [userId]
        );

        if (result.rows.length === 0) {
            return res.json({});
        }

        res.json(result.rows[0]);
    } catch (err) {
        console.error('Error fetching client details:', err.message);
        res.status(500).json({ msg: 'שגיאה בטעינת הפרטים' });
    }
});

// [14] Manual trigger for appointment reminders (for testing)
// Endpoint to manually check and send reminders
app.post('/api/test/send-reminders', async (req, res) => {
    try {
        const { checkAndSendReminders } = require('./reminderService');
        await checkAndSendReminders();
        res.json({ msg: '✅ בדיקת תזכורות התחילה' });
    } catch (err) {
        console.error('Error triggering reminders:', err.message);
        res.status(500).json({ msg: 'שגיאה בביצוע בדיקה' });
    }
});

// --------------------------------------------------------------------
// [15] Reviews Route - הוספת ביקורת
// --------------------------------------------------------------------
app.post('/api/reviews', authenticateToken, async (req, res) => {
    const { businessId, rating, comment } = req.body;
    const clientId = req.user.userId;

    if (!rating || rating < 1 || rating > 5) {
        return res.status(400).json({ msg: 'דירוג חייב להיות בין 1 ל-5' });
    }

    try {
        // שמירת הביקורת (אם כבר קיימת ביקורת מאותו משתמש לאותו עסק - נעדכן אותה)
        await db.query(`
            INSERT INTO reviews (user_id, business_id, rating, comment)
            VALUES ($1, $2, $3, $4)
            ON CONFLICT (user_id, business_id) 
            DO UPDATE SET rating = $3, comment = $4, created_at = CURRENT_TIMESTAMP;
        `, [clientId, businessId, rating, comment]);

        res.json({ msg: 'הביקורת נשמרה בהצלחה!' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('שגיאה בשמירת הביקורת');
    }
});

// [2] הפעלת השרת
initDB().then(() => {
    // הפעלת מתזכר התורים
    startReminderScheduler();
    
    app.listen(PORT, () => console.log(`שרת Node.js פועל בפורט ${PORT}`));
});

