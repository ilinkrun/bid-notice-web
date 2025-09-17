'use client';

import { useState, useEffect } from 'react';
import { gql } from '@apollo/client';
import { useQuery } from '@apollo/client';

interface LogScraping {
  time: string;
  scrapedCount: number;
  orgName: string;
  insertedCount: number;
}

interface LogScrapingStatisticsTableProps {
  initialData: LogScraping[];
  defaultGap: string;
}

const GET_LOG_SCRAPINGS = gql`
  query GetLogScrapings($gap: Int!) {
    logScrapings(gap: $gap) {
      time
      scrapedCount
      orgName
      insertedCount
    }
  }
`;

export function LogScrapingStatisticsTable({ 
  initialData, 
  defaultGap 
}: LogScrapingStatisticsTableProps) {
  const [gap, setGap] = useState(defaultGap);
  
  const { data, loading, error, refetch } = useQuery(GET_LOG_SCRAPINGS, {
    variables: { gap: parseInt(gap) },
    skip: true, // 초기에는 서버 데이터 사용
  });

  const logScrapings = data?.logScrapings || initialData;
  
  // 고유 ID 생성 함수
  const createUniqueId = (item: LogScraping, index: number) => {
    return `${item.time}-${item.orgName}-${index}`;
  };

  return (
    <div>
      <div className="flex items-center mb-4">
        <label htmlFor="gap" className="mr-2">조회 기간(일):</label>
        <input
          id="gap"
          type="number"
          min="1"
          value={gap}
          onChange={(e) => setGap(e.target.value)}
          className="border border-border p-1 mr-2  text-color-primary-foreground"
        />
        <button
          onClick={() => refetch({ gap: parseInt(gap) })}
          className="bg-primary text-primary-foreground px-4 py-1 rounded hover:bg-primary/90"
        >
          조회
        </button>
      </div>
      
      {error && <p className="text-destructive">데이터를 불러오는 중 오류가 발생했습니다.</p>}
      
      <table className="min-w-full bg-card">
        <thead>
          <tr>
            <th className="border border-border p-2  text-color-primary-foreground">시간</th>
            <th className="border border-border p-2  text-color-primary-foreground">기관명</th>
            <th className="border border-border p-2  text-color-primary-foreground">스크래핑 건수</th>
            <th className="border border-border p-2  text-color-primary-foreground">삽입 건수</th>
          </tr>
        </thead>
        <tbody>
          {logScrapings.map((item, index) => (
            <tr key={createUniqueId(item, index)}>
              <td className="border border-border p-2">{item.time.replace("T", " ")}</td>
              <td className="border border-border p-2">{item.orgName}</td>
              <td className="border border-border p-2">{item.scrapedCount}</td>
              <td className="border border-border p-2">{item.insertedCount}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
