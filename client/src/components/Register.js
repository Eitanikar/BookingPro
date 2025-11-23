// קובץ: client/src/components/Register.js
import React, { useState } from 'react';

const Register = () => {
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
            } else {
                setMessage(`שגיאת רישום: ${data.msg || 'אירעה שגיאה בשרת.'}`);
            }
        } catch (err) {
            setMessage('שגיאת חיבור לשרת. ודא ששרת Node.js פועל בפורט 5000.');
        }
    };

    return (
        <div style={{ padding: '20px', maxWidth: '400px', margin: 'auto', textAlign: 'center', backgroundColor: '#f0f0f0', borderRadius: '8px' }}>
            <h2>הרשמה למערכת BookingPro</h2>
            <form onSubmit={onSubmit}>
                <input type="text" placeholder="שם מלא" name="name" value={name} onChange={onChange} required style={{ width: '100%', padding: '10px', margin: '8px 0', border: '1px solid #ccc', borderRadius: '4px' }} /><br/>
                <input type="email" placeholder="אימייל" name="email" value={email} onChange={onChange} required style={{ width: '100%', padding: '10px', margin: '8px 0', border: '1px solid #ccc', borderRadius: '4px' }} /><br/>
                <input type="password" placeholder="סיסמה" name="password" value={password} onChange={onChange} required minLength="6" style={{ width: '100%', padding: '10px', margin: '8px 0', border: '1px solid #ccc', borderRadius: '4px' }} /><br/>
                
                <select name="role" value={role} onChange={onChange} style={{ width: '100%', padding: '10px', margin: '8px 0', border: '1px solid #ccc', borderRadius: '4px' }}>
                    <option value="Client">לקוח קצה</option>
                    <option value="Service Provider">נותן שירות</option>
                </select><br/>
                
                <button type="submit" style={{ padding: '10px 20px', backgroundColor: '#2196F3', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', marginTop: '10px' }}>הירשם</button>
            </form>
            {message && <p style={{color: message.includes('הצליחה') ? 'green' : 'red', fontWeight: 'bold', marginTop: '15px'}}>{message}</p>}
        </div>
    );
};

export default Register;