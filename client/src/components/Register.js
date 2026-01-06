// קובץ: client/src/components/Register.js
import React, { useState } from 'react';

const Register = ({ onRegisterSuccess }) => {
    const [formData, setFormData] = useState({
        name: '', email: '', password: '', role: 'Client',
    });
    const [message, setMessage] = useState('');

    const { name, email, password, role } = formData;

    const onChange = e => setFormData({ ...formData, [e.target.name]: e.target.value });

    const onSubmit = async e => {
        e.preventDefault();
        setMessage('שולח נתונים...');

        try {
            // [1] שליחת בקשה לשרת ה-Node.js
            const res = await fetch('http://localhost:5000/api/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, email, password, role })
            });

            const data = await res.json();

            if (res.ok) {
                setMessage(`ההרשמה הצליחה! ברוך הבא, ${data.user.name}.`);
                if (onRegisterSuccess) onRegisterSuccess();
            } else {
                setMessage(`שגיאת רישום: ${data.msg || 'אירעה שגיאה בשרת.'}`);
            }
        } catch (err) {
            setMessage('שגיאת חיבור לשרת. ודא ששרת Node.js פועל בפורט 5000.');
        }
    };

    return (
        <div className="card auth-container animate-fade-in">
            <h2 className="text-center mb-4">הרשמה למערכת BookingPro</h2>
            <form onSubmit={onSubmit}>
                <div className="mb-4">
                    <input type="text" placeholder="שם מלא" name="name" value={name} onChange={onChange} required />
                </div>
                <div className="mb-4">
                    <input type="email" placeholder="אימייל" name="email" value={email} onChange={onChange} required />
                </div>
                <div className="mb-4">
                    <input type="password" placeholder="סיסמה" name="password" value={password} onChange={onChange} required minLength="6" />
                </div>

                <div className="mb-4">
                    <select name="role" value={role} onChange={onChange}>
                        <option value="Client">לקוח קצה</option>
                        <option value="Service Provider">נותן שירות</option>
                    </select>
                </div>

                <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>הירשם</button>
            </form>
            {message && <p className="text-center mt-4" style={{ color: message.includes('הצליחה') ? '#10b981' : '#f43f5e', fontWeight: 'bold' }}>{message}</p>}
        </div>
    );
};

export default Register;