import React, { useEffect, useState } from 'react';

const BusinessProfileClientView = ({ business, onBack, onSelectService }) => {
    const [services, setServices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        // Fetch services for this specific provider
        const fetchServices = async () => {
            try {
                // business.user_id is the provider_id
                const res = await fetch(`http://localhost:5000/api/services/provider/${business.user_id}`);

                if (!res.ok) throw new Error('Failed to load services');

                const data = await res.json();
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

    if (!business) return null;

    return (
        <div className="container animate-fade-in">
            <button onClick={onBack} className="btn btn-secondary mb-4">
                &larr; חזרה לרשימת העסקים
            </button>

            {/* Business Header */}
            <div className="card mb-4 text-center">
                {business.image_url && (
                    <img
                        src={business.image_url}
                        alt={business.business_name}
                        style={{ width: '100%', maxHeight: '300px', objectFit: 'cover', borderTopLeftRadius: '8px', borderTopRightRadius: '8px' }}
                    />
                )}
                <div className="p-4">
                    <h2 className="mb-2">{business.business_name}</h2>
                    <p className="text-muted">{business.description}</p>
                    <div className="text-sm mt-2">
                        <span className="me-3">📍 {business.address}</span>
                        <span>📞 {business.phone}</span>
                    </div>
                </div>
            </div>

            {/* Services List */}
            <h3 className="text-center mb-4">בחר שירות לקביעת תור</h3>

            {loading && <p className="text-center">טוען שירותים...</p>}
            {error && <p className="text-center text-danger">{error}</p>}

            {!loading && !error && services.length === 0 && (
                <p className="text-center">לצערנו, לעסק זה אין שירותים זמינים כרגע.</p>
            )}

            <div className="services-grid">
                {services.map(service => (
                    <div
                        key={service.id}
                        className="service-card cursor-pointer hover-effect"
                        onClick={() => onSelectService(service)}
                        style={{ cursor: 'pointer', transition: 'transform 0.2s' }}
                    >
                        <h4 className="mb-2 font-bold">{service.service_name}</h4>
                        {service.description && <p className="text-muted text-sm mb-2">{service.description}</p>}
                        <div className="d-flex justify-content-between align-items-center mt-3">
                            <span>⏱️ {service.duration_minutes} דק'</span>
                            <span className="font-bold text-primary">₪{service.price}</span>
                        </div>
                        <button className="btn btn-outline-primary w-100 mt-3">
                            בחר שירות
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default BusinessProfileClientView;
