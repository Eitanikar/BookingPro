import React, { useState } from 'react';

const BusinessProfileSetup = ({ user, onSaveSuccess }) => {
    const [formData, setFormData] = useState({
        businessName: '',
        address: '',
        phone: '',
        description: ''
    });
    const [msg, setMsg] = useState('');

    const onSubmit = async (e) => {
        e.preventDefault();
        setMsg('שומר נתונים...');
        
        try {
            // שים לב: אנחנו שולחים לפורט 5000 (או 5001 אם שינית)
            const res = await fetch('http://localhost:5000/api/business-profile', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    userId: user.id, 
                    ...formData 
                })
            });
            const data = await res.json();
            
            if (res.ok) {
                setMsg('הפרופיל נוצר בהצלחה! מיד מועבר...');
                setTimeout(() => {
                    onSaveSuccess(); // הפונקציה שתחזיר אותנו לדף הבית
                }, 2000);
            } else {
                setMsg('שגיאה: ' + (data.msg || 'משהו השתבש'));
            }
        } catch (err) {
            setMsg('שגיאת תקשורת עם השרת');
        }
    };

    return (
        <div style={{ maxWidth: '500px', margin: '40px auto', padding: '30px', border: '1px solid #ddd', borderRadius: '12px', backgroundColor: '#fff', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
            <h2 style={{ textAlign: 'center', color: '#333' }}>🏢 הקמת העסק שלך</h2>
            <p style={{ textAlign: 'center', marginBottom: '20px', color: '#666' }}>
                שלום <strong>{user.name}</strong>, מלא את הפרטים כדי שהלקוחות יוכלו למצוא אותך.
            </p>
            
            <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                <div>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>שם העסק *</label>
                    <input 
                        type="text" required 
                        placeholder="למשל: המספרה של יוסי"
                        value={formData.businessName}
                        onChange={e => setFormData({...formData, businessName: e.target.value})}
                        style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ccc' }}
                    />
                </div>

                <div>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>כתובת</label>
                    <input 
                        type="text" 
                        placeholder="רחוב, עיר" 
                        value={formData.address}
                        onChange={e => setFormData({...formData, address: e.target.value})}
                        style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ccc' }}
                    />
                </div>

                <div>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>טלפון לקביעת תורים</label>
                    <input 
                        type="text" 
                        placeholder="050-0000000" 
                        value={formData.phone}
                        onChange={e => setFormData({...formData, phone: e.target.value})}
                        style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ccc' }}
                    />
                </div>

                <div>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>תיאור קצר</label>
                    <textarea 
                        placeholder="ספר לנו על השירותים שלך..." 
                        value={formData.description}
                        onChange={e => setFormData({...formData, description: e.target.value})}
                        style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ccc', height: '80px' }}
                    />
                </div>

                <button type="submit" style={{ padding: '12px', backgroundColor: '#FF9800', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '16px', fontWeight: 'bold', marginTop: '10px' }}>
                    שמור ופתח עסק 🚀
                </button>
            </form>

            {msg && <div style={{ marginTop: '20px', padding: '10px', borderRadius: '6px', backgroundColor: msg.includes('הצלחה') ? '#e8f5e9' : '#ffebee', color: msg.includes('הצלחה') ? '#2e7d32' : '#c62828', textAlign: 'center' }}>
                {msg}
            </div>}
        </div>
    );
};

export default BusinessProfileSetup;