import React, { useEffect, useState } from 'react';
import BusinessCard from './BusinessCard';
import SearchBar from './SearchBar';
import './BusinessesList.css'; // Import the new styles

const BusinessesList = ({ onSelectBusiness }) => {
    const [businesses, setBusinesses] = useState([]);
    const [filteredBusinesses, setFilteredBusinesses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchBusinesses = async () => {
            try {
                const res = await fetch('http://localhost:5000/api/businesses');
                if (!res.ok) throw new Error('שגיאה בטעינת הנתונים');

                const data = await res.json();
                setBusinesses(data);
                setFilteredBusinesses(data);
                setLoading(false);
            } catch (err) {
                setError(err.message);
                setLoading(false);
            }
        };

        fetchBusinesses();
    }, []);

    const handleSearch = (term, type) => {
        if (!term) {
            setFilteredBusinesses(businesses);
            return;
        }

        const lowerTerm = term.toLowerCase();

        const filtered = businesses.filter(biz => {
            if (type === 'name') {
                return biz.business_name.toLowerCase().includes(lowerTerm);
            } else if (type === 'address') {
                return biz.address && biz.address.toLowerCase().includes(lowerTerm);
            }
            return false;
        });

        setFilteredBusinesses(filtered);
    };

    if (loading) return <div className="businesses-page"><p className="text-center text-muted">טוען עסקים...</p></div>;
    if (error) return <div className="businesses-page"><p className="text-center text-danger">שגיאה: {error}</p></div>;

    return (
        <div className="businesses-page">
            <h2 className="page-title">עסקים מומלצים</h2>

            <SearchBar onSearch={handleSearch} />

            <div className="businesses-grid">
                {filteredBusinesses.length > 0 ? (
                    filteredBusinesses.map(business => (
                        <BusinessCard
                            key={business.id}
                            business={business}
                            onSelect={onSelectBusiness}
                        />
                    ))
                ) : (
                    <div className="empty-state">
                        <div className="empty-state-icon">😕</div>
                        <h3>לא נמצאו תוצאות</h3>
                        <p>נסה לשנות את מילות החיפוש או לנקות את הסינון</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default BusinessesList;