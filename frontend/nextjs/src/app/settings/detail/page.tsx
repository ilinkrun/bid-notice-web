'use client';

import { useQuery } from '@apollo/client';
import { getClient } from '@/lib/api/graphqlClient';
import { gql } from '@apollo/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { useUnifiedLoading } from '@/components/providers/UnifiedLoadingProvider';
import { useUnifiedNavigation } from '@/hooks/useUnifiedNavigation';
import { useEffect } from 'react';

// GraphQL 쿼리 정의
const GET_SETTINGS_NOTICE_DETAILS = gql`
  query GetSettingsDetails {
    settingsDetails {
      title
      orgName
    }
  }
`;

export default function SettingsDetailPage() {
  const { navigate } = useUnifiedNavigation();
  const { finishLoading } = useUnifiedLoading();

  // 설정 상세 목록 쿼리
  const { loading: loadingDetails, error: errorDetails, data: dataDetails } = useQuery(GET_SETTINGS_NOTICE_DETAILS, {
    client: getClient()
  });

  useEffect(() => {
    if (dataDetails) {
      console.log('GET_SETTINGS_NOTICE_DETAILS 완료:', dataDetails);
    }
  }, [dataDetails]);

  useEffect(() => {
    if (errorDetails) {
      console.error('GET_SETTINGS_NOTICE_DETAILS 에러:', errorDetails);
    }
  }, [errorDetails]);

  // GraphQL 쿼리 완료 또는 데이터 없음 시에만 로딩 해제
  useEffect(() => {
    if (!loadingDetails && (dataDetails !== undefined || errorDetails)) {
      finishLoading();
    }
  }, [loadingDetails, dataDetails, errorDetails, finishLoading]);

  // 기관 선택 핸들러 - 페이지 이동
  const handleOrgSelect = (orgName: string) => {
    console.log('기관 선택:', orgName);
    const encodedOrgName = encodeURIComponent(orgName);
    navigate(`/settings/detail/${encodedOrgName}`);
  };

  // 로딩 상태 처리
  if (loadingDetails) {
    return (
      <div className="container mx-auto py-10">
        <Card>
          <CardHeader>
            <CardTitle>설정 상세</CardTitle>
            <CardDescription>기관별 설정 상세 정보를 관리합니다.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // 에러 상태 처리
  if (errorDetails) {
    return (
      <div className="container mx-auto py-10">
        <Card>
          <CardHeader>
            <CardTitle>오류 발생</CardTitle>
            <CardDescription>데이터를 불러오는 중 오류가 발생했습니다.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-red-500">{errorDetails.message}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-10">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>상세페이지 스크랩 설정</CardTitle>
              <CardDescription>기관별 설정 상세 정보를 관리합니다.</CardDescription>
            </div>
            <a
              href="/settings/detail/new"
              className="inline-flex items-center justify-center whitespace-nowrap text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 bg-primary text-primary-foreground hover:bg-primary/90 h-9 gap-1.5 px-3 has-[>svg]:px-2.5"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                <path d="M5 12h14" />
                <path d="M12 5v14" />
              </svg>
              추가
            </a>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>기관명</TableHead>
                <TableHead>제목</TableHead>
                <TableHead>작업</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {dataDetails?.settingsDetails?.map((detail: any) => (
                <TableRow key={detail.orgName}>
                  <TableCell>{detail.orgName}</TableCell>
                  <TableCell>{detail.title}</TableCell>
                  <TableCell>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleOrgSelect(detail.orgName)}
                    >
                      상세 보기
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
} 