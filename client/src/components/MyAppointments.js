import React, { useEffect, useState } from 'react';
import ProviderCalendar from './ProviderCalendar';
import AddReviewModal from './AddReviewModal'; // --- [חדש] ייבוא המודל
import './Calendar.css';

const MyAppointments = ({ user }) => {
    const [appointments, setAppointments] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('upcoming'); // 'upcoming' | 'history' | 'calendar'

    // --- State לפרטי לקוחות (עבור ספקים) ---
    const [clientDetails, setClientDetails] = useState({});

    // --- [חדש] State לביקורות ---
    const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
    const [selectedApptForReview, setSelectedApptForReview] = useState(null);

    const isServiceProvider = user && user.role === 'Service Provider';

    // פונקציה למשיכת התורים
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

            // אם זה ספק, נמשוך גם פרטים נוספים על הלקוחות (כמו בקוד המקורי שלך)
            if (isServiceProvider && data && data.length > 0) {
                const uniqueClientIds = [...new Set(data.map(a => a.client_id).filter(id => id))];
                uniqueClientIds.forEach(fetchClientDetails);
            }

            setIsLoading(false);
        } catch (err) {
            console.error(err);
            setIsLoading(false);
        }
    };

    // פונקציה למשיכת פרטי לקוח (עבור ספקים)
    const fetchClientDetails = async (clientId) => {
        try {
            const res = await fetch(`http://localhost:5000/api/client-details/${clientId}`);
            const data = await res.json();
            if (res.ok) {
                setClientDetails(prev => ({ ...prev, [clientId]: data }));
            }
        } catch (err) {
            console.error('Error fetching client details', err);
        }
    };

    useEffect(() => {
        if (user) fetchAppointments();
        // eslint-disable-next-line
    }, [user]);

    // --- [חדש] פונקציה לפתיחת חלון הדירוג ---
    const handleOpenReview = (appt) => {
        setSelectedApptForReview(appt);
        setIsReviewModalOpen(true);
    };

    // סינון תורים (עתידיים מול היסטוריה)
    const now = new Date();
    const upcomingList = appointments.filter(a => new Date(a.start_time) >= now);
    const historyList = appointments.filter(a => new Date(a.start_time) < now);

    // עיצוב כרטיס תור
    const renderAppointmentCard = (appt, isHistory = false) => {
        const details = appt.client_id ? clientDetails[appt.client_id] : null;

        return (
            <div key={appt.id} className="card mb-3" style={{ borderRight: isHistory ? '4px solid #999' : '4px solid #2196F3', padding: '15px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', backgroundColor: 'white' }}>
                <div className="d-flex justify-content-between align-items-center">
                    <div>
                        <h4 style={{ margin: '0 0 5px 0', fontSize: '1.1rem' }}>{appt.service_name}</h4>
                        <p className="text-muted m-0">
                            {isServiceProvider ? (
                                <span>
                                    לקוח: <strong>{appt.client_name || 'מזדמן'}</strong>
                                    {details && <span style={{ fontSize: '0.9em', marginRight: '10px' }}> (📞 {details.phone})</span>}
                                </span>
                            ) : (
                                <span>עסק: <strong>{appt.business_name || appt.provider_name}</strong></span>
                            )}
                        </p>
                        <p className="m-0 text-sm" style={{ color: '#555' }}>
                            📅 {new Date(appt.start_time).toLocaleDateString('he-IL')} | 🕒 {new Date(appt.start_time).toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                    </div>

                    {/* --- [חדש] כפתור דירוג - מופיע רק ללקוח, רק בהיסטוריה --- */}
                    {!isServiceProvider && isHistory && (
                        <button
                            className="btn btn-sm"
                            onClick={() => handleOpenReview(appt)}
                            style={{
                                border: '1px solid #ffc107',
                                color: '#ff8f00',
                                background: '#fffbeb',
                                padding: '5px 12px',
                                borderRadius: '20px',
                                cursor: 'pointer',
                                fontWeight: 'bold',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '5px'
                            }}
                        >
                            ⭐ דרג
                        </button>
                    )}
                </div>
            </div>
        );
    };

    if (isServiceProvider && activeTab === 'calendar') {
        return <ProviderCalendar user={user} />;
    }

    return (
        <div className="container animate-fade-in" style={{ maxWidth: '800px', margin: '0 auto', padding: '20px' }}>
            <h2 className="text-center mb-4">התורים שלי</h2>

            {/* טאבים */}
            <div className="d-flex justify-content-center gap-3 mb-4" style={{ marginBottom: '20px', display: 'flex', gap: '10px', justifyContent: 'center' }}>
                {isServiceProvider && (
                    <button className={`btn ${activeTab === 'calendar' ? 'btn-primary' : 'btn-outline-secondary'}`} onClick={() => setActiveTab('calendar')}>
                        📅 יומן
                    </button>
                )}
                <button className={`btn ${activeTab === 'upcoming' ? 'btn-primary' : 'btn-outline-secondary'}`} onClick={() => setActiveTab('upcoming')}>
                    תורים קרובים
                </button>
                <button className={`btn ${activeTab === 'history' ? 'btn-primary' : 'btn-outline-secondary'}`} onClick={() => setActiveTab('history')}>
                    📜 היסטוריה
                </button>
            </div>

            {/* תוכן */}
            <div className="appointment-list">
                {isLoading && <p className="text-center">טוען...</p>}

                {!isLoading && activeTab === 'upcoming' && (
                    upcomingList.length > 0 ? upcomingList.map(a => renderAppointmentCard(a)) : <p className="text-center text-muted">אין תורים קרובים</p>
                )}

                {!isLoading && activeTab === 'history' && (
                    historyList.length > 0 ? historyList.map(a => renderAppointmentCard(a, true)) : <p className="text-center text-muted">אין היסטוריית תורים</p>
                )}
            </div>

            {/* --- [חדש] החלון הקופץ לדירוג --- */}
            <AddReviewModal
                isOpen={isReviewModalOpen}
                onClose={() => setIsReviewModalOpen(false)}
                appointment={selectedApptForReview}
                onReviewSaved={fetchAppointments}
            />
        </div>
    );
};

export default MyAppointments;