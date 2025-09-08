import mysql from 'mysql2/promise';

export default class MySQL {
  private pool: mysql.Pool;

  constructor() {
    this.pool = mysql.createPool({
      host: process.env.MYSQL_HOST || '1.23.45.67',
      user: process.env.MYSQL_USER || 'root',
      password: process.env.MYSQL_PASSWORD || 'mysqlpassword',
      database: process.env.MYSQL_DATABASE || 'ilmac_bid_db',
      port: parseInt(process.env.MYSQL_PORT || '1234', 10),
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
    });
  }

  /**
   * 데이터베이스 연결 종료
   */
  async close(): Promise<void> {
    await this.pool.end();
  }

  /**
   * SQL 쿼리 실행
   */
  async fetch(sql: string, limit: number = 0): Promise<any | any[] | null> {
    try {
      const [rows] = await this.pool.query(sql);
      if (!Array.isArray(rows)) return null;

      if (limit === 1) {
        return rows.length > 0 ? rows[0] : null;
      }

      return limit > 0 ? rows.slice(0, limit) : rows;
    } catch (e) {
      console.error('Error in fetch:', e);
      return null;
    }
  }

  /**
   * 테이블 조회
   */
  async find(tableName: string, fields: string[] | null = null, addStr: string = ''): Promise<any | any[] | null> {
    const fieldStr = fields ? fields.join(',') : '*';
    const sql = `SELECT ${fieldStr} FROM ${tableName} ${addStr}`;
    return this.fetch(sql);
  }

  /**
   * 데이터 삽입 또는 업데이트
   */
  async upsert(data: any[][], tableName: string, uniqueFields: string[]): Promise<void> {
    if (data.length < 2) return;

    const fields = data[0];
    const values = data.slice(1);
    const placeholders = values.map(() => '(' + fields.map(() => '?').join(',') + ')').join(',');

    const duplicateUpdate = fields
      .filter((field) => !uniqueFields.includes(field))
      .map((field) => `${field}=VALUES(${field})`)
      .join(',');

    const sql = `
      INSERT INTO ${tableName} (${fields.join(',')})
      VALUES ${placeholders}
      ON DUPLICATE KEY UPDATE ${duplicateUpdate}
    `;

    try {
      await this.pool.query(sql, values.flat());
    } catch (e) {
      console.error('Error in upsert:', e);
    }
  }

  /**
   * 기관명으로 마지막 공지사항 조회
   */
  async findLastany(name: string, field: string = '제목'): Promise<[number | null, string | null]> {
    const sql = `
      SELECT sn, ${field}
      FROM notices
      WHERE 기관명='${name}'
      ORDER BY sn DESC
      LIMIT 1
    `;

    const result = await this.fetch(sql, 1);

    if (!result || Array.isArray(result)) return [null, null];
    return [result.sn, result[field]];
  }

  /**
   * 기관명으로 설정 조회
   */
  async noticeConfigByName(name: string): Promise<any | null> {
    try {
      const addStr = `WHERE 기관명='${name}'`;
      const result = await this.find('settings_notice_list', null, addStr);

      if (!result || Array.isArray(result)) {
        console.error(`설정을 찾을 수 없습니다: ${name}`);
        return null;
      }

      const row = result;
      console.log('@@@ Raw settings row:', row);

      const elementFields = ['제목', '상세페이지주소', '작성일', '작성자', '제외항목'];
      const SEPARATOR = '|-';

      const elements = {};
      elementFields.forEach((field) => {
        const value = row[field];
        if (typeof value === 'string' && value.trim() !== '') {
          const parts = value.split(SEPARATOR);
          const xpath = parts[0].trim();

          if (xpath !== '') {
            const element = [xpath];

            if (parts.length >= 2 && parts[1].trim() !== '') {
              element.push(parts[1].trim());
            }

            if (parts.length === 3 && parts[2].trim() !== '') {
              element.push(parts[2].trim());
            }

            elements[field] = element;
          }
        }
      });

      console.log('@@@ Constructed elements:', elements);

      return {
        name: name,
        baseUrl: row.url,
        iframe: row.iframe || undefined,
        rowXpath: row.rowXpath,
        paging: row.paging || undefined,
        startPage: Number(row.startPage) || 1,
        endPage: Number(row.endPage) || 1,
        login: row.login || undefined,
        elements: elements,
      };
    } catch (e) {
      console.error(`Error in noticeConfigByName for ${name}:`, e);
      return null;
    }
  }

  /**
   * 카테고리별로 notices를 검색하는 함수
   * @param category 카테고리명('무관' 또는 카테고리명)
   * @param dayGap 현재 시간으로부터 몇 일 전까지의 notices를 검색할지 (기본값: 15일)
   * @returns Notice 객체 배열
   */
  async findNoticesByCategory(category: string, dayGap: number = 15): Promise<any[]> {
    try {
      // 카테고리별 notices 검색 조건 생성
      let searchStr = category === '무관'
        ? 'WHERE category IS NULL'
        : `WHERE category = '${category}'`;

      // 날짜 조건 추가
      if (dayGap > 0) {
        const date = new Date();
        date.setDate(date.getDate() - dayGap);
        searchStr += ` AND scraped_at >= '${date.toISOString()}'`;
      }

      // 필요한 필드 정의
      const fields = ['nid', '제목', '상세페이지주소', '작성일', '작성자', '기관명', 'category'];

      // notices 테이블 조회
      const notices = await this.find('notices', fields, searchStr);

      if (!notices || !Array.isArray(notices)) {
        return [];
      }

      // settings_notice_list 전체 데이터를 한 번에 조회
      const allSettings = await this.find('settings_notice_list', ['기관명', '지역', '등록']);
      const settingsMap = Array.isArray(allSettings)
        ? allSettings.reduce((acc: { [key: string]: { 지역: string; 등록: string } }, setting: any) => {
          acc[setting.기관명] = {
            지역: setting.지역,
            등록: setting.등록
          };
          return acc;
        }, {})
        : {};

      // 결과 처리
      const result = notices.map((notice: any) => {
        const noticeObj = {
          nid: notice.nid,
          title: notice.제목,
          detailUrl: notice.상세페이지주소,
          postedAt: notice.작성일
            ? new Date(notice.작성일).toLocaleDateString('ko-KR', {
              year: 'numeric',
              month: '2-digit',
              day: '2-digit'
            }).replace(/\. /g, '-').replace('.', '')
            : null,
          orgName: notice.기관명,
          category: notice.category
        };

        // 메모리에서 기관 설정 정보 조회
        const orgSettings = settingsMap[notice.기관명];
        if (orgSettings) {
          noticeObj["region"] = orgSettings.지역;
          noticeObj["registration"] = orgSettings.등록;
        }

        return noticeObj;
      });

      return result;

    } catch (error) {
      console.error(`카테고리 '${category}' notices 검색 중 오류 발생:`, error);
      return [];
    }
  }
}