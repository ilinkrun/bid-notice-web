export const getDayOfWeek = (date: string) => {
  const days = ['일', '월', '화', '수', '목', '금', '토'];
  const dayIndex = new Date(date).getDay();
  return days[dayIndex];
};

export const processNoticeStatistics = {
  category: (data: any[], cutoffDays: number = 14) => {
    // 날짜별, 지역별로 데이터 그룹화
    const groupedByDate = data.reduce((acc, item) => {
      const date = item.postedAt.split('T')[0];
      const region = item.region || '미지정';
      
      if (!acc[date]) {
        acc[date] = {
          construction: 0,
          performance: 0,
          etc: 0,
          total: 0,
          regions: {}
        };
      }

      if (!acc[date].regions[region]) {
        acc[date].regions[region] = {
          construction: 0,
          performance: 0,
          etc: 0,
          total: 0
        };
      }

      // 전체 카운트 증가
      acc[date].total++;
      acc[date].regions[region].total++;

      // 카테고리별 카운트
      if (item.category === '공사점검') {
        acc[date].construction++;
        acc[date].regions[region].construction++;
      } else if (item.category === '성능평가') {
        acc[date].performance++;
        acc[date].regions[region].performance++;
      } else if (item.category === '기타') {
        acc[date].etc++;
        acc[date].regions[region].etc++;
      }

      return acc;
    }, {} as any);

    // 날짜별 통계 계산 및 정렬
    const today = new Date();
    const cutoffDate = new Date(today);
    cutoffDate.setDate(today.getDate() - cutoffDays);

    return Object.entries(groupedByDate)
      .map(([date, stats]) => {
        const regions = Object.entries((stats as { regions: Record<string, { construction: number; performance: number; etc: number; total?: number }> }).regions).map(([region, regionStats]) => ({
          region,
          construction: regionStats.construction,
          performance: regionStats.performance,
          etc: regionStats.etc,
          subtotal: regionStats.construction + regionStats.performance + regionStats.etc,
          total: regionStats.total || (regionStats.construction + regionStats.performance + regionStats.etc)
        }));

        return {
          date,
          dayOfWeek: getDayOfWeek(date),
          regions,
          construction: (stats as any).construction,
          performance: (stats as any).performance,
          etc: (stats as any).etc,
          subtotal: (stats as any).construction + (stats as any).performance + (stats as any).etc,
          total: (stats as any).total,
        };
      })
      .filter(stat => new Date(stat.date) >= cutoffDate)
      .sort((a, b) => b.date.localeCompare(a.date));
  },

  region: (data: any[]) => {
    // 날짜별, 지역별로 데이터 그룹화
    const groupedByDateAndRegion = data.reduce((acc: any, item) => {
      const date = item.postedAt.split('T')[0];
      const region = item.region || '미지정';
      
      if (!acc[date]) {
        acc[date] = {};
      }
      
      if (!acc[date][region]) {
        acc[date][region] = {
          construction: 0,
          performance: 0,
          etc: 0,
          total: 0,
        };
      }

      // 전체 카운트 증가
      acc[date][region].total++;

      // 카테고리별 카운트
      if (item.category === '공사점검') {
        acc[date][region].construction++;
      } else if (item.category === '성능평가') {
        acc[date][region].performance++;
      } else if (item.category === '기타') {
        acc[date][region].etc++;
      }

      return acc;
    }, {});

    // 모든 지역 목록 수집
    const allRegions = new Set<string>();
    Object.values(groupedByDateAndRegion).forEach((dateData: any) => {
      Object.keys(dateData).forEach(region => allRegions.add(region));
    });

    // 날짜별로 정렬된 데이터 생성
    const sortedDates = Object.keys(groupedByDateAndRegion)
      .sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

    // 날짜별, 지역별 통계 데이터 생성
    const statistics = sortedDates.map(date => {
      const dateData = groupedByDateAndRegion[date];
      const regions = Array.from(allRegions).map(region => {
        const regionData = dateData[region] || {
          construction: 0,
          performance: 0,
          etc: 0,
          total: 0,
        };

        return {
          date,
          region,
          construction: regionData.construction,
          performance: regionData.performance,
          etc: regionData.etc,
          subtotal: regionData.construction + regionData.performance + regionData.etc,
          total: regionData.total,
        };
      });

      // 날짜별 합계 계산
      const dateTotal = regions.reduce(
        (acc, curr) => ({
          construction: acc.construction + curr.construction,
          performance: acc.performance + curr.performance,
          etc: acc.etc + curr.etc,
          subtotal: acc.subtotal + curr.subtotal,
          total: acc.total + curr.total,
        }),
        { construction: 0, performance: 0, etc: 0, subtotal: 0, total: 0 }
      );

      return {
        date,
        dayOfWeek: getDayOfWeek(date),
        regions,
        totals: dateTotal,
      };
    });

    return statistics;
  },

  organization: (data: any[]) => {
    // 기관별로 데이터 그룹화
    const groupedByOrg = data.reduce((acc, item) => {
      const orgName = item.orgName || '미지정';
      if (!acc[orgName]) {
        acc[orgName] = {
          construction: 0,
          performance: 0,
          etc: 0,
          total: 0,
        };
      }

      // 전체 카운트 증가
      acc[orgName].total++;

      // 카테고리별 카운트
      if (item.category === '공사점검') {
        acc[orgName].construction++;
      } else if (item.category === '성능평가') {
        acc[orgName].performance++;
      } else if (item.category === '기타') {
        acc[orgName].etc++;
      }

      return acc;
    }, {} as any);

    return Object.entries(groupedByOrg)
      .map(([orgName, stats]) => ({
        orgName,
        construction: (stats as any).construction,
        performance: (stats as any).performance,
        etc: (stats as any).etc,
        subtotal: (stats as any).construction + (stats as any).performance + (stats as any).etc,
        total: (stats as any).total,
      }))
      .sort((a, b) => b.total - a.total);
  },

  calculateTotals: (data: any[]) => {
    return data.reduce(
      (acc, curr) => ({
        construction: acc.construction + curr.construction,
        performance: acc.performance + curr.performance,
        etc: acc.etc + curr.etc,
        subtotal: acc.subtotal + (curr.subtotal || 0),
        total: acc.total + curr.total,
      }),
      { construction: 0, performance: 0, etc: 0, subtotal: 0, total: 0 }
    );
  }
};