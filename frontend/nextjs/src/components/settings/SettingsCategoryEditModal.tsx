'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface SettingsCategoryEditModalProps {
  sn: number;
  onClose: () => void;
}

export function SettingsCategoryEditModal({ sn, onClose }: SettingsCategoryEditModalProps) {
  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>카테고리 설정 수정</DialogTitle>
        </DialogHeader>
        <div className="py-4">
          <p>카테고리 설정 수정 기능은 현재 개발 중입니다.</p>
          <p className="text-sm text-color-primary-muted-foreground mt-2">선택된 카테고리 번호: {sn}</p>
        </div>
      </DialogContent>
    </Dialog>
  );
} 