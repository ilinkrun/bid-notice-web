'use client';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useState, useMemo } from 'react';
import { SettingsCategoryEditModal } from './SettingsCategoryEditModal';

interface SettingsCategoryTableProps {
  initialData: {
    sn: number;
    category: string;
    keywords: string;
    minPoint: number;
    nots: string;
    creator: string;
    memo: string;
  }[];
}

type SortConfig = {
  key: keyof SettingsCategoryTableProps['initialData'][0] | null;
  direction: 'asc' | 'desc';
};

export function SettingsCategoryTable({ initialData }: SettingsCategoryTableProps) {
  const [selectedSn, setSelectedSn] = useState<number | null>(null);
  const [sortConfig, setSortConfig] = useState<SortConfig>({
    key: null,
    direction: 'asc',
  });

  const handleRowClick = (sn: number) => {
    setSelectedSn(sn);
  };

  const handleSort = (key: keyof SettingsCategoryTableProps['initialData'][0]) => {
    setSortConfig((prevSort) => ({
      key,
      direction:
        prevSort.key === key && prevSort.direction === 'asc' ? 'desc' : 'asc',
    }));
  };

  const sortedData = useMemo(() => {
    if (!sortConfig.key) return initialData;

    return [...initialData].sort((a, b) => {
      if (a[sortConfig.key!] < b[sortConfig.key!]) {
        return sortConfig.direction === 'asc' ? -1 : 1;
      }
      if (a[sortConfig.key!] > b[sortConfig.key!]) {
        return sortConfig.direction === 'asc' ? 1 : -1;
      }
      return 0;
    });
  }, [initialData, sortConfig]);

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>
                <button
                  onClick={() => handleSort('sn')}
                  className={sortConfig.key === 'sn' ? 'text-red-500' : ''}
                >
                  번호
                </button>
              </TableHead>
              <TableHead>
                <button
                  onClick={() => handleSort('category')}
                  className={sortConfig.key === 'category' ? 'text-red-500' : ''}
                >
                  카테고리
                </button>
              </TableHead>
              <TableHead>
                <button
                  onClick={() => handleSort('keywords')}
                  className={sortConfig.key === 'keywords' ? 'text-red-500' : ''}
                >
                  키워드
                </button>
              </TableHead>
              <TableHead>
                <button
                  onClick={() => handleSort('minPoint')}
                  className={sortConfig.key === 'minPoint' ? 'text-red-500' : ''}
                >
                  최소점수
                </button>
              </TableHead>
              <TableHead>
                <button
                  onClick={() => handleSort('nots')}
                  className={sortConfig.key === 'nots' ? 'text-red-500' : ''}
                >
                  제외어
                </button>
              </TableHead>
              <TableHead>
                <button
                  onClick={() => handleSort('creator')}
                  className={sortConfig.key === 'creator' ? 'text-red-500' : ''}
                >
                  생성자
                </button>
              </TableHead>
              <TableHead>
                <button
                  onClick={() => handleSort('memo')}
                  className={sortConfig.key === 'memo' ? 'text-red-500' : ''}
                >
                  메모
                </button>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedData.map((item) => (
              <TableRow 
                key={item.sn}
                className="cursor-pointer hover:bg-gray-50"
                onClick={() => handleRowClick(item.sn)}
              >
                <TableCell>{item.sn}</TableCell>
                <TableCell>{item.category}</TableCell>
                <TableCell>{item.keywords}</TableCell>
                <TableCell>{item.minPoint}</TableCell>
                <TableCell>{item.nots}</TableCell>
                <TableCell>{item.creator}</TableCell>
                <TableCell>{item.memo}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {selectedSn && (
        <SettingsCategoryEditModal
          sn={selectedSn}
          onClose={() => setSelectedSn(null)}
        />
      )}
    </>
  );
} 