// פקיד: BookingPro/server/reminderService.js
// שליחת תזכורות אוטומטיות להתורים ליום לפני

const db = require('./db');
const { sendEmail } = require('./emailService');
const cron = require('node-cron');

// עזר: קבל את התאריך של היום בשעון ישראל
const getTodayInIsrael = () => {
    const now = new Date();
    const israelTime = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Jerusalem' }));
    israelTime.setHours(0, 0, 0, 0);
    return israelTime;
};

// פונקציה לעיצוב תאריך לעברית
const formatHebrewDate = (date) => {
    const months = [
        'ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני',
        'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר'
    ];
    const days = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];
    
    return `${days[date.getDay()]}, ${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
};

// פונקציה לעיצוב שעה
const formatTime = (date) => {
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
};

// פונקציה לשליחת תזכורת
const sendAppointmentReminder = async (appointment) => {
    try {
        const appointmentId = appointment.id;
        const clientEmail = appointment.client_email;
        const clientName = appointment.client_name;
        const providerEmail = appointment.provider_email;
        const providerName = appointment.provider_name;
        const businessName = appointment.business_name || 'BookingPro';
        const startTime = new Date(appointment.start_time);
        const hebrewDate = formatHebrewDate(startTime);
        const time = formatTime(startTime);

        // 1. שליחת תזכורת ללקוח
        if (clientEmail) {
            const subjectClient = `⏰ תזכורת: התור שלך ל-${businessName} מחר`;
            const htmlBodyClient = `
                <div style="direction: rtl; font-family: Arial, sans-serif; color: #333;">
                    <h2 style="color: #FF9800;">🔔 תזכורת על התור שלך</h2>
                    <p>היי ${clientName},</p>
                    <p>רוצים להזכיר לך שיש לך תור <strong>מחר</strong> ל-${businessName}!</p>
                    
                    <div style="background-color: #FFF3E0; padding: 15px; border-radius: 8px; border-left: 4px solid #FF9800; margin: 20px 0;">
                        <p style="margin: 5px 0;"><strong>📅 תאריך:</strong> ${hebrewDate}</p>
                        <p style="margin: 5px 0;"><strong>⏰ שעה:</strong> ${time}</p>
                        <p style="margin: 5px 0;"><strong>🏢 עסק:</strong> ${businessName}</p>
                    </div>
                    
                    <p style="color: #d32f2f; font-weight: bold;">⚠️ בבקשה, הגיע בזמן!</p>
                    
                    <br>
                    <p style="font-size: 0.9em; color: #777;">בברכה,<br>צוות BookingPro 📱</p>
                </div>
            `;
            await sendEmail(clientEmail, subjectClient, htmlBodyClient);
            console.log(`✅ תזכורת נשלחה ללקוח: ${clientEmail} (תור מס' ${appointmentId})`);
        }

        // 2. שליחת תזכורת לספק (בעל העסק)
        if (providerEmail) {
            const subjectProvider = `📌 תזכורת: יש לך תור מחר בשעה ${time}`;
            const htmlBodyProvider = `
                <div style="direction: rtl; font-family: Arial, sans-serif; color: #333;">
                    <h2 style="color: #2196F3;">🔔 תזכורת לתור מחר</h2>
                    <p>היי ${providerName},</p>
                    <p>רוצים להזכיר לך שיש לך תור <strong>מחר</strong>!</p>
                    
                    <div style="background-color: #E3F2FD; padding: 15px; border-radius: 8px; border-left: 4px solid #2196F3; margin: 20px 0;">
                        <p style="margin: 5px 0;"><strong>👤 לקוח:</strong> ${clientName}</p>
                        <p style="margin: 5px 0;"><strong>📅 תאריך:</strong> ${hebrewDate}</p>
                        <p style="margin: 5px 0;"><strong>⏰ שעה:</strong> ${time}</p>
                    </div>
                    
                    <p>וודא שאתה מוכן להפגשה!</p>
                    
                    <br>
                    <p style="font-size: 0.9em; color: #777;">בברכה,<br>צוות BookingPro 📱</p>
                </div>
            `;
            await sendEmail(providerEmail, subjectProvider, htmlBodyProvider);
            console.log(`✅ תזכורת נשלחה לספק: ${providerEmail} (תור מס' ${appointmentId})`);
        }

        // 3. הקלטה בטבלה שהתזכורת נשלחה
        await db.query(
            `INSERT INTO appointment_reminders (appointment_id, client_email, provider_email, reminder_type, status)
             VALUES ($1, $2, $3, 'day_before', 'sent')`,
            [appointmentId, clientEmail || null, providerEmail || null]
        );

        return true;
    } catch (error) {
        console.error('❌ שגיאה בשליחת תזכורת:', error);
        return false;
    }
};

// פונקציה ראשית שמחפשת התורים שמגיעים מחר
const checkAndSendReminders = async () => {
    try {
        console.log('🔍 בודק התורים שמגיעים מחר...');

        // מחשבים את התאריך של מחר בקישוט לחציי-לילה (בעברית שעות)
        const today = getTodayInIsrael();
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const dayAfterTomorrow = new Date(tomorrow);
        dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 1);

        // שליפת התורים שיש להם מחר
        const query = `
            SELECT 
                a.id,
                a.client_id,
                a.provider_id,
                a.start_time,
                a.client_name,
                u_client.email as client_email,
                u_client.name as client_name_from_db,
                u_provider.email as provider_email,
                u_provider.name as provider_name,
                b.business_name
            FROM appointments a
            LEFT JOIN users u_client ON a.client_id = u_client.id
            LEFT JOIN users u_provider ON a.provider_id = u_provider.id
            LEFT JOIN businesses b ON u_provider.id = b.user_id
            WHERE 
                a.start_time >= $1 
                AND a.start_time < $2
                AND a.id NOT IN (
                    SELECT appointment_id FROM appointment_reminders 
                    WHERE reminder_type = 'day_before'
                )
        `;

        const result = await db.query(query, [tomorrow, dayAfterTomorrow]);
        const appointments = result.rows;

        if (appointments.length === 0) {
            console.log('✅ אין התורים שמגיעים מחר');
            return;
        }

        console.log(`📨 נמצאו ${appointments.length} התורים שמגיעים מחר`);

        // שליחת תזכורות
        for (const appointment of appointments) {
            // בדיקה שיש לנו לפחות מייל אחד (ללקוח או לספק)
            if (appointment.client_email || appointment.provider_email) {
                // ודא שיש לנו שם לקוח
                const finalClientName = appointment.client_name_from_db || appointment.client_name || 'לקוח';
                
                const appointmentToSend = {
                    ...appointment,
                    client_name: finalClientName
                };

                await sendAppointmentReminder(appointmentToSend);
            }
        }

        console.log(`✅ סיום בדיקה של תזכורות`);
    } catch (error) {
        console.error('❌ שגיאה בבדיקת התזכורות:', error);
    }
};

// התחלת המשימה המחזורית
// רץ כל יום בשעה 08:00 (בזמן השרת)
const startReminderScheduler = () => {
    console.log('📅 הפעלת מתזכר התורים...');
    
    // רץ כל יום בשעה 08:00
    cron.schedule('0 8 * * *', () => {
        console.log('\n⏱️  התחלת בדיקת תזכורות (08:00)');
        checkAndSendReminders();
    });

    console.log('✅ מתזכר התורים מפעיל (בדיקה יומית בשעה 08:00)');
};

module.exports = { startReminderScheduler, checkAndSendReminders, sendAppointmentReminder };
