'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Form, FormControl, FormField, FormItem, FormLabel } from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { useNoticeFilterStore, NoticeFilter } from '@/store/noticeFilterStore';
import { useRouter, useSearchParams } from 'next/navigation';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { CalendarIcon } from 'lucide-react';

export function AdvancedSearchModal() {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { filter, setFilter, resetFilter } = useNoticeFilterStore();

  const form = useForm<NoticeFilter>({
    defaultValues: filter,
  });

  // URL 쿼리 파라미터에서 필터 상태 복원
  useEffect(() => {
    const categories = searchParams.get('categories')?.split(',').filter(Boolean) || [];
    const endDate = searchParams.get('endDate') ? new Date(searchParams.get('endDate')!) : null;
    const period = Number(searchParams.get('period')) || 14;
    const scrapEndDate = searchParams.get('scrapEndDate') ? new Date(searchParams.get('scrapEndDate')!) : null;
    const scrapPeriod = Number(searchParams.get('scrapPeriod')) || 14;
    const excludedOrgs = searchParams.get('excludedOrgs') || '';
    const includedOrgs = searchParams.get('includedOrgs') || '';
    const excludedRegions = searchParams.get('excludedRegions') || '';
    const includedRegions = searchParams.get('includedRegions') || '';

    const filterFromUrl = {
      categories,
      endDate,
      period,
      scrapEndDate,
      scrapPeriod,
      excludedOrgs,
      includedOrgs,
      excludedRegions,
      includedRegions,
    };

    form.reset(filterFromUrl);
    setFilter(filterFromUrl);
  }, [searchParams, form, setFilter]);

  const updateQueryParams = (data: NoticeFilter) => {
    const params = new URLSearchParams();
    if (data.categories.length > 0) params.set('categories', data.categories.join(','));
    if (data.endDate) params.set('endDate', data.endDate.toISOString());
    if (data.period !== 14) params.set('period', data.period.toString());
    if (data.scrapEndDate) params.set('scrapEndDate', data.scrapEndDate.toISOString());
    if (data.scrapPeriod !== 14) params.set('scrapPeriod', data.scrapPeriod.toString());
    if (data.excludedOrgs) params.set('excludedOrgs', data.excludedOrgs);
    if (data.includedOrgs) params.set('includedOrgs', data.includedOrgs);
    if (data.excludedRegions) params.set('excludedRegions', data.excludedRegions);
    if (data.includedRegions) params.set('includedRegions', data.includedRegions);

    const queryString = params.toString();
    router.push(queryString ? `?${queryString}` : '');
  };

  const onSubmit = (data: NoticeFilter) => {
    setFilter(data);
    updateQueryParams(data);
    setOpen(false);
  };

  const handleReset = () => {
    resetFilter();
    form.reset(filter);
    router.push('');
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="hidden">상세 검색</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>상세 검색</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="categories"
                render={() => (
                  <FormItem>
                    <FormLabel>카테고리</FormLabel>
                    <div className="flex gap-4">
                      {['공사점검', '성능평가', '기타'].map((category) => (
                        <FormField
                          key={category}
                          control={form.control}
                          name="categories"
                          render={({ field }) => (
                            <FormItem className="flex items-center space-x-2">
                              <FormControl>
                                <Checkbox
                                  checked={field.value?.includes(category)}
                                  onCheckedChange={(checked) => {
                                    const current = field.value || [];
                                    if (checked) {
                                      field.onChange([...current, category]);
                                    } else {
                                      field.onChange(current.filter((value) => value !== category));
                                    }
                                  }}
                                />
                              </FormControl>
                              <FormLabel className="font-normal">{category}</FormLabel>
                            </FormItem>
                          )}
                        />
                      ))}
                    </div>
                  </FormItem>
                )}
              />

              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="endDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>작성일</FormLabel>
                      <div className="flex items-center gap-4">
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              className={cn(
                                'w-[240px] justify-start text-left font-normal',
                                !field.value && 'text-muted-foreground'
                              )}
                            >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {field.value ? format(field.value, 'PPP', { locale: ko }) : '날짜 선택'}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0 bg-white" align="start">
                            <Calendar
                              mode="single"
                              selected={field.value || undefined}
                              onSelect={field.onChange}
                              initialFocus
                              locale={ko}
                              className="bg-white rounded-md border"
                            />
                          </PopoverContent>
                        </Popover>
                        <div className="flex items-center gap-2">
                          <span>기간</span>
                          <Input type="number" {...form.register('period', { valueAsNumber: true })} className="w-20" />
                        </div>
                      </div>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="scrapEndDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>스크랩일</FormLabel>
                      <div className="flex items-center gap-4">
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              className={cn(
                                'w-[240px] justify-start text-left font-normal',
                                !field.value && 'text-muted-foreground'
                              )}
                            >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {field.value ? format(field.value, 'PPP', { locale: ko }) : '날짜 선택'}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0 bg-white" align="start">
                            <Calendar
                              mode="single"
                              selected={field.value || undefined}
                              onSelect={field.onChange}
                              initialFocus
                              locale={ko}
                              className="bg-white rounded-md border"
                            />
                          </PopoverContent>
                        </Popover>
                        <div className="flex items-center gap-2">
                          <span>기간</span>
                          <Input
                            type="number"
                            {...form.register('scrapPeriod', { valueAsNumber: true })}
                            className="w-20"
                          />
                        </div>
                      </div>
                    </FormItem>
                  )}
                />
              </div>

              <div className="space-y-4">
                <FormItem>
                  <FormLabel>기관 (여러 개 입력시 &apos;,&apos; 사용)</FormLabel>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <FormLabel className="text-sm font-normal">제외 기관</FormLabel>
                      <Input {...form.register('excludedOrgs')} />
                    </div>
                    <div>
                      <FormLabel className="text-sm font-normal">포함 기관</FormLabel>
                      <Input {...form.register('includedOrgs')} />
                    </div>
                  </div>
                </FormItem>

                <FormItem>
                  <FormLabel>지역 (여러 개 입력시 &apos;,&apos; 사용)</FormLabel>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <FormLabel className="text-sm font-normal">제외 지역</FormLabel>
                      <Input {...form.register('excludedRegions')} />
                    </div>
                    <div>
                      <FormLabel className="text-sm font-normal">포함 지역</FormLabel>
                      <Input {...form.register('includedRegions')} />
                    </div>
                  </div>
                </FormItem>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={handleReset}>
                초기화
              </Button>
              <Button type="submit">적용</Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
