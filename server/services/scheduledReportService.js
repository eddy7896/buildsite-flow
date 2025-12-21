/**
 * Scheduled Report Service
 * Handles scheduled report generation and delivery
 */

const { parseDatabaseUrl } = require('../utils/poolManager');
const { Pool } = require('pg');
const cron = require('node-cron');
const crypto = require('crypto');
const reportBuilderService = require('./reportBuilderService');

function generateUUID() {
  return crypto.randomUUID();
}

async function getAgencyConnection(agencyDatabase) {
  const { host, port, user, password } = parseDatabaseUrl();
  const agencyDbUrl = `postgresql://${user}:${password}@${host}:${port}/${agencyDatabase}`;
  const agencyPool = new Pool({ connectionString: agencyDbUrl, max: 1 });
  return await agencyPool.connect();
}

/**
 * Calculate next run time based on schedule
 */
function calculateNextRun(schedule) {
  const now = new Date();
  let nextRun = new Date(now);

  switch (schedule.schedule_type) {
    case 'daily':
      nextRun.setDate(now.getDate() + 1);
      break;
    case 'weekly':
      const daysUntilNext = (schedule.day_of_week - now.getDay() + 7) % 7 || 7;
      nextRun.setDate(now.getDate() + daysUntilNext);
      break;
    case 'monthly':
      nextRun.setMonth(now.getMonth() + 1);
      nextRun.setDate(schedule.day_of_month || 1);
      break;
    case 'quarterly':
      nextRun.setMonth(now.getMonth() + 3);
      nextRun.setDate(1);
      break;
    case 'yearly':
      nextRun.setFullYear(now.getFullYear() + 1);
      nextRun.setMonth(0);
      nextRun.setDate(1);
      break;
    case 'custom':
      // For custom cron, would need to parse cron expression
      // For now, default to next day
      nextRun.setDate(now.getDate() + 1);
      break;
  }

  // Set time
  if (schedule.time) {
    const [hours, minutes] = schedule.time.split(':');
    nextRun.setHours(parseInt(hours), parseInt(minutes), 0, 0);
  }

  return nextRun;
}

/**
 * Create report schedule
 */
async function createReportSchedule(agencyDatabase, scheduleData, userId) {
  const client = await getAgencyConnection(agencyDatabase);
  try {
    const nextRun = calculateNextRun(scheduleData);

    const result = await client.query(
      `INSERT INTO public.report_schedules (
        id, agency_id, report_template_id, schedule_name, schedule_type,
        cron_expression, day_of_week, day_of_month, time, recipients,
        format, filters, is_active, next_run_at, created_by, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, NOW(), NOW())
      RETURNING *`,
      [
        generateUUID(),
        scheduleData.agency_id,
        scheduleData.report_template_id || null,
        scheduleData.schedule_name,
        scheduleData.schedule_type,
        scheduleData.cron_expression || null,
        scheduleData.day_of_week || null,
        scheduleData.day_of_month || null,
        scheduleData.time || '09:00:00',
        scheduleData.recipients || [],
        scheduleData.format || 'pdf',
        scheduleData.filters || null,
        scheduleData.is_active !== false,
        nextRun,
        userId,
      ]
    );

    return result.rows[0];
  } finally {
    client.release();
    await client.client.pool.end();
  }
}

/**
 * Execute scheduled report
 */
async function executeScheduledReport(agencyDatabase, scheduleId) {
  const client = await getAgencyConnection(agencyDatabase);
  try {
    await client.query('BEGIN');

    // Get schedule
    const scheduleResult = await client.query(
      'SELECT * FROM public.report_schedules WHERE id = $1',
      [scheduleId]
    );

    if (scheduleResult.rows.length === 0) {
      throw new Error('Schedule not found');
    }

    const schedule = scheduleResult.rows[0];

    // Get report template
    const templateResult = await client.query(
      'SELECT * FROM public.custom_reports WHERE id = $1',
      [schedule.report_template_id]
    );

    if (templateResult.rows.length === 0) {
      throw new Error('Report template not found');
    }

    const template = templateResult.rows[0];

    // Create execution record
    const executionResult = await client.query(
      `INSERT INTO public.report_executions (
        id, agency_id, report_id, schedule_id, execution_type,
        status, parameters, started_at
      ) VALUES ($1, $2, $3, $4, 'scheduled', 'running', $5, NOW())
      RETURNING *`,
      [
        generateUUID(),
        schedule.agency_id,
        schedule.report_template_id,
        scheduleId,
        schedule.filters,
      ]
    );

    const execution = executionResult.rows[0];

    try {
      // Build and execute report
      const reportData = await reportBuilderService.buildReport(
        agencyDatabase,
        template.query_config || {}
      );

      // Generate file
      const file = await reportBuilderService.generateReportFile(
        agencyDatabase,
        reportData,
        schedule.format
      );

      // Update execution
      await client.query(
        `UPDATE public.report_executions 
         SET status = 'completed', result_data = $1, file_path = $2, completed_at = NOW()
         WHERE id = $3`,
        [
          JSON.stringify(reportData),
          file.path || null,
          execution.id
        ]
      );

      // Update schedule
      const nextRun = calculateNextRun(schedule);
      await client.query(
        `UPDATE public.report_schedules 
         SET last_run_at = NOW(), next_run_at = $1, updated_at = NOW()
         WHERE id = $2`,
        [nextRun, scheduleId]
      );

      // TODO: Send email with report attachment
      // await sendReportEmail(schedule.recipients, file, schedule.schedule_name);

      await client.query('COMMIT');
      return { execution, reportData, file };
    } catch (error) {
      // Update execution with error
      await client.query(
        `UPDATE public.report_executions 
         SET status = 'failed', error_message = $1, completed_at = NOW()
         WHERE id = $2`,
        [error.message, execution.id]
      );
      throw error;
    }
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
    await client.client.pool.end();
  }
}

/**
 * Get schedules due for execution
 */
async function getSchedulesDue(agencyDatabase) {
  const client = await getAgencyConnection(agencyDatabase);
  try {
    const now = new Date();
    const result = await client.query(
      `SELECT * FROM public.report_schedules
       WHERE is_active = true
       AND next_run_at <= $1
       ORDER BY next_run_at ASC`,
      [now]
    );
    return result.rows;
  } finally {
    client.release();
    await client.client.pool.end();
  }
}

/**
 * Initialize scheduled report execution
 */
function initializeScheduledReports() {
  // Check for due schedules every minute
  cron.schedule('* * * * *', async () => {
    try {
      // Get all agency databases (would need to query agencies table)
      // For now, this is a placeholder - would need to iterate through agencies
      console.log('[Scheduled Reports] Checking for due reports...');
      
      // In production, would:
      // 1. Get all active agencies
      // 2. For each agency, check for due schedules
      // 3. Execute reports
    } catch (error) {
      console.error('[Scheduled Reports] Error checking schedules:', error);
    }
  });

  console.log('[Scheduled Reports] ✅ Scheduler initialized');
}

module.exports = {
  createReportSchedule,
  executeScheduledReport,
  getSchedulesDue,
  initializeScheduledReports,
  calculateNextRun,
};
