// קובץ: BookingPro/server/server.js - קוד מתוקן
const express = require('express');
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
                
                -- כאן הקסם: אם יש שם משתמש רשום, קח אותו. אם לא, קח את השם הידני.
                COALESCE(u.name, a.client_name) AS client_name,
                
                a.client_id
            FROM appointments a
            JOIN services s ON a.service_id = s.id
            LEFT JOIN users u ON a.client_id = u.id  -- שינינו מ-JOIN ל-LEFT JOIN
            WHERE
                a.provider_id = $1
                AND a.start_time >= $2
                AND a.start_time <= $3
            ORDER BY a.start_time ASC
        `;

        const result = await db.query(query, [providerId, start, end]);
        res.json(result.rows);

    } catch (err) {
        console.error('Error fetching provider calendar:', err.message);
        res.status(500).send('שגיאת שרת בשליפת היומן.');
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
// [2] הפעלת השרת
// --------------------------------------------------------------------
initDB().then(() => {
    app.listen(PORT, () => console.log(`שרת Node.js פועל בפורט ${PORT}`));
});

