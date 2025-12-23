// קובץ: client/src/components/AppointmentDetailsModal.js
import React from 'react';

const AppointmentDetailsModal = ({ isOpen, onClose, onCancel, appointment }) => {

    // אם החלון סגור או שאין מידע על התור - לא מציגים כלום
    if (!isOpen || !appointment) return null;

    // פונקציה לעיצוב השעה לתצוגה יפה
    const formatTime = (dateObj) => {
        return dateObj.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' });
    };

    return (
        // מסך רקע כהה (Overlay)
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex',
            justifyContent: 'center', alignItems: 'center', zIndex: 1000
        }}>

            {/* החלון הלבן */}
            <div style={{
                backgroundColor: 'white', padding: '25px', borderRadius: '12px',
                width: '400px', maxWidth: '90%', boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
                textAlign: 'center'
            }}>
                <h3 style={{ marginTop: 0, color: '#333' }}>פרטי תור</h3>

                <div style={{ margin: '20px 0', textAlign: 'right', paddingRight: '20px', fontSize: '1.1em' }}>
                    <p><strong>לקוח:</strong> {appointment.title.split('-')[1] || 'לא צוין'}</p>
                    <p><strong>שירות:</strong> {appointment.title.split('-')[0]}</p>
                    <p><strong>שעות:</strong> {formatTime(appointment.start)} - {formatTime(appointment.end)}</p>
                </div>

                <hr style={{ border: '0', borderTop: '1px solid #eee', margin: '20px 0' }} />

                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px' }}>

                    {/* כפתור סגירה (אפור) */}
                    <button
                        onClick={onClose}
                        style={{
                            padding: '10px 20px', backgroundColor: '#e5e7eb', color: '#374151',
                            border: 'none', borderRadius: '6px', cursor: 'pointer', flex: 1, fontWeight: 'bold'
                        }}
                    >
                        סגור
                    </button>

                    {/* כפתור ביטול תור (אדום) */}
                    <button
                        onClick={() => onCancel(appointment.id)}
                        style={{
                            padding: '10px 20px', backgroundColor: '#ef4444', color: 'white',
                            border: 'none', borderRadius: '6px', cursor: 'pointer', flex: 1, fontWeight: 'bold'
                        }}
                    >
                        🗑️ בטל תור
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AppointmentDetailsModal;
