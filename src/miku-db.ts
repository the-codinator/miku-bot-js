import { Connection, createConnection, ResultSetHeader, RowDataPacket } from 'mysql2/promise';
import logger from './logger';

class DbHelper {
  connection: Connection | undefined;

  async init() {
    if (this.connection) {
      try {
        await this.connection.end();
      } catch (e) {
        logger.warn('Failed to end DB connection', e);
      }
    }
    this.connection = await createConnection({
      host: 'localhost',
      user: 'miku',
      password: 'discord',
      database: 'mikuDB',
    });
    await this.connection.connect();
    logger.info('DB: connected');
  }

  async report(reporter: string, reportee: string, ts: string) {
    const [{ affectedRows }] = await this.connection!.query<ResultSetHeader>(
      `INSERT INTO reports VALUES ('${reporter}', '${reportee}', 1, '${ts}', NULL) ON DUPLICATE KEY UPDATE count = count + 1, report_ts = '${ts}'`
    );
    return affectedRows;
  }

  async request(requestor: string, requestee: string, ts: string) {
    const [{ affectedRows }] = await this.connection!.query<ResultSetHeader>(
      `UPDATE reports SET request_ts = '${ts}' WHERE reporter = '${requestee}' AND reportee = '${requestor}'`
    );
    return affectedRows;
  }

  async unreport(reporter: string, reportee: string) {
    const [{ affectedRows }] = await this.connection!.query<ResultSetHeader>(
      `DELETE FROM reports WHERE reporter = '${reporter}' AND reportee = '${reportee}' AND count > 0`
    );
    return affectedRows;
  }

  async getReport(reporter: string, reportee: string) {
    const [result] = await this.connection!.query<RowDataPacket[]>(
      `SELECT count, report_ts FROM reports WHERE reporter = '${reporter}' AND reportee = '${reportee}'`
    );
    return result && result[0]
      ? { count: result[0].count, tsString: `Last reported at ${result[0].report_ts}` }
      : { count: 0, tsString: '' };
  }

  async getReportAggregated(user: string) {
    const [[{ c }]] = await this.connection!.query<RowDataPacket[]>(
      `SELECT SUM(count) AS c FROM reports WHERE reportee = '${user}'`
    );
    const [[{ c2 }]] = await this.connection!.query<RowDataPacket[]>(
      `SELECT SUM(count) AS c2 FROM reports WHERE reporter = '${user}'`
    );
    return { gotReported: c || 0, reportedOthers: c2 || 0 };
  }

  async getReportVerbose(mode: 'reporter' | 'reportee', user: string) {
    const [result] = await this.connection!.query<RowDataPacket[]>(
      `SELECT ${this.flipMode(mode)} as x, count FROM reports WHERE ${mode} = '${user}' AND count > 0`
    );
    return result.map(({ x, count }) => `${x} (${count})`).join(', ');
  }

  async getRequestsFrom(requestor: string) {
    const [result] = await this.connection!.query<RowDataPacket[]>(
      `SELECT reporter, request_ts FROM reports WHERE reportee = '${requestor}' AND request_ts IS NOT NULL`
    );
    return result.map(({ reporter, request_ts }) => `${reporter} (${request_ts})`).join(', ');
  }

  async getRequestsTo(requestee: string) {
    const [result] = await this.connection!.query<RowDataPacket[]>(
      `SELECT reportee, request_ts FROM reports WHERE reporter = '${requestee}' AND request_ts IS NOT NULL`
    );
    return result.map(({ reportee, request_ts }) => `${reportee} (${request_ts})`).join(', ');
  }

  async deleteRequest(requestor: string, requestee: string) {
    const [{ affectedRows }] = await this.connection!.query<ResultSetHeader>(
      `UPDATE reports SET request_ts = NULL WHERE reporter = '${requestee}' AND reportee = '${requestor}'`
    );
    return affectedRows;
  }

  async resetReports(mode: 'reporter' | 'reportee', user: string) {
    const [{ affectedRows }] = await this.connection!.query<ResultSetHeader>(
      `DELETE FROM reports WHERE ${mode} = '${user}'`
    );
    return affectedRows;
  }

  private flipMode(mode: string) {
    if (mode === 'reporter') return 'reportee';
    else if (mode === 'reportee') return 'reporter';
    else return undefined;
  }
}

export default new DbHelper();
