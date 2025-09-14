'use client';

import { useQuery } from '@apollo/client';
import { gql } from '@apollo/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

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

interface ErrorScrapingTableProps {
  initialData: {
    id: string;
    orgName: string;
    errorMessage: string;
    time: string;
  }[];
}

export function ErrorScrapingTable({ initialData }: ErrorScrapingTableProps) {
  const [gap, setGap] = useState(7); // 기본값: 7일
  const { data, loading, error } = useQuery(GET_ERROR_SCRAPINGS, {
    variables: { gap },
    skip: false, // 항상 쿼리 실행
    fetchPolicy: 'no-cache', // 캐시를 사용하지 않고 항상 새로운 데이터를 가져옴
  });

  const errorScrapings = data?.logsErrorAll || initialData || [];

  const handleGapChange = (value: string) => {
    // 문자열 값을 숫자로 변환
    const gapValue = parseInt(value, 10);
    setGap(gapValue);
  };

  if (loading && !errorScrapings.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>스크래핑 오류 통계</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error && !errorScrapings.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>스크래핑 오류 통계</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-destructive">
            <p>데이터를 불러오는 중 오류가 발생했습니다.</p>
            <p>{error.message}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>스크래핑 오류 통계</CardTitle>
        <Select value={gap.toString()} onValueChange={handleGapChange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="기간 선택" />
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
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>시간</TableHead>
                <TableHead>기관명</TableHead>
                <TableHead>오류 메시지</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {errorScrapings.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>{item.time.replace('T', ' ')}</TableCell>
                  <TableCell>{item.orgName || '에러 없음'}</TableCell>
                  <TableCell>
                    <div className="max-w-md overflow-hidden text-ellipsis whitespace-nowrap">
                      {item.errorMessage}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
} 