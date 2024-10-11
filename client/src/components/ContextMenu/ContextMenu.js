import React, { useEffect, useState, useRef } from 'react';
import styles from './ContextMenu.module.css';

const ContextMenu = ({ contextMenu, handleOpenInExplorer, handleRemoveTorrent, handleStopTorrent, tableRef }) => {
  const [isVisible, setIsVisible] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    if (contextMenu) {
      setIsVisible(true);
      adjustPosition();
    } else {
      setTimeout(() => setIsVisible(false), 300);
    }
  }, [contextMenu]);

  const adjustPosition = () => {
    if (menuRef.current && contextMenu && tableRef.current) {
      const rect = menuRef.current.getBoundingClientRect();
      const tableRect = tableRef.current.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      let { clientX, clientY } = contextMenu;

      // Adjust for table position
      clientX -= tableRect.left;
      clientY -= tableRect.top;

      if (clientX + rect.width > tableRect.width) {
        clientX = tableRect.width - rect.width;
      }

      if (clientY + rect.height > tableRect.height) {
        clientY = tableRect.height - rect.height;
      }

      menuRef.current.style.left = `${clientX}px`;
      menuRef.current.style.top = `${clientY}px`;
    }
  };

  if (!contextMenu && !isVisible) return null;

  return (
    <div
      ref={menuRef}
      className={`${styles.contextMenu} ${contextMenu ? styles.fadeIn : styles.fadeOut}`}
    >
      <div
        className={`${styles.menuItem} ${styles.openExplorer}`}
        onClick={handleOpenInExplorer}
      >
        <i className="bi bi-folder"></i>
        Open in explorer
      </div>
      <div
        className={`${styles.menuItem} ${styles.stopTorrent}`}
        onClick={() => handleStopTorrent(contextMenu.torrent)}
      >
        <i className="bi bi-stop-circle"></i>
        Stop
      </div>
      <div
        className={`${styles.menuItem} ${styles.removeTorrent}`}
        onClick={() => handleRemoveTorrent(contextMenu.torrent)}
      >
        <i className="bi bi-trash"></i>
        Remove
      </div>
    </div>
  );
};

export default ContextMenu;