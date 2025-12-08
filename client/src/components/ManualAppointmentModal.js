// קובץ: client/src/components/ManualAppointmentModal.js
import React, { useState, useEffect } from 'react';

const ManualAppointmentModal = ({ isOpen, onClose, onSave, bookingData }) => {
    // State לשמירת הנתונים שהספק מקליד
    const [clientName, setClientName] = useState('');
    const [serviceId, setServiceId] = useState('');

    // רשימת השירותים
    const [services, setServices] = useState([]);

    // *** מחקנו מכאן את ה-loading ***

    // בעת טעינת החלון: נביא את רשימת השירותים מהשרת
    useEffect(() => {
        if (isOpen) {
            fetchServices();
            // איפוס שדות
            setClientName('');
            setServiceId('');
        }
    }, [isOpen]);

    const fetchServices = async () => {
        try {
            const res = await fetch('http://localhost:5000/api/services');
            const data = await res.json();
            setServices(data);
            // *** מחקנו מכאן את setLoading(false) ***
        } catch (err) {
            console.error('Error loading services:', err);
        }
    };

    // פונקציה לשמירה
    const handleSubmit = () => {
        if (!clientName || !serviceId) {
            alert('נא למלא שם לקוח ולבחור שירות');
            return;
        }
        onSave(clientName, serviceId);
    };

    // אם החלון סגור - לא מציגים כלום
    if (!isOpen) return null;

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex',
            justifyContent: 'center', alignItems: 'center', zIndex: 1000
        }}>
            <div style={{
                backgroundColor: 'white', padding: '20px', borderRadius: '8px',
                width: '350px', maxWidth: '90%', boxShadow: '0 4px 10px rgba(0,0,0,0.2)'
            }}>
                <h3 style={{ textAlign: 'center', marginTop: 0 }}>קביעת תור ידנית</h3>

                <p style={{ margin: '10px 0', fontSize: '0.9em', color: '#666' }}>
                    תאריך: {bookingData?.dateStr} <br />
                    שעה: {bookingData?.timeStr}
                </p>

                <div style={{ marginBottom: '15px' }}>
                    <label style={{ display: 'block', marginBottom: '5px' }}>שם הלקוח:</label>
                    <input
                        type="text"
                        placeholder="למשל: דני כהן (טלפון)"
                        value={clientName}
                        onChange={(e) => setClientName(e.target.value)}
                        style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }}
                    />
                </div>

                <div style={{ marginBottom: '20px' }}>
                    <label style={{ display: 'block', marginBottom: '5px' }}>סוג שירות:</label>
                    <select
                        value={serviceId}
                        onChange={(e) => setServiceId(e.target.value)}
                        style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }}
                    >
                        <option value="">-- בחר שירות --</option>
                        {services.map(s => (
                            <option key={s.id} value={s.id}>
                                {s.service_name} ({s.duration_minutes} דק') - ₪{s.price}
                            </option>
                        ))}
                    </select>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <button
                        onClick={onClose}
                        style={{ padding: '8px 15px', backgroundColor: '#ccc', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                    >
                        ביטול
                    </button>
                    <button
                        onClick={handleSubmit}
                        style={{ padding: '8px 15px', backgroundColor: '#4CAF50', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                    >
                        שמור תור
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ManualAppointmentModal;