import React, { useState, useEffect } from 'react';
import './BookingModal.css';

const BookingModal = ({ business, user, onClose, onSuccess }) => {
    const [step, setStep] = useState(1);
    const [services, setServices] = useState([]);
    const [selectedService, setSelectedService] = useState(null);
    const [selectedDate, setSelectedDate] = useState('');
    const [availableTimes, setAvailableTimes] = useState([]);
    const [selectedTime, setSelectedTime] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    // Load services when modal opens
    useEffect(() => {
        const fetchServices = async () => {
            try {
                const res = await fetch(`http://localhost:5000/api/services/provider/${business.user_id}`);
                const data = await res.json();
                setServices(data);
            } catch (err) {
                console.error("Failed to load services", err);
                setError("שגיאה בטעינת השירותים");
            }
        };
        fetchServices();
    }, [business.user_id]);

    // Fetch availability when date changes
    useEffect(() => {
        if (selectedDate && business.user_id) {
            const fetchAvailability = async () => {
                setIsLoading(true);
                try {
                    const res = await fetch(`http://localhost:5000/api/availability?providerId=${business.user_id}&date=${selectedDate}`);
                    const data = await res.json();
                    setAvailableTimes(data);
                } catch (err) {
                    console.error("Failed to load availability", err);
                } finally {
                    setIsLoading(false);
                }
            };
            fetchAvailability();
        }
    }, [selectedDate, business.user_id]);

    const handleServiceSelect = (service) => {
        setSelectedService(service);
        setStep(2);
    };

    const handleBooking = async () => {
        if (!selectedService || !selectedDate || !selectedTime) return;

        setIsLoading(true);
        try {
            const res = await fetch('http://localhost:5000/api/book', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    clientId: user.id,
                    providerId: business.user_id,
                    serviceId: selectedService.id,
                    date: selectedDate,
                    time: selectedTime
                })
            });

            if (!res.ok) throw new Error('Booking failed');

            setStep(3); // Success step
            setTimeout(() => {
                onSuccess();
                onClose();
            }, 2500); // Close after 2.5s

        } catch (err) {
            setError("אירעה שגיאה בקביעת התור. נסה שנית.");
        } finally {
            setIsLoading(false);
        }
    };

    // Calculate minimum date (today)
    const today = new Date().toISOString().split('T')[0];

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <button className="close-btn" onClick={onClose}>&times;</button>

                <div className="modal-header">
                    <h2 className="modal-title">קביעת תור ב-{business.business_name}</h2>
                    <div className="step-indicator">
                        <div className={`step-dot ${step >= 1 ? 'active' : ''} ${step > 1 ? 'completed' : ''}`}></div>
                        <div className={`step-dot ${step >= 2 ? 'active' : ''} ${step > 2 ? 'completed' : ''}`}></div>
                        <div className={`step-dot ${step >= 3 ? 'active' : ''}`}></div>
                    </div>
                </div>

                {error && <div className="p-3 mb-4 bg-red-100 text-red-700 rounded">{error}</div>}

                {/* Step 1: Choose Service */}
                {step === 1 && (
                    <div className="animate-fade-in">
                        <h3 className="text-center mb-4">בחר שירות</h3>
                        <div className="service-selection">
                            {services.length === 0 ? (
                                <p className="text-center text-muted">לא נמצאו שירותים זמינים לעסק זה.</p>
                            ) : (
                                services.map(service => (
                                    <div
                                        key={service.id}
                                        className="selection-card"
                                        onClick={() => handleServiceSelect(service)}
                                    >
                                        <div>
                                            <div className="font-bold">{service.service_name}</div>
                                            <div className="text-sm text-muted">{service.duration_minutes} דקות</div>
                                        </div>
                                        <div className="font-bold text-primary">
                                            ₪{service.price}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                )}

                {/* Step 2: Choose Date & Time */}
                {step === 2 && (
                    <div className="animate-fade-in">
                        <button className="text-sm text-muted mb-4 hover:text-white" onClick={() => setStep(1)}>
                            ← חזרה לבחירת שירות
                        </button>

                        <div className="mb-4">
                            <label className="block mb-2 text-sm">בחר תאריך</label>
                            <input
                                type="date"
                                min={today}
                                value={selectedDate}
                                onChange={(e) => setSelectedDate(e.target.value)}
                                className="w-full p-2 rounded bg-surface border border-slate-600"
                            />
                        </div>

                        {selectedDate && (
                            <div>
                                <h4 className="mb-2 text-sm">שעות פנויות</h4>
                                {isLoading ? (
                                    <p className="text-center text-sm">בודק זמינות...</p>
                                ) : availableTimes.length === 0 ? (
                                    <p className="text-center text-sm text-red-400">אין תורים פנויים בתאריך זה.</p>
                                ) : (
                                    <div className="time-grid">
                                        {availableTimes.map(time => (
                                            <div
                                                key={time}
                                                className={`time-slot ${selectedTime === time ? 'selected' : ''}`}
                                                onClick={() => setSelectedTime(time)}
                                            >
                                                {time}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        <button
                            className="btn btn-primary w-full mt-6"
                            disabled={!selectedTime || isLoading}
                            onClick={handleBooking}
                        >
                            {isLoading ? 'מבצע הזמנה...' : 'אשר הזמנה'}
                        </button>
                    </div>
                )}

                {/* Step 3: Success */}
                {step === 3 && (
                    <div className="success-animation">
                        <div className="checkmark">✓</div>
                        <h3>התור נקבע בהצלחה!</h3>
                        <p className="text-muted">אישור נשלח למייל שלך.</p>
                        <p className="text-muted text-sm mt-4">חלון זה ייסגר אוטומטית...</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default BookingModal;
