import React, { useEffect, useState } from 'react';
import BusinessCard from './BusinessCard';
import SearchBar from './SearchBar';
import './BusinessesList.css';

const BusinessesList = ({ onSelectBusiness }) => {
    const [businesses, setBusinesses] = useState([]);
    const [filteredBusinesses, setFilteredBusinesses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // 1. הוספנו משתנה state לניהול המיון
    const [sortBy, setSortBy] = useState('default');

    useEffect(() => {
        const fetchBusinesses = async () => {
            try {
                setLoading(true);
                // 2. הוספנו את הפרמטר לשאילתה הנשלחת לשרת
                const res = await fetch(`http://localhost:5000/api/businesses?sort=${sortBy}`);

                if (!res.ok) throw new Error('שגיאה בטעינת הנתונים');

                const data = await res.json();
                setBusinesses(data);

                // איפוס הסינון המקומי לאחר טעינה מחדש מהשרת
                setFilteredBusinesses(data);
                setLoading(false);
            } catch (err) {
                setError(err.message);
                setLoading(false);
            }
        };

        fetchBusinesses();
        // 3. הוספנו את sortBy לתלויות - הפונקציה תרוץ מחדש בכל שינוי בבחירה
    }, [sortBy]);

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

    if (error) return <div className="businesses-page"><p className="text-center text-danger">שגיאה: {error}</p></div>;

    return (
        <div className="businesses-page">
            <h2 className="page-title">עסקים מומלצים</h2>

            {/* 4. עדכנו את הקונטיינר להכיל גם את המיון */}
            <div className="search-bar-container" style={{ flexDirection: 'column', gap: '15px' }}>
                <SearchBar onSearch={handleSearch} />

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', width: '100%', maxWidth: '500px' }}>
                    <span style={{ color: '#cbd5e1', whiteSpace: 'nowrap' }}>מיין לפי:</span>
                    <select
                        className="search-select"
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                        style={{ width: '100%' }}
                    >
                        <option value="default">✨ חדשים ביותר</option>
                        <option value="rating_high">⭐ דירוג: מהגבוה לנמוך</option>
                        <option value="rating_low">📉 דירוג: מהנמוך לגבוה</option>
                    </select>
                </div>
            </div>

            {loading ? (
                <div className="businesses-page"><p className="text-center text-muted">טוען עסקים...</p></div>
            ) : (
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
                            <p>נסה לשנות את מילות החיפוש או את סוג המיון</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default BusinessesList;