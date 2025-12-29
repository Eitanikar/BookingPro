import React, { useState } from 'react';

function ResetPassword({ token, onResetSuccess }) {
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [msg, setMsg] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMsg('');
        setError('');

        if (password !== confirmPassword) {
            setError('הסיסמאות אינן תואמות');
            return;
        }

        try {
            const response = await fetch('http://localhost:5000/api/reset-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token, newPassword: password }),
            });

            const data = await response.json();

            if (response.ok) {
                setMsg(data.msg);
                setTimeout(() => {
                    onResetSuccess(); // חזרה לדף הבית/כניסה
                }, 3000);
            } else {
                setError(data.msg || 'שגיאה באיפוס הסיסמה');
            }
        } catch (err) {
            setError('שגיאת תקשורת עם השרת');
        }
    };

    return (
        <div className="card" style={{ maxWidth: '400px', margin: '40px auto', padding: '20px' }}>
            <h3 className="text-center mb-3">איפוס סיסמה</h3>

            {msg && <div className="alert alert-success">{msg}</div>}
            {error && <div className="alert alert-danger">{error}</div>}

            {!msg && (
                <form onSubmit={handleSubmit}>
                    <div className="mb-3">
                        <label className="form-label">סיסמה חדשה:</label>
                        <input
                            type="password"
                            className="form-control"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            minLength="6"
                        />
                    </div>
                    <div className="mb-3">
                        <label className="form-label">אימות סיסמה:</label>
                        <input
                            type="password"
                            className="form-control"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                        />
                    </div>
                    <button type="submit" className="btn btn-success w-100">עדכן סיסמה</button>
                </form>
            )}
        </div>
    );
}

export default ResetPassword;
