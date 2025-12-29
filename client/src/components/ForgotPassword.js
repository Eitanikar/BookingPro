import React, { useState } from 'react';

function ForgotPassword({ onBack }) {
    const [email, setEmail] = useState('');
    const [msg, setMsg] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMsg('');
        setError('');

        try {
            const response = await fetch('http://localhost:5000/api/forgot-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email }),
            });

            const data = await response.json();

            if (response.ok) {
                setMsg(data.msg);
            } else {
                setError(data.msg || 'שגיאה בשליחת הבקשה');
            }
        } catch (err) {
            setError('שגיאת תקשורת עם השרת');
        }
    };

    return (
        <div className="card" style={{ maxWidth: '400px', margin: '40px auto', padding: '20px' }}>
            <h3 className="text-center mb-3">שכחתי סיסמה</h3>
            <p className="text-muted text-center">הכנס את כתובת המייל שלך ונישלח לך קישור לאיפוס הסיסמה.</p>

            {msg && <div className="alert alert-success">{msg}</div>}
            {error && <div className="alert alert-danger">{error}</div>}

            <form onSubmit={handleSubmit}>
                <div className="mb-3">
                    <label className="form-label">כתובת אימייל:</label>
                    <input
                        type="email"
                        className="form-control"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />
                </div>
                <button type="submit" className="btn btn-primary w-100">שלח קישור לאיפוס</button>
            </form>

            <button onClick={onBack} className="btn btn-link w-100 mt-2">
                חזרה לדף הכניסה
            </button>
        </div>
    );
}

export default ForgotPassword;
