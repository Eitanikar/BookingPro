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
        <div className="card auth-container animate-fade-in">
            <h2 className="text-center mb-4">כניסה למערכת</h2>
            <form onSubmit={onSubmit}>
                <div className="mb-4">
                    <input
                        type="email"
                        placeholder="אימייל"
                        name="email"
                        value={email}
                        onChange={onChange}
                        required
                    />
                </div>
                <div className="mb-4">
                    <input
                        type="password"
                        placeholder="סיסמה"
                        name="password"
                        value={password}
                        onChange={onChange}
                        required
                    />
                </div>
                <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
                    התחבר
                </button>
            </form>
            {message && <p className="text-center mt-4" style={{ color: '#f43f5e' }}>{message}</p>}
        </div>
    );
};

export default Login;