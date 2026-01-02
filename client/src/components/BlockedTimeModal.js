import React, { useState } from 'react';
import './BookingModal.css'; // נשתמש באותו עיצוב בסיסי

const BlockedTimeModal = ({ isOpen, onClose, onSave }) => {
    const [start, setStart] = useState('');
    const [end, setEnd] = useState('');
    const [reason, setReason] = useState('חופשה / הפסקה');
    const [isAllDay, setIsAllDay] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = (e) => {
        e.preventDefault();

        // אם זה יום שלם, נגדיר את השעות 00:00 עד 23:59
        let startTime = start;
        let endTime = end;

        // ולידציה בסיסית
        if (!startTime || !endTime) {
            alert('נא למלא תאריך התחלה וסיום');
            return;
        }

        if (new Date(startTime) >= new Date(endTime)) {
            alert('תאריך הסיום חייב להיות אחרי תאריך ההתחלה');
            return;
        }

        onSave({
            start: startTime,
            end: endTime,
            reason
        });
    };

    return (
        <div className="modal-overlay">
            <div className="modal-content" style={{ maxWidth: '400px' }}>
                <button className="close-btn" onClick={onClose}>&times;</button>
                <h3>חסימת זמן / חופשה ⛔</h3>

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>סיבת החסימה:</label>
                        <input
                            type="text"
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            placeholder="לדוגמה: חופשה באילת, הפסקת צהריים..."
                        />
                    </div>

                    <div className="form-group">
                        <label>התחלה:</label>
                        <input
                            type="datetime-local"
                            value={start}
                            onChange={(e) => setStart(e.target.value)}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label>סיום:</label>
                        <input
                            type="datetime-local"
                            value={end}
                            onChange={(e) => setEnd(e.target.value)}
                            required
                        />
                    </div>

                    <button type="submit" className="book-btn" style={{ backgroundColor: '#F44336' }}>
                        חסום זמן זה
                    </button>
                </form>
            </div>
        </div>
    );
};

export default BlockedTimeModal;
