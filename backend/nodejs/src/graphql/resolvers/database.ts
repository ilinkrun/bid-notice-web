import { executeQuery } from '@/utils/database/mysql';

export const databaseResolvers = {
  Query: {
    databaseExecuteSql: async (_: unknown, { sql }: { sql: string }) => {
      try {
        const results = await executeQuery(sql);
        return results;
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
        // Build the search query with weight calculation
        const baseQuery = baseSql || "SELECT nid, posted_date, org_name, title, detail_url, category, org_region FROM notice_list";
        const whereClause = addWhere || "";
        const orderClause = addSql || "ORDER BY posted_date DESC";

        // Simple keyword search implementation
        let searchConditions = "";
        if (keywords.trim()) {
          const keywordList = keywords.split(/\s+/).filter(k => k.length > 0);
          const keywordConditions = keywordList.map(keyword =>
            `(title LIKE '%${keyword}%' OR org_name LIKE '%${keyword}%')`
          ).join(" AND ");
          searchConditions = keywordConditions;
        }

        if (nots.trim()) {
          const notList = nots.split(/\s+/).filter(n => n.length > 0);
          const notConditions = notList.map(not =>
            `(title NOT LIKE '%${not}%' AND org_name NOT LIKE '%${not}%')`
          ).join(" AND ");
          searchConditions = searchConditions ? `${searchConditions} AND ${notConditions}` : notConditions;
        }

        let finalQuery = baseQuery;
        if (searchConditions || whereClause) {
          const allConditions = [searchConditions, whereClause].filter(c => c).join(" AND ");
          finalQuery += ` WHERE ${allConditions}`;
        }
        finalQuery += ` ${orderClause}`;

        const results = await executeQuery(finalQuery) as { nid?: number; title: string; org_name: string; posted_date: string; detail_url: string; category?: string; org_region?: string }[];

        return results.map(notice => ({
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