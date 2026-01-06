import React from 'react';

export const RatingStars = ({ rating, count, onRate, size = '1.2em' }) => {
    // יוצר מערך של 5 כוכבים
    const stars = Array.from({ length: 5 }, (_, index) => {
        const starValue = index + 1;
        const isFilled = rating >= starValue;

        return (
            <span
                key={index}
                onClick={() => onRate && onRate(starValue)} // מגיב ללחיצה רק אם הועברה פונקציה
                style={{
                    color: isFilled ? '#FFD700' : '#e4e5e9',
                    fontSize: size,
                    cursor: onRate ? 'pointer' : 'default',
                    marginRight: '2px'
                }}
            >
                ★
            </span>
        );
    });

    return (
        <div style={{ display: 'flex', alignItems: 'center' }}>
            {stars}
            {count !== undefined && (
                <span style={{ fontSize: '0.85em', color: '#666', marginRight: '5px' }}>
                    ({count})
                </span>
            )}
        </div>
    );
};