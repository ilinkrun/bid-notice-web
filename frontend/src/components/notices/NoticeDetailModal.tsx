'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { type Notice } from '@/types/notice';

interface NoticeDetailModalProps {
  notice: Notice;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function NoticeDetailModal({ notice, open, onOpenChange }: NoticeDetailModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>공고 상세 정보</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-4 gap-4 text-sm">
            <div className="font-medium">제목</div>
            <div className="col-span-3">
              <a
                href={notice.detailUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800 hover:underline"
              >
                {notice.title}
              </a>
            </div>

            <div className="font-medium">기관명</div>
            <div className="col-span-3">{notice.orgName}</div>

            <div className="font-medium">지역</div>
            <div className="col-span-3">{notice.region || '-'}</div>

            <div className="font-medium">등록일</div>
            <div className="col-span-3">{notice.registration || '-'}</div>

            <div className="font-medium">공고 ID</div>
            <div className="col-span-3">{notice.nid}</div>

            {notice.description && (
              <>
                <div className="font-medium">상세 내용</div>
                <div className="col-span-3 whitespace-pre-wrap">{notice.description}</div>
              </>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
