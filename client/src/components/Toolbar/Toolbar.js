import React, { useState, useRef, useEffect } from 'react';
import styles from './Toolbar.module.css';

const Toolbar = ({ onLogout, onSearch, isSearchActive, searchQuery, setIsDetailsPanelOpen, username }) => {
  const [showSubmenu, setShowSubmenu] = useState(false);
  const [localSearchQuery, setLocalSearchQuery] = useState(searchQuery);
  const submenuRef = useRef(null);
  const searchInputRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (submenuRef.current && !submenuRef.current.contains(event.target)) {
        setShowSubmenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleSearchClick = () => {
    searchInputRef.current.focus();
    setIsDetailsPanelOpen(false);
  };

  const handleSearchChange = (e) => {
    setLocalSearchQuery(e.target.value);
    onSearch(e.target.value);
    setIsDetailsPanelOpen(false);
  };

  const handleClearSearch = () => {
    setLocalSearchQuery('');
    onSearch('');
    searchInputRef.current.focus();
  };

  const handleUserIconClick = () => {
    setShowSubmenu(!showSubmenu);
  };

  return (
    <div className={styles.toolbar}>
      <i className={`bi bi-search ${styles.searchIcon}`} onClick={handleSearchClick}></i>
      <div className={`${styles.searchContainer} ${isSearchActive ? styles.active : ''}`}>
        <input
          ref={searchInputRef}
          type="text"
          placeholder="Search a torrent..."
          className={`${styles.searchInput} ${isSearchActive ? styles.active : ''}`}
          value={localSearchQuery}
          onChange={handleSearchChange}
        />
        {isSearchActive && (
          <button className={styles.clearButton} onClick={handleClearSearch}>
            <i className="bi bi-x-lg"></i>
          </button>
        )}
      </div>
      <div className={styles.userIconContainer} onClick={handleUserIconClick}>
        <i className="bi bi-person-circle"></i>
        <span className={styles.username}>{username}</span>
        {showSubmenu && (
          <div className={styles.submenu} ref={submenuRef}>
            <div className={styles.submenuItem} onClick={onLogout}>
              <i className="bi bi-box-arrow-right"></i>
              Logout
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Toolbar;