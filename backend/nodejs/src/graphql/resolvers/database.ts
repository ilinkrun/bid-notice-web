import { mysqlApiClient } from '../lib/api/backendClient.js';

export const databaseResolvers = {
  Query: {
    databaseExecuteSql: async (_: unknown, { sql }: { sql: string }) => {
      try {
        const response = await mysqlApiClient.post('/fetch_by_sql/', {
          sql
        });
        return response.data;
      } catch (error) {
        console.error('Error executing SQL:', error);
        throw new Error('Failed to execute SQL query');
      }
    },
  },

  Mutation: {
    databaseSearchNoticesByWeight: async (_: unknown, { 
      keywords, nots, minPoint, addWhere, baseSql, addSql 
    }: { 
      keywords: string; 
      nots: string; 
      minPoint: number; 
      addWhere?: string; 
      baseSql?: string; 
      addSql?: string; 
    }) => {
      try {
        const response = await mysqlApiClient.post('/notice_list_by_search/', {
          keywords,
          nots,
          min_point: minPoint,
          add_where: addWhere || "",
          base_sql: baseSql || "SELECT `posted_date`, `org_name`, `title`, `detail_url` FROM notice_list",
          add_sql: addSql || "ORDER BY `posted_date` DESC"
        });
        
        return response.data.map((notice: { nid?: number; title: string; org_name: string; posted_date: string; detail_url: string; category?: string; org_region?: string }) => ({
          nid: notice.nid?.toString(),
          title: notice.title,
          orgName: notice.org_name,
          postedAt: notice.posted_date,
          detailUrl: notice.detail_url,
          category: notice.category || "",
          region: notice.org_region || "미지정",
        }));
      } catch (error) {
        console.error('Error searching notices by weight:', error);
        throw new Error('Failed to search notices');
      }
    },
  },
};