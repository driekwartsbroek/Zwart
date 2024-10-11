import { useState, useCallback } from 'react';

const useColumnResize = (initialWidths) => {
  const [columnWidths, setColumnWidths] = useState(initialWidths);

  const handleResize = useCallback((index, newWidth) => {
    setColumnWidths(prevWidths => {
      const newWidths = [...prevWidths];
      newWidths[index] = newWidth;
      return newWidths;
    });
  }, []);

  return [columnWidths, handleResize];
};

export default useColumnResize;