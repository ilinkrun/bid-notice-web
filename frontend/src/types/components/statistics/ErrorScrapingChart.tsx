'use client';

import { useQuery } from '@apollo/client';
import { gql } from '@apollo/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useState } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const GET_ERROR_SCRAPINGS = gql`
  query GetErrorScrapings($gap: Int!) {
    errorScrapings(gap: $gap) {
      orgNames
      time
    }
  }
`;

interface ErrorScraping {
  orgNames: string[];
  time: string;
}

interface ErrorScrapingChartProps {
  initialData?: ErrorScraping[];
}

export function ErrorScrapingChart({ initialData }: ErrorScrapingChartProps) {
  const [gap, setGap] = useState(7); // 기본값: 7일
  const { data, loading, error } = useQuery(GET_ERROR_SCRAPINGS, {
    variables: { gap },
    skip: false, // 항상 쿼리 실행
    fetchPolicy: 'no-cache', // 캐시를 사용하지 않고 항상 새로운 데이터를 가져옴
  });

  const errorScrapings = data?.errorScrapings || initialData || [];

  if (loading && !errorScrapings.length) {
    return <div>로딩 중...</div>;
  }

  if (error && !errorScrapings.length) {
    return <div>에러가 발생했습니다: {error.message}</div>;
  }

  const chartData = {
    labels: errorScrapings.map(item => item.time),
    datasets: [
      {
        label: '오류 발생 기관 수',
        data: errorScrapings.map(item => item.orgNames.length),
        backgroundColor: '#ef4444',
        borderColor: '#dc2626',
        borderWidth: 1,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: false,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          stepSize: 1,
        },
      },
    },
  };

  const handleGapChange = (value: string) => {
    // 문자열 값을 숫자로 변환
    const gapValue = parseInt(value, 10);
    setGap(gapValue);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">스크래핑 오류 통계</CardTitle>
        <Select value={gap.toString()} onValueChange={handleGapChange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="시간 간격 선택" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1">1일</SelectItem>
            <SelectItem value="3">3일</SelectItem>
            <SelectItem value="7">7일</SelectItem>
            <SelectItem value="15">15일</SelectItem>
            <SelectItem value="30">30일</SelectItem>
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent>
        <div className="h-[400px]">
          <Bar options={options} data={chartData} />
        </div>
      </CardContent>
    </Card>
  );
} 