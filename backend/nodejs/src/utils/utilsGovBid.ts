import {
  includesMulti,
  loadEnv,
  strFromAny,
  today,
} from 'jnu-abc';
import { Mysql } from 'jnu-db';
import { decodeHtml } from 'jnu-doc';
import type { RowDataPacket, ResultSetHeader } from 'mysql2/promise';

import {
  createMySQLPool as createSpiderListPool,
  scrapeList,
  type ScrapeResult as ScrapeListResult,
} from './spiderGovBidList';

import { upsertDetailByNid } from './spiderGovBidDetail';
const DEFAULT_DAY_GAP = Number(process.env.DAY_GAP ?? 15);

type StringRecord = Record<string, string | null>;

interface NoticeSummary {
  nid: number;
  title: string;
  detailUrl: string;
  postedDate: string;
  postedBy?: string | null;
  orgName: string;
  category?: string | null;
  region?: string | null;
  registration?: string | null;
  scrapedAt?: string | null;
  isSelected?: number;
}

interface NoticeStatisticsRow {
  orgName: string;
  postedAt: string;
  category: string;
  region: string;
  createdAt?: string;
}

interface NoticeSearchOptions {
  keywords: string;
  nots?: string;
  minPoint?: number;
  field?: string;
  addFields?: string[];
  addWhere?: string;
}

interface KeywordWeight {
  keyword: string;
  weight: number;
}

interface KeywordSearchResult {
  nid: number;
  matched: string[];
  point: number;
  [key: string]: unknown;
}

interface SettingsNoticeListRecord extends Record<string, unknown> {
  oid?: number;
  org_name: string;
  url: string;
  iframe?: string | null;
  rowXpath?: string | null;
  paging?: string | null;
  startPage?: number | null;
  endPage?: number | null;
  login?: string | null;
  use?: number | null;
  org_region?: string | null;
  registration?: string | null;
  title?: string | null;
  detail_url?: string | null;
  posted_date?: string | null;
  posted_by?: string | null;
  company_in_charge?: string | null;
  org_man?: string | null;
  exception_row?: string | null;
}

interface SettingsNoticeDetailRecord extends Record<string, unknown> {
  oid?: number;
  org_name: string;
  title?: string | null;
  body_html?: string | null;
  file_name?: string | null;
  file_url?: string | null;
  preview?: string | null;
  notice_div?: string | null;
  notice_num?: string | null;
  org_dept?: string | null;
  org_man?: string | null;
  org_tel?: string | null;
  use?: number | null;
  sample_url?: string | null;
  down?: string | null;
}

interface NasPathRecord {
  id?: number;
  name: string;
  area: string;
  depth: number;
  folder: string;
  remark?: string | null;
}

const envCache = (() => {
  try {
    return loadEnv('/exposed/.env') as Record<string, string | undefined>;
  } catch {
    return {} as Record<string, string | undefined>;
  }
})();

interface MysqlConfig {
  host: string;
  user: string;
  password: string;
  database?: string;
  port?: number;
  connectionLimit?: number;
}

interface QueryResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: Error;
}

function currentTimestamp(): string {
  return new Date().toISOString().replace('T', ' ').replace(/\..*/, '');
}

const DEFAULT_DB_CONFIG: MysqlConfig = {
  host: (envCache.MYSQL_HOST ?? process.env.MYSQL_HOST ?? '1.231.118.217') as string,
  port: Number(envCache.MYSQL_PORT ?? process.env.MYSQL_PORT ?? 20201),
  user: (envCache.MYSQL_USER ?? process.env.MYSQL_USER ?? 'root') as string,
  password: (envCache.MYSQL_PASSWORD ?? process.env.MYSQL_PASSWORD ?? 'mysqlIlmac123') as string,
  database: (envCache.MYSQL_DATABASE ?? process.env.MYSQL_DATABASE ?? 'ubuntu_ilmac__ilmac_bid_web_db') as string,
  connectionLimit: Number(envCache.MYSQL_POOL_SIZE ?? process.env.MYSQL_POOL_SIZE ?? 8),
};

let mysqlInstance: Mysql | null = null;

function getMysqlInstance(config?: Partial<MysqlConfig>): Mysql {
  if (!mysqlInstance) {
    const merged: MysqlConfig = {
      ...DEFAULT_DB_CONFIG,
      ...(config ?? {}),
    };
    mysqlInstance = new Mysql(merged);
  }
  return mysqlInstance;
}

function normalizeDate(value: unknown): string {
  if (value instanceof Date) {
    const year = value.getFullYear();
    const month = String(value.getMonth() + 1).padStart(2, '0');
    const day = String(value.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
      return trimmed;
    }
    if (/^\d{4}[./]\d{2}[./]\d{2}$/.test(trimmed)) {
      return trimmed.replace(/[./]/g, '-');
    }
    const parsed = new Date(trimmed);
    if (!Number.isNaN(parsed.getTime())) {
      return normalizeDate(parsed);
    }
  }
  return today();
}

async function runQuery<T extends RowDataPacket>(sql: string, params: unknown[] = []): Promise<T[]> {
  const db = getMysqlInstance();
  const result = await db.executeQuery(sql, params) as QueryResult<T[]>;
  if (!result.success) {
    throw result.error ?? new Error('Failed to execute MySQL query');
  }
  return (result.data ?? []) as T[];
}

async function runQuerySingle<T extends RowDataPacket>(sql: string, params: unknown[] = []): Promise<T | null> {
  const rows = await runQuery<T>(sql, params);
  return rows.length > 0 ? rows[0] : null;
}

function withSettingsEnrichment(notice: NoticeSummary, setting?: StringRecord | null): NoticeSummary {
  if (!setting) {
    return notice;
  }
  return {
    ...notice,
    region: setting.org_region ?? notice.region ?? null,
    registration: setting.registration ?? notice.registration ?? null,
  };
}

function parseKeywordWeightString(keywordWeightStr: string): KeywordWeight[] {
  const cleaned = strFromAny(keywordWeightStr).trim();
  if (!cleaned) {
    return [];
  }

  return cleaned
    .split(',')
    .map((pair) => pair.trim())
    .filter(Boolean)
    .map((pair) => {
      const [keyword, weightStr] = pair.split('*').map((token) => token.trim());
      return {
        keyword,
        weight: weightStr ? Number(weightStr) || 1 : 1,
      };
    })
    .filter((item) => item.keyword.length > 0);
}

function filterByNotStrings<T extends Record<string, unknown>>(nots: string, dicts: T[], field: string = 'title'): T[] {
  const tokens = strFromAny(nots)
    .split(',')
    .map((token) => token.trim())
    .filter(Boolean);

  if (tokens.length === 0) {
    return dicts;
  }

  return dicts.filter((item) => {
    const text = strFromAny(item[field] ?? '');
    return !includesMulti(text, tokens);
  });
}

async function getSettingsNoticeList(): Promise<SettingsNoticeListRecord[]> {
  const sql = `
    SELECT
      oid,
      org_name,
      url,
      iframe,
      rowXpath,
      paging,
      startPage,
      endPage,
      login,
      is_active,
      org_region,
      registration,
      title,
      detail_url,
      posted_date,
      posted_by,
      company_in_charge,
      org_man,
      exception_row
    FROM settings_notice_list
    ORDER BY org_name ASC
  `;
  const rows = await runQuery<RowDataPacket & SettingsNoticeListRecord>(sql);
  return rows.map((row) => ({
    ...row,
    // Keep posted_date as-is if it's an XPath expression
    posted_date: row.posted_date && typeof row.posted_date === 'string' &&
      (row.posted_date.includes('td[') || row.posted_date.includes('//') || row.posted_date.includes('|-'))
      ? row.posted_date
      : (row.posted_date ? normalizeDate(row.posted_date) : null),
  }));
}

async function getSettingsNoticeListByOrgName(orgName: string): Promise<SettingsNoticeListRecord | null> {
  const sql = `
    SELECT
      oid,
      org_name,
      url,
      iframe,
      rowXpath,
      paging,
      startPage,
      endPage,
      login,
      is_active,
      org_region,
      registration,
      title,
      detail_url,
      posted_date,
      posted_by,
      company_in_charge,
      org_man,
      exception_row
    FROM settings_notice_list
    WHERE org_name = ?
    LIMIT 1
  `;
  const row = await runQuerySingle<RowDataPacket & SettingsNoticeListRecord>(sql, [orgName]);
  if (!row) {
    return null;
  }
  return {
    ...row,
    // Keep posted_date as-is if it's an XPath expression
    posted_date: row.posted_date && typeof row.posted_date === 'string' &&
      (row.posted_date.includes('td[') || row.posted_date.includes('//') || row.posted_date.includes('|-'))
      ? row.posted_date
      : (row.posted_date ? normalizeDate(row.posted_date) : null),
  };
}

async function getSettingsNoticeListByOid(oid: number): Promise<SettingsNoticeListRecord | null> {
  const sql = `
    SELECT
      oid,
      org_name,
      url,
      iframe,
      rowXpath,
      paging,
      startPage,
      endPage,
      login,
      is_active,
      org_region,
      registration,
      title,
      detail_url,
      posted_date,
      posted_by,
      company_in_charge,
      org_man,
      exception_row
    FROM settings_notice_list
    WHERE oid = ?
    LIMIT 1
  `;
  const row = await runQuerySingle<RowDataPacket & SettingsNoticeListRecord>(sql, [oid]);
  if (!row) {
    return null;
  }
  return {
    ...row,
    // Keep posted_date as-is if it's an XPath expression
    posted_date: row.posted_date && typeof row.posted_date === 'string' &&
      (row.posted_date.includes('td[') || row.posted_date.includes('//') || row.posted_date.includes('|-'))
      ? row.posted_date
      : (row.posted_date ? normalizeDate(row.posted_date) : null),
  };
}

async function upsertSettingsNoticeListByOrgName(orgName: string, data: Partial<SettingsNoticeListRecord>): Promise<boolean> {
  const db = getMysqlInstance();
  const payload: Record<string, unknown> = {
    org_name: orgName,
    updated_at: currentTimestamp(),
    ...data,
  };
  // Don't normalize posted_date if it's an XPath expression (contains 'td[' or other XPath indicators)
  if ('posted_date' in payload && payload.posted_date && typeof payload.posted_date === 'string') {
    const value = payload.posted_date.trim();
    // Only normalize if it looks like a date, not an XPath or configuration string
    if (!value.includes('td[') && !value.includes('//') && !value.includes('|-')) {
      payload.posted_date = normalizeDate(payload.posted_date);
    }
  }
  const result = await db.upsert('settings_notice_list', {
    data: payload,
  });
  if (!result.success) {
    throw result.error ?? new Error('Failed to upsert settings_notice_list');
  }
  return true;
}

async function upsertSettingsNoticeListByOid(oid: number, data: Partial<SettingsNoticeListRecord>): Promise<boolean> {
  const db = getMysqlInstance();
  const payload: Record<string, unknown> = {
    oid,
    updated_at: currentTimestamp(),
    ...data,
  };
  // Don't normalize posted_date if it's an XPath expression (contains 'td[' or other XPath indicators)
  if ('posted_date' in payload && payload.posted_date && typeof payload.posted_date === 'string') {
    const value = payload.posted_date.trim();
    // Only normalize if it looks like a date, not an XPath or configuration string
    if (!value.includes('td[') && !value.includes('//') && !value.includes('|-')) {
      payload.posted_date = normalizeDate(payload.posted_date);
    }
  }
  const result = await db.upsert('settings_notice_list', {
    data: payload,
  });
  if (!result.success) {
    throw result.error ?? new Error('Failed to upsert settings_notice_list');
  }
  return true;
}

async function getSettingsNoticeDetail(): Promise<SettingsNoticeDetailRecord[]> {
  const sql = `
    SELECT
      oid,
      org_name,
      title,
      body_html,
      file_name,
      file_url,
      preview,
      notice_div,
      notice_num,
      org_dept,
      org_man,
      org_tel,
      is_active,
      sample_url,
      down
    FROM settings_notice_detail
    ORDER BY org_name ASC
  `;
  const rows = await runQuery<RowDataPacket & SettingsNoticeDetailRecord>(sql);
  return rows.map((row) => ({
    ...row,
    body_html: row.body_html ? decodeHtml(row.body_html) : null,
  }));
}

async function getSettingsNoticeDetailByOrgName(orgName: string): Promise<SettingsNoticeDetailRecord | null> {
  const sql = `
    SELECT
      oid,
      org_name,
      title,
      body_html,
      file_name,
      file_url,
      preview,
      notice_div,
      notice_num,
      org_dept,
      org_man,
      org_tel,
      is_active,
      sample_url,
      down
    FROM settings_notice_detail
    WHERE org_name = ?
    LIMIT 1
  `;
  const row = await runQuerySingle<RowDataPacket & SettingsNoticeDetailRecord>(sql, [orgName]);
  if (!row) {
    return null;
  }
  return {
    ...row,
    body_html: row.body_html ? decodeHtml(row.body_html) : null,
  };
}

async function getSettingsNoticeDetailByOid(oid: number): Promise<SettingsNoticeDetailRecord | null> {
  const sql = `
    SELECT
      oid,
      org_name,
      title,
      body_html,
      file_name,
      file_url,
      preview,
      notice_div,
      notice_num,
      org_dept,
      org_man,
      org_tel,
      is_active,
      sample_url,
      down
    FROM settings_notice_detail
    WHERE oid = ?
    LIMIT 1
  `;
  const row = await runQuerySingle<RowDataPacket & SettingsNoticeDetailRecord>(sql, [oid]);
  if (!row) {
    return null;
  }
  return {
    ...row,
    body_html: row.body_html ? decodeHtml(row.body_html) : null,
  };
}

async function upsertSettingsNoticeDetailByOid(oid: number, data: Partial<SettingsNoticeDetailRecord>): Promise<boolean> {
  const db = getMysqlInstance();
  const payload: Record<string, unknown> = {
    oid,
    updated_at: currentTimestamp(),
    ...data,
  };
  if ('body_html' in payload && typeof payload.body_html === 'string') {
    payload.body_html = payload.body_html;
  }
  const result = await db.upsert('settings_notice_detail', {
    data: payload,
  });
  if (!result.success) {
    throw result.error ?? new Error('Failed to upsert settings_notice_detail');
  }
  return true;
}

async function getDetailConfigByOrgName(orgName: string): Promise<Record<string, unknown> | null> {
  const sql = `
    SELECT
      org_name,
      sample_url,
      down,
      is_active
    FROM settings_notice_detail
    WHERE org_name = ?
    LIMIT 1
  `;
  const row = await runQuerySingle<RowDataPacket & Pick<SettingsNoticeDetailRecord, 'org_name' | 'sample_url' | 'down' | 'use'>>(sql, [orgName]);
  if (!row) {
    return null;
  }
  return {
    org_name: row.org_name,
    sample_url: row.sample_url,
    down: row.down,
    is_active: row.is_active,
  };
}

async function getNasPathSettings(): Promise<NasPathRecord[]> {
  const sql = `
    SELECT id, name, area, depth, folder, remark
    FROM settings_nas_path
    ORDER BY depth ASC, id ASC
  `;
  return runQuery<RowDataPacket & NasPathRecord>(sql);
}

async function getNasPathSettingById(nasId: number): Promise<NasPathRecord | null> {
  const sql = `
    SELECT id, name, area, depth, folder, remark
    FROM settings_nas_path
    WHERE id = ?
    LIMIT 1
  `;
  return runQuerySingle<RowDataPacket & NasPathRecord>(sql, [nasId]);
}

async function createNasPathSetting(setting: NasPathRecord): Promise<number> {
  const db = getMysqlInstance();
  const payload = {
    ...setting,
    created_at: currentTimestamp(),
    updated_at: currentTimestamp(),
  };
  const result = await db.create('settings_nas_path', payload);
  if (!result.success || !result.data) {
    throw result.error ?? new Error('Failed to insert settings_nas_path');
  }
  return Number(result.data.insertId);
}

async function updateNasPathSetting(nasId: number, setting: Partial<NasPathRecord>): Promise<boolean> {
  const db = getMysqlInstance();
  const payload = {
    ...setting,
    updated_at: currentTimestamp(),
  };
  const result = await db.update('settings_nas_path', {
    where: { id: nasId },
    data: payload,
  });
  if (!result.success) {
    throw result.error ?? new Error('Failed to update settings_nas_path');
  }
  return true;
}

async function deleteNasPathSetting(nasId: number): Promise<boolean> {
  const db = getMysqlInstance();
  const result = await db.delete('settings_nas_path', { id: nasId });
  if (!result.success) {
    throw result.error ?? new Error('Failed to delete settings_nas_path');
  }
  return true;
}

async function getNoticeList(gap: number = DEFAULT_DAY_GAP): Promise<NoticeSummary[]> {
  const sql = `
    SELECT
      n.nid,
      n.title,
      n.detail_url,
      DATE_FORMAT(n.posted_date, '%Y-%m-%d') AS posted_date,
      n.posted_by,
      n.org_name,
      n.category,
      n.is_selected,
      n.scraped_at,
      s.org_region,
      s.registration
    FROM notice_list AS n
    LEFT JOIN settings_notice_list AS s
      ON s.org_name = n.org_name
    WHERE STR_TO_DATE(n.posted_date, '%Y-%m-%d') >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
    ORDER BY n.nid DESC
  `;
  const rows = await runQuery<RowDataPacket & {
    nid: number;
    title: string;
    detail_url: string;
    posted_date: string;
    posted_by: string | null;
    org_name: string;
    category: string | null;
    is_selected: number;
    scraped_at: string | null;
    org_region: string | null;
    registration: string | null;
  }>(sql, [Math.max(gap, 0)]);

  return rows.map((row) =>
    withSettingsEnrichment(
      {
        nid: row.nid,
        title: row.title,
        detailUrl: row.detail_url,
        postedDate: row.posted_date,
        postedBy: row.posted_by,
        orgName: row.org_name,
        category: row.category,
        scrapedAt: row.scraped_at,
        isSelected: row.is_selected,
        region: row.org_region,
        registration: row.registration,
      },
      row,
    ));
}

async function getNoticeListByCategory(category: string, gap: number = DEFAULT_DAY_GAP, isSelected: number = 0): Promise<NoticeSummary[]> {
  const params: unknown[] = [];
  let whereClause = '';

  if (category === '제외') {
    whereClause = 'WHERE n.is_selected = -1';
  } else {
    whereClause = 'WHERE n.category = ? AND n.is_selected = ?';
    params.push(category, isSelected);
  }

  if (gap > 0) {
    whereClause += ' AND STR_TO_DATE(n.posted_date, \'%Y-%m-%d\') >= DATE_SUB(CURDATE(), INTERVAL ? DAY)';
    params.push(gap);
  }

  const sql = `
    SELECT
      n.nid,
      n.title,
      n.detail_url,
      DATE_FORMAT(n.posted_date, '%Y-%m-%d') AS posted_date,
      n.posted_by,
      n.org_name,
      n.category,
      n.scraped_at,
      n.is_selected,
      s.org_region,
      s.registration
    FROM notice_list AS n
    LEFT JOIN settings_notice_list AS s
      ON s.org_name = n.org_name
    ${whereClause}
    ORDER BY n.posted_date DESC, n.nid DESC
  `;

  const rows = await runQuery<RowDataPacket & {
    nid: number;
    title: string;
    detail_url: string;
    posted_date: string;
    posted_by: string | null;
    org_name: string;
    category: string | null;
    scraped_at: string | null;
    is_selected: number;
    org_region: string | null;
    registration: string | null;
  }>(sql, params);

  return rows.map((row) =>
    withSettingsEnrichment(
      {
        nid: row.nid,
        title: row.title,
        detailUrl: row.detail_url,
        postedDate: row.posted_date,
        postedBy: row.posted_by,
        orgName: row.org_name,
        category: row.category,
        scrapedAt: row.scraped_at,
        isSelected: row.is_selected,
        region: row.org_region,
        registration: row.registration,
      },
      row,
    ));
}

async function getNoticeListByCategories(categories: string[], gap: number = DEFAULT_DAY_GAP, isSelected: number = 0): Promise<NoticeSummary[]> {
  if (!Array.isArray(categories) || categories.length === 0) {
    return [];
  }

  const trimmed = categories.map((cat) => cat.trim()).filter(Boolean);
  if (trimmed.length === 0) {
    return [];
  }

  const includesExcluded = trimmed.includes('제외');
  const filtered = trimmed.filter((cat) => cat !== '제외');

  const params: unknown[] = [];
  let whereClause = '';

  if (includesExcluded && filtered.length > 0) {
    const placeholders = filtered.map((_value) => '?').join(', ');
    whereClause = `
      WHERE (
        (n.category IN (${placeholders}) AND n.is_selected = ?)
        OR n.is_selected = -1
      )
    `;
    params.push(...filtered, isSelected);
  } else if (includesExcluded) {
    whereClause = 'WHERE n.is_selected = -1';
  } else {
    const placeholders = filtered.map((_value) => '?').join(', ');
    whereClause = `
      WHERE n.category IN (${placeholders})
      AND n.is_selected = ?
    `;
    params.push(...filtered, isSelected);
  }

  if (gap > 0) {
    whereClause += ' AND STR_TO_DATE(n.posted_date, \'%Y-%m-%d\') >= DATE_SUB(CURDATE(), INTERVAL ? DAY)';
    params.push(gap);
  }

  const sql = `
    SELECT
      n.nid,
      n.title,
      n.detail_url,
      DATE_FORMAT(n.posted_date, '%Y-%m-%d') AS posted_date,
      n.posted_by,
      n.org_name,
      n.category,
      n.scraped_at,
      n.is_selected,
      s.org_region,
      s.registration
    FROM notice_list AS n
    LEFT JOIN settings_notice_list AS s
      ON s.org_name = n.org_name
    ${whereClause}
    ORDER BY n.posted_date DESC, n.nid DESC
  `;

  const rows = await runQuery<RowDataPacket & {
    nid: number;
    title: string;
    detail_url: string;
    posted_date: string;
    posted_by: string | null;
    org_name: string;
    category: string | null;
    scraped_at: string | null;
    is_selected: number;
    org_region: string | null;
    registration: string | null;
  }>(sql, params);

  return rows.map((row) =>
    withSettingsEnrichment(
      {
        nid: row.nid,
        title: row.title,
        detailUrl: row.detail_url,
        postedDate: row.posted_date,
        postedBy: row.posted_by,
        orgName: row.org_name,
        category: row.category,
        scrapedAt: row.scraped_at,
        isSelected: row.is_selected,
        region: row.org_region,
        registration: row.registration,
      },
      row,
    ));
}

async function getNoticeListForStatistics(gap: number = DEFAULT_DAY_GAP): Promise<NoticeStatisticsRow[]> {
  const sql = `
    SELECT
      n.org_name,
      DATE_FORMAT(n.posted_date, '%Y-%m-%d') AS posted_date,
      n.category,
      DATE_FORMAT(n.created_at, '%Y-%m-%d') AS created_at,
      s.org_region
    FROM notice_list AS n
    LEFT JOIN settings_notice_list AS s
      ON s.org_name = n.org_name
    WHERE STR_TO_DATE(n.posted_date, '%Y-%m-%d') >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
    ORDER BY n.posted_date DESC
  `;
  const rows = await runQuery<RowDataPacket & {
    org_name: string;
    posted_date: string;
    category: string | null;
    created_at: string | null;
    org_region: string | null;
  }>(sql, [Math.max(gap, 0)]);

  return rows.map((row) => {
    const base: NoticeStatisticsRow = {
      orgName: row.org_name,
      postedAt: row.posted_date,
      category: row.category ?? '',
      region: row.org_region ?? '',
    };
    if (row.created_at) {
      base.createdAt = row.created_at;
    }
    return base;
  });
}

async function getDoneNotices(gap: number = DEFAULT_DAY_GAP): Promise<NoticeSummary[]> {
  const sql = `
    SELECT
      n.nid,
      n.title,
      n.detail_url,
      DATE_FORMAT(n.posted_date, '%Y-%m-%d') AS posted_date,
      n.posted_by,
      n.org_name,
      n.category,
      n.scraped_at,
      n.is_selected,
      s.org_region,
      s.registration
    FROM notice_list AS n
    LEFT JOIN settings_notice_list AS s
      ON s.org_name = n.org_name
    WHERE n.is_selected = 9
      AND STR_TO_DATE(n.posted_date, '%Y-%m-%d') >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
    ORDER BY n.nid DESC
  `;

  const rows = await runQuery<RowDataPacket & {
    nid: number;
    title: string;
    detail_url: string;
    posted_date: string;
    posted_by: string | null;
    org_name: string;
    category: string | null;
    scraped_at: string | null;
    is_selected: number;
    org_region: string | null;
    registration: string | null;
  }>(sql, [Math.max(gap, 0)]);

  return rows.map((row) =>
    withSettingsEnrichment(
      {
        nid: row.nid,
        title: row.title,
        detailUrl: row.detail_url,
        postedDate: row.posted_date,
        postedBy: row.posted_by,
        orgName: row.org_name,
        category: row.category,
        scrapedAt: row.scraped_at,
        isSelected: row.is_selected,
        region: row.org_region,
        registration: row.registration,
      },
      row,
    ));
}

async function searchNoticesByKeywordWeight(options: NoticeSearchOptions): Promise<KeywordSearchResult[]> {
  const {
    keywords,
    nots = '',
    minPoint = 4,
    field = 'title',
    addFields = [],
    addWhere = '',
  } = options;

  const keywordWeights = parseKeywordWeightString(keywords);
  if (keywordWeights.length === 0) {
    return [];
  }

  const selectableFields = ['nid', field, ...addFields]
    .map((column) => (column.includes('.') ? column : `n.${column}`))
    .join(', ');

  const sql = `
    SELECT
      ${selectableFields}
    FROM notice_list AS n
    ${addWhere ? `WHERE ${addWhere}` : ''}
  `;

  const rows = await runQuery<RowDataPacket & Record<string, unknown>>(sql);

  const evaluated = rows.map((row) => {
    const text = strFromAny(row[field]);
    const matched: string[] = [];
    let point = 0;
    for (const item of keywordWeights) {
      if (!item.keyword) {
        continue;
      }
      if (text.includes(item.keyword)) {
        matched.push(item.keyword);
        point += item.weight;
      }
    }
    return {
      ...row,
      nid: Number(row.nid),
      matched,
      point,
    };
  }) as KeywordSearchResult[];

  const filtered = evaluated.filter((item) => item.point >= minPoint);
  return filterByNotStrings(nots, filtered, field);
}

function parseKeywordWeights(keywordWeightStr: string): KeywordWeight[] {
  return parseKeywordWeightString(keywordWeightStr);
}

async function scrapeListByOrgName(orgName: string, startPage = 1, endPage = 2): Promise<ScrapeListResult> {
  getMysqlInstance();
  createSpiderListPool({
    host: DEFAULT_DB_CONFIG.host ?? '1.231.118.217',
    port: DEFAULT_DB_CONFIG.port ?? 20201,
    user: DEFAULT_DB_CONFIG.user ?? 'root',
    password: DEFAULT_DB_CONFIG.password ?? '',
    database: DEFAULT_DB_CONFIG.database ?? 'ubuntu_ilmac__ilmac_bid_web_db',
  });

  return scrapeList(orgName, startPage, endPage);
}
function ensureArray<T>(value: T | T[]): T[] {
  return Array.isArray(value) ? value : [value];
}

async function execQuery(sql: string, params: unknown[] = []): Promise<number> {
  const db = getMysqlInstance();
  const result = await db.executeQuery(sql, params) as QueryResult<ResultSetHeader>;
  if (!result.success) {
    throw result.error ?? new Error('Failed to execute MySQL non-query');
  }
  const data = result.data as ResultSetHeader | undefined;
  return data?.affectedRows ?? 0;
}

interface NoticeCategorySetting {
  sn: number;
  keywords: string;
  nots: string;
  min_point: number;
  category: string;
  creator?: string | null;
  memo?: string | null;
  use?: number | null;
  priority?: number | null;
}

async function getAllNoticeCategorySettings(includeInactive = true): Promise<NoticeCategorySetting[]> {
  const sql = `
    SELECT sn, keywords, nots, min_point, category, creator, memo, is_active, priority
    FROM settings_notice_category
    ${includeInactive ? '' : 'WHERE \\`use\\` = 1'}
    ORDER BY priority DESC, sn ASC
  `;
  return runQuery<RowDataPacket & NoticeCategorySetting>(sql);
}

async function getNoticeCategorySetting(category: string): Promise<NoticeCategorySetting | null> {
  const sql = `
    SELECT sn, keywords, nots, min_point, category, creator, memo, is_active, priority
    FROM settings_notice_category
    WHERE category = ?
    LIMIT 1
  `;
  return runQuerySingle<RowDataPacket & NoticeCategorySetting>(sql, [category]);
}

async function getNoticeCategoriesByPriority(): Promise<string[]> {
  const sql = `
    SELECT category
    FROM settings_notice_category
    WHERE is_active = 1
    ORDER BY priority DESC, sn ASC
  `;
  const rows = await runQuery<RowDataPacket & { category: string }>(sql);
  return rows.map((row) => row.category);
}

async function searchNoticeList(options: NoticeSearchOptions): Promise<KeywordSearchResult[]> {
  return searchNoticesByKeywordWeight(options);
}

function filterNoticeList<T extends Record<string, unknown>>(notStr: string, dicts: T[], field: string = 'title'): T[] {
  return filterByNotStrings(notStr, dicts, field);
}

interface NoticeFileItem {
  file_name: string;
  file_url: string;
  down_folder: string;
  source: 'notice_details' | 'notice_files';
  order: number;
}

interface NoticeFilesResponse {
  success: boolean;
  nid: number;
  files: NoticeFileItem[];
  total_count: number;
}

async function getNoticeFiles(nid: number): Promise<NoticeFilesResponse> {
  const detailRow = await runQuerySingle<RowDataPacket & { file_name: string | null; file_url: string | null }>(
    'SELECT file_name, file_url FROM notice_details WHERE nid = ? LIMIT 1',
    [nid],
  );

  const detailFiles: NoticeFileItem[] = [];
  if (detailRow?.file_name) {
    const names = detailRow.file_name.split('|-').map((name) => name.trim()).filter(Boolean);
    const urls = (detailRow.file_url ?? '')
      .split('|-')
      .map((url) => url.trim());

    names.forEach((name, index) => {
      const fileUrl = urls[index] ?? '';
      detailFiles.push({
        file_name: name,
        file_url: fileUrl,
        down_folder: '',
        source: 'notice_details',
        order: index + 1,
      });
    });
  }

  const fileRows = await runQuery<RowDataPacket & {
    file_name: string | null;
    file_url: string | null;
    down_folder: string | null;
    sn?: number;
  }>(
    'SELECT file_name, file_url, down_folder, sn FROM notice_files WHERE nid = ?',
    [nid],
  );

  const noticeFiles = fileRows
    .filter((row) => row.file_name)
    .map((row, idx) => ({
      file_name: row.file_name?.trim() ?? '',
      file_url: row.file_url?.trim() ?? '',
      down_folder: row.down_folder?.trim() ?? '',
      source: 'notice_files' as const,
      order: row.sn ?? idx + 1,
    }));

  const fileMap = new Map<string, NoticeFileItem>(
    noticeFiles.map((file) => [file.file_name, { ...file }]),
  );

  const combined: NoticeFileItem[] = [];
  for (const detailFile of detailFiles) {
    const matched = fileMap.get(detailFile.file_name);
    if (matched) {
      combined.push({ ...matched, order: detailFile.order });
      fileMap.delete(detailFile.file_name);
    } else {
      combined.push(detailFile);
    }
  }

  for (const remaining of fileMap.values()) {
    combined.push({ ...remaining, order: remaining.order ?? 0 });
  }

  combined.sort((a, b) => a.order - b.order);

  return {
    success: true,
    nid,
    files: combined,
    total_count: combined.length,
  };
}

interface NoticeDetailsPayload {
  title: string;
  notice_num: string;
  org_dept: string;
  org_tel: string;
  body_html: string;
  detail_url: string;
  category: string;
}

interface NoticeDetailsResponse {
  success: boolean;
  nid: number;
  details: NoticeDetailsPayload;
  message?: string;
}

async function getNoticeDetails(nid: number): Promise<NoticeDetailsResponse> {
  const row = await runQuerySingle<RowDataPacket & NoticeDetailsPayload>(
    `SELECT
      COALESCE(title, '') AS title,
      COALESCE(notice_num, '') AS notice_num,
      COALESCE(org_dept, '') AS org_dept,
      COALESCE(org_tel, '') AS org_tel,
      COALESCE(body_html, '') AS body_html,
      COALESCE(detail_url, '') AS detail_url,
      COALESCE(category, '') AS category
    FROM notice_details
    WHERE nid = ?
    LIMIT 1`,
    [nid],
  );

  if (!row) {
    return {
      success: false,
      nid,
      details: {
        title: '',
        notice_num: '',
        org_dept: '',
        org_tel: '',
        body_html: '',
        detail_url: '',
        category: '',
      },
      message: '공고 상세정보를 찾을 수 없습니다.',
    };
  }

  return {
    success: true,
    nid,
    details: {
      title: row.title,
      notice_num: row.notice_num,
      org_dept: row.org_dept,
      org_tel: row.org_tel,
      body_html: row.body_html,
      detail_url: row.detail_url,
      category: row.category,
    },
  };
}

async function updateNoticeDetails(nid: number, details: Record<string, unknown>): Promise<{ success: boolean; message: string; nid: number }> {
  const allowedFields = ['title', 'notice_num', 'org_dept', 'org_tel', 'body_html', 'detail_url', 'category'];
  const updateData: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(details)) {
    if (!allowedFields.includes(key)) {
      continue;
    }
    if (value === undefined || value === null) {
      continue;
    }
    updateData[key] = typeof value === 'string' ? value : JSON.stringify(value);
  }

  if (Object.keys(updateData).length === 0) {
    return {
      success: false,
      message: '업데이트할 데이터가 없습니다.',
      nid,
    };
  }

  const db = getMysqlInstance();
  await db.upsert('notice_details', {
    data: { nid, ...updateData },
    updateData,
  });

  return {
    success: true,
    message: '공고 상세정보가 성공적으로 업데이트되었습니다.',
    nid,
  };
}

interface LogNoticeScrapingRow {
  org_name: string;
  error_code: number | null;
  error_message: string | null;
  scraped_count: number;
  new_count?: number | null;
  inserted_count: number;
  time: string;
}

async function getLogsNoticeScraping(gap: number = DEFAULT_DAY_GAP): Promise<LogNoticeScrapingRow[]> {
  const sql = `
    SELECT
      org_name,
      error_code,
      error_message,
      scraped_count,
      new_count,
      inserted_count,
      DATE_FORMAT(time, '%Y-%m-%d %H:%i:%s') AS time
    FROM logs_notice_scraping
    WHERE time >= DATE_SUB(NOW(), INTERVAL ? DAY)
    ORDER BY time DESC
  `;
  return runQuery<RowDataPacket & LogNoticeScrapingRow>(sql, [Math.max(gap, 0)]);
}

interface ErrorNoticeScrapingRow {
  orgs: string;
  time: string;
}

async function getErrorsNoticeScraping(gap: number = DEFAULT_DAY_GAP): Promise<ErrorNoticeScrapingRow[]> {
  const sql = `
    SELECT
      orgs,
      DATE_FORMAT(time, '%Y-%m-%d %H:%i:%s') AS time
    FROM errors_notice_scraping
    WHERE time >= DATE_SUB(NOW(), INTERVAL ? DAY)
    ORDER BY time DESC
  `;
  return runQuery<RowDataPacket & ErrorNoticeScrapingRow>(sql, [Math.max(gap, 0)]);
}

const DEFAULT_BID_DETAIL: Record<string, unknown> = {
  공고: {
    '입찰 개시 시간': '정보 없음',
    '입찰 종료 시간': '정보 없음',
    '입찰 종류': '전자입찰',
    '제출 서류': '입찰서, 사업계획서',
    '입찰 보증금': '추정가격의 5%',
    '개찰 방식': '공개경쟁입찰',
  },
  응찰: { '응찰가': 0, '장소': '', '시간': '' },
  낙찰: { '프로젝트명': '', 'PM': '' },
  패찰: { '패찰 사유': '' },
  포기: { '포기 사유': '' },
};

const DEFAULT_BID_MEMO: Record<string, string> = {
  공고: '',
  응찰: '',
  낙찰: '',
  패찰: '',
  포기: '',
};

function cloneDefault<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

async function noticeToProgress(nid: number): Promise<void> {
  await execQuery('UPDATE notice_list SET is_selected = 1 WHERE nid = ?', [nid]);
  await upsertDetailByNid(nid);

  const noticeInfo = await runQuerySingle<RowDataPacket & { title: string; detail_url: string | null }>(
    'SELECT title, detail_url FROM notice_list WHERE nid = ? LIMIT 1',
    [nid],
  );

  const title = noticeInfo?.title ?? `Notice ${nid}`;
  const detailUrl = noticeInfo?.detail_url ?? '';

  const db = getMysqlInstance();
  const existingBid = await runQuerySingle<RowDataPacket & { mid: number; memo: string | null; detail: string | null }>(
    'SELECT mid, memo, detail FROM my_bids WHERE nid = ? LIMIT 1',
    [nid],
  );

  const memoDict = existingBid?.memo
    ? safelyParseJson<Record<string, string>>(existingBid.memo, cloneDefault(DEFAULT_BID_MEMO))
    : cloneDefault(DEFAULT_BID_MEMO);
  const detailDict = existingBid?.detail
    ? safelyParseJson<Record<string, unknown>>(existingBid.detail, cloneDefault(DEFAULT_BID_DETAIL))
    : cloneDefault(DEFAULT_BID_DETAIL);

  const payloadBase = {
    title,
    detail_url: detailUrl,
    status: '진행',
    memo: JSON.stringify(memoDict, null, 0),
    detail: JSON.stringify(detailDict, null, 0),
    updated_at: currentTimestamp(),
  };

  if (existingBid) {
    await db.update('my_bids', {
      where: { mid: existingBid.mid },
      data: payloadBase,
    });
  } else {
    await db.create('my_bids', {
      nid,
      ...payloadBase,
      created_at: currentTimestamp(),
    });
  }
}

async function noticeToProgressBatch(nids: number[]): Promise<{ successCount: number; failedNids: number[] }> {
  const targets = ensureArray(nids).filter((nid) => Number.isInteger(nid));
  let successCount = 0;
  const failedNids: number[] = [];

  for (const nid of targets) {
    try {
      await noticeToProgress(nid);
      successCount += 1;
    } catch (error) {
      console.error(`Failed to process nid ${nid}:`, error);
      failedNids.push(nid);
    }
  }

  return { successCount, failedNids };
}

async function updateNoticeCategoryByNids(nids: number[], category: string): Promise<number> {
  const targets = ensureArray(nids).filter((nid) => Number.isInteger(nid));
  if (targets.length === 0) {
    return 0;
  }
  const placeholders = targets.map((_value) => '?').join(', ');
  const sql = `UPDATE notice_list SET category = ? WHERE nid IN (${placeholders})`;
  return execQuery(sql, [category, ...targets]);
}

async function excludeNotices(nids: number[]): Promise<number> {
  const targets = ensureArray(nids).filter((nid) => Number.isInteger(nid));
  if (targets.length === 0) {
    return 0;
  }
  const placeholders = targets.map((_value) => '?').join(', ');
  const sql = `UPDATE notice_list SET is_selected = -1 WHERE nid IN (${placeholders})`;
  return execQuery(sql, targets);
}

async function restoreNotices(nids: number[]): Promise<number> {
  const targets = ensureArray(nids).filter((nid) => Number.isInteger(nid));
  if (targets.length === 0) {
    return 0;
  }
  const placeholders = targets.map((_value) => '?').join(', ');
  const sql = `UPDATE notice_list SET is_selected = 0 WHERE nid IN (${placeholders})`;
  return execQuery(sql, targets);
}

async function confirmDoneNotices(nids: number[]): Promise<number> {
  const targets = ensureArray(nids).filter((nid) => Number.isInteger(nid));
  if (targets.length === 0) {
    return 0;
  }
  const placeholders = targets.map((_value) => '?').join(', ');
  const sql = `UPDATE notice_list SET is_selected = -9 WHERE nid IN (${placeholders})`;
  return execQuery(sql, targets);
}

interface MyBidRow {
  mid: number;
  nid: number;
  status: string;
  title: string;
  detail_url: string | null;
  started_at: string | null;
  ended_at: string | null;
  detail: string | null;
  memo: string | null;
  org_name: string | null;
  posted_date: string | null;
  category: string | null;
  org_region: string | null;
}

async function getMyBids(): Promise<MyBidRow[]> {
  const sql = `
    SELECT
      b.mid,
      b.nid,
      b.status,
      b.title,
      b.detail_url,
      b.started_at,
      b.ended_at,
      b.detail,
      b.memo,
      n.org_name,
      n.posted_date,
      n.category,
      s.org_region
    FROM my_bids AS b
    LEFT JOIN notice_list AS n ON n.nid = b.nid
    LEFT JOIN settings_notice_list AS s ON s.org_name = n.org_name
    ORDER BY b.updated_at DESC, b.mid DESC
  `;
  return runQuery<RowDataPacket & MyBidRow>(sql);
}

async function getMyBidsByStatus(status: string): Promise<MyBidRow[]> {
  const sql = `
    SELECT
      b.mid,
      b.nid,
      b.status,
      b.title,
      b.detail_url,
      b.started_at,
      b.ended_at,
      b.detail,
      b.memo,
      n.org_name,
      n.posted_date,
      n.category,
      s.org_region
    FROM my_bids AS b
    LEFT JOIN notice_list AS n ON n.nid = b.nid
    LEFT JOIN settings_notice_list AS s ON s.org_name = n.org_name
    WHERE b.status = ?
    ORDER BY b.updated_at DESC, b.mid DESC
  `;
  return runQuery<RowDataPacket & MyBidRow>(sql, [status]);
}

async function getMyBidByNid(nid: number): Promise<MyBidRow | null> {
  const sql = `
    SELECT
      b.mid,
      b.nid,
      b.status,
      b.title,
      b.detail_url,
      b.started_at,
      b.ended_at,
      b.detail,
      b.memo,
      n.org_name,
      n.posted_date,
      n.category,
      s.org_region
    FROM my_bids AS b
    LEFT JOIN notice_list AS n ON n.nid = b.nid
    LEFT JOIN settings_notice_list AS s ON s.org_name = n.org_name
    WHERE b.nid = ?
    LIMIT 1
  `;
  return runQuerySingle<RowDataPacket & MyBidRow>(sql, [nid]);
}

async function createMyBid(data: Record<string, unknown>): Promise<number> {
  const db = getMysqlInstance();
  const payload = {
    ...data,
    created_at: currentTimestamp(),
    updated_at: currentTimestamp(),
  };
  const result = await db.create('my_bids', payload);
  if (!result.success || !result.data) {
    throw result.error ?? new Error('Failed to create my_bid');
  }
  return Number(result.data.insertId);
}

async function upsertMyBid(data: Record<string, unknown>): Promise<boolean> {
  const db = getMysqlInstance();
  const payload = {
    ...data,
    updated_at: currentTimestamp(),
  };
  const result = await db.upsert('my_bids', {
    data: payload,
  });
  if (!result.success) {
    throw result.error ?? new Error('Failed to upsert my_bid');
  }
  return true;
}

function safelyParseJson<T>(value: string, fallback: T): T {
  try {
    const parsed = JSON.parse(value);
    return parsed ?? fallback;
  } catch {
    return fallback;
  }
}

async function updateMyBid(nid: number, input: { status: string; memo?: string | null; detail?: unknown }): Promise<{ success: boolean; message: string }> {
  const existing = await runQuerySingle<RowDataPacket & { mid: number; memo: string | null; detail: string | null }>(
    'SELECT mid, memo, detail FROM my_bids WHERE nid = ? LIMIT 1',
    [nid],
  );

  if (!existing) {
    throw new Error(`입찰 정보를 찾을 수 없습니다: ${nid}`);
  }

  const memoDict = existing.memo ? safelyParseJson<Record<string, string>>(existing.memo, cloneDefault(DEFAULT_BID_MEMO)) : cloneDefault(DEFAULT_BID_MEMO);
  const detailDict = existing.detail ? safelyParseJson<Record<string, unknown>>(existing.detail, cloneDefault(DEFAULT_BID_DETAIL)) : cloneDefault(DEFAULT_BID_DETAIL);

  if (typeof input.memo === 'string') {
    memoDict[input.status] = input.memo;
  }

  if (input.detail !== undefined) {
    detailDict[input.status] = input.detail;
  }

  const db = getMysqlInstance();
  await db.update('my_bids', {
    where: { mid: existing.mid },
    data: {
      status: input.status,
      memo: JSON.stringify(memoDict, null, 0),
      detail: JSON.stringify(detailDict, null, 0),
      updated_at: currentTimestamp(),
    },
  });

  return {
    success: true,
    message: `입찰 정보가 성공적으로 업데이트되었습니다: ${nid}`,
  };
}

async function deleteMyBid(mid: number): Promise<boolean> {
  const db = getMysqlInstance();
  const result = await db.delete('my_bids', { mid });
  if (!result.success) {
    throw result.error ?? new Error('Failed to delete my_bid');
  }
  return true;
}

async function getSettingsCheck(orgName: string): Promise<SettingsNoticeListRecord | { error: string }> {
  try {
    const result = await getSettingsNoticeListByOrgName(orgName);
    if (!result) {
      return { error: '기관명에 해당하는 설정을 찾을 수 없습니다' };
    }
    return result;
  } catch (error) {
    console.error('Error in getSettingsCheck', error);
    return { error: (error as Error).message };
  }
}

function hello(): { message: string } {
  return { message: 'Hello, World!' };
}

export {
  parseKeywordWeightString,
  filterByNotStrings,
  getSettingsNoticeList,
  getSettingsNoticeListByOrgName,
  getSettingsNoticeListByOid,
  upsertSettingsNoticeListByOrgName,
  upsertSettingsNoticeListByOid,
  getSettingsNoticeDetail,
  getSettingsNoticeDetailByOrgName,
  getSettingsNoticeDetailByOid,
  upsertSettingsNoticeDetailByOid,
  getDetailConfigByOrgName,
  getNasPathSettings,
  getNasPathSettingById,
  createNasPathSetting,
  updateNasPathSetting,
  deleteNasPathSetting,
  getNoticeList,
  getNoticeListByCategory,
  getNoticeListByCategories,
  getNoticeListForStatistics,
  getDoneNotices,
  searchNoticesByKeywordWeight,
  parseKeywordWeights,
  scrapeListByOrgName,
  getAllNoticeCategorySettings,
  getNoticeCategorySetting,
  getNoticeCategoriesByPriority,
  searchNoticeList,
  filterNoticeList,
  getNoticeFiles,
  getNoticeDetails,
  updateNoticeDetails,
  getLogsNoticeScraping,
  getErrorsNoticeScraping,
  noticeToProgress,
  noticeToProgressBatch,
  updateNoticeCategoryByNids,
  excludeNotices,
  restoreNotices,
  confirmDoneNotices,
  getMyBids,
  getMyBidsByStatus,
  getMyBidByNid,
  createMyBid,
  upsertMyBid,
  updateMyBid,
  deleteMyBid,
  getSettingsCheck,
  hello,
};

