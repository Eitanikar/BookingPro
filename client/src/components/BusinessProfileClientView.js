import React, { useEffect, useState } from 'react';
import './BusinessProfile.css';

const BusinessProfileClientView = ({ business, onBack, onSelectService, user }) => {
    const [services, setServices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchServices = async () => {
            try {
                console.log('Fetching services for provider:', business.user_id); // DEBUG
                const res = await fetch(`http://localhost:5000/api/services/provider/${business.user_id}`);

                if (!res.ok) throw new Error('Failed to load services');

                const data = await res.json();
                console.log('Fetched services:', data); // DEBUG
                setServices(data);
                setLoading(false);
            } catch (err) {
                console.error(err);
                setError('שגיאה בטעינת השירותים');
                setLoading(false);
            }
        };

        if (business && business.user_id) {
            fetchServices();
        }
    }, [business]);

    console.log('BusinessProfileClientView rendered. User:', user); // DEBUG

    if (!business) return null;

    return (
        <div className="profile-page animate-fade-in">
            <div className="back-button-container">
                <button onClick={onBack} className="btn-back">
                    &larr; חזרה לרשימת העסקים
                </button>
            </div>

            {/* Business Header */}
            <div className="profile-header">
                {business.image_url && (
                    <img
                        src={business.image_url}
                        alt={business.business_name}
                        className="profile-cover-image"
                    />
                )}
                <div className="profile-info">
                    <h2 className="profile-title">{business.business_name}</h2>
                    <p className="profile-description">{business.description}</p>
                    <div className="profile-contact">
                        <div className="contact-item">
                            <span>📍 {business.address}</span>
                        </div>
                        <div className="contact-item">
                            <span>📞 {business.phone}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Services List */}
            <h3 className="services-section-title">בחר שירות לקביעת תור</h3>

            {loading && <p className="loading-state">טוען שירותים...</p>}
            {error && <p className="error-state">{error}</p>}

            {!loading && !error && services.length === 0 && (
                <p className="empty-state">לצערנו, לעסק זה אין שירותים זמינים כרגע.</p>
            )}

            <div className="services-grid">
                {services.map(service => (
                    <div
                        key={service.id}
                        className="service-card-modern"
                        onClick={() => {
                            if (user && user.role === 'Client') {
                                onSelectService(service);
                            }
                        }}
                        style={{ cursor: user && user.role === 'Client' ? 'pointer' : 'default' }}
                    >
                        <div>
                            <h4 className="service-name">{service.service_name}</h4>
                            {service.description && <p className="service-desc">{service.description}</p>}
                        </div>

                        <div>
                            <div className="service-meta">
                                <span className="service-duration">⏱️ {service.duration_minutes} דק'</span>
                                <span className="service-price">₪{service.price}</span>
                            </div>
                            {user && user.role === 'Client' && (
                                <button className="btn-select-service">
                                    בחר שירות
                                </button>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default BusinessProfileClientView;
