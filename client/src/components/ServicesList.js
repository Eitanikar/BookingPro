// קובץ: client/src/components/ServicesList.js
import React, { useEffect, useState } from 'react';

const ServicesList = () => {
    const [services, setServices] = useState([]);

    useEffect(() => {
        const fetchServices = async () => {
            try {
                const res = await fetch('http://localhost:5000/api/services');
                const data = await res.json();
                setServices(data);
            } catch (err) {
                console.error('Error fetching services:', err);
            }
        };
        fetchServices();
    }, []);

    return (
        <div className="container">
            <h2 className="text-center mb-4">השירותים שלנו</h2>
            {services.length === 0 ? (
                <p className="text-center">טוען שירותים... (אם זה לוקח זמן, ודא שיש נתונים ב-DB)</p>
            ) : (
                <div className="services-grid">
                    {services.map(service => (
                        <div key={service.id} className="service-card">
                            <h3 className="mb-2 text-xl font-bold">{service.service_name}</h3>
                            <p className="text-muted mb-2">ספק: {service.provider_name}</p>
                            <p className="mb-2">⏱️ {service.duration_minutes} דקות</p>
                            <p className="text-lg font-bold text-primary mb-4">₪{service.price}</p>
                            <button className="btn btn-primary" style={{ width: '100%' }}>
                                הזמן תור
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default ServicesList;