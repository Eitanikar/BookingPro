import React from 'react';

export const RatingStars = ({ rating, count }) => {
    // פונקציה שמייצרת 5 כוכבים
    const stars = Array.from({ length: 5 }, (_, index) => {
        const number = index + 0.5; // משמש לחישוב חצאי כוכבים אם נרצה בעתיד

        return (
            <span key={index}>
                {rating >= index + 1 ? (
                    <span style={{ color: '#FFD700', fontSize: '1.2em' }}>★</span> // כוכב מלא
                ) : rating >= number ? (
                    <span style={{ color: '#FFD700', fontSize: '1.2em' }}>★</span> // (כרגע מתייחסים לחצי כמלא או ריק, נשדרג בהמשך אם צריך)
                ) : (
                    <span style={{ color: '#e4e5e9', fontSize: '1.2em' }}>★</span> // כוכב ריק (אפור)
                )}
            </span>
        );
    });

    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <div style={{ display: 'flex' }}>{stars}</div>
            {count !== undefined && (
                <span style={{ fontSize: '0.85em', color: '#666' }}>
                    ({count} דירוגים)
                </span>
            )}
        </div>
    );
};