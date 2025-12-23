import React from 'react';
import { ArrowUp, ArrowDown, ArrowUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SortableTableHeaderProps {
  column: string;
  label: string;
  sortColumn: string;
  sortDirection: 'asc' | 'desc';
  onSort: (column: string) => void;
  className?: string;
  sortable?: boolean;
}

export const SortableTableHeader: React.FC<SortableTableHeaderProps> = ({
  column,
  label,
  sortColumn,
  sortDirection,
  onSort,
  className,
  sortable = true
}) => {
  const isActive = sortColumn === column;
  
  const handleClick = () => {
    if (sortable) {
      onSort(column);
    }
  };

  const getSortIcon = () => {
    if (!sortable) return null;
    
    if (isActive) {
      return sortDirection === 'asc' ? (
        <ArrowUp className="h-4 w-4 text-blue-600" />
      ) : (
        <ArrowDown className="h-4 w-4 text-blue-600" />
      );
    }
    
    return <ArrowUpDown className="h-4 w-4 text-gray-400" />;
  };

  // Check if className contains text-center
  const isCentered = className?.includes('text-center');
  
  return (
    <th 
      className={cn(
        isCentered ? "text-center" : "text-left",
        "font-semibold text-gray-700",
        sortable && "cursor-pointer hover:bg-gray-100 select-none transition-colors duration-200",
        className
      )}
      onClick={handleClick}
    >
      <div className={cn("flex items-center gap-2", isCentered && "justify-center")}>
        <span>{label}</span>
        <span className="flex-shrink-0">{getSortIcon()}</span>
      </div>
    </th>
  );
};

export default SortableTableHeader;
