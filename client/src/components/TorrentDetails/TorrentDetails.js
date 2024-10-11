import React, { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import styles from './TorrentDetails.module.css';

const columnWidths = ['40%', '15%', '20%', '15%', '10%'];

const TorrentDetails = ({ torrent, onClose, isOpen }) => {
  console.log('TorrentDetails props:', torrent);
  const [fileContents, setFileContents] = useState([]);
  const [sortColumn, setSortColumn] = useState('name');
  const [sortDirection, setSortDirection] = useState('asc');
  const [isClosing, setIsClosing] = useState(false);
  const [isOpening, setIsOpening] = useState(false);
  const [panelHeight, setPanelHeight] = useState(470);
  const [isResizing, setIsResizing] = useState(false);
  const resizeRef = useRef(null);

  const handleClose = useCallback(() => {
    setIsClosing(true);
    setTimeout(() => {
      onClose();
      setIsClosing(false);
    }, 300); // Match this with the CSS transition duration
  }, [onClose]);

  useEffect(() => {
    const fetchFileContents = async () => {
      if (torrent) {
        try {
          const response = await axios.get(`http://localhost:5000/api/torrents/${torrent.hash}/files`);
          setFileContents(response.data);
        } catch (error) {
          console.error('Failed to fetch file contents:', error);
          setFileContents([]);
        }
      }
    };

    fetchFileContents();
  }, [torrent]);

  useEffect(() => {
    if (isOpen) {
      setIsOpening(true);
      setTimeout(() => {
        setIsOpening(false);
      }, 300); // Match this with the CSS transition duration
    }
  }, [isOpen]);

  const handleMouseDown = (e) => {
    e.preventDefault();
    setIsResizing(true);
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const handleMouseMove = useCallback((e) => {
    if (isResizing) {
      const newHeight = window.innerHeight - e.clientY;
      setPanelHeight(Math.max(200, Math.min(newHeight, window.innerHeight - 100)));
    }
  }, [isResizing]);

  const handleMouseUp = useCallback(() => {
    setIsResizing(false);
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
  }, [handleMouseMove]);

  useEffect(() => {
    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing, handleMouseMove, handleMouseUp]);

  if (!torrent) return null;

  const formatSize = (size) => {
    if (size === undefined || size === null) return 'N/A';
    const units = ['B', 'KB', 'MB', 'GB', 'TB'];
    let i = 0;
    while (size >= 1024 && i < units.length - 1) {
      size /= 1024;
      i++;
    }
    return `${size.toFixed(2)} ${units[i]}`;
  };

  const getProgressBarClass = (progress) => {
    if (progress === 1) {
      return styles.completedBar;
    } else {
      return styles.downloadingBar;
    }
  };

  const handleHeaderClick = (column) => {
    if (column === sortColumn) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  const sortedFileContents = [...fileContents].sort((a, b) => {
    if (a[sortColumn] < b[sortColumn]) return sortDirection === 'asc' ? -1 : 1;
    if (a[sortColumn] > b[sortColumn]) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  return (
    <div 
      className={`${styles.detailsContainer} ${isOpen ? styles.open : ''} ${isClosing ? styles.closing : ''} ${isOpening ? styles.opening : ''}`}
      style={{ height: `${panelHeight}px` }}
    >
      <div className={styles.resizeHandle} onMouseDown={handleMouseDown}></div>
      <div className={styles.closeButton} onClick={handleClose}>
        <i className="bi bi-x-lg"></i>
      </div>
      <div className={styles.tableContainer}>
        <table className={styles.contentTable}>
          <thead>
            <tr>
              {['Name', 'Size', 'Progress', 'Priority', 'Availability'].map((header, index) => {
                const column = ['name', 'size', 'progress', 'priority', 'availability'][index];
                return (
                  <th
                    key={header}
                    className={`${styles.th} ${index === 1 ? styles.rightAlign : ''}`}
                    onClick={() => handleHeaderClick(column)}
                    style={{ width: columnWidths[index] }}
                  >
                    {header}
                    {sortColumn === column && (
                      <i className={`bi ${sortDirection === 'asc' ? 'bi-caret-up-fill' : 'bi-caret-down-fill'} ${styles.sortIcon}`}></i>
                    )}
                  </th>
                );
              })}
            </tr>
          </thead>
        </table>
        <div className={styles.tableBodyWrapper}>
          <table className={styles.contentTable}>
            <tbody>
              {sortedFileContents.map((file, index) => (
                <tr key={index}>
                  <td className={styles.td} style={{ width: columnWidths[0] }}>{file.name || 'N/A'}</td>
                  <td className={`${styles.td} ${styles.rightAlign}`} style={{ width: columnWidths[1] }}>{formatSize(file.size)}</td>
                  <td className={styles.td} style={{ width: columnWidths[2] }}>
                    <div className={styles.progressContainer}>
                      <div 
                        className={`${styles.progressBar} ${getProgressBarClass(file.progress)}`}
                        style={{ width: `${(file.progress || 0) * 100}%` }}
                      ></div>
                      <span className={styles.progressText}>{file.progress !== undefined ? `${(file.progress * 100).toFixed(2)}%` : 'N/A'}</span>
                    </div>
                  </td>
                  <td className={styles.td} style={{ width: columnWidths[3] }}>{file.priority || 'N/A'}</td>
                  <td className={styles.td} style={{ width: columnWidths[4] }}>{file.availability !== undefined ? file.availability.toFixed(2) : 'N/A'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default TorrentDetails;