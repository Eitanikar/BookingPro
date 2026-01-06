import React, { useState } from 'react';
import { RatingStars } from './RatingStars';

const AddReviewModal = ({ isOpen, onClose, appointment, onReviewSaved }) => {
    const [rating, setRating] = useState(0);
    const [comment, setComment] = useState('');
    const [loading, setLoading] = useState(false);

    if (!isOpen || !appointment) return null;

    const handleSubmit = async () => {
        if (rating === 0) {
            alert('נא לבחור דירוג בכוכבים');
            return;
        }

        setLoading(true);
        const token = localStorage.getItem('token');

        try {
            const res = await fetch('http://localhost:5000/api/reviews', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    businessId: appointment.business_id,
                    rating: rating,
                    comment: comment
                })
            });

            if (res.ok) {
                alert('הביקורת נוספה בהצלחה! תודה רבה.');
                onReviewSaved(); // רענון הנתונים ברקע
                onClose();
            } else {
                const data = await res.json();
                alert(data.msg || 'שגיאה בשמירה');
            }
        } catch (err) {
            alert('שגיאת תקשורת');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex',
            justifyContent: 'center', alignItems: 'center', zIndex: 2000
        }}>
            <div className="card animate-fade-in" style={{ width: '400px', maxWidth: '90%', position: 'relative', backgroundColor: 'white', padding: '20px', borderRadius: '10px' }}>
                <button
                    onClick={onClose}
                    style={{ position: 'absolute', top: '10px', left: '10px', background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer' }}
                >
                    &times;
                </button>

                <h3 className="text-center mb-4">דרג את השירות</h3>
                <p className="text-center text-muted">
                    איך היה הטיפול אצל <strong>{appointment.provider_name}</strong>?
                </p>

                {/* בחירת כוכבים */}
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px' }}>
                    <RatingStars
                        rating={rating}
                        onRate={(val) => setRating(val)}
                        size="2.5rem"
                    />
                </div>

                {/* כתיבת תגובה */}
                <div className="mb-3">
                    <label className="form-label">חוות דעת (אופציונלי):</label>
                    <textarea
                        className="form-control"
                        rows="3"
                        style={{ width: '100%', marginTop: '5px' }}
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        placeholder="ספר לנו איך היה..."
                    ></textarea>
                </div>

                <button
                    className="btn btn-primary w-100"
                    onClick={handleSubmit}
                    disabled={loading}
                    style={{ marginTop: '10px' }}
                >
                    {loading ? 'שולח...' : 'פרסם ביקורת'}
                </button>
            </div>
        </div>
    );
};

export default AddReviewModal;
