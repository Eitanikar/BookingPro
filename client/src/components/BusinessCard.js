import React from 'react';

const BusinessCard = ({ business, onSelect }) => {
    const imageSrc = business.image_url || 'https://via.placeholder.com/300x200?text=No+Image';

    return (
        <div className="business-card">
            <img
                src={imageSrc}
                alt={business.business_name}
                className="card-image"
            />
            <h3 className="card-title">{business.business_name}</h3>
            <p className="card-description">{business.description}</p>

            <hr className="card-divider" />

            <div className="card-details">
                <div className="card-detail-item">
                    <span>📍</span> {business.address}
                </div>
                <div className="card-detail-item">
                    <span>📞</span> {business.phone}
                </div>
            </div>

            <button
                className="card-action-btn"
                onClick={() => onSelect(business)}
            >
                הזמן תור / צפה בפרופיל
            </button>
        </div>
    );
};

export default BusinessCard;