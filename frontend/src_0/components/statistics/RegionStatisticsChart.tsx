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

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface RegionData {
  region: string;
  count: number;
}

interface RegionStatisticsChartProps {
  data: RegionData[];
}

const REGION_COLORS = {
  '서울': 'rgba(255, 99, 132, 0.8)',
  '경기': 'rgba(54, 162, 235, 0.8)',
  '인천': 'rgba(255, 206, 86, 0.8)',
  '강원': 'rgba(75, 192, 192, 0.8)',
  '충북': 'rgba(153, 102, 255, 0.8)',
  '충남': 'rgba(255, 159, 64, 0.8)',
  '대전': 'rgba(255, 99, 255, 0.8)',
  '경북': 'rgba(128, 128, 0, 0.8)',
  '경남': 'rgba(0, 128, 128, 0.8)',
  '대구': 'rgba(128, 0, 128, 0.8)',
  '울산': 'rgba(0, 255, 0, 0.8)',
  '부산': 'rgba(255, 128, 0, 0.8)',
  '전북': 'rgba(0, 128, 255, 0.8)',
  '전남': 'rgba(255, 0, 128, 0.8)',
  '광주': 'rgba(128, 255, 0, 0.8)',
  '제주': 'rgba(0, 255, 128, 0.8)',
  '세종': 'rgba(128, 0, 255, 0.8)',
  '미지정': 'rgba(128, 128, 128, 0.8)',
};

export function RegionStatisticsChart({ data }: RegionStatisticsChartProps) {
  // 날짜를 mm-dd 형식으로 변환하는 함수
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${month}-${day}`;
  };

  // 데이터를 개수 기준으로 내림차순 정렬
  const sortedData = [...data].sort((a, b) => b.count - a.count);
  const regions = sortedData.map(item => item.region);

  const chartData = {
    labels: Array.from({ length: 10 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (9 - i));
      return formatDate(date.toISOString());
    }),
    datasets: regions.map(region => ({
      label: region,
      data: Array.from({ length: 10 }, () => 
        data.find(item => item.region === region)?.count || 0
      ),
      backgroundColor: REGION_COLORS[region as keyof typeof REGION_COLORS] || 'rgba(128, 128, 128, 0.8)',
      borderColor: REGION_COLORS[region as keyof typeof REGION_COLORS]?.replace('0.8', '1') || 'rgb(128, 128, 128)',
      borderWidth: 1,
    })),
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right' as const,
        labels: {
          generateLabels: (chart: any) => {
            const datasets = chart.data.datasets;
            return datasets.map((dataset: any, i: number) => ({
              text: `${dataset.label} (${dataset.data[dataset.data.length - 1]})`,
              fillStyle: dataset.backgroundColor,
              strokeStyle: dataset.borderColor,
              lineWidth: 1,
              hidden: false,
              index: i,
            }));
          }
        }
      },
      tooltip: {
        callbacks: {
          title: (context: any) => {
            return context[0].label;
          },
          label: (context: any) => {
            return `${context.dataset.label}: ${context.raw}`;
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
      },
      y: {
        stacked: true,
        beginAtZero: true,
        ticks: {
          stepSize: 1,
        },
      },
    },
  };

  return (
    <div className="h-full w-full">
      <Bar data={chartData} options={options} />
    </div>
  );
} 