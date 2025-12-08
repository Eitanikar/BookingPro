// קובץ: client/src/components/ProviderCalendar.js
import React, { useRef, useState } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction'; // פלאגין שמאפשר לחיצות
import heLocale from '@fullcalendar/core/locales/he';
import ManualAppointmentModal from './ManualAppointmentModal'; // ייבוא החלון שיצרנו

const ProviderCalendar = ({ user }) => {
    const calendarRef = useRef(null);

    // --- State לניהול החלון הקופץ ---
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedSlot, setSelectedSlot] = useState({ dateStr: '', timeStr: '' });

    // פונקציה לטעינת אירועים מהשרת
    const fetchEvents = async (fetchInfo, successCallback, failureCallback) => {
        try {
            const token = localStorage.getItem('token');
            const start = fetchInfo.start.toISOString();
            const end = fetchInfo.end.toISOString();

            // קריאה לשרת (נתיב שעדכנו במשימה 3)
            const response = await fetch(`http://localhost:5000/api/calendar/provider/${user.id}?start=${start}&end=${end}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!response.ok) throw new Error('Failed to fetch');

            const data = await response.json();

            // המרת הנתונים לפורמט של FullCalendar
            const events = data.map(appt => ({
                id: appt.id,
                title: `${appt.service_name} - ${appt.client_name || 'לקוח מזדמן'}`,
                start: appt.start_time,
                end: appt.end_time,
                // צבע שונה לתור ידני (כתום) ולתור רשום (כחול)
                backgroundColor: appt.client_id ? '#2196F3' : '#FF9800',
                borderColor: appt.client_id ? '#1976D2' : '#F57C00'
            }));

            successCallback(events);
        } catch (err) {
            console.error('Error loading events:', err);
            failureCallback(err);
        }
    };

    // --- אירוע לחיצה על משבצת (Date Click) ---
    const handleDateClick = (arg) => {
        // arg.dateStr מגיע בפורמט ISO. נפרק אותו לתצוגה יפה
        const dateObj = new Date(arg.dateStr);

        const datePart = dateObj.toLocaleDateString('he-IL'); // למשל: 25.10.2023
        const timePart = dateObj.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' }); // למשל: 10:30

        // שמירת הזמן שנבחר ופתיחת החלון
        setSelectedSlot({
            dateStr: datePart, // לתצוגה בחלון
            timeStr: timePart, // לתצוגה בחלון
            isoDate: arg.dateStr.split('T')[0], // תאריך נקי לשרת (YYYY-MM-DD)
            isoTime: timePart // שעה נקייה לשרת
        });

        setIsModalOpen(true);
    };

    // --- שמירת התור (נשלח מהמודל) ---
    const handleSaveManualAppointment = async (clientName, serviceId) => {
        try {
            const token = localStorage.getItem('token');

            // הכנת המידע לשליחה לשרת
            const payload = {
                providerId: user.id,
                serviceId: serviceId,
                date: selectedSlot.isoDate, // התאריך שהקליקו עליו
                time: selectedSlot.isoTime, // השעה שהקליקו עליה
                clientName: clientName
            };

            // שליחה ל-API שיצרנו במשימה 2
            const res = await fetch('http://localhost:5000/api/appointments/manual', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });

            const data = await res.json();

            if (res.ok) {
                alert('✅ התור נקבע בהצלחה!');
                setIsModalOpen(false); // סגירת החלון

                // רענון היומן באופן מיידי
                if (calendarRef.current) {
                    calendarRef.current.getApi().refetchEvents();
                }
            } else {
                alert('שגיאה: ' + (data.msg || 'משהו השתבש'));
            }
        } catch (err) {
            console.error(err);
            alert('שגיאת תקשורת');
        }
    };

    return (
        <div style={{ padding: '20px', backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 0 10px rgba(0,0,0,0.1)' }}>
            <h2 style={{ textAlign: 'center', marginBottom: '20px' }}>יומן ניהול תורים</h2>

            <div className="calendar-wrapper" style={{ direction: 'rtl' }}>
                <FullCalendar
                    ref={calendarRef}
                    plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]} // חובה לכלול את interactionPlugin
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

                    // --- הגדרות הלחיצה ---
                    selectable={true}
                    dateClick={handleDateClick} // הפונקציה שתופעל בלחיצה

                    events={fetchEvents}
                />
            </div>

            {/* --- החלון הקופץ שלנו --- */}
            <ManualAppointmentModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSave={handleSaveManualAppointment}
                bookingData={selectedSlot}
            />
        </div>
    );
};

export default ProviderCalendar;