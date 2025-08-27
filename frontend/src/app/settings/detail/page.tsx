'use client';

import { useState } from 'react';
import { useQuery } from '@apollo/client';
import { getClient } from '@/lib/api/graphqlClient';
import { gql } from '@apollo/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// GraphQL 쿼리 정의
const GET_SETTINGS_DETAILS = gql`
  query GetSettingsDetails {
    settingsDetails {
      title
      orgName
    }
  }
`;

const GET_SETTING_DETAIL = gql`
  query GetSettingDetail($orgName: String!) {
    settingDetail(orgName: $orgName) {
      orgName
      elements {
        key
        xpath
        target
        callback
      }
    }
  }
`;

export default function SettingsDetailPage() {
  const [selectedOrgName, setSelectedOrgName] = useState<string>('');
  const [activeTab, setActiveTab] = useState<string>('list');

  // 설정 상세 목록 쿼리
  const { loading: loadingDetails, error: errorDetails, data: dataDetails } = useQuery(GET_SETTINGS_DETAILS, {
    client: getClient(),
  });

  // 선택된 기관의 상세 설정 쿼리
  const { loading: loadingDetail, error: errorDetail, data: dataDetail } = useQuery(GET_SETTING_DETAIL, {
    client: getClient(),
    variables: { orgName: selectedOrgName },
    skip: !selectedOrgName, // orgName이 없으면 쿼리 실행하지 않음
  });

  // 기관 선택 핸들러
  const handleOrgSelect = (orgName: string) => {
    setSelectedOrgName(orgName);
    setActiveTab('detail');
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
          <CardTitle>상세페이지 스크랩 설정</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="list">기관 목록</TabsTrigger>
              <TabsTrigger value="detail" disabled={!selectedOrgName}>상세 설정</TabsTrigger>
            </TabsList>
            
            <TabsContent value="list">
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
            </TabsContent>
            
            <TabsContent value="detail">
              {loadingDetail ? (
                <div className="space-y-4">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ) : errorDetail ? (
                <p className="text-red-500">{errorDetail.message}</p>
              ) : dataDetail?.settingDetail ? (
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>기관명</Label>
                      <Input value={dataDetail.settingDetail.orgName} readOnly />
                    </div>
                  </div>
                  
                  <div>
                    <Label className="mb-2 block">요소 목록</Label>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>키</TableHead>
                          <TableHead>XPath</TableHead>
                          <TableHead>Target</TableHead>
                          <TableHead>Callback</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {dataDetail.settingDetail.elements?.map((element: any, index: number) => (
                          <TableRow key={index}>
                            <TableCell>{element.key}</TableCell>
                            <TableCell>{element.xpath}</TableCell>
                            <TableCell>{element.target}</TableCell>
                            <TableCell>{element.callback}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              ) : (
                <p>데이터가 없습니다.</p>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
} 