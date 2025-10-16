'use client';

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
import { useState, useEffect } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface CategoryChartData {
  date: string;
  dayOfWeek: string;
  construction: number;
  performance: number;
  etc: number;
  subtotal: number;
  total: number;
}

interface RegionChartData {
  date: string;
  regions: {
    region: string;
    construction: number;
    performance: number;
    etc: number;
    subtotal: number;
    total: number;
  }[];
  totals: {
    construction: number;
    performance: number;
    etc: number;
    subtotal: number;
    total: number;
  };
}

interface NoticeStatisticsChartProps {
  data: CategoryChartData[] | RegionChartData[];
  type: 'category' | 'region';
  categoryLabels?: string[];
}

export function NoticeStatisticsChart({ data, type, categoryLabels = ['공사점검', '성능평가', '기타'] }: NoticeStatisticsChartProps) {
  // 동적 색상 배열
  const colors = [
    process.env.NEXT_PUBLIC_PINK || 'rgba(255, 99, 132, 0.5)',
    process.env.NEXT_PUBLIC_GREEN || 'rgba(54, 162, 235, 0.5)', 
    process.env.NEXT_PUBLIC_BLUE || 'rgba(255, 206, 86, 0.5)',
    'rgba(75, 192, 192, 0.5)',
    'rgba(153, 102, 255, 0.5)',
    'rgba(255, 159, 64, 0.5)',
    'rgba(199, 199, 199, 0.5)',
    'rgba(83, 166, 157, 0.5)'
  ];
  // 선택된 항목 상태 관리
  const [selectedItem, setSelectedItem] = useState<string>('전체');
  const [isDarkMode, setIsDarkMode] = useState(false);

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

  // 지역별 색상 매핑
  const REGION_COLORS = {
    '서울': { bg: 'rgba(255, 99, 132, 0.5)', border: 'rgba(255, 99, 132, 1)' },
    '부산': { bg: 'rgba(54, 162, 235, 0.5)', border: 'rgba(54, 162, 235, 1)' },
    '대구': { bg: 'rgba(255, 206, 86, 0.5)', border: 'rgba(255, 206, 86, 1)' },
    '인천': { bg: 'rgba(75, 192, 192, 0.5)', border: 'rgba(75, 192, 192, 1)' },
    '광주': { bg: 'rgba(153, 102, 255, 0.5)', border: 'rgba(153, 102, 255, 1)' },
    '대전': { bg: 'rgba(255, 159, 64, 0.5)', border: 'rgba(255, 159, 64, 1)' },
    '울산': { bg: 'rgba(199, 199, 199, 0.5)', border: 'rgba(199, 199, 199, 1)' },
    '세종': { bg: 'rgba(83, 166, 157, 0.5)', border: 'rgba(83, 166, 157, 1)' },
    '경기': { bg: 'rgba(128, 0, 128, 0.5)', border: 'rgba(128, 0, 128, 1)' },
    '강원': { bg: 'rgba(255, 99, 71, 0.5)', border: 'rgba(255, 99, 71, 1)' },
    '충북': { bg: 'rgba(70, 130, 180, 0.5)', border: 'rgba(70, 130, 180, 1)' },
    '충남': { bg: 'rgba(210, 105, 30, 0.5)', border: 'rgba(210, 105, 30, 1)' },
    '전북': { bg: 'rgba(0, 128, 0, 0.5)', border: 'rgba(0, 128, 0, 1)' },
    '전남': { bg: 'rgba(255, 0, 255, 0.5)', border: 'rgba(255, 0, 255, 1)' },
    '경북': { bg: 'rgba(0, 0, 139, 0.5)', border: 'rgba(0, 0, 139, 1)' },
    '경남': { bg: 'rgba(184, 134, 11, 0.5)', border: 'rgba(184, 134, 11, 1)' },
    '제주': { bg: 'rgba(169, 169, 169, 0.5)', border: 'rgba(169, 169, 169, 1)' },
    '미지정': { bg: 'rgba(128, 128, 128, 0.5)', border: 'rgba(128, 128, 128, 1)' }
  };

  // 날짜를 mm-dd 형식으로 변환하는 함수
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${month}-${day}`;
  };

  // 요일을 가져오는 함수
  const getDayOfWeek = (dateStr: string) => {
    const days = ['일', '월', '화', '수', '목', '금', '토'];
    const dayIndex = new Date(dateStr).getDay();
    return days[dayIndex];
  };

  // 데이터 처리
  const processedData = type === 'category' 
    ? (data as CategoryChartData[])
    : (data as RegionChartData[]).flatMap(item => 
        (item.regions || []).map(region => ({
          date: item.date,
          region: region.region,
          construction: region.construction,
          performance: region.performance,
          etc: region.etc,
          total: region.total,
        }))
      );

  // 지역별 데이터를 날짜별로 그룹화
  const groupedByRegion = type === 'region'
    ? processedData.reduce((acc: any, item: any) => {
        if (!acc[item.region]) {
          acc[item.region] = {
            label: item.region,
            dates: {},
          };
        }
        acc[item.region].dates[item.date] = {
          construction: item.construction,
          performance: item.performance,
          etc: item.etc,
          total: item.total,
        };
        return acc;
      }, {})
    : {};

  // 모든 날짜 목록 (정렬된)
  const allDates = type === 'category'
    ? (data as CategoryChartData[]).map(item => item.date).sort((a, b) => new Date(b).getTime() - new Date(a).getTime())
    : Array.from(new Set((data as RegionChartData[]).map(item => item.date))).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

  // 최대값 계산
  const maxStackedValue = type === 'category'
    ? processedData.reduce((max, item: any) => {
        const stackedValue = item.construction + item.performance + item.etc;
        return Math.max(max, stackedValue);
      }, 0)
    : Object.values(groupedByRegion).reduce((max: number, region: any) => {
        const regionMax = Object.values(region.dates).reduce((rMax: number, date: any) => {
          if (selectedItem === '전체') {
            return Math.max(rMax, date.total);
          } else if (categoryLabels.includes(selectedItem)) {
            return Math.max(rMax, date[selectedItem] || 0);
          }
          return rMax;
        }, 0);
        return Math.max(max, regionMax);
      }, 0);

  const maxTotalValue = type === 'category'
    ? processedData.reduce((max, item: any) => Math.max(max, item.total), 0)
    : maxStackedValue;

  // Y축 스케일 계산
  const calculateAxisMax = (value: number, baseUnit: number) => {
    if (value === 0) return baseUnit;
    const magnitude = Math.floor(Math.log10(value));
    const unit = baseUnit * Math.pow(10, Math.floor(magnitude / Math.log10(baseUnit)));
    return Math.ceil(value / unit) * unit;
  };

  // 왼쪽 Y축 (누적 막대)의 최대값과 단위 계산
  const leftAxisUnit = maxStackedValue <= 20 ? 5 : maxStackedValue <= 100 ? 10 : 20;
  const leftAxisMax = calculateAxisMax(maxStackedValue, leftAxisUnit);

  // 오른쪽 Y축 (전체)의 최대값과 단위 계산
  const rightAxisUnit = maxTotalValue <= 100 ? 50 : maxTotalValue <= 1000 ? 100 : 200;
  const rightAxisMax = calculateAxisMax(maxTotalValue, rightAxisUnit);

  const chartData = {
    labels: allDates.map(formatDate),
    datasets: type === 'category' ? [
      // 동적 카테고리 데이터셋
      ...categoryLabels.map((label, index) => ({
        label: label,
        data: allDates.map(date => (data as CategoryChartData[]).find(item => item.date === date)?.[label] || 0),
        backgroundColor: colors[index % colors.length],
        borderColor: colors[index % colors.length]?.replace(/[\d.]+\)$/, '1)'),
        borderWidth: 1,
        stack: 'stack1',
        barPercentage: 1,
        categoryPercentage: 0.8,
      })),
      // 전체 데이터셋
      {
        label: '전체',
        data: allDates.map(date => (data as CategoryChartData[]).find(item => item.date === date)?.total || 0),
        backgroundColor: process.env.NEXT_PUBLIC_GRAY,
        borderColor: process.env.NEXT_PUBLIC_GRAY?.replace(/[\d.]+\)$/, '0.8)'),
        borderWidth: 1,
        yAxisID: 'y1',
        stack: 'stack2',
        barPercentage: 0.5,
        categoryPercentage: 0.8,
      },
    ] : Object.values(groupedByRegion).map((region: any) => ({
      label: region.label,
      data: allDates.map(date => {
        const dateData = region.dates[date];
        if (!dateData) return 0;
        
        if (selectedItem === '전체') {
          return dateData.total;
        } else if (categoryLabels.includes(selectedItem)) {
          return dateData[selectedItem] || 0;
        }
        return 0;
      }),
      backgroundColor: REGION_COLORS[region.label]?.bg || 'rgba(128, 128, 128, 0.5)',
      borderColor: REGION_COLORS[region.label]?.border || 'rgba(128, 128, 128, 1)',
      borderWidth: 1,
      stack: 'stack1',
      barPercentage: 0.8,
      categoryPercentage: 0.8,
    })),
  };

  // 다크 모드에 따른 색상 설정
  const textColor = isDarkMode ? '#e5e7eb' : '#374151'; // gray-200 : gray-700
  const gridColor = isDarkMode ? '#374151' : '#e5e7eb'; // gray-700 : gray-200

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index' as const,
      intersect: false,
    },
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          color: textColor,
        },
      },
      tooltip: {
        backgroundColor: isDarkMode ? '#1f2937' : '#ffffff',
        titleColor: textColor,
        bodyColor: textColor,
        borderColor: gridColor,
        borderWidth: 1,
        callbacks: {
          title: (context: any) => {
            const dataIndex = context[0].dataIndex;
            const date = allDates[dataIndex];
            if (type === 'category') {
              const item = data as CategoryChartData[];
              const matchingItem = item.find(i => i.date === date);
              return `${date} (${matchingItem?.dayOfWeek})`;
            }
            return `${date} (${getDayOfWeek(date)})`;
          },
        },
      },
    },
    scales: {
      x: {
        stacked: true,
        grid: {
          display: false,
        },
        reverse: true,
        ticks: {
          color: textColor,
          callback: function(_val: any, index: number) {
            const date = allDates[index];
            if (type === 'category') {
              const item = data as CategoryChartData[];
              const matchingItem = item.find(i => i.date === date);
              return [formatDate(date), `(${matchingItem?.dayOfWeek})`];
            }
            return [formatDate(date), `(${getDayOfWeek(date)})`];
          },
          padding: 8,
        },
      },
      y: {
        type: 'linear' as const,
        display: true,
        position: 'left' as const,
        stacked: true,
        beginAtZero: true,
        max: leftAxisMax,
        grid: {
          color: gridColor,
        },
        ticks: {
          color: textColor,
          stepSize: leftAxisUnit,
        },
        title: {
          display: true,
          text: type === 'category' ? '유형별 공고 수' : '지역별 공고 수',
          color: textColor,
        },
      },
      y1: type === 'category' ? {
        type: 'linear' as const,
        display: true,
        position: 'right' as const,
        beginAtZero: true,
        max: rightAxisMax,
        grid: {
          drawOnChartArea: false,
        },
        ticks: {
          color: textColor,
          stepSize: rightAxisUnit,
        },
        title: {
          display: true,
          text: '전체 공고 수',
          color: textColor,
        },
      } : {
        display: false,
      },
    },
  };

  return (
    <div className="relative h-[400px] p-4 overflow-hidden">
      {type === 'region' && (
        <div className="absolute top-2 right-2 z-10">
          <Select value={selectedItem} onValueChange={setSelectedItem}>
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="항목 선택" />
            </SelectTrigger>
            <SelectContent>
              {categoryLabels.map((label) => (
                <SelectItem key={label} value={label}>
                  {label}
                </SelectItem>
              ))}
              <SelectItem value="전체">전체</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}
      <Bar data={chartData} options={options} />
    </div>
  );
} 