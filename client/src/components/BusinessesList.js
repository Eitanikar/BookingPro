import React, { useEffect, useState } from 'react';
import BusinessCard from './BusinessCard'; // הרכיב הקיים שלך
import SearchBar from './SearchBar';       // הרכיב החדש שיצרנו

const BusinessesList = ({ onSelectBusiness }) => {
    // 1. הגדרת State
    const [businesses, setBusinesses] = useState([]); // כל העסקים (מהשרת)
    const [filteredBusinesses, setFilteredBusinesses] = useState([]); // עסקים לסינון (לתצוגה)
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // 2. משיכת נתונים מהשרת
    useEffect(() => {
        const fetchBusinesses = async () => {
            try {
                const res = await fetch('http://localhost:5000/api/businesses');
                if (!res.ok) throw new Error('שגיאה בטעינת הנתונים');
                
                const data = await res.json();
                setBusinesses(data);
                setFilteredBusinesses(data); // בהתחלה - מציגים את הכל
                setLoading(false);
            } catch (err) {
                setError(err.message);
                setLoading(false);
            }
        };

        fetchBusinesses();
    }, []);

    // 3. לוגיקת החיפוש (כאן הקסם קורה)
    const handleSearch = (term, type) => {
        // אם שדה החיפוש ריק - מציגים את הרשימה המקורית המלאה
        if (!term) {
            setFilteredBusinesses(businesses);
            return;
        }

        const lowerTerm = term.toLowerCase();

        // סינון הרשימה
        const filtered = businesses.filter(biz => {
            if (type === 'name') {
                return biz.business_name.toLowerCase().includes(lowerTerm);
            } else if (type === 'address') {
                // בדיקה שיש כתובת לפני שמנסים לחפש בה (למניעת קריסה)
                return biz.address && biz.address.toLowerCase().includes(lowerTerm);
            }
            return false;
        });

        setFilteredBusinesses(filtered);
    };

    // 4. תצוגת טעינה ושגיאות
    if (loading) return <p style={{ textAlign: 'center', marginTop: '20px' }}>טוען עסקים...</p>;
    if (error) return <p style={{ textAlign: 'center', color: 'red', marginTop: '20px' }}>שגיאה: {error}</p>;

    // 5. התצוגה הסופית
    return (
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
            <h2 style={{ textAlign: 'center', marginBottom: '30px' }}>עסקים מומלצים</h2>

            {/* הטמעת שורת החיפוש */}
            <SearchBar onSearch={handleSearch} />

            <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '20px' }}>
                {filteredBusinesses.length > 0 ? (
                    // אנו רצים על הרשימה *המסוננת*
                    filteredBusinesses.map(business => (
                        <BusinessCard
                            key={business.id}
                            business={business}
                            onSelect={onSelectBusiness} 
                        />
                    ))
                ) : (
                    // תצוגה כאשר החיפוש לא מצא כלום
                    <div style={{ textAlign: 'center', width: '100%', padding: '20px', color: '#666' }}>
                        <h3>😕 לא נמצאו תוצאות</h3>
                        <p>נסה לשנות את מילות החיפוש או לנקות את הסינון</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default BusinessesList;