import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CalendarIcon, Building2Icon, MapPinIcon } from 'lucide-react';

interface Notice {
  nid: number;
  title: string;
  orgName: string;
  createdAt: string;
  detailUrl: string;
  category?: string;
  region?: string;
  registration?: string;
}

interface NoticeListProps {
  notices: Notice[];
}

export default function NoticeList({ notices }: NoticeListProps) {
  return (
    <div className="grid gap-3">
      {notices.map((notice) => (
        <Card key={notice.nid} className="hover:bg-muted/50 transition-colors">
          <CardContent className="p-4">
            <a href={notice.detailUrl} target="_blank" rel="noopener noreferrer" className="block">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium text-muted-foreground">#{notice.nid}</span>
                    <h2 className="text-base font-semibold text-foreground">{notice.title}</h2>
                  </div>
                  <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Building2Icon className="w-3.5 h-3.5" />
                      <span>{notice.orgName}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <CalendarIcon className="w-3.5 h-3.5" />
                      <span>{notice.createdAt}</span>
                    </div>
                    {notice.region && (
                      <div className="flex items-center gap-1">
                        <MapPinIcon className="w-3.5 h-3.5" />
                        <span>{notice.region}</span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {notice.registration && (
                    <Badge variant="outline" className="font-normal">
                      {notice.registration}
                    </Badge>
                  )}
                  {notice.category && (
                    <Badge variant="secondary" className="font-normal">
                      {notice.category}
                    </Badge>
                  )}
                </div>
              </div>
            </a>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}