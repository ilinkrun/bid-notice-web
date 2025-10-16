export const getDayOfWeek = (date: string) => {
  const days = ['일', '월', '화', '수', '목', '금', '토'];
  const dayIndex = new Date(date).getDay();
  return days[dayIndex];
};

export const processNoticeStatistics = {
  category: (data: any[], cutoffDays: number = 14, categoryLabels: string[] = ['공사점검', '성능평가', '기타']) => {
    // 날짜별, 지역별로 데이터 그룹화
    const groupedByDate = data.reduce((acc, item) => {
      const date = item.postedAt.split('T')[0];
      const region = item.region || '미지정';
      
      if (!acc[date]) {
        acc[date] = {
          total: 0,
          regions: {},
          categories: {}
        };
        // 동적으로 카테고리 필드 초기화
        categoryLabels.forEach(category => {
          acc[date].categories[category] = 0;
        });
      }

      if (!acc[date].regions[region]) {
        acc[date].regions[region] = {
          total: 0,
          categories: {}
        };
        // 동적으로 카테고리 필드 초기화
        categoryLabels.forEach(category => {
          acc[date].regions[region].categories[category] = 0;
        });
      }

      // 전체 카운트 증가
      acc[date].total++;
      acc[date].regions[region].total++;

      // 카테고리별 카운트
      if (item.category && categoryLabels.includes(item.category)) {
        acc[date].categories[item.category]++;
        acc[date].regions[region].categories[item.category]++;
      }

      return acc;
    }, {} as any);

    // 날짜별 통계 계산 및 정렬
    const today = new Date();
    const cutoffDate = new Date(today);
    cutoffDate.setDate(today.getDate() - cutoffDays);

    return Object.entries(groupedByDate)
      .map(([date, stats]) => {
        const regions = Object.entries((stats as any).regions).map(([region, regionStats]: [string, any]) => {
          const regionData: any = {
            region,
            total: regionStats.total
          };
          // 동적으로 카테고리 데이터 추가
          categoryLabels.forEach(category => {
            regionData[category] = regionStats.categories[category] || 0;
          });
          // 소계 계산
          regionData.subtotal = categoryLabels.reduce((sum, category) => sum + (regionStats.categories[category] || 0), 0);
          return regionData;
        });

        const result: any = {
          date,
          dayOfWeek: getDayOfWeek(date),
          regions,
          total: (stats as any).total
        };
        
        // 동적으로 카테고리 데이터 추가
        categoryLabels.forEach(category => {
          result[category] = (stats as any).categories[category] || 0;
        });
        
        // 소계 계산
        result.subtotal = categoryLabels.reduce((sum, category) => sum + ((stats as any).categories[category] || 0), 0);
        
        return result;
      })
      .filter(stat => new Date(stat.date) >= cutoffDate)
      .sort((a, b) => b.date.localeCompare(a.date));
  },

  region: (data: any[], categoryLabels: string[] = ['공사점검', '성능평가', '기타']) => {
    // 날짜별, 지역별로 데이터 그룹화
    const groupedByDateAndRegion = data.reduce((acc: any, item) => {
      const date = item.postedAt.split('T')[0];
      const region = item.region || '미지정';
      
      if (!acc[date]) {
        acc[date] = {};
      }
      
      if (!acc[date][region]) {
        acc[date][region] = {
          total: 0,
          categories: {}
        };
        // 동적으로 카테고리 필드 초기화
        categoryLabels.forEach(category => {
          acc[date][region].categories[category] = 0;
        });
      }

      // 전체 카운트 증가
      acc[date][region].total++;

      // 카테고리별 카운트
      if (item.category && categoryLabels.includes(item.category)) {
        acc[date][region].categories[item.category]++;
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
          total: 0,
          categories: {}
        };

        const regionResult: any = {
          date,
          region,
          total: regionData.total,
        };

        // 동적으로 카테고리 데이터 추가
        categoryLabels.forEach(category => {
          regionResult[category] = regionData.categories?.[category] || 0;
        });

        // 소계 계산
        regionResult.subtotal = categoryLabels.reduce((sum, category) => sum + (regionData.categories?.[category] || 0), 0);

        return regionResult;
      });

      // 날짜별 합계 계산
      const dateTotal: any = {
        total: 0,
        subtotal: 0
      };

      // 동적으로 카테고리 합계 초기화
      categoryLabels.forEach(category => {
        dateTotal[category] = 0;
      });

      // 합계 계산
      regions.forEach(region => {
        dateTotal.total += region.total;
        dateTotal.subtotal += region.subtotal;
        categoryLabels.forEach(category => {
          dateTotal[category] += region[category];
        });
      });

      return {
        date,
        dayOfWeek: getDayOfWeek(date),
        regions,
        totals: dateTotal,
      };
    });

    return statistics;
  },

  organization: (data: any[], categoryLabels: string[] = ['공사점검', '성능평가', '기타']) => {
    // 기관별로 데이터 그룹화
    const groupedByOrg = data.reduce((acc, item) => {
      const orgName = item.orgName || '미지정';
      if (!acc[orgName]) {
        acc[orgName] = {
          total: 0,
          categories: {}
        };
        // 동적으로 카테고리 필드 초기화
        categoryLabels.forEach(category => {
          acc[orgName].categories[category] = 0;
        });
      }

      // 전체 카운트 증가
      acc[orgName].total++;

      // 카테고리별 카운트
      if (item.category && categoryLabels.includes(item.category)) {
        acc[orgName].categories[item.category]++;
      }

      return acc;
    }, {} as any);

    return Object.entries(groupedByOrg)
      .map(([orgName, stats]: [string, any]) => {
        const result: any = {
          orgName,
          total: stats.total,
        };

        // 동적으로 카테고리 데이터 추가
        categoryLabels.forEach(category => {
          result[category] = stats.categories[category] || 0;
        });

        // 소계 계산
        result.subtotal = categoryLabels.reduce((sum, category) => sum + (stats.categories[category] || 0), 0);

        return result;
      })
      .sort((a, b) => b.total - a.total);
  },

  calculateTotals: (data: any[], categoryLabels: string[] = ['공사점검', '성능평가', '기타']) => {
    if (data.length === 0) {
      const result: any = { subtotal: 0, total: 0 };
      categoryLabels.forEach(category => {
        result[category] = 0;
      });
      return result;
    }

    return data.reduce((acc, curr) => {
      if (!acc.subtotal) acc.subtotal = 0;
      if (!acc.total) acc.total = 0;

      // 동적으로 카테고리 합계 계산
      categoryLabels.forEach(category => {
        if (!acc[category]) acc[category] = 0;
        acc[category] += curr[category] || 0;
      });

      acc.subtotal += curr.subtotal || 0;
      acc.total += curr.total || 0;

      return acc;
    }, {});
  }
};