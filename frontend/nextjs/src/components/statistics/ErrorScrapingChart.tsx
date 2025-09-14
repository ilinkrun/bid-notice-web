'use client';

import { useQuery } from '@apollo/client';
import { gql } from '@apollo/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useState, useEffect } from 'react';
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
    logsErrorAll(gap: $gap) {
      id
      orgName
      errorMessage
      time
    }
  }
`;

interface ErrorScraping {
  id: string;
  orgName: string;
  errorMessage: string;
  time: string;
}

interface ErrorScrapingChartProps {
  initialData?: ErrorScraping[];
}

export function ErrorScrapingChart({ initialData }: ErrorScrapingChartProps) {
  const [gap, setGap] = useState(7); // 기본값: 7일
  const [isDarkMode, setIsDarkMode] = useState(false);

  const { data, loading, error } = useQuery(GET_ERROR_SCRAPINGS, {
    variables: { gap },
    skip: false, // 항상 쿼리 실행
    fetchPolicy: 'no-cache', // 캐시를 사용하지 않고 항상 새로운 데이터를 가져옴
  });

  // 다크 모드 감지
  useEffect(() => {
    const checkDarkMode = () => {
      const isDark = document.documentElement.classList.contains('dark');
      setIsDarkMode(isDark);
    };

    checkDarkMode();

    // MutationObserver로 다크 모드 변경 감지
    const observer = new MutationObserver(checkDarkMode);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    });

    return () => observer.disconnect();
  }, []);

  const errorScrapings = data?.logsErrorAll || initialData || [];

  if (loading && !errorScrapings.length) {
    return <div className="text-foreground">로딩 중...</div>;
  }

  if (error && !errorScrapings.length) {
    return <div className="text-destructive">에러가 발생했습니다: {error.message}</div>;
  }

  // 시간별로 오류 그룹화
  const groupedErrors = errorScrapings.reduce((acc: Record<string, Set<string>>, item) => {
    const timeKey = item.time.split('T')[0]; // 날짜만 추출
    if (!acc[timeKey]) {
      acc[timeKey] = new Set();
    }
    // 쉼표로 구분된 기관명들을 개별적으로 처리
    if (item.orgName) {
      const orgNames = item.orgName.split(',').map(name => name.trim()).filter(name => name);
      orgNames.forEach(orgName => acc[timeKey].add(orgName));
    }
    return acc;
  }, {});

  const chartData = {
    labels: Object.keys(groupedErrors).sort(),
    datasets: [
      {
        label: '오류 발생 기관 수',
        data: (Object.values(groupedErrors) as Set<string>[]).map(orgSet => orgSet.size),
        backgroundColor: '#ef4444',
        borderColor: '#dc2626',
        borderWidth: 1,
      },
    ],
  };

  // 다크 모드에 따른 색상 설정
  const textColor = isDarkMode ? '#e5e7eb' : '#374151'; // gray-200 : gray-700
  const gridColor = isDarkMode ? '#374151' : '#e5e7eb'; // gray-700 : gray-200

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          color: textColor,
        },
      },
      title: {
        display: false,
      },
      tooltip: {
        backgroundColor: isDarkMode ? '#1f2937' : '#ffffff',
        titleColor: textColor,
        bodyColor: textColor,
        borderColor: gridColor,
        borderWidth: 1,
      },
    },
    scales: {
      x: {
        ticks: {
          color: textColor,
        },
        grid: {
          color: gridColor,
        },
      },
      y: {
        beginAtZero: true,
        ticks: {
          color: textColor,
          stepSize: 1,
        },
        grid: {
          color: gridColor,
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