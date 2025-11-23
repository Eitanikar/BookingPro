// קובץ: client/src/components/Login.js
import React, { useState } from 'react';

const Login = ({ onLoginSuccess }) => {
    const [formData, setFormData] = useState({ email: '', password: '' });
    const [message, setMessage] = useState('');

    const { email, password } = formData;

    const onChange = e => setFormData({ ...formData, [e.target.name]: e.target.value });

    const onSubmit = async e => {
        e.preventDefault();
        setMessage('מתחבר...');
        
        try {
            const res = await fetch('http://localhost:5000/api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });

            const data = await res.json();

            if (res.ok) {
                // הצלחה! מעדכנים את האפליקציה הראשית
                onLoginSuccess(data.user, data.token); 
            } else {
                setMessage(data.msg || 'שגיאת התחברות');
            }
        } catch (err) {
            setMessage('שגיאת תקשורת עם השרת');
        }
    };

    return (
        <div style={{ maxWidth: '400px', margin: '20px auto', padding: '20px', border: '1px solid #ccc', borderRadius: '8px', backgroundColor: '#fff' }}>
            <h2>כניסה למערכת</h2>
            <form onSubmit={onSubmit}>
                <div style={{ marginBottom: '15px' }}>
                    <input 
                        type="email" 
                        placeholder="אימייל" 
                        name="email" 
                        value={email} 
                        onChange={onChange} 
                        required 
                        style={{ width: '100%', padding: '10px', boxSizing: 'border-box' }} 
                    />
                </div>
                <div style={{ marginBottom: '15px' }}>
                    <input 
                        type="password" 
                        placeholder="סיסמה" 
                        name="password" 
                        value={password} 
                        onChange={onChange} 
                        required 
                        style={{ width: '100%', padding: '10px', boxSizing: 'border-box' }} 
                    />
                </div>
                <button type="submit" style={{ width: '100%', padding: '10px', backgroundColor: '#4CAF50', color: 'white', border: 'none', cursor: 'pointer', fontSize: '16px' }}>
                    התחבר
                </button>
            </form>
            {message && <p style={{ color: 'red', marginTop: '10px', textAlign: 'center' }}>{message}</p>}
        </div>
    );
};

export default Login;