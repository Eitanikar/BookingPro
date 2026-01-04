// קובץ: client/src/components/MyAppointments.js - חידוש: היסטוריה וטאבים
import React, { useEffect, useState } from 'react';
import ProviderCalendar from './ProviderCalendar';
import './Calendar.css'; // שימוש בעיצוב הכללי

const MyAppointments = ({ user }) => {
    const [appointments, setAppointments] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('upcoming'); // 'upcoming' | 'history' | 'calendar'
    const [refreshTrigger, setRefreshTrigger] = useState(0); // Force refresh counter
    const [clientDetails, setClientDetails] = useState({}); // Store client details by user ID

    const isServiceProvider = user && user.role === 'Service Provider';

    // Fetch appointments
    const fetchAppointments = async () => {
        try {
            setIsLoading(true);
            const token = localStorage.getItem('token');
            const res = await fetch('http://localhost:5000/api/my-appointments', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!res.ok) throw new Error('Failed to fetch appointments');
            const data = await res.json();
            setAppointments(data || []);

            // If service provider, fetch client details for each appointment
            if (isServiceProvider && data && data.length > 0) {
                const uniqueClientIds = [...new Set(data.map(a => a.client_id).filter(Boolean))];
                const detailsMap = {};
                
                for (const clientId of uniqueClientIds) {
                    try {
                        const detailRes = await fetch(`http://localhost:5000/api/client-details/${clientId}`);
                        if (detailRes.ok) {
                            const details = await detailRes.json();
                            detailsMap[clientId] = details;
                        }
                    } catch (err) {
                        console.error(`Failed to fetch details for client ${clientId}:`, err);
                    }
                }
                setClientDetails(detailsMap);
            }
        } catch (err) {
            console.error('Error fetching appointments:', err);
            setAppointments([]);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        // Fetch whenever component mounts or when activeTab/user changes
        fetchAppointments();
    }, [user, activeTab, isServiceProvider, refreshTrigger]);

    // מיון וסינון
    const now = new Date();

    // סינון: עתידיים (כולל היום מעכשיו)
    const upcomingList = appointments.filter(a => new Date(a.start_time) >= now);

    // סינון: היסטוריה (עבר)
    const historyList = appointments.filter(a => new Date(a.start_time) < now);

    const formatDate = (isoString) => {
        const date = new Date(isoString);
        return date.toLocaleDateString('he-IL', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    };

    const formatTime = (isoString) => {
        return new Date(isoString).toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' });
    };

    // ביטול תור
    const handleCancelAppointment = async (appointmentId) => {
        if (!window.confirm('האם אתה בטוח שברצונך לבטל את התור הזה?')) {
            return;
        }

        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`http://localhost:5000/api/appointments/${appointmentId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!res.ok) {
                const data = await res.json();
                alert('שגיאה: ' + (data.msg || 'לא ניתן לבטל את התור'));
                return;
            }

            alert('✅ התור בוטל בהצלחה');
            setRefreshTrigger(prev => prev + 1); // רענון התורים
        } catch (err) {
            console.error('Cancel error:', err);
            alert('שגיאת תקשורת: ' + err.message);
        }
    };

    // --- רינדור כרטיס תור ---
    const renderAppointmentCard = (appt, isHistory = false) => {
        const clientInfo = isServiceProvider && appt.client_id ? clientDetails[appt.client_id] : null;

        return (
        <div key={appt.id} className="card mb-3" style={{ borderRight: `4px solid ${isHistory ? '#9ca3af' : 'var(--primary)'}`, padding: '15px' }}>
            <div className="d-flex justify-content-between align-items-center">
                <div style={{ flex: 1 }}>
                    <h4 style={{ margin: '0 0 5px 0', color: isHistory ? 'var(--text-muted)' : 'var(--text-main)' }}>
                        {appt.service_name}
                    </h4>
                    <p className="text-muted m-0" style={{ fontSize: '0.9rem' }}>
                        {isServiceProvider ?
                            `לקוח: ${appt.client_name || 'מזדמן'}` :
                            `אצל: ${appt.provider_name}`
                        }
                    </p>

                    {/* Display client details for service providers */}
                    {isServiceProvider && clientInfo && (
                        <div style={{ marginTop: '8px', fontSize: '0.85rem', borderTop: '1px solid #333', paddingTop: '8px' }}>
                            {clientInfo.phone && <div>📱 {clientInfo.phone}</div>}
                            {clientInfo.email && <div>✉️ {clientInfo.email}</div>}
                            {clientInfo.full_name && <div>👤 {clientInfo.full_name}</div>}
                            {clientInfo.notes && <div style={{ fontStyle: 'italic', marginTop: '4px' }}>📝 {clientInfo.notes}</div>}
                        </div>
                    )}

                    {appt.price && (
                        <span className="badge bg-secondary mt-2 d-inline-block">₪{appt.price}</span>
                    )}
                </div>
                <div className="text-left" style={{ textAlign: 'left', minWidth: '100px', marginLeft: '15px' }}>
                    <div style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>{formatTime(appt.start_time)}</div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{formatDate(appt.start_time)}</div>
                    {isHistory && <span className="badge bg-light text-dark mt-1">הושלם</span>}
                </div>
                {!isHistory && (
                    <button
                        onClick={() => handleCancelAppointment(appt.id)}
                        className="btn btn-danger"
                        style={{ marginLeft: '10px', padding: '6px 12px', fontSize: '0.9rem', whiteSpace: 'nowrap' }}
                    >
                        ביטול
                    </button>
                )}
            </div>
        </div>
        );
    };

    return (
        <div className="container" style={{ maxWidth: '900px' }}>
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h2 className="m-0">
                    {isServiceProvider ? 'ניהול יומן ותורים' : 'התורים שלי'}
                </h2>
                <button 
                    className="btn btn-outline-primary text-sm"
                    onClick={() => setRefreshTrigger(prev => prev + 1)}
                    title="רענן את התורים"
                >
                    🔄 רענן
                </button>
            </div>

            {/* --- Tabs Selection --- */}
            <div className="d-flex justify-content-center mb-4 gap-3">
                {isServiceProvider && (
                    <button
                        className={`btn ${activeTab === 'calendar' ? 'btn-primary' : 'btn-outline'}`}
                        onClick={() => setActiveTab('calendar')}
                    >
                        📅 יומן ויזואלי
                    </button>
                )}

                <button
                    className={`btn ${activeTab === 'upcoming' ? (isServiceProvider ? 'btn-outline' : 'btn-primary') : 'btn-outline'}`}
                    onClick={() => setActiveTab('upcoming')}
                >
                    {(isServiceProvider && activeTab === 'calendar') ? 'רשימה עתידית' : 'תורים עתידיים'}
                </button>

                <button
                    className={`btn ${activeTab === 'history' ? 'btn-primary' : 'btn-outline'}`}
                    onClick={() => setActiveTab('history')}
                >
                    📜 היסטוריה
                </button>
            </div>

            {/* --- Content Area --- */}

            {/* 1. Provider Calendar View */}
            {isServiceProvider && activeTab === 'calendar' && (
                <div className="animate-fade-in">
                    <ProviderCalendar user={user} />
                </div>
            )}

            {/* 2. Upcoming List */}
            {activeTab === 'upcoming' && (
                <div className="animate-fade-in">
                    {isLoading ? <p className="text-center">טוען...</p> :
                        upcomingList.length === 0 ? <p className="text-center text-muted">אין תורים עתידיים.</p> :
                            upcomingList.map(appt => renderAppointmentCard(appt))}
                </div>
            )}

            {/* 3. History List */}
            {activeTab === 'history' && (
                <div className="animate-fade-in">
                    {isLoading ? <p className="text-center">טוען...</p> :
                        historyList.length === 0 ? <p className="text-center text-muted">אין היסטוריית תורים.</p> :
                            historyList.map(appt => renderAppointmentCard(appt, true))}
                </div>
            )}

        </div>
    );
};

export default MyAppointments;