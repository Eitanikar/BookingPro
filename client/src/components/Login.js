// קובץ: client/src/components/Login.js
import React, { useState } from 'react';

const Login = ({ onLoginSuccess }) => {
    const [formData, setFormData] = useState({ email: '', password: '' });
    const [loginContext, setLoginContext] = useState('Client'); // 'Client' or 'Service Provider'
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
                body: JSON.stringify({
                    email,
                    password,
                    loginAs: loginContext
                })
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

            {/* --- טאבים לבחירת סוג כניסה --- */}
            <div className="d-flex justify-content-center mb-4 gap-2">
                <button
                    type="button"
                    className={`btn ${loginContext === 'Client' ? 'btn-primary' : 'btn-outline'}`}
                    onClick={() => setLoginContext('Client')}
                    style={{ flex: 1 }}
                >
                    👤 כלקוח
                </button>
                <button
                    type="button"
                    className={`btn ${loginContext === 'Service Provider' ? 'btn-info' : 'btn-outline'}`}
                    onClick={() => setLoginContext('Service Provider')}
                    style={{ flex: 1 }}
                >
                    💼 כעסק
                </button>
            </div>

            <form onSubmit={onSubmit}>
                <div className="mb-4">
                    <input
                        type="email"
                        placeholder="אימייל"
                        name="email"
                        value={email}
                        onChange={onChange}
                        required
                        id="email-input"
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
                        id="password-input"
                    />
                </div>
                <button type="submit" className={`btn ${loginContext === 'Client' ? 'btn-primary' : 'btn-info'}`} style={{ width: '100%' }} id="login-btn">
                    התחבר {loginContext === 'Client' ? 'כלקוח' : 'כעסק'}
                </button>
                <div className="text-center mt-3">
                    <button
                        type="button"
                        onClick={() => window.dispatchEvent(new CustomEvent('switchView', { detail: 'forgot-password' }))}
                        className="btn btn-link text-decoration-none"
                    >
                        שכחתי סיסמה?
                    </button>
                </div>
            </form>
            {message && <p className="text-center mt-4" style={{ color: '#f43f5e' }}>{message}</p>}
        </div>
    );
};

export default Login;