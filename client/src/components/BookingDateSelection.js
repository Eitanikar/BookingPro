import React, { useState, useEffect } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import heLocale from '@fullcalendar/core/locales/he'; // Hebrew locale

const BookingDateSelection = ({ service, business, user, onBack, onBookingSuccess }) => {
    const [selectedDate, setSelectedDate] = useState('');
    const [slots, setSlots] = useState([]);
    const [selectedTime, setSelectedTime] = useState(null);
    const [loading, setLoading] = useState(false);
    const [booking, setBooking] = useState(false);
    const [msg, setMsg] = useState('');

    useEffect(() => {
        if (selectedDate) {
            fetchAvailability(selectedDate);
        }
    }, [selectedDate]);

    const fetchAvailability = async (date) => {
        setLoading(true);
        setMsg('');
        setSlots([]);
        setSelectedTime(null);

        try {
            const res = await fetch(`http://localhost:5000/api/availability?providerId=${business.user_id}&date=${date}`);
            if (!res.ok) throw new Error('Failed to fetch');
            const data = await res.json();
            setSlots(data);
        } catch (err) {
            console.error(err);
            setMsg('שגיאה בטעינת תורים פנויים');
        } finally {
            setLoading(false);
        }
    };

    const handleDateClick = (arg) => {
        // Prevent clicking past dates if needed, but API usually handles it
        // Or simple check:
        const clickedDate = new Date(arg.dateStr);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (clickedDate < today) {
            // Optional: alert('לא ניתן לבחור תאריך עבר');
            // return;
        }

        setSelectedDate(arg.dateStr);
    };

    const handleBook = async () => {
        if (!selectedDate || !selectedTime) return;
        if (!user) {
            alert('עליך להתחבר כדי לקבוע תור');
            return;
        }

        setBooking(true);
        try {
            const res = await fetch('http://localhost:5000/api/book', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    clientId: user.id,
                    providerId: business.user_id,
                    serviceId: service.id,
                    date: selectedDate,
                    time: selectedTime
                })
            });
            const data = await res.json();
            if (res.ok) {
                onBookingSuccess();
            } else {
                setMsg('שגיאה: ' + data.msg);
            }
        } catch (err) {
            setMsg('שגיאת תקשורת');
        } finally {
            setBooking(false);
        }
    };

    return (
        <div className="container animate-fade-in" style={{ maxWidth: '900px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>

            <div className="d-flex justify-content-between align-items-center mb-3">
                <button onClick={onBack} className="btn btn-secondary">&larr; חזרה</button>
                <h2 className="m-0">קביעת תור ל{service.service_name}</h2>
            </div>

            <div className="row">
                {/* --- עמודה ימנית: לוח שנה --- */}
                <div className="col-md-7 mb-4">
                    <div className="card p-3 shadow-sm">
                        <FullCalendar
                            plugins={[dayGridPlugin, interactionPlugin]}
                            initialView="dayGridMonth"
                            locale={heLocale}
                            direction="rtl"
                            headerToolbar={{
                                start: 'title',
                                center: '',
                                end: 'prev,next'
                            }}
                            height="auto"
                            selectable={true}
                            dateClick={handleDateClick}
                            validRange={{
                                start: new Date().toISOString().split('T')[0] // Disable past dates visually
                            }}
                        />
                    </div>
                </div>

                {/* --- עמודה שמאלית: בחירת שעה --- */}
                <div className="col-md-5">
                    <div className="card p-4 shadow-sm h-100">
                        <h4 className="text-center mb-3">
                            {selectedDate ? `תאריך נבחר: ${selectedDate}` : 'בחר תאריך בלוח השנה'}
                        </h4>

                        {!selectedDate && (
                            <p className="text-center text-muted mt-4">
                                לחץ על יום בלוח השנה כדי לראות שעות פנויות.
                            </p>
                        )}

                        {loading && <p className="text-center">טוען שעות...</p>}

                        {selectedDate && !loading && slots.length === 0 && (
                            <div className="alert alert-warning text-center">אין תורים פנויים ביום זה.</div>
                        )}

                        {slots.length > 0 && (
                            <div className="d-flex flex-wrap gap-2 justify-content-center mt-2" style={{ maxHeight: '300px', overflowY: 'auto' }}>
                                {slots.map(slot => (
                                    <button
                                        key={slot}
                                        onClick={() => setSelectedTime(slot)}
                                        className={`btn ${selectedTime === slot ? 'btn-primary' : 'btn-outline-primary'}`}
                                        style={{ minWidth: '80px' }}
                                    >
                                        {slot}
                                    </button>
                                ))}
                            </div>
                        )}

                        <div className="mt-auto pt-4">
                            {msg && <p className="text-danger text-center">{msg}</p>}

                            <button
                                onClick={handleBook}
                                disabled={!selectedDate || !selectedTime || booking}
                                className="btn btn-success w-100 py-3 font-bold"
                                style={{ fontSize: '1.2rem' }}
                            >
                                {booking ? 'מבצע הזמנה...' : 'אשר הזמנה ✅'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BookingDateSelection;
