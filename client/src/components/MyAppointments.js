import React, { useEffect, useState } from 'react';

const MyAppointments = ({ user }) => {
    const [appointments, setAppointments] = useState([]);

    useEffect(() => {
        const fetchAppointments = async () => {
            if (!user) return;
            try {
                const res = await fetch('http://localhost:5000/api/my-appointments', {
                    headers: { 'user-id': user.id } // שולחים את ה-ID של המשתמש
                });
                const data = await res.json();
                setAppointments(data);
            } catch (err) {
                console.error('Error fetching appointments:', err);
            }
        };
        fetchAppointments();
    }, [user]);

    // פונקציה לפרמוט תאריך ושעה
    const formatDate = (isoString) => {
        const date = new Date(isoString);
        return date.toLocaleDateString('he-IL', { weekday: 'long', day: 'numeric', month: 'long' });
    };

    const formatTime = (isoString) => {
        const date = new Date(isoString);
        return date.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' });
    };

    return (
        <div style={{ padding: '20px', maxWidth: '600px', margin: '0 auto' }}>
            <h2 style={{ textAlign: 'center' }}>📅 התורים שלי</h2>
            
            {appointments.length === 0 ? (
                <p style={{ textAlign: 'center' }}>אין לך תורים עתידיים.</p>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                    {appointments.map(appt => (
                        <div key={appt.id} style={{ 
                            borderRight: '5px solid #4CAF50', 
                            backgroundColor: '#f9f9f9', 
                            padding: '15px', 
                            borderRadius: '8px',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center'
                        }}>
                            <div>
                                <h3 style={{ margin: '0 0 5px 0' }}>{appt.service_name}</h3>
                                <p style={{ margin: 0, color: '#666' }}>אצל: {appt.provider_name}</p>
                            </div>
                            
                            {/* --- כאן מוצגים התאריך והשעה --- */}
                            <div style={{ textAlign: 'left' }}>
                                <div style={{ fontWeight: 'bold', fontSize: '1.1em' }}>{formatTime(appt.start_time)}</div>
                                <div style={{ fontSize: '0.9em', color: '#555' }}>{formatDate(appt.start_time)}</div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default MyAppointments;