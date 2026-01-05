import React, { useState } from 'react';

const SearchBar = ({ onSearch }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [searchType, setSearchType] = useState('name');

    const handleSearch = () => {
        onSearch(searchTerm, searchType);
    };

    const handleClear = () => {
        setSearchTerm('');
        onSearch('', 'name');
    };

    return (
        <div className="search-bar-container">
            <select
                className="search-select"
                value={searchType}
                onChange={(e) => setSearchType(e.target.value)}
            >
                <option value="name">שם העסק</option>
                <option value="address">עיר / כתובת</option>
            </select>

            <input
                className="search-input"
                type="text"
                placeholder={searchType === 'name' ? 'לדוגמה: המספרה של יוסי...' : 'לדוגמה: תל אביב...'}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            />

            <button
                className="search-btn"
                onClick={handleSearch}
            >
                🔍 חפש
            </button>

            {searchTerm && (
                <button
                    className="clear-btn"
                    onClick={handleClear}
                >
                    נקה
                </button>
            )}
        </div>
    );
};

export default SearchBar;