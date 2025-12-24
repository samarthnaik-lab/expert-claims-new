import { useState, useMemo } from 'react';

export type SortDirection = 'asc' | 'desc';

export interface SortConfig {
  column: string;
  direction: SortDirection;
}

export const useTableSort = <T>(data: T[], defaultSort?: SortConfig) => {
  const [sortConfig, setSortConfig] = useState<SortConfig | null>(defaultSort || null);

  const handleSort = (column: string) => {
    let direction: SortDirection = 'asc';
    
    if (sortConfig && sortConfig.column === column && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    
    setSortConfig({ column, direction });
  };

  const sortedData = useMemo(() => {
    if (!sortConfig || !data || data.length === 0) return data;

    return [...data].sort((a, b) => {
      let aValue = (a as any)[sortConfig.column];
      let bValue = (b as any)[sortConfig.column];

      // Handle ID columns specifically - convert to number for proper sorting
      if (sortConfig.column === 'backlog_id' || sortConfig.column === 'task_id' || sortConfig.column === 'case_id' || sortConfig.column === 'id') {
        // Extract last 3+ digits from ID (e.g., "ECSI-GA-25-080" -> "080", "ECSI-25-242" -> "242")
        // Handles future growth: "ECSI-GA-25-1234" -> "1234"
        const extractLastDigits = (id: string | number) => {
          if (id == null) return 0;
          const idStr = String(id);
          // Match last 3 or more digits at the end
          const match = idStr.match(/(\d{3,})$/); // Match last 3+ digits
          return match ? Number(match[1]) : 0;
        };
        
        // For 'id' column, check multiple possible field names
        if (sortConfig.column === 'id') {
          aValue = (a as any).id || (a as any).task_id || (a as any).case_id || aValue;
          bValue = (b as any).id || (b as any).task_id || (b as any).case_id || bValue;
        }
        
        aValue = extractLastDigits(aValue);
        bValue = extractLastDigits(bValue);
        
        // For ascending: 001, 002, 003, 010, 080, 100, 1234...
        // For descending: 1234, 100, 080, 010, 003, 002, 001...
        if (sortConfig.direction === 'asc') {
          return aValue - bValue;
        } else {
          return bValue - aValue;
        }
      }

      // Handle application_id - can be simple number or string number
      if (sortConfig.column === 'application_id') {
        const aNum = typeof aValue === 'number' ? aValue : (typeof aValue === 'string' && /^\d+$/.test(aValue) ? parseInt(aValue, 10) : 0);
        const bNum = typeof bValue === 'number' ? bValue : (typeof bValue === 'string' && /^\d+$/.test(bValue) ? parseInt(bValue, 10) : 0);
        
        if (sortConfig.direction === 'asc') {
          return aNum - bNum;
        } else {
          return bNum - aNum;
        }
      }

      // Handle numeric ID columns (like user id, report id)
      if (sortConfig.column === 'id' && (typeof aValue === 'number' || typeof bValue === 'number' || 
          (typeof aValue === 'string' && /^\d+$/.test(aValue)) || 
          (typeof bValue === 'string' && /^\d+$/.test(bValue)))) {
        const aNum = typeof aValue === 'number' ? aValue : (typeof aValue === 'string' ? parseInt(aValue, 10) : 0);
        const bNum = typeof bValue === 'number' ? bValue : (typeof bValue === 'string' ? parseInt(bValue, 10) : 0);
        
        if (sortConfig.direction === 'asc') {
          return aNum - bNum;
        } else {
          return bNum - aNum;
        }
      }

      // Handle different data types for other columns
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }

      // Handle dates
      if (aValue && typeof aValue === 'string' && (aValue.includes('T') || aValue.includes('-'))) {
        const aDate = new Date(aValue).getTime();
        const bDate = new Date(bValue).getTime();
        if (!isNaN(aDate) && !isNaN(bDate)) {
          aValue = aDate;
          bValue = bDate;
        }
      }

      // Handle null/undefined values
      if (aValue == null) aValue = '';
      if (bValue == null) bValue = '';

      if (sortConfig.direction === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });
  }, [data, sortConfig]);

  return {
    sortedData,
    sortConfig,
    handleSort
  };
};

export default useTableSort;
