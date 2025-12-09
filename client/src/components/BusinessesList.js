import React, { useEffect, useState } from 'react';
import BusinessCard from './BusinessCard';

const BusinessesList = () => {
    const [businesses, setBusinesses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // פונקציה שמושכת את הנתונים מהשרת כשהדף עולה
    useEffect(() => {
        fetch('http://localhost:5000/api/businesses')
            .then(res => {
                if (!res.ok) throw new Error('שגיאה בטעינת הנתונים');
                return res.json();
            })
            .then(data => {
                setBusinesses(data);
                setLoading(false);
            })
            .catch(err => {
                setError(err.message);
                setLoading(false);
            });
    }, []);

    if (loading) return <p style={{ textAlign: 'center', marginTop: '20px' }}>טוען עסקים...</p>;
    if (error) return <p style={{ textAlign: 'center', color: 'red', marginTop: '20px' }}>שגיאה: {error}</p>;

    return (
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
            <h2 style={{ textAlign: 'center', marginBottom: '30px' }}>עסקים מומלצים</h2>
            
            <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '20px' }}>
                {businesses.length > 0 ? (
                    businesses.map(business => (
                        <BusinessCard key={business.id} business={business} />
                    ))
                ) : (
                    <p>לא נמצאו עסקים במערכת.</p>
                )}
            </div>
        </div>
    );
};

export default BusinessesList;