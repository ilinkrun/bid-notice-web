'use client';

import { DataTable, DataTableHeader, DataTableBody, DataTableRow, DataTableCell } from '@/components/shared/DataTable';
import { useState, useMemo, useEffect } from 'react';
import { useUnifiedNavigation } from '@/hooks/useUnifiedNavigation';
import { useUnifiedLoading } from '@/components/providers/UnifiedLoadingProvider';
import { IsActive } from '@/components/shared/FormComponents';

interface SettingsListTableProps {
  initialData: {
    oid: number;
    orgName: string;
    url: string;
    detailUrl: string;
    use: number;
    orgRegion: string;
    companyInCharge: string;
    orgMan: string;
  }[];
}

type SortConfig = {
  key: keyof SettingsListTableProps['initialData'][0] | null;
  direction: 'asc' | 'desc';
};

const detailUrlHref = (detailUrl: string | undefined) => {
  if (!detailUrl || detailUrl.length < 2) {
    return '#';
  }
  return detailUrl.replace('${i}', '1');
};

const detailUrlA = (detailUrl: string | undefined) => {
  if (!detailUrl || detailUrl.length < 2) {
    return '';
  }
  const urlParts = detailUrl.split('://');
  if (urlParts.length < 2) {
    return detailUrl;
  }
  const domain = urlParts[1].split('/')[0];
  return urlParts[0] + '://' + domain;
};

export function SettingsListTable({ initialData }: SettingsListTableProps) {
  const { navigate } = useUnifiedNavigation();
  const { finishLoading } = useUnifiedLoading();
  const [sortConfig, setSortConfig] = useState<SortConfig>({
    key: null,
    direction: 'asc',
  });

  // 설정 데이터 로딩 완료 감지: 서버사이드에서 이미 로드된 데이터가 있으므로 즉시 완료
  useEffect(() => {
    // initialData가 이미 서버에서 로드되어 전달된 상태
    console.log(`[SettingsListTable] 설정 데이터 로딩 완료: ${initialData?.length || 0}개 항목`);
    finishLoading();
  }, [finishLoading]);

  const handleRowClick = (oid: number) => {
    navigate(`/settings/scrapping/${oid}`);
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

    const key = sortConfig.key;
    return [...initialData].sort((a, b) => {
      const aValue = a[key] ?? '';
      const bValue = b[key] ?? '';
      if (aValue < bValue) {
        return sortConfig.direction === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortConfig.direction === 'asc' ? 1 : -1;
      }
      return 0;
    });
  }, [initialData, sortConfig]);

  return (
    <div className="statistics-cell">
      <DataTable>
        <DataTableHeader>
          <DataTableRow isHoverable={false}>
            <DataTableCell
              isHeader
              onClick={() => handleSort('orgName')}
              className={`cursor-pointer ${sortConfig.key === 'orgName' ? 'text-primary' : ''}`}
            >
              기관명
            </DataTableCell>
            <DataTableCell
              isHeader
              onClick={() => handleSort('url')}
              className={`cursor-pointer ${sortConfig.key === 'url' ? 'text-primary' : ''}`}
            >
              크롤링 URL
            </DataTableCell>
            <DataTableCell
              isHeader
              onClick={() => handleSort('companyInCharge')}
              className={`cursor-pointer ${sortConfig.key === 'companyInCharge' ? 'text-primary' : ''}`}
            >
              담당업체
            </DataTableCell>
            <DataTableCell
              isHeader
              onClick={() => handleSort('orgRegion')}
              className={`cursor-pointer ${sortConfig.key === 'orgRegion' ? 'text-primary' : ''}`}
            >
              지역
            </DataTableCell>
            <DataTableCell
              isHeader
              onClick={() => handleSort('use')}
              className={`cursor-pointer ${sortConfig.key === 'use' ? 'text-primary' : ''}`}
            >
              상태
            </DataTableCell>
          </DataTableRow>
        </DataTableHeader>
        <DataTableBody>
          {sortedData.map((item, index) => (
            <DataTableRow
              key={index}
              onClick={() => handleRowClick(item.oid)}
            >
              <DataTableCell>{item.orgName}</DataTableCell>
              <DataTableCell>
                <a
                  href={detailUrlHref(item.url)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline dark:text-blue-400"
                  onClick={(e) => e.stopPropagation()}
                >
                  {detailUrlA(item.url)}
                </a>
              </DataTableCell>
              <DataTableCell>{item.companyInCharge || '-'}</DataTableCell>
              <DataTableCell>{item.orgRegion || '-'}</DataTableCell>
              <DataTableCell>
                <IsActive value={item.use === 1} />
              </DataTableCell>
            </DataTableRow>
          ))}
        </DataTableBody>
      </DataTable>
    </div>
  );
}
