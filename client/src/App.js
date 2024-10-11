import React, { useState, useEffect } from 'react';
import axios from 'axios';
import styles from './App.module.css';
import Sidebar from './components/Sidebar/Sidebar';
import TorrentTable, { mapStatus, getSmartName } from './components/TorrentTable/TorrentTable';
import Toolbar from './components/Toolbar/Toolbar';

function App() {
  const [torrents, setTorrents] = useState([]);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [activeFilter, setActiveFilter] = useState('All');
  const [activeCategory, setActiveCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchActive, setIsSearchActive] = useState(false);
  const [isSmartNamesEnabled, setIsSmartNamesEnabled] = useState(false);
  const [tagFilter, setTagFilter] = useState(null);
  const [categories, setCategories] = useState(['All']);
  const [isDetailsPanelOpen, setIsDetailsPanelOpen] = useState(true); // Assuming this is the state for the details panel

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      await axios.post('http://localhost:5000/api/login', { username, password });
      setIsLoggedIn(true);
    } catch (error) {
      alert('Login failed');
    }
  };

  useEffect(() => {
    const fetchTorrents = async () => {
      if (isLoggedIn) {
        try {
          const response = await axios.get('http://localhost:5000/api/torrents');
          setTorrents(response.data);
          
          // Extract unique categories
          const uniqueCategories = ['All', ...new Set(response.data.map(torrent => torrent.category).filter(Boolean))];
          setCategories(uniqueCategories);
        } catch (error) {
          console.error('Failed to fetch torrents:', error);
        }
      }
    };

    fetchTorrents();
    const interval = setInterval(fetchTorrents, 5000);
    return () => clearInterval(interval);
  }, [isLoggedIn]);

  const filteredTorrents = torrents.filter((torrent) => {
    const status = mapStatus(torrent.state, torrent.progress);
    const matchesSearch = torrent.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTagFilter = tagFilter
      ? getSmartName(torrent.name, true).includes(`>${tagFilter.value}</span>`)
      : true;
  
    let matchesCategory;
    if (activeCategory === 'All') {
      matchesCategory = true;
    } else if (activeCategory === 'Uncategorized') {
      matchesCategory = !torrent.category || torrent.category === '';
    } else {
      matchesCategory = torrent.category === activeCategory;
    }

    let matchesStatusFilter;
    switch (activeFilter) {
      case 'Downloading':
        matchesStatusFilter = torrent.progress < 1;
        break;
      case 'Seeding':
        matchesStatusFilter = status === 'Seeding';
        break;
      case 'Completed':
        matchesStatusFilter = torrent.progress === 1;
        break;
      default:
        matchesStatusFilter = true;
    }

    return matchesSearch && matchesStatusFilter && matchesTagFilter && matchesCategory;
  });

  if (!isLoggedIn) {
    return (
      <div className={styles.loginContainer}>
        <div className={styles.loginForm}>
          <img src="/andy-wave.svg" alt="Andy waving" className={styles.loginIllustration} />
          <h2 className={styles.appName}>
            <span className={styles.appNameBold}>Zwart</span> for Qbittorrent
          </h2>
          <form onSubmit={handleLogin}>
            <div className={styles.formGroup}>
              <label htmlFor="username">Username</label>
              <input
                type="text"
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>
            <div className={styles.formGroup}>
              <label htmlFor="password">Password</label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <button type="submit" className={styles.loginButton}>Login</button>
          </form>
          <p className={styles.versionInfo}>©️ 2024 rough alpha, by 8cht</p>
        </div>
      </div>
    );
  }

  const handleLogout = async () => {
    try {
      await axios.post('http://localhost:5000/api/logout');
      setIsLoggedIn(false);
      setUsername('');
      setPassword('');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const handleSearch = (query) => {
    setSearchQuery(query);
    setIsSearchActive(query.length > 0);
    setIsDetailsPanelOpen(false);
  };

  const handleToggleSmartNames = (enabled) => {
    setIsSmartNamesEnabled(enabled);
  };

  const handleTagClick = (key, value) => {
    setTagFilter(key && value ? { key, value } : null);
  };

  return (
    <div className={styles.app}>
      <Toolbar
        onLogout={handleLogout}
        onSearch={handleSearch}
        isSearchActive={searchQuery !== ''}
        searchQuery={searchQuery}
        setIsDetailsPanelOpen={setIsDetailsPanelOpen}
        username={username}
      />
      <div className={styles.content}>
        <Sidebar 
          activeFilter={activeFilter} 
          setActiveFilter={setActiveFilter} 
          torrents={torrents}
          isSmartNamesEnabled={isSmartNamesEnabled}
          onToggleSmartNames={handleToggleSmartNames}
          categories={categories}
          activeCategory={activeCategory}
          setActiveCategory={setActiveCategory}
        />
        <div className={styles.mainContentWrapper}>
          <TorrentTable 
            filteredTorrents={filteredTorrents} 
            searchQuery={searchQuery} 
            isSmartNamesEnabled={isSmartNamesEnabled}
            onTagClick={handleTagClick}
            tagFilter={tagFilter}
            setIsDetailsPanelOpen={setIsDetailsPanelOpen}
          />
        </div>
      </div>
    </div>
  );
}

export default App;