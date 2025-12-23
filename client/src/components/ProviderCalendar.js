// קובץ: client/src/components/ProviderCalendar.js
import React, { useRef, useState } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import heLocale from '@fullcalendar/core/locales/he';
import ManualAppointmentModal from './ManualAppointmentModal'; // החלון לקביעת תור
import AppointmentDetailsModal from './AppointmentDetailsModal'; // החלון החדש לפרטי תור

const ProviderCalendar = ({ user }) => {
    const calendarRef = useRef(null);

    // --- State לקביעת תור חדש ---
    const [isManualModalOpen, setIsManualModalOpen] = useState(false);
    const [newSlot, setNewSlot] = useState({ dateStr: '', timeStr: '' });

    // --- State לפרטי תור קיים (ביטול) ---
    const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
    const [selectedAppointment, setSelectedAppointment] = useState(null);

    // טעינת אירועים מהשרת
    const fetchEvents = async (fetchInfo, successCallback, failureCallback) => {
        try {
            const token = localStorage.getItem('token');
            const start = fetchInfo.start.toISOString();
            const end = fetchInfo.end.toISOString();

            const response = await fetch(`http://localhost:5000/api/calendar/provider/${user.id}?start=${start}&end=${end}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!response.ok) throw new Error('Failed to fetch');

            const data = await response.json();

            const events = data.map(appt => ({
                id: appt.id,
                title: `${appt.service_name} - ${appt.client_name || 'לקוח מזדמן'}`,
                start: appt.start_time,
                end: appt.end_time,
                backgroundColor: appt.client_id ? '#2196F3' : '#FF9800',
                borderColor: appt.client_id ? '#1976D2' : '#F57C00'
            }));

            successCallback(events);
        } catch (err) {
            console.error('Error loading events:', err);
            failureCallback(err);
        }
    };

    // --- 1. לחיצה על משבצת ריקה (קביעת תור) ---
    const handleDateClick = (arg) => {
        const dateObj = new Date(arg.dateStr);
        setNewSlot({
            dateStr: dateObj.toLocaleDateString('he-IL'),
            timeStr: dateObj.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' }),
            isoDate: arg.dateStr.split('T')[0],
            isoTime: dateObj.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })
        });
        setIsManualModalOpen(true);
    };

    // --- 2. לחיצה על תור קיים (פתיחת פרטים לביטול) ---
    const handleEventClick = (info) => {
        // שולפים את המידע מהאירוע שנלחץ
        setSelectedAppointment({
            id: info.event.id,
            title: info.event.title,
            start: info.event.start,
            end: info.event.end
        });
        setIsDetailsModalOpen(true);
    };

    // --- 3. לוגיקת ביטול תור (נשלח מהמודל החדש) ---
    const handleCancelAppointment = async (appointmentId) => {
        if (!window.confirm('האם אתה בטוח שברצונך לבטל את התור הזה? הפעולה היא סופית.')) return;

        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`http://localhost:5000/api/appointments/${appointmentId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            const data = await res.json();

            if (res.ok) {
                alert('✅ התור בוטל בהצלחה.');
                setIsDetailsModalOpen(false); // סגירת החלון
                // רענון היומן
                if (calendarRef.current) {
                    calendarRef.current.getApi().refetchEvents();
                }
            } else {
                alert('שגיאה: ' + (data.msg || 'לא ניתן לבטל את התור'));
            }
        } catch (err) {
            console.error(err);
            alert('שגיאת תקשורת');
        }
    };

    // --- לוגיקת שמירת תור חדש (מהמודל הישן) ---
    const handleSaveManualAppointment = async (clientName, serviceId) => {
        try {
            const token = localStorage.getItem('token');
            const payload = {
                providerId: user.id,
                serviceId: serviceId,
                date: newSlot.isoDate,
                time: newSlot.isoTime,
                clientName: clientName
            };

            const res = await fetch('http://localhost:5000/api/appointments/manual', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                alert('✅ התור נקבע בהצלחה!');
                setIsManualModalOpen(false);
                if (calendarRef.current) {
                    calendarRef.current.getApi().refetchEvents();
                }
            } else {
                alert('שגיאה בשמירת התור');
            }
        } catch (err) {
            alert('שגיאת תקשורת');
        }
    };

    return (
        <div style={{ padding: '20px', backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 0 10px rgba(0,0,0,0.1)' }}>
            <h2 style={{ textAlign: 'center', marginBottom: '20px' }}>יומן ניהול תורים</h2>

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
                    selectable={true}

                    // אירועים
                    events={fetchEvents}

                    // לחיצה על משבצת ריקה -> קביעת תור
                    dateClick={handleDateClick}

                    // לחיצה על תור קיים -> פרטים וביטול (חדש!)
                    eventClick={handleEventClick}
                />
            </div>

            {/* חלון קביעת תור חדש */}
            <ManualAppointmentModal
                isOpen={isManualModalOpen}
                onClose={() => setIsManualModalOpen(false)}
                onSave={handleSaveManualAppointment}
                bookingData={newSlot}
            />

            {/* חלון פרטי תור וביטול (חדש!) */}
            <AppointmentDetailsModal
                isOpen={isDetailsModalOpen}
                onClose={() => setIsDetailsModalOpen(false)}
                onCancel={handleCancelAppointment}
                appointment={selectedAppointment}
            />
        </div>
    );
};

export default ProviderCalendar;