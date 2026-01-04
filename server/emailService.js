// טוען את המשתנים מקובץ ה-.env
require('dotenv').config(); 
const nodemailer = require('nodemailer');

// הגדרת הטרנספורטר - שואב את הפרטים מהקובץ המאובטח
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER, // לוקח מה-.env
        pass: process.env.EMAIL_PASS  // לוקח מה-.env
    }
});

// פונקציה לשליחת מייל
const sendEmail = async (to, subject, htmlContent) => {
    try {
        const mailOptions = {
            from: `"BookingPro" <${process.env.EMAIL_USER}>`, // השולח הוא המייל של המערכת
            to: to,
            subject: subject,
            html: htmlContent
        };

        const info = await transporter.sendMail(mailOptions);
        console.log('✅ Email sent successfully: ' + info.response);
        return true;
    } catch (error) {
        console.error('❌ Error sending email:', error);
        return false;
    }
};

module.exports = { sendEmail };