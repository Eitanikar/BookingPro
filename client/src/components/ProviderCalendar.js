// קובץ: client/src/components/ProviderCalendar.js
import React, { useRef } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import heLocale from '@fullcalendar/core/locales/he';

// מקבלים את האובייקט user כדי לדעת מי הספק המחובר
const ProviderCalendar = ({ user }) => {

    const calendarRef = useRef(null);

    // פונקציה זו תיקרא אוטומטית ע"י FullCalendar בכל פעם שצריך לטעון נתונים
    // (למשל: בטעינה ראשונית, או כשלוחצים על "הבא/הקודם")
    const fetchEvents = async (fetchInfo, successCallback, failureCallback) => {
        try {
            // 1. שליפת הטוקן לצורך אימות
            const token = localStorage.getItem('token');
            if (!token) {
                console.error("No token found");
                failureCallback("No token");
                return;
            }

            // 2. הכנת הפרמטרים לשרת (start ו-end מגיעים מ-FullCalendar)
            const start = fetchInfo.start.toISOString();
            const end = fetchInfo.end.toISOString();

            // 3. ביצוע הקריאה ל-API המאובטח שיצרנו
            const response = await fetch(`http://localhost:5000/api/calendar/provider/${user.id}?start=${start}&end=${end}`, {
                headers: {
                    'Authorization': `Bearer ${token}` // שליחת הטוקן בכותרת
                }
            });

            if (!response.ok) {
                throw new Error('Failed to fetch events');
            }

            const data = await response.json();

            // 4. מיפוי (Mapping) הנתונים מהפורמט של השרת לפורמט של FullCalendar
            // השרת מחזיר: { start_time, end_time, service_name, client_name, ... }
            // היומן צריך: { title, start, end, ... }
            const events = data.map(appt => ({
                id: appt.id,
                title: `${appt.service_name} - ${appt.client_name}`, // הכותרת שתופיע בקוביה
                start: appt.start_time,
                end: appt.end_time,
                backgroundColor: '#2196F3', // צבע רקע לתור
                borderColor: '#1976D2'
            }));

            // 5. עדכון היומן עם האירועים המוכנים
            successCallback(events);

        } catch (err) {
            console.error('Error loading events:', err);
            failureCallback(err);
        }
    };

    return (
        <div style={{ padding: '20px', backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 0 10px rgba(0,0,0,0.1)' }}>
            <h2 style={{ textAlign: 'center', marginBottom: '20px' }}>?? יומן ניהול תורים</h2>

            <div className="calendar-wrapper" style={{ direction: 'rtl' }}>
                <FullCalendar
                    ref={calendarRef}
                    plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
                    initialView="timeGridWeek"
                    headerToolbar={{
                        right: 'prev,next today',
                        center: 'title',
                        left: 'dayGridMonth,timeGridWeek,timeGridDay'
                    }}
                    locale={heLocale}
                    direction="rtl"
                    firstDay={0}
                    slotMinTime="08:00:00"
                    slotMaxTime="22:00:00"
                    allDaySlot={false}
                    height="auto"

                    // --- כאן השינוי הגדול: חיבור הפונקציה ליומן ---
                    events={fetchEvents}
                />
            </div>
        </div>
    );
};

export default ProviderCalendar;