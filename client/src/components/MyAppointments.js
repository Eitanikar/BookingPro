// קובץ: client/src/components/MyAppointments.js - קוד מעודכן
import React, { useEffect, useState } from 'react';
import ProviderCalendar from './ProviderCalendar'; // ייבוא רכיב היומן

const MyAppointments = ({ user }) => {
    const [appointments, setAppointments] = useState([]);
    const [isLoading, setIsLoading] = useState(true); // חדש: מצב טעינה

    // בדיקה: אם המשתמש הוא ספק שירות, נציג את היומן במקום רשימת התורים
    const isServiceProvider = user && user.role === 'Service Provider';

    useEffect(() => {
        const fetchAppointments = async () => {
            if (!user || isServiceProvider) {
                setIsLoading(false); // אין צורך לטעון תורים רגילים אם הוא ספק
                return;
            }

            try {
                // שימו לב: כאן עדיין משתמשים בשיטה הישנה של user-id
                // לשיפור אבטחה (שכבר יושמה ביומן ספק) יש לעדכן גם את ה-API הזה!
                const res = await fetch('http://localhost:5000/api/my-appointments', {
                    headers: { 'user-id': user.id } // שולחים את ה-ID של המשתמש
                });
                const data = await res.json();
                setAppointments(data);
            } catch (err) {
                console.error('Error fetching appointments:', err);
            } finally {
                setIsLoading(false);
            }
        };
        fetchAppointments();
    }, [user, isServiceProvider]);

    // פונקציה לפרמוט תאריך ושעה (היה קודם, נשאר)
    const formatDate = (isoString) => {
        const date = new Date(isoString);
        return date.toLocaleDateString('he-IL', { weekday: 'long', day: 'numeric', month: 'long' });
    };

    const formatTime = (isoString) => {
        const date = new Date(isoString);
        return date.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' });
    };

    // --- לוגיקת הצגה: ספק או לקוח ---

    // אם המשתמש הוא ספק שירות - מציגים את היומן!
    if (isServiceProvider) {
        return (
            <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
                <h1 style={{ textAlign: 'center' }}>🗓️ יומן הספק שלי</h1>
                {/* מעבירים את המשתמש כ-prop כדי שרכיב היומן יוכל להשתמש ב-ID שלו */}
                <ProviderCalendar user={user} />
            </div>
        );
    }

    // אם הוא לקוח, ממשיכים בלוגיקה הקיימת (רשימת תורים)
    return (
        <div style={{ padding: '20px', maxWidth: '600px', margin: '0 auto' }}>
            <h2 style={{ textAlign: 'center' }}>📅 התורים שלי</h2>

            {isLoading ? (
                <p style={{ textAlign: 'center' }}>טוען תורים...</p>
            ) : appointments.length === 0 ? (
                <p style={{ textAlign: 'center', marginTop: '20px', padding: '15px', backgroundColor: '#f0f8ff', borderRadius: '8px' }}>אין לך תורים קרובים. בוא לקבוע!</p>
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