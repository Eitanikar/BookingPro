import React, { useState, useEffect } from 'react';
import FullCalendar from '@fullcalendar/react';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import heLocale from '@fullcalendar/core/locales/he';
import './Calendar.css'; // Modern styles override

const ProviderAvailability = ({ user }) => {
    const [events, setEvents] = useState([]);
    const [msg, setMsg] = useState('');

    useEffect(() => {
        if (user) {
            fetchAvailability();
        }
    }, [user]);

    const fetchAvailability = async () => {
        try {
            const res = await fetch(`http://localhost:5000/api/provider/availability/${user.id}`);
            const data = await res.json();

            // המרה לפורמט של FullCalendar
            const calendarEvents = data.map(item => ({
                id: item.id,
                start: item.start_time,
                end: item.end_time,
                title: 'פנוי',
                backgroundColor: '#4CAF50',
                borderColor: '#4CAF50'
            }));
            setEvents(calendarEvents);
        } catch (err) {
            console.error('Error fetching availability:', err);
        }
    };

    const handleSelect = async (selectInfo) => {
        const title = 'פנוי';
        const calendarApi = selectInfo.view.calendar;

        calendarApi.unselect(); // clear date selection

        if (window.confirm(`האם להגדיר את השעות ${selectInfo.startStr.slice(11, 16)} - ${selectInfo.endStr.slice(11, 16)} כזמינות?`)) {
            const token = localStorage.getItem('token');
            try {
                const res = await fetch('http://localhost:5000/api/provider/availability', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        start: selectInfo.startStr,
                        end: selectInfo.endStr
                    })
                });

                if (res.ok) {
                    const newEvent = await res.json();
                    setEvents([...events, {
                        id: newEvent.id,
                        start: newEvent.start_time,
                        end: newEvent.end_time,
                        title: 'פנוי',
                        backgroundColor: '#4CAF50'
                    }]);
                    setMsg('הזמינות נשמרה!');
                } else {
                    const text = await res.text();
                    console.error('Save error:', text);
                    alert('שגיאה בשמירה: ' + text);
                }
            } catch (err) {
                console.error(err);
                alert('שגיאת תקשורת: ' + err.message);
            }
        }
    };

    const handleEventClick = async (clickInfo) => {
        if (window.confirm(`האם למחוק את הזמינות הזו?`)) {
            const token = localStorage.getItem('token');
            try {
                const res = await fetch(`http://localhost:5000/api/provider/availability/${clickInfo.event.id}`, {
                    method: 'DELETE',
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });

                if (res.ok) {
                    clickInfo.event.remove(); // הסרה מהתצוגה
                    setMsg('נמחק בהצלחה');
                } else {
                    alert('שגיאה במחיקה');
                }
            } catch (err) {
                alert('שגיאת תקשורת');
            }
        }
    };

    return (
        <div style={{ padding: '20px' }}>
            <h3 className="text-center mb-4">ניהול יומן זמינות</h3>
            <p className="text-center mb-4 text-muted">גרור את העכבר על גבי היומן כדי לסמן שעות שבהן אתה רוצה לקבל לקוחות.</p>

            {msg && <p className="text-center text-success font-bold mb-3">{msg}</p>}

            {events.length === 0 && (
                <div className="alert alert-info text-center mb-4">
                    ⚠️ עדיין לא הגדרת אף זמינות. לקוחות לא יוכלו להזמין תורים עד שתגדיר זמינות!
                </div>
            )}

            <div style={{ height: '600px', backgroundColor: 'white', padding: '10px', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
                <FullCalendar
                    plugins={[timeGridPlugin, interactionPlugin]}
                    initialView="timeGridWeek"
                    locale={heLocale}
                    direction="rtl"
                    headerToolbar={{
                        left: 'prev,next today',
                        center: 'title',
                        right: 'timeGridWeek,timeGridDay'
                    }}
                    slotMinTime="07:00:00"
                    slotMaxTime="23:00:00"
                    slotDuration="00:30:00"
                    slotLabelInterval="00:30:00"
                    allDaySlot={false}
                    selectable={true}
                    selectMirror={true}
                    weekends={true}
                    events={events}
                    select={handleSelect}
                    eventClick={handleEventClick}
                    height="100%"
                />
            </div>
        </div>
    );
};

export default ProviderAvailability;
