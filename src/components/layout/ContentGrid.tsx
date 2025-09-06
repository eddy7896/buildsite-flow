import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface ContentGridProps {
  children: ReactNode;
  className?: string;
  cols?: 1 | 2 | 3;
}

export const ContentGrid = ({ 
  children, 
  className, 
  cols = 2 
}: ContentGridProps) => {
  const gridCols = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 lg:grid-cols-2',
    3: 'grid-cols-1 lg:grid-cols-3'
  };

  return (
    <div className={cn("grid gap-6", gridCols[cols], className)}>
      {children}
    </div>
  );
};