import React from 'react';

const BusinessCard = ({ business, onSelect }) => {
    // אם אין תמונה, נשתמש בתמונה ברירת מחדל
    const imageSrc = business.image_url || 'https://via.placeholder.com/300x200?text=No+Image';

    return (
        <div style={{
            border: '1px solid #ddd',
            borderRadius: '8px',
            padding: '15px',
            margin: '15px',
            width: '300px',
            boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
            backgroundColor: 'white',
            textAlign: 'center'
        }}>
            <img
                src={imageSrc}
                alt={business.business_name}
                style={{ width: '100%', height: '180px', objectFit: 'cover', borderRadius: '4px' }}
            />
            <h3 style={{ color: '#333', marginBottom: '10px' }}>{business.business_name}</h3>
            <p style={{ color: '#666', fontSize: '14px', minHeight: '40px' }}>{business.description}</p>

            <hr style={{ border: '0', borderTop: '1px solid #eee', margin: '10px 0' }} />

            <div style={{ textAlign: 'right', fontSize: '14px', color: '#555' }}>
                <p>📍 {business.address}</p>
                <p>📞 {business.phone}</p>
            </div>

            <button
                onClick={() => onSelect(business)}
                style={{
                    marginTop: '15px',
                    width: '100%',
                    padding: '10px',
                    backgroundColor: '#2196F3',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontWeight: 'bold'
                }}>
                הזמן תור / צפה בפרופיל
            </button>
        </div>
    );
};

export default BusinessCard;