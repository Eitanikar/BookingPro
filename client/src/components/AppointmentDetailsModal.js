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
            backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex',
            justifyContent: 'center', alignItems: 'center', zIndex: 1000
        }}>

            {/* החלון */}
            <div style={{
                backgroundColor: 'var(--bg-surface)', 
                padding: '30px', 
                borderRadius: '12px',
                width: '400px', 
                maxWidth: '90%', 
                boxShadow: '0 10px 25px rgba(0,0,0,0.3)',
                textAlign: 'center',
                border: '1px solid var(--border-color)'
            }}>
                <h3 style={{ marginTop: 0, color: 'var(--text-main)', marginBottom: '20px' }}>פרטי התור</h3>

                <div style={{ margin: '20px 0', textAlign: 'right', paddingRight: '10px', fontSize: '1rem' }}>
                    <p style={{ margin: '10px 0', color: 'var(--text-muted)' }}>
                        <strong style={{ color: 'var(--text-main)' }}>שירות:</strong> {appointment.title.split('-')[0]}
                    </p>
                    <p style={{ margin: '10px 0', color: 'var(--text-muted)' }}>
                        <strong style={{ color: 'var(--text-main)' }}>לקוח:</strong> {appointment.title.split('-')[1] || 'לא צוין'}
                    </p>
                    <p style={{ margin: '10px 0', color: 'var(--text-muted)' }}>
                        <strong style={{ color: 'var(--text-main)' }}>שעות:</strong> {formatTime(appointment.start)} - {formatTime(appointment.end)}
                    </p>
                </div>

                <hr style={{ border: '0', borderTop: '1px solid var(--border-color)', margin: '20px 0' }} />

                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px' }}>

                    {/* כפתור סגירה */}
                    <button
                        onClick={onClose}
                        style={{
                            padding: '10px 20px', 
                            backgroundColor: 'var(--bg-surface-hover)', 
                            color: 'var(--text-main)',
                            border: '1px solid var(--border-color)', 
                            borderRadius: '6px', 
                            cursor: 'pointer', 
                            flex: 1, 
                            fontWeight: 'bold',
                            transition: 'all 0.2s'
                        }}
                        onMouseEnter={(e) => e.target.style.backgroundColor = 'var(--primary)'}
                        onMouseLeave={(e) => e.target.style.backgroundColor = 'var(--bg-surface-hover)'}
                    >
                        סגור
                    </button>

                    {/* כפתור ביטול תור */}
                    <button
                        onClick={() => onCancel(appointment.id)}
                        style={{
                            padding: '10px 20px', 
                            backgroundColor: '#ef4444', 
                            color: 'white',
                            border: 'none', 
                            borderRadius: '6px', 
                            cursor: 'pointer', 
                            flex: 1, 
                            fontWeight: 'bold',
                            transition: 'all 0.2s'
                        }}
                        onMouseEnter={(e) => e.target.style.backgroundColor = '#dc2626'}
                        onMouseLeave={(e) => e.target.style.backgroundColor = '#ef4444'}
                    >
                        ביטול התור
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AppointmentDetailsModal;
