import React, { useState, useEffect } from 'react';

const DAYS_OF_WEEK_HE = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];
const DAYS_OF_WEEK_EN = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const ProviderAvailabilitySetup = ({ user }) => {
    const [schedule, setSchedule] = useState({});
    const [loading, setLoading] = useState(true);
    const [msg, setMsg] = useState('');
    const [saved, setSaved] = useState(false);

    useEffect(() => {
        if (user) {
            fetchSchedule();
        }
    }, [user]);

    const fetchSchedule = async () => {
        try {
            const res = await fetch(`http://localhost:5000/api/provider/schedule/${user.id}`);
            const data = await res.json();

            // יצירת לוח ברירת מחדל למדינה ימים
            const newSchedule = {};
            DAYS_OF_WEEK_EN.forEach(day => {
                newSchedule[day] = {
                    isWorking: false,
                    startTime: '09:00',
                    endTime: '17:00'
                };
            });

            // עדכון עם הנתונים הקיימים אם קיימים
            if (Array.isArray(data) && data.length > 0) {
                data.forEach(item => {
                    if (newSchedule[item.day_of_week]) {
                        newSchedule[item.day_of_week] = {
                            isWorking: true,
                            startTime: item.start_time,
                            endTime: item.end_time
                        };
                    }
                });
            }

            setSchedule(newSchedule);
        } catch (err) {
            console.error('Error fetching schedule:', err);
            // אתחול לוח ברירת מחדל אם יש שגיאה
            const defaultSchedule = {};
            DAYS_OF_WEEK_EN.forEach(day => {
                defaultSchedule[day] = {
                    isWorking: false,
                    startTime: '09:00',
                    endTime: '17:00'
                };
            });
            setSchedule(defaultSchedule);
        } finally {
            setLoading(false);
        }
    };

    const handleDayToggle = (day) => {
        setSchedule(prev => ({
            ...prev,
            [day]: {
                ...prev[day],
                isWorking: !prev[day].isWorking
            }
        }));
        setSaved(false);
    };

    const handleTimeChange = (day, timeType, value) => {
        setSchedule(prev => ({
            ...prev,
            [day]: {
                ...prev[day],
                [timeType]: value
            }
        }));
        setSaved(false);
    };

    const handleSave = async () => {
        alert('DEBUG: Clicked Save Working Hours');
        console.log('DEBUG: handleSave triggered');

        // בנייה של array של ימים פעילים
        const availability = [];
        for (const [day, config] of Object.entries(schedule)) {
            if (config && config.isWorking) {
                availability.push({
                    day_of_week: day,
                    start_time: config.startTime,
                    end_time: config.endTime
                });
            }
        }

        console.log('Sending availability:', availability);

        // בדיקה שלפחות יום אחד בוחר
        if (availability.length === 0) {
            alert('DEBUG: No days selected (availability empty)');
            setMsg('⚠️ עליך לבחור לפחות יום עבודה אחד!');
            return;
        }

        try {
            const token = localStorage.getItem('token');
            if (!token) {
                alert('DEBUG: Missing Token');
                setMsg('❌ שגיאת אימות: חסר טוקן התחברות');
                return;
            }

            const res = await fetch('http://localhost:5000/api/provider/schedule', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ availability })
            });

            const data = await res.json();
            console.log('Server response:', data);

            if (res.ok) {
                setMsg('✅ שעות העבודה נשמרו בהצלחה!');
                alert('שעות העבודה נשמרו בהצלחה!');
                setSaved(true);
                setTimeout(() => setMsg(''), 3000);
            } else {
                setMsg('❌ שגיאה בשמירה: ' + (data.msg || 'בעיה בשרת'));
                console.error('Save failed details:', data);
                alert('שגיאה בשמירה: ' + (data.msg || 'בעיה בשרת'));
            }
        } catch (err) {
            console.error('Save error:', err);
            setMsg('❌ שגיאת תקשורת: ' + (err.message || 'Unknown error'));
            alert('שגיאת תקשורת: ' + (err.message || 'Unknown error'));
        }
    };

    if (loading) {
        return <div className="text-center p-4">טוען...</div>;
    }

    return (
        <div style={{ maxWidth: '600px', margin: '0 auto', padding: '20px' }}>
            <h3 className="text-center mb-4">⏰ הגדרת שעות עבודה</h3>

            {msg && (
                <div className={`alert text-center mb-4 ${saved ? 'alert-success' : 'alert-warning'}`}>
                    {msg}
                </div>
            )}

            <div className="schedule-container" style={{
                backgroundColor: 'var(--bg-surface)',
                borderRadius: '12px',
                padding: '20px'
            }}>
                {DAYS_OF_WEEK_EN.map((day, index) => {
                    // בדיקה שהיום קיים בלוח
                    if (!schedule[day]) return null;

                    return (
                        <div
                            key={day}
                            style={{
                                marginBottom: '15px',
                                padding: '15px',
                                backgroundColor: 'var(--bg-secondary)',
                                borderRadius: '8px',
                                border: '1px solid var(--border-color)',
                                transition: 'all 0.3s ease'
                            }}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                                {/* Checkbox */}
                                <input
                                    type="checkbox"
                                    id={day}
                                    checked={schedule[day].isWorking}
                                    onChange={() => handleDayToggle(day)}
                                    style={{
                                        width: '20px',
                                        height: '20px',
                                        cursor: 'pointer'
                                    }}
                                />

                                {/* Day Label */}
                                <label
                                    htmlFor={day}
                                    style={{
                                        flex: '0 0 60px',
                                        fontWeight: 'bold',
                                        cursor: 'pointer',
                                        marginBottom: 0
                                    }}
                                >
                                    {DAYS_OF_WEEK_HE[index]}
                                </label>

                                {/* Time Inputs */}
                                {schedule[day].isWorking ? (
                                    <>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                            <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>מ-</span>
                                            <input
                                                type="time"
                                                value={schedule[day].startTime}
                                                onChange={(e) => handleTimeChange(day, 'startTime', e.target.value)}
                                                style={{
                                                    padding: '6px',
                                                    borderRadius: '6px',
                                                    border: '1px solid var(--border-color)',
                                                    backgroundColor: 'var(--bg-secondary)',
                                                    color: 'var(--text-main)',
                                                    cursor: 'pointer'
                                                }}
                                            />
                                        </div>

                                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                            <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>עד</span>
                                            <input
                                                type="time"
                                                value={schedule[day].endTime}
                                                onChange={(e) => handleTimeChange(day, 'endTime', e.target.value)}
                                                style={{
                                                    padding: '6px',
                                                    borderRadius: '6px',
                                                    border: '1px solid var(--border-color)',
                                                    backgroundColor: 'var(--bg-secondary)',
                                                    color: 'var(--text-main)',
                                                    cursor: 'pointer'
                                                }}
                                            />
                                        </div>
                                    </>
                                ) : (
                                    <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginLeft: 'auto' }}>
                                        ❌ סגור
                                    </span>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Save Button */}
            <button
                onClick={handleSave}
                style={{
                    width: '100%',
                    marginTop: '20px',
                    padding: '12px',
                    fontSize: '1.1rem',
                    fontWeight: 'bold',
                    backgroundColor: '#4CAF50',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    transition: 'background-color 0.3s ease'
                }}
                onMouseEnter={(e) => e.target.style.backgroundColor = '#45a049'}
                onMouseLeave={(e) => e.target.style.backgroundColor = '#4CAF50'}
            >
                💾 שמור שעות עבודה
            </button>

            {/* Summary */}
            <div style={{ marginTop: '20px', padding: '15px', backgroundColor: 'var(--bg-secondary)', borderRadius: '8px' }}>
                <h5 style={{ marginBottom: '10px' }}>📋 סיכום שעות עבודה:</h5>
                {Object.entries(schedule).filter(([_, config]) => config && config.isWorking).length === 0 ? (
                    <p style={{ color: 'var(--text-muted)' }}>⚠️ לא בחרת אף יום עבודה</p>
                ) : (
                    <ul style={{ margin: 0, paddingLeft: '20px' }}>
                        {DAYS_OF_WEEK_EN.map((day, index) =>
                            schedule[day] && schedule[day].isWorking && (
                                <li key={day} style={{ marginBottom: '5px' }}>
                                    {DAYS_OF_WEEK_HE[index]}: {schedule[day].startTime} - {schedule[day].endTime}
                                </li>
                            )
                        )}
                    </ul>
                )}
            </div>
        </div>
    );
};

export default ProviderAvailabilitySetup;
