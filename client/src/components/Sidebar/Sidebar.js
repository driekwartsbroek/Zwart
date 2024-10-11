import React, { useState, useEffect } from 'react';
import styles from './Sidebar.module.css';

const Sidebar = ({ activeFilter, setActiveFilter, torrents, isSmartNamesEnabled, onToggleSmartNames, categories, activeCategory, setActiveCategory }) => {
  const [isStatusCollapsed, setIsStatusCollapsed] = useState(false);
  const [isCategoryCollapsed, setIsCategoryCollapsed] = useState(false);
  const filters = ['All', 'Downloading', 'Seeding', 'Completed'];

  const getFilterCount = (filter) => {
    switch (filter) {
      case 'All':
        return torrents.length;
      case 'Downloading':
        return torrents.filter(t => t.progress < 1).length;
      case 'Seeding':
        return torrents.filter(t => t.progress === 1 && t.state === 'uploading').length;
      case 'Completed':
        return torrents.filter(t => t.progress === 1).length;
      default:
        return 0;
    }
  };

  const getCategoryCount = (category) => {
    if (category === 'All') {
      return torrents.length;
    } else if (category === 'Uncategorized') {
      return torrents.filter(t => !t.category || t.category === '').length;
    } else {
      return torrents.filter(t => t.category === category).length;
    }
  };

  const displayCategories = ['All', 'Uncategorized', ...categories.filter(cat => cat !== 'All')];

  return (
    <div className={styles.sidebar}>
      <div className={styles.filterGroup}>
        <div className={styles.headingContainer} onClick={() => setIsStatusCollapsed(!isStatusCollapsed)}>
          <h3 className={styles.heading}>Status</h3>
          <div className={styles.iconContainer}>
            <i className={`bi bi-chevron-${isStatusCollapsed ? 'up' : 'down'}`}></i>
          </div>
        </div>
        {!isStatusCollapsed && (
          <ul className={styles.filterList}>
            {filters.map((filter) => (
              <li
                key={filter}
                className={activeFilter === filter ? styles.active : ''}
                onClick={() => setActiveFilter(filter)}
              >
                <span>{filter}</span>
                <span className={styles.counter}>{getFilterCount(filter)}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
      
      <div className={styles.filterGroup}>
        <div className={styles.headingContainer} onClick={() => setIsCategoryCollapsed(!isCategoryCollapsed)}>
          <h3 className={styles.heading}>Categories</h3>
          <div className={styles.iconContainer}>
            <i className={`bi bi-chevron-${isCategoryCollapsed ? 'up' : 'down'}`}></i>
          </div>
        </div>
        {!isCategoryCollapsed && (
          <ul className={styles.filterList}>
            {displayCategories.map((category) => (
              <li
                key={category}
                className={activeCategory === category ? styles.active : ''}
                onClick={() => setActiveCategory(category)}
              >
                <span>{category}</span>
                <span className={styles.counter}>{getCategoryCount(category)}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className={styles.toggleContainer}>
        <span className={styles.toggleLabel}>Smart Names</span>
        <label className={styles.switch}>
          <input
            type="checkbox"
            checked={isSmartNamesEnabled}
            onChange={() => onToggleSmartNames(!isSmartNamesEnabled)}
          />
          <span className={styles.slider}></span>
        </label>
      </div>
    </div>
  );
};

export default Sidebar;