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
        <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
            <h2>השירותים שלנו</h2>
            {services.length === 0 ? (
                <p>טוען שירותים... (אם זה לוקח זמן, ודא שיש נתונים ב-DB)</p>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '20px' }}>
                    {services.map(service => (
                        <div key={service.id} style={{ border: '1px solid #ddd', borderRadius: '8px', padding: '15px', backgroundColor: 'white', boxShadow: '0 2px 5px rgba(0,0,0,0.1)' }}>
                            <h3 style={{ margin: '0 0 10px 0', color: '#333' }}>{service.service_name}</h3>
                            <p style={{ margin: '5px 0', color: '#666' }}>ספק: {service.provider_name}</p>
                            <p style={{ margin: '5px 0' }}>⏱️ {service.duration_minutes} דקות</p>
                            <p style={{ fontWeight: 'bold', color: '#2196F3', fontSize: '1.2em' }}>₪{service.price}</p>
                            <button style={{ width: '100%', padding: '10px', backgroundColor: '#2196F3', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', marginTop: '10px' }}>
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