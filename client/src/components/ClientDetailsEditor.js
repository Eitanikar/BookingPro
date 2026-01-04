import React, { useState, useEffect } from 'react';
import './ClientDetailsEditor.css';

const ClientDetailsEditor = ({ user }) => {
    const [details, setDetails] = useState({
        phone: '',
        email: '',
        full_name: '',
        notes: ''
    });
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');
    const [errorMessage, setErrorMessage] = useState('');

    // טעינת הפרטים הקיימים
    useEffect(() => {
        const fetchDetails = async () => {
            try {
                setIsLoading(true);
                const token = localStorage.getItem('token');
                const res = await fetch('http://localhost:5000/api/client-details', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (!res.ok) throw new Error('Failed to fetch details');
                const data = await res.json();
                setDetails(data);
            } catch (err) {
                console.error('Error fetching client details:', err);
                setErrorMessage('שגיאה בטעינת הפרטים');
            } finally {
                setIsLoading(false);
            }
        };

        if (user) {
            fetchDetails();
        }
    }, [user]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setDetails(prev => ({
            ...prev,
            [name]: value
        }));
        setSuccessMessage('');
        setErrorMessage('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSaving(true);
        setErrorMessage('');
        setSuccessMessage('');

        try {
            const token = localStorage.getItem('token');
            const res = await fetch('http://localhost:5000/api/client-details', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(details)
            });

            if (!res.ok) throw new Error('Failed to save details');
            
            const data = await res.json();
            setSuccessMessage('✅ הפרטים נשמרו בהצלחה!');
            
            // הסרת ההודעה אחרי 3 שניות
            setTimeout(() => setSuccessMessage(''), 3000);
        } catch (err) {
            console.error('Error saving details:', err);
            setErrorMessage('שגיאה בשמירת הפרטים. נסה שנית.');
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return (
            <div className="client-details-container">
                <div className="loading-spinner">טוען פרטים...</div>
            </div>
        );
    }

    return (
        <div className="client-details-container">
            <div className="details-card">
                <h2 className="details-title">📋 פרטים אישיים</h2>
                <p className="details-subtitle">
                    עדכן את הפרטים שלך כדי שבעלי העסקים יוכלו ליצור איתך קשר בקלות
                </p>

                {successMessage && (
                    <div className="alert alert-success">
                        {successMessage}
                    </div>
                )}

                {errorMessage && (
                    <div className="alert alert-error">
                        {errorMessage}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="details-form">
                    <div className="form-group">
                        <label htmlFor="full_name">👤 שם מלא</label>
                        <input
                            type="text"
                            id="full_name"
                            name="full_name"
                            value={details.full_name || ''}
                            onChange={handleChange}
                            placeholder="הזן שם מלא"
                            className="form-input"
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="phone">📱 טלפון</label>
                        <input
                            type="tel"
                            id="phone"
                            name="phone"
                            value={details.phone || ''}
                            onChange={handleChange}
                            placeholder="הזן מספר טלפון"
                            className="form-input"
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="email">✉️ דוא"ל</label>
                        <input
                            type="email"
                            id="email"
                            name="email"
                            value={details.email || ''}
                            onChange={handleChange}
                            placeholder="הזן כתובת דוא״ל"
                            className="form-input"
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="notes">📝 הערות נוספות</label>
                        <textarea
                            id="notes"
                            name="notes"
                            value={details.notes || ''}
                            onChange={handleChange}
                            placeholder="הוסף הערות נוספות (למשל הערות מיוחדות, דרישות מיוחדות וכדומה)"
                            className="form-input form-textarea"
                            rows="4"
                        ></textarea>
                    </div>

                    <button
                        type="submit"
                        className="submit-btn"
                        disabled={isSaving}
                    >
                        {isSaving ? '⏳ שומר...' : '💾 שמור פרטים'}
                    </button>
                </form>

                <div className="info-box">
                    <h3>ℹ️ מידע חשוב</h3>
                    <p>
                        הפרטים שלך יהיו נראים לבעלי העסקים כאשר תקביע תור אצלם.
                        זה עוזר להם ליצור איתך קשר בקלות ולתאם את הפרטים של התור.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default ClientDetailsEditor;
