'use client';

import { useQuery } from '@apollo/client';
import { gql } from '@apollo/client';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useState } from 'react';

const GET_SETTING_LIST = gql`
  query GetSettingList($orgName: String!) {
    settingList(orgName: $orgName) {
      orgName
      detailUrl
      region
      registration
      use
      elements {
        key
        xpath
        target
        callback
      }
      endPage
      iframe
      login
      paging
      rowXpath
      startPage
    }
  }
`;

interface SettingsEditModalProps {
  orgName: string;
  onClose: () => void;
}

interface Element {
  key: string;
  xpath: string;
  target?: string;
  callback?: string;
}

export function SettingsEditModal({ orgName, onClose }: SettingsEditModalProps) {
  const { data, loading, error } = useQuery(GET_SETTING_LIST, {
    variables: { orgName },
  });

  const [editedSetting, setEditedSetting] = useState<any>(null);

  // 데이터가 로드되면 편집 가능한 상태로 설정
  if (data?.settingList && !editedSetting) {
    setEditedSetting(data.settingList);
  }

  const handleChange = (field: string, value: string | number | boolean) => {
    setEditedSetting((prev: any) => ({
      ...prev,
      [field]: field === 'use' ? (value ? 1 : 0) : value,
    }));
  };

  const handleElementChange = (index: number, field: keyof Element, value: string) => {
    setEditedSetting((prev: any) => {
      if (!prev) return prev;
      const newElements = [...(prev.elements || [])];
      newElements[index] = {
        ...newElements[index],
        [field]: value,
      };
      return {
        ...prev,
        elements: newElements,
      };
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // 여기에 저장 로직 추가
    console.log('저장된 설정:', editedSetting);
    onClose();
  };

  if (loading) {
    return (
      <Dialog open onOpenChange={onClose}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>스크랩 설정 수정</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (error) {
    return (
      <Dialog open onOpenChange={onClose}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>스크랩 설정 수정</DialogTitle>
          </DialogHeader>
          <div className="text-red-500">
            <p>데이터를 불러오는 중 오류가 발생했습니다.</p>
            <p>{error.message}</p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (!editedSetting) return null;

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-h-[90vh] overflow-y-auto rounded-none w-[98vw] max-w-[98vw] !important">
        <DialogHeader>
          <DialogTitle>스크랩 설정 수정</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 기본 정보 */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label htmlFor="기관명" className="text-xs">기관명</Label>
              <Input
                id="기관명"
                value={editedSetting.orgName}
                onChange={(e) => handleChange('orgName', e.target.value)}
                required
                className="h-8 text-sm text-gray-800"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="지역" className="text-xs">지역</Label>
              <Input
                id="지역"
                value={editedSetting.region || ''}
                onChange={(e) => handleChange('region', e.target.value)}
                className="h-8 text-sm text-gray-800"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="startPage" className="text-xs">시작</Label>
              <Input
                id="startPage"
                type="number"
                value={editedSetting.startPage || 1}
                onChange={(e) => handleChange('startPage', parseInt(e.target.value))}
                className="h-8 text-sm text-gray-800"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="endPage" className="text-xs">종료</Label>
              <Input
                id="endPage"
                type="number"
                value={editedSetting.endPage || 1}
                onChange={(e) => handleChange('endPage', parseInt(e.target.value))}
                className="h-8 text-sm text-gray-800"
              />
            </div>
            <div className="flex justify-start">
              <div className="flex items-center gap-0.5">
                <Checkbox
                  id="등록"
                  checked={editedSetting.registration === 1}
                  onCheckedChange={(checked) => handleChange('registration', checked ? 1 : 0)}
                  className="h-4 w-4"
                />
                <Label htmlFor="등록" className="text-xs">등록</Label>
              </div>
            </div>
            <div className="flex justify-end">
              <div className="flex items-center gap-0.5">
                <Checkbox
                  id="use"
                  checked={editedSetting.use === 1}
                  onCheckedChange={(checked) => handleChange('use', checked ? 1 : 0)}
                  className="h-4 w-4"
                />
                <Label htmlFor="use" className="text-xs">사용</Label>
              </div>
            </div>
          </div>

          {/* URL 및 XPath 설정 */}
          <div className="space-y-2">
            <Label htmlFor="url">URL</Label>
            <Input
              id="url"
              value={editedSetting.detailUrl || ''}
              onChange={(e) => handleChange('detailUrl', e.target.value)}
              className="text-gray-800"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="rowXpath">행 XPath</Label>
            <Input
              id="rowXpath"
              value={editedSetting.rowXpath || ''}
              onChange={(e) => handleChange('rowXpath', e.target.value)}
              className="text-gray-800"
            />
          </div>

          {/* 페이징 설정 */}
          <div className="space-y-2">
            <Label htmlFor="paging">페이징</Label>
            <Input
              id="paging"
              value={editedSetting.paging || ''}
              onChange={(e) => handleChange('paging', e.target.value)}
              className="text-gray-800"
            />
          </div>

          {/* 스크랩 요소 */}
          <div className="space-y-2">
            <Label>스크랩 요소</Label>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[100px]">key</TableHead>
                  <TableHead className="w-[300px]">xpath</TableHead>
                  <TableHead className="w-[200px]">attribute</TableHead>
                  <TableHead className="w-[800px]">callback</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {editedSetting.elements?.map((element: Element, index: number) => (
                  <TableRow key={index}>
                    <TableCell className="w-[100px]">{element.key}</TableCell>
                    <TableCell className="w-[300px]">
                      <Input
                        value={element.xpath}
                        onChange={(e) => handleElementChange(index, 'xpath', e.target.value)}
                        className="text-gray-800"
                      />
                    </TableCell>
                    <TableCell className="w-[200px]">
                      <Input
                        value={element.target || ''}
                        onChange={(e) => handleElementChange(index, 'target', e.target.value)}
                        className="text-gray-800"
                      />
                    </TableCell>
                    <TableCell className="w-[800px]">
                      <Input
                        value={element.callback || ''}
                        onChange={(e) => handleElementChange(index, 'callback', e.target.value)}
                        className="text-gray-800"
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* 버튼 */}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              취소
            </Button>
            <Button type="submit">저장</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
