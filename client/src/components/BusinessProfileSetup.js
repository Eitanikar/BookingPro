import React, { useState, useEffect } from 'react';
import ServiceManagement from './ServiceManagement';
import ProviderAvailabilitySetup from './ProviderAvailabilitySetup';

const BusinessProfileSetup = ({ user, onSaveSuccess }) => {
    // --- State לפרטי העסק ---
    const [formData, setFormData] = useState({
        businessName: '',
        address: '',
        phone: '',
        description: ''
    });

    // --- State לגלריה ---
    const [photos, setPhotos] = useState([]);

    // --- State להודעות ---
    const [msg, setMsg] = useState('');

    // טעינת התמונות כשהדף עולה
    useEffect(() => {
        fetchPhotos();
    }, []);

    const fetchPhotos = async () => {
        try {
            const res = await fetch(`http://localhost:5000/api/photos/${user.id}`);
            const data = await res.json();
            if (res.ok) setPhotos(data);
        } catch (err) {
            console.error('Error fetching photos');
        }
    };

    // פונקציה לשמירת פרטי העסק (הטופס העליון)
    const onSaveProfile = async (e) => {
        e.preventDefault();
        setMsg('שומר נתונים...');

        try {
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
                setMsg('פרטי העסק עודכנו בהצלחה!');
                // לא עושים Redirect אוטומטי כדי לאפשר לו להעלות תמונות
            } else {
                setMsg('שגיאה: ' + (data.msg || 'משהו השתבש'));
            }
        } catch (err) {
            setMsg('שגיאת תקשורת עם השרת');
        }
    };

    // --- לוגיקה להעלאת תמונות (Base64) ---

    const convertToBase64 = (file) => {
        return new Promise((resolve, reject) => {
            const fileReader = new FileReader();
            fileReader.readAsDataURL(file);
            fileReader.onload = () => {
                resolve(fileReader.result);
            };
            fileReader.onerror = (error) => {
                reject(error);
            };
        });
    };

    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setMsg('מעלה תמונה...');

        try {
            // המרה ל-Base64
            const base64 = await convertToBase64(file);

            // שליחה לשרת
            const res = await fetch('http://localhost:5000/api/photos', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: user.id, imageUrl: base64 })
            });

            if (res.ok) {
                setMsg('✅ התמונה הועלתה בהצלחה!');
                setTimeout(() => setMsg(''), 3000);
                fetchPhotos(); // רענון הגלריה
            } else {
                setMsg('❌ שגיאה בהעלאת התמונה');
            }
        } catch (err) {
            setMsg('❌ שגיאה בהעלאת התמונה');
        }
    };

    // פונקציה למחיקת תמונה
    const handleDeletePhoto = async (photoId) => {
        alert('DEBUG: Clicked Delete Photo, ID: ' + photoId);
        console.log('DEBUG: handleDeletePhoto triggered', photoId);

        if (!window.confirm('האם אתה בטוח שברצונך למחוק את התמונה?')) {
            return;
        }

        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`http://localhost:5000/api/photos/${photoId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (res.ok) {
                setMsg('✅ התמונה נמחקה בהצלחה!');
                alert('התמונה נמחקה בהצלחה!');
                setTimeout(() => setMsg(''), 3000);
                fetchPhotos(); // רענון הגלריה
            } else {
                const data = await res.json();
                const errorMsg = data.msg || 'בעיה בשרת';
                setMsg('❌ שגיאה במחיקה: ' + errorMsg);
                alert('שגיאה במחיקה: ' + errorMsg);
            }
        } catch (err) {
            setMsg('❌ שגיאת תקשורת');
            alert('שגיאת תקשורת: ' + err.message);
        }
    };

    return (
        <div style={{ maxWidth: '600px', 
            margin: '40px auto', 
            padding: '30px', 
            border: '1px solid #ddd', 
            borderRadius: '12px', 
            backgroundColor: '#fff', 
            boxShadow: '0 4px 6px rgba(0,0,0,0.1)' ,
            color: '#333'
            }}>
            <h2 style={{ textAlign: 'center', color: '#333' }}>🏢 ניהול העסק שלך</h2>
            <p style={{ textAlign: 'center', marginBottom: '20px', color: '#666' }}>
                שלום <strong>{user.name}</strong>, כאן תוכל לערוך את פרטי העסק ולנהל את הגלריה.
            </p>

            {/* --- חלק א: טופס פרטי העסק --- */}
            <h3 style={{ borderBottom: '1px solid #eee', paddingBottom: '10px' }}>1. פרטים כלליים</h3>
            <form onSubmit={onSaveProfile} style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginBottom: '30px' }}>
                <div>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>שם העסק *</label>
                    <input
                        type="text" required
                        placeholder="למשל: המספרה של יוסי"
                        value={formData.businessName}
                        onChange={e => setFormData({ ...formData, businessName: e.target.value })}
                        style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ccc' }}
                    />
                </div>

                <div>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>כתובת</label>
                    <input
                        type="text"
                        placeholder="רחוב, עיר"
                        value={formData.address}
                        onChange={e => setFormData({ ...formData, address: e.target.value })}
                        style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ccc' }}
                    />
                </div>

                <div>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>טלפון לקביעת תורים</label>
                    <input
                        type="text"
                        placeholder="050-0000000"
                        value={formData.phone}
                        onChange={e => setFormData({ ...formData, phone: e.target.value })}
                        style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ccc' }}
                    />
                </div>

                <div>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>תיאור קצר</label>
                    <textarea
                        placeholder="ספר לנו על השירותים שלך..."
                        value={formData.description}
                        onChange={e => setFormData({ ...formData, description: e.target.value })}
                        style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ccc', height: '80px' }}
                    />
                </div>

                <button type="submit" style={{ padding: '12px', backgroundColor: '#FF9800', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '16px', fontWeight: 'bold', marginTop: '10px' }}>
                    שמור פרטים
                </button>
            </form>

            {/* --- חלק ב: גלריה --- */}
            <h3 style={{ borderBottom: '1px solid #eee', paddingBottom: '10px' }}>2. גלריית תמונות</h3>
            <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '10px' }}>בחר תמונה להעלאה מהמחשב:</label>
                <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    style={{ marginBottom: '15px' }}
                />

                {/* רשת תמונות */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: '10px' }}>
                    {photos.map(photo => (
                        <div
                            key={photo.id}
                            style={{
                                position: 'relative',
                                height: '120px',
                                border: '1px solid #ddd',
                                borderRadius: '8px',
                                overflow: 'hidden',
                                backgroundColor: '#f5f5f5'
                            }}
                        >
                            <img
                                src={photo.image_url}
                                alt="Business"
                                style={{
                                    width: '100%',
                                    height: '100%',
                                    objectFit: 'cover'
                                }}
                            />
                            {/* כפתור מחיקה */}
                            <button
                                type="button"
                                onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    if (!photo.id) {
                                        alert('Error: Photo ID is missing');
                                        return;
                                    }
                                    handleDeletePhoto(photo.id);
                                }}
                                style={{
                                    position: 'absolute',
                                    top: '4px',
                                    right: '4px',
                                    backgroundColor: 'rgba(220, 53, 69, 0.9)',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '50%',
                                    width: '28px',
                                    height: '28px',
                                    fontSize: '16px',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    transition: 'background-color 0.2s',
                                    zIndex: 100
                                }}
                                onMouseEnter={(e) => e.target.style.backgroundColor = 'rgba(220, 53, 69, 1)'}
                                onMouseLeave={(e) => e.target.style.backgroundColor = 'rgba(220, 53, 69, 0.9)'}
                                title="מחיקה"
                            >
                                ✕
                            </button>
                        </div>
                    ))}
                </div>
                {photos.length === 0 && <p style={{ fontSize: '0.9em', color: '#888' }}>אין תמונות בגלריה עדיין.</p>}
            </div>

            {/* --- חלק ג: ניהול שירותים --- */}
            <h3 style={{ borderBottom: '1px solid #eee', paddingBottom: '10px', marginTop: '30px' }}>3. שירותים ומחירון</h3>
            <div style={{ marginBottom: '30px' }}>
                <ServiceManagement user={user} />
            </div>

            {/* --- חלק ד: ניהול יומן זמינות --- */}
            <h3 style={{ borderBottom: '1px solid #eee', paddingBottom: '10px', marginTop: '30px' }}>4. שעות עבודה</h3>
            <div style={{ marginBottom: '30px' }}>
                <ProviderAvailabilitySetup user={user} />
            </div>

            {/* הודעות מערכת */}
            {msg && <div style={{ marginTop: '20px', padding: '10px', borderRadius: '6px', backgroundColor: msg.includes('הצלחה') ? '#e8f5e9' : '#ffebee', color: msg.includes('הצלחה') ? '#2e7d32' : '#c62828', textAlign: 'center' }}>
                {msg}
            </div>}

            <button onClick={() => onSaveSuccess()} style={{ marginTop: '20px', width: '100%', padding: '12px', backgroundColor: '#eee', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>
                חזרה לדף הבית
            </button>
        </div>
    );
};

export default BusinessProfileSetup;