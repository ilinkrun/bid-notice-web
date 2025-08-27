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
import { SettingsEditModal } from './SettingsEditModal';

interface SettingsListTableProps {
  initialData: {
    orgName: string;
    detailUrl: string;
    region: string;
    registration: string;
    use: boolean;
  }[];
}

type SortConfig = {
  key: keyof SettingsListTableProps['initialData'][0] | null;
  direction: 'asc' | 'desc';
};

const detailUrlHref = (detailUrl: string) => {
  return detailUrl.replace('${i}', '1');
};

const detailUrlA = (detailUrl: string) => {
  if (detailUrl.length < 2) {
    return '';
  }
  return detailUrl.split('://')[0] + '://' + detailUrl.split('://')[1].split('/')[0];
};

export function SettingsListTable({ initialData }: SettingsListTableProps) {
  const [selectedOrgName, setSelectedOrgName] = useState<string | null>(null);
  const [sortConfig, setSortConfig] = useState<SortConfig>({
    key: null,
    direction: 'asc',
  });

  const handleRowClick = (orgName: string) => {
    setSelectedOrgName(orgName);
  };

  const handleSort = (key: keyof SettingsListTableProps['initialData'][0]) => {
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
                  onClick={() => handleSort('orgName')}
                  className={sortConfig.key === 'orgName' ? 'text-red-500' : ''}
                >
                  기관명
                </button>
              </TableHead>
              <TableHead>
                <button
                  onClick={() => handleSort('detailUrl')}
                  className={sortConfig.key === 'detailUrl' ? 'text-red-500' : ''}
                >
                  상세 URL
                </button>
              </TableHead>
              <TableHead>
                <button
                  onClick={() => handleSort('region')}
                  className={sortConfig.key === 'region' ? 'text-red-500' : ''}
                >
                  지역
                </button>
              </TableHead>
              <TableHead>
                <button
                  onClick={() => handleSort('registration')}
                  className={sortConfig.key === 'registration' ? 'text-red-500' : ''}
                >
                  등록
                </button>
              </TableHead>
              <TableHead>
                <button
                  onClick={() => handleSort('use')}
                  className={sortConfig.key === 'use' ? 'text-red-500' : ''}
                >
                  사용
                </button>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedData.map((item, index) => (
              <TableRow 
                key={index}
                className="cursor-pointer hover:bg-gray-50"
                onClick={() => handleRowClick(item.orgName)}
              >
                <TableCell>{item.orgName}</TableCell>
                <TableCell>
                <a
                  href={detailUrlHref(item.detailUrl)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  {detailUrlA(item.detailUrl)}
                </a>
                </TableCell>
                <TableCell>{item.region}</TableCell>
                <TableCell>{item.registration}</TableCell>
                <TableCell>{item.use}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {selectedOrgName && (
        <SettingsEditModal
          orgName={selectedOrgName}
          onClose={() => setSelectedOrgName(null)}
        />
      )}
    </>
  );
}
