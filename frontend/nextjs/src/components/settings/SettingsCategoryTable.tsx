'use client';

import { DataTable, DataTableHeader, DataTableBody, DataTableRow, DataTableCell } from '@/components/shared/DataTable';
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
      <div className="statistics-cell">
        <DataTable>
          <DataTableHeader>
            <DataTableRow isHoverable={false}>
              <DataTableCell
                isHeader
                onClick={() => handleSort('sn')}
                className={`cursor-pointer ${sortConfig.key === 'sn' ? 'text-primary' : ''}`}
              >
                번호
              </DataTableCell>
              <DataTableCell
                isHeader
                onClick={() => handleSort('category')}
                className={`cursor-pointer ${sortConfig.key === 'category' ? 'text-primary' : ''}`}
              >
                카테고리
              </DataTableCell>
              <DataTableCell
                isHeader
                onClick={() => handleSort('keywords')}
                className={`cursor-pointer ${sortConfig.key === 'keywords' ? 'text-primary' : ''}`}
              >
                키워드
              </DataTableCell>
              <DataTableCell
                isHeader
                onClick={() => handleSort('minPoint')}
                className={`cursor-pointer ${sortConfig.key === 'minPoint' ? 'text-primary' : ''}`}
              >
                최소점수
              </DataTableCell>
              <DataTableCell
                isHeader
                onClick={() => handleSort('nots')}
                className={`cursor-pointer ${sortConfig.key === 'nots' ? 'text-primary' : ''}`}
              >
                제외어
              </DataTableCell>
              <DataTableCell
                isHeader
                onClick={() => handleSort('creator')}
                className={`cursor-pointer ${sortConfig.key === 'creator' ? 'text-primary' : ''}`}
              >
                생성자
              </DataTableCell>
              <DataTableCell
                isHeader
                onClick={() => handleSort('memo')}
                className={`cursor-pointer ${sortConfig.key === 'memo' ? 'text-primary' : ''}`}
              >
                메모
              </DataTableCell>
            </DataTableRow>
          </DataTableHeader>
          <DataTableBody>
            {sortedData.map((item) => (
              <DataTableRow
                key={item.sn}
                onClick={() => handleRowClick(item.sn)}
              >
                <DataTableCell>{item.sn}</DataTableCell>
                <DataTableCell>{item.category}</DataTableCell>
                <DataTableCell>{item.keywords}</DataTableCell>
                <DataTableCell>{item.minPoint}</DataTableCell>
                <DataTableCell>{item.nots}</DataTableCell>
                <DataTableCell>{item.creator}</DataTableCell>
                <DataTableCell>{item.memo}</DataTableCell>
              </DataTableRow>
            ))}
          </DataTableBody>
        </DataTable>
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