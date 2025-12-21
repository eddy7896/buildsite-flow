/**
 * Custom Report Builder Service
 * Handles dynamic report generation based on user-defined configurations
 */

const { parseDatabaseUrl } = require('../utils/poolManager');
const { Pool } = require('pg');

async function getAgencyConnection(agencyDatabase) {
  const { host, port, user, password } = parseDatabaseUrl();
  const agencyDbUrl = `postgresql://${user}:${password}@${host}:${port}/${agencyDatabase}`;
  const agencyPool = new Pool({ connectionString: agencyDbUrl, max: 1 });
  return await agencyPool.connect();
}

/**
 * Build and execute custom report query
 */
async function buildReport(agencyDatabase, reportConfig) {
  const client = await getAgencyConnection(agencyDatabase);
  try {
    const {
      tables,
      columns,
      joins,
      filters,
      groupBy,
      orderBy,
      limit,
    } = reportConfig;

    // Build SELECT clause
    const selectColumns = columns.map(col => {
      if (col.aggregate) {
        return `${col.aggregate}(${col.table}.${col.column}) as ${col.alias || col.column}`;
      }
      return `${col.table}.${col.column}${col.alias ? ` as ${col.alias}` : ''}`;
    }).join(', ');

    // Build FROM clause
    let fromClause = tables[0];
    if (tables.length > 1 && joins) {
      for (const join of joins) {
        fromClause += ` ${join.type} JOIN ${join.table} ON ${join.condition}`;
      }
    }

    // Build WHERE clause
    let whereClause = '';
    if (filters && filters.length > 0) {
      const conditions = filters.map(filter => {
        const value = typeof filter.value === 'string' ? `'${filter.value}'` : filter.value;
        return `${filter.table}.${filter.column} ${filter.operator} ${value}`;
      }).join(' AND ');
      whereClause = `WHERE ${conditions}`;
    }

    // Build GROUP BY
    let groupByClause = '';
    if (groupBy && groupBy.length > 0) {
      groupByClause = `GROUP BY ${groupBy.join(', ')}`;
    }

    // Build ORDER BY
    let orderByClause = '';
    if (orderBy && orderBy.length > 0) {
      const orders = orderBy.map(o => `${o.column} ${o.direction || 'ASC'}`).join(', ');
      orderByClause = `ORDER BY ${orders}`;
    }

    // Build LIMIT
    const limitClause = limit ? `LIMIT ${limit}` : '';

    // Construct final query
    const query = `
      SELECT ${selectColumns}
      FROM ${fromClause}
      ${whereClause}
      ${groupByClause}
      ${orderByClause}
      ${limitClause}
    `;

    const result = await client.query(query);
    return result.rows;
  } finally {
    client.release();
    await client.client.pool.end();
  }
}

/**
 * Generate report in specified format
 */
async function generateReportFile(agencyDatabase, reportData, format = 'json') {
  // In production, use libraries like:
  // - PDF: pdfkit, puppeteer
  // - Excel: exceljs, xlsx
  // - CSV: csv-stringify
  
  switch (format) {
    case 'pdf':
      // Generate PDF (would use pdfkit or puppeteer)
      return { format: 'pdf', data: 'PDF binary data' };
    case 'excel':
      // Generate Excel (would use exceljs)
      return { format: 'xlsx', data: 'Excel binary data' };
    case 'csv':
      // Generate CSV
      const headers = Object.keys(reportData[0] || {});
      const csv = [
        headers.join(','),
        ...reportData.map(row => headers.map(h => row[h]).join(','))
      ].join('\n');
      return { format: 'csv', data: csv };
    default:
      return { format: 'json', data: JSON.stringify(reportData, null, 2) };
  }
}

module.exports = {
  buildReport,
  generateReportFile,
};
