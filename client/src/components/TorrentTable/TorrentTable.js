import React, { useRef, useState, useEffect } from 'react';
import styles from './TorrentTable.module.css';
import TorrentDetails from '../TorrentDetails/TorrentDetails';
import axios from 'axios';
import ContextMenu from '../ContextMenu/ContextMenu';

export const mapStatus = (apiStatus, progress) => {
  const statusMap = {
    'stalledUP': 'Seeding',
    'stalledDL': 'Paused',
    'uploading': 'Seeding',
    'downloading': 'Downloading',
    'pausedUP': 'Paused',
    'pausedDL': 'Paused',
    'queuedUP': 'Queued',
    'queuedDL': 'Queued',
    'checkingUP': 'Checking',
    'checkingDL': 'Checking',
    'error': 'Error',
    'missingFiles': 'Missing Files',
    'unknown': 'Unknown'
  };


  if (progress === 1 && (apiStatus === 'pausedUP' || apiStatus === 'stalledUP')) {
    return 'Completed';
  }

  return statusMap[apiStatus] || apiStatus;
};




export const getSmartName = (name, isSmartNamesEnabled) => {
  if (!isSmartNamesEnabled) return name;

  const colors = {
    year: { bg: '#FFF7D6', text: '#8F7200' },
    resolution: { bg: '#FDEDD6', text: '#885207' },
    quality: { bg: '#FDDBD8', text: '#B8180A' },
    codec: { bg: '#FCD9E6', text: '#B30F4B' },
    audio: { bg: '#EEDFF6', text: '#732C96' },
    group: { bg: '#E0DDF8', text: '#2C22A0' },
    season: { bg: '#D6E9FD', text: '#074788' },
    episode: { bg: '#DDF7F2', text: '#1D7263' },
    language: { bg: '#FFF7D6', text: '#8F7200' }  // Reusing the first color for language
  };

  const patterns = {
    year: /\b(19\d{2}|20\d{2})\b/,
    resolution: /\b(2160p|1080p|720p|480p)\b/i,
    quality: /\b(REMUX|PROPER|REPACK|EXTENDED|UNRATED|RETAIL|BLURAY|WEB-DL|WEBDL|WEBRip|BDRip|HDRip|DVDRip|HDTV)\b/i,
    codec: /\b(xx265|h264|h265|HEVC|XviD)\b/i,
    audio: /\b(DTS-HD MA|DTS-HD|DTS|DD|AAC|FLAC)\b/i,
    group: /\-(\w+)$/,
    season: /S(\d{2})/i,
    episode: /E(\d{2})/i,
    language: /\b(MULTi|DUAL|VOSTFR|SUBFRENCH)\b/i
  };


  let matches = {};
  let titleEnd = name.length;

  // Find matches for each pattern
  Object.entries(patterns).forEach(([key, pattern]) => {
    const match = name.match(pattern);
    if (match) {
      matches[key] = match[0];
      const matchIndex = name.indexOf(match[0]);
      if (matchIndex < titleEnd) {
        titleEnd = matchIndex;
      }
    }
  });


  // Extract title
  let title = name.substring(0, titleEnd).trim();
  title = title.replace(/\./g, ' ').trim();

  // Create tags for other properties
  const tags = Object.entries(matches).map(([key, value]) => {
    return `<span style="background-color: ${colors[key].bg}; color: ${colors[key].text}; padding: 2px 4px; border-radius: 3px; font-size: 0.8em; margin-right: 4px; font-weight: 600; cursor: pointer;" onclick="window.handleTagClick('${key}', '${value}')">${value}</span>`;
  });



  // Combine title and tags
  return `<span>${title}</span> ${tags.join(' ')}`;
};



const TorrentTable = ({ filteredTorrents, searchQuery, isSmartNamesEnabled, onTagClick, tagFilter, setIsDetailsPanelOpen }) => {
  const tableRef = useRef(null);
  const [columnWidths, setColumnWidths] = useState([400, 144.5, 144.5, 144.5, 144.5, 144.5, 144.5, 144.5, 160]);
  const [sortedTorrents, setSortedTorrents] = useState([]);
  const thRefs = useRef([]);
  const [sortColumn, setSortColumn] = useState('added_on');
  const [sortDirection, setSortDirection] = useState('desc');
  const [selectedTorrent, setSelectedTorrent] = useState(null);
  const [selectedTorrentHash, setSelectedTorrentHash] = useState(null);
  const [contextMenu, setContextMenu] = useState(null);
  const [prevDownloadSpeeds, setPrevDownloadSpeeds] = useState({});

  const sortTorrents = (torrents, column, direction) => {
    return [...torrents].sort((a, b) => {
      if (a[column] < b[column]) return direction === 'asc' ? -1 : 1;
      if (a[column] > b[column]) return direction === 'asc' ? 1 : -1;
      return 0;
    });
  };



  const handleRowClick = (torrent) => {
    setSelectedTorrent(torrent);
    setSelectedTorrentHash(torrent.hash);
    setIsDetailsPanelOpen(true);
  };


  const handleCloseDetailsPanel = () => {
    setIsDetailsPanelOpen(false);
    setSelectedTorrent(null);
    setSelectedTorrentHash(null);
  };

  useEffect(() => {
    const sorted = sortTorrents(filteredTorrents, sortColumn, sortDirection);
    setSortedTorrents(sorted);

    // Update previous download speeds
    const newPrevDownloadSpeeds = {};
    sorted.forEach(torrent => {
      newPrevDownloadSpeeds[torrent.hash] = prevDownloadSpeeds[torrent.hash] || torrent.dlspeed;
    });
    setPrevDownloadSpeeds(newPrevDownloadSpeeds);
  }, [filteredTorrents, sortColumn, sortDirection]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (contextMenu && !event.target.closest('.context-menu')) {
        setContextMenu(null);
      }
    };


    document.addEventListener('click', handleClickOutside);

    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [contextMenu]);



  const getProgressBarClass = (torrent) => {
    const status = mapStatus(torrent.state, torrent.progress);
    if (status === 'Error' || status === 'Missing Files') {
      return styles.errorBar;
    } else if (torrent.progress < 1) {
      return styles.downloadingBar;
    } else if (status === 'Seeding') {
      return styles.seedingBar;
    } else if (status === 'Completed') {
      return styles.completedBar;
    } else {
      return styles.completedBar;
    }
  };



  const formatSize = (size) => {
    const units = ['B', 'KB', 'MB', 'GB', 'TB'];
    let i = 0;
    while (size >= 1024 && i < units.length - 1) {
      size /= 1024;
      i++;
    }
    return `${size.toFixed(2)} ${units[i]}`;
  };

  const formatSpeed = (speed) => {
    return `${formatSize(speed)}/s`;
  };


  const formatDate = (timestamp) => {
    return new Date(timestamp * 1000).toLocaleString();
  };



  const formatETA = (seconds) => {
    if (seconds < 0 || seconds >= 8640000) { // 2400 hours in seconds
      return <i className={`bi bi-infinity ${styles.infinityIcon}`}></i>;
    }
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };



  const handleMouseDown = (index) => (e) => {
    e.preventDefault();
    const startX = e.pageX;
    const startWidth = columnWidths[index];

    const handleMouseMove = (e) => {
      const newWidth = Math.max(80, startWidth + e.pageX - startX);
      setColumnWidths(prevWidths => {
        const newWidths = [...prevWidths];
        newWidths[index] = newWidth;
        return newWidths;
      });
    };


    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };



    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };


  const handleHeaderClick = (column) => {
    if (column === sortColumn) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  const handleContextMenu = (event, torrent) => {
    event.preventDefault();
    setContextMenu({
      clientX: event.clientX,
      clientY: event.clientY,
      torrent: torrent,
    });
  };


  const handleOpenInExplorer = async () => {
    if (contextMenu) {
      try {
        await axios.post(`http://localhost:5000/api/torrents/${contextMenu.torrent.hash}/open-in-explorer`);
        setContextMenu(null);
      } catch (error) {
        console.error('Failed to open in explorer:', error);
      }
    }
  };


  const handleRemoveTorrent = async (torrent) => {
    if (contextMenu) {
      try {
        const response = await axios.post(`http://localhost:5000/api/torrents/${torrent.hash}/remove`, {
          deleteFiles: false
        });
        if (response.status === 200) {
          setContextMenu(null);
          // Refresh the torrent list after removal
          const torrentsResponse = await axios.get('http://localhost:5000/api/torrents');
          setSortedTorrents(torrentsResponse.data);
        } else {
          console.error('Failed to remove torrent:', response.data.error);
          alert(`Failed to remove torrent: ${response.data.error}`);
        }
      } catch (error) {
        console.error('Failed to remove torrent:', error.response ? error.response.data : error.message);
        alert(`Failed to remove torrent: ${error.response ? error.response.data.error : error.message}`);
      }
    }
  };

  const handleStopTorrent = async (torrent) => {
    if (contextMenu) {
      try {
        const response = await axios.post(`http://localhost:5000/api/torrents/${torrent.hash}/stop`);
        if (response.status === 200) {
          setContextMenu(null);
          // Refresh the torrent list after stopping
          const torrentsResponse = await axios.get('http://localhost:5000/api/torrents');
          setSortedTorrents(torrentsResponse.data);
        } else {
          throw new Error(`Failed to stop torrent: ${response.data.error}`);
        }
      } catch (error) {
        console.error('Failed to stop torrent:', error.response ? error.response.data : error.message);
        alert(`Failed to stop torrent: ${error.response ? error.response.data.error : error.message}`);
      }
    }
  };

  useEffect(() => {
    window.handleTagClick = (key, value) => {
      onTagClick(key, value);
    };

    return () => {
      delete window.handleTagClick;
    };
  }, [onTagClick]);

  return (
    <div className={styles.torrentTableContainer} ref={tableRef}>
      {tagFilter && (
        <div className={styles.filterSignifier}>
          Currently filtering for: 
          <span className={styles.filterTag}>
            {tagFilter.value}
            <i className="bi bi-x-circle" onClick={() => onTagClick(null)} style={{ marginLeft: '4px', cursor: 'pointer' }}></i>
          </span>
        </div>
      )}
      <div className={styles.torrentTable}>
        <div className={styles.torrentTableContent}>
          <table className={styles.table}>
            <thead className={styles.tableHeaderContainer}>
              <tr>
                {['Name', 'Size', 'Progress', 'Status', 'Seeds', 'Peers', 'Down Speed', 'ETA', 'Added on'].map((header, index) => {
                  const column = ['name', 'size', 'progress', 'state', 'num_seeds', 'num_leechs', 'dlspeed', 'eta', 'added_on'][index];
                  return (
                    <th
                      key={header}
                      className={`${styles.th} ${index !== 0 && index !== 2 && index !== 3 ? styles.rightAlign : ''}`}
                      ref={(el) => (thRefs.current[index] = el)}
                      style={{ width: columnWidths[index] }}
                      onClick={() => handleHeaderClick(column)}
                    >
                      {header}
                      {sortColumn === column && (
                        <i className={`bi ${sortDirection === 'asc' ? 'bi-caret-up-fill' : 'bi-caret-down-fill'} ${styles.sortIcon}`}></i>
                      )}
                      <div
                        className={styles.resizeHandle}
                        onMouseDown={handleMouseDown(index)}
                      />
                    </th>
                  );
                })}
              </tr>
            </thead>
          </table>
          <div className={styles.tableBodyContainer}>
            <table className={styles.table}>
              <tbody>
                {sortedTorrents.map((torrent) => (
                  <tr
                    key={torrent.hash}
                    className={`${styles.torrentRow} ${torrent.hash === selectedTorrentHash ? styles.selectedRow : ''}`}
                    onClick={() => handleRowClick(torrent)}
                    onContextMenu={(event) => handleContextMenu(event, torrent)}
                  >
                    {['name', 'size', 'progress', 'state', 'num_seeds', 'num_leechs', 'dlspeed', 'eta', 'added_on'].map((column, index) => (
                      <td
                        key={column}
                        className={`${styles.td} ${index !== 0 && index !== 2 && index !== 3 ? styles.rightAlign : ''}`}
                        style={{ width: columnWidths[index] }}
                      >
                        {column === 'name' && (
                          <span dangerouslySetInnerHTML={{ __html: getSmartName(torrent.name, isSmartNamesEnabled) }}></span>
                        )}
                        {column === 'size' && formatSize(torrent.size)}
                        {column === 'progress' && (
                          <div className={styles.progressContainer}>
                            <div 
                              className={`${styles.progressBar} ${getProgressBarClass(torrent)}`}
                              style={{ width: `${torrent.progress * 100}%` }}
                            ></div>
                            <span className={styles.progressText}>{(torrent.progress * 100).toFixed(2)}%</span>
                          </div>
                        )}
                        {column === 'state' && mapStatus(torrent.state, torrent.progress)}
                        {column === 'num_seeds' && torrent.num_seeds}
                        {column === 'num_leechs' && torrent.num_leechs}
                        {column === 'dlspeed' && (
                          <div className={`${styles.speedContainer} ${styles.rightAlign}`}>
                            {formatSpeed(torrent.dlspeed)}
                            {torrent.dlspeed !== prevDownloadSpeeds[torrent.hash] && (
                              <span className={`${styles.speedIndicator} ${torrent.dlspeed > prevDownloadSpeeds[torrent.hash] ? styles.speedUp : styles.speedDown}`}>
                                <i className={`bi ${torrent.dlspeed > prevDownloadSpeeds[torrent.hash] ? 'bi-arrow-up-short' : 'bi-arrow-down-short'}`}></i>
                              </span>
                            )}
                          </div>
                        )}
                        {column === 'eta' && formatETA(torrent.eta)}
                        {column === 'added_on' && formatDate(torrent.added_on)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      {selectedTorrent && (
        <TorrentDetails
          torrent={selectedTorrent}
          onClose={handleCloseDetailsPanel}
          isOpen={selectedTorrent !== null}
        />
      )}
      <ContextMenu 
        contextMenu={contextMenu}
        handleOpenInExplorer={handleOpenInExplorer}
        handleRemoveTorrent={handleRemoveTorrent}
        handleStopTorrent={handleStopTorrent}
        tableRef={tableRef}
      />
    </div>
  );
};



export default TorrentTable;