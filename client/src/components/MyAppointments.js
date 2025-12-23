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
            <div className="container">
                <h1 className="text-center mb-4">🗓️ יומן הספק שלי</h1>
                {/* מעבירים את המשתמש כ-prop כדי שרכיב היומן יוכל להשתמש ב-ID שלו */}
                <ProviderCalendar user={user} />
            </div>
        );
    }

    // אם הוא לקוח, ממשיכים בלוגיקה הקיימת (רשימת תורים)
    return (
        <div className="container" style={{ maxWidth: '800px' }}>
            <h2 className="text-center mb-4">📅 התורים שלי</h2>

            {isLoading ? (
                <p className="text-center">טוען תורים...</p>
            ) : appointments.length === 0 ? (
                <p className="text-center p-4 bg-surface rounded text-muted">אין לך תורים קרובים. בוא לקבוע!</p>
            ) : (
                <div className="flex flex-col gap-4">
                    {appointments.map(appt => (
                        <div key={appt.id} className="card flex justify-between items-center" style={{ borderRight: '4px solid var(--primary)' }}>
                            <div>
                                <h3 className="mb-2 font-bold">{appt.service_name}</h3>
                                <p className="text-muted m-0">אצל: {appt.provider_name}</p>
                            </div>

                            <div className="text-left">
                                <div className="font-bold text-lg">{formatTime(appt.start_time)}</div>
                                <div className="text-sm text-muted">{formatDate(appt.start_time)}</div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default MyAppointments;