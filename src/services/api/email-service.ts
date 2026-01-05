/**
 * Email Service API
 * Handles email testing and sending operations
 */

import { getApiRoot } from '@/config/api';
import { getAgencyDatabase } from '@/utils/authContext';
import { getApiHeaders } from './api-helpers';

const API_BASE = getApiRoot();


export interface EmailProviderStatus {
  active: string;
  providers: {
    [key: string]: {
      name: string;
      available: boolean;
      configured: boolean;
    };
  };
}

export interface TestEmailRequest {
  to: string;
  provider?: string;
  config?: Record<string, any>;
}

export interface SendEmailRequest {
  to: string | string[];
  subject: string;
  html?: string;
  text?: string;
  attachments?: Array<{
    filename: string;
    content: string | Buffer;
  }>;
  provider?: string;
  config?: Record<string, any>;
  from?: string;
}

export interface NotificationEmailRequest {
  to: string;
  title: string;
  message: string;
  actionUrl?: string;
  provider?: string;
  config?: Record<string, any>;
}

export interface ReportEmailRequest {
  recipients: string | string[];
  reportData: string | Buffer;
  reportName: string;
  format?: string;
  provider?: string;
  config?: Record<string, any>;
}

export interface EmailResponse {
  success: boolean;
  messageId?: string;
  provider?: string;
  error?: string;
}

/**
 * Get email provider status
 */
export async function getEmailStatus(): Promise<EmailProviderStatus> {
  const headers = getApiHeaders();
  if (!headers['Authorization']) {
    throw new Error('Authentication required');
  }

  const response = await fetch(`${API_BASE}/email/status`, {
    headers,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Failed to fetch email status' }));
    throw new Error(error.error || 'Failed to fetch email status');
  }

  const result = await response.json();
  return result.data;
}

/**
 * Test email configuration
 */
export async function testEmail(request: TestEmailRequest): Promise<EmailResponse> {
  const headers = getApiHeaders();
  if (!headers['Authorization']) {
    throw new Error('Authentication required');
  }

  const response = await fetch(`${API_BASE}/email/test`, {
    method: 'POST',
    headers,
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Failed to send test email' }));
    throw new Error(error.error || 'Failed to send test email');
  }

  const result = await response.json();
  return result.data;
}

/**
 * Send custom email
 */
export async function sendEmail(request: SendEmailRequest): Promise<EmailResponse> {
  const headers = getApiHeaders();
  if (!headers['Authorization']) {
    throw new Error('Authentication required');
  }

  const response = await fetch(`${API_BASE}/email/send`, {
    method: 'POST',
    headers,
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Failed to send email' }));
    throw new Error(error.error || 'Failed to send email');
  }

  const result = await response.json();
  return result.data;
}

/**
 * Send notification email
 */
export async function sendNotificationEmail(request: NotificationEmailRequest): Promise<EmailResponse> {
  const headers = getApiHeaders();
  if (!headers['Authorization']) {
    throw new Error('Authentication required');
  }

  const response = await fetch(`${API_BASE}/email/notification`, {
    method: 'POST',
    headers,
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Failed to send notification email' }));
    throw new Error(error.error || 'Failed to send notification email');
  }

  const result = await response.json();
  return result.data;
}

/**
 * Send report email
 */
export async function sendReportEmail(request: ReportEmailRequest): Promise<EmailResponse> {
  const headers = getApiHeaders();
  if (!headers['Authorization']) {
    throw new Error('Authentication required');
  }

  // Convert reportData to base64 if it's a Buffer
  const reportData = typeof request.reportData === 'string' 
    ? request.reportData 
    : Buffer.from(request.reportData).toString('base64');

  const response = await fetch(`${API_BASE}/email/report`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      ...request,
      reportData,
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Failed to send report email' }));
    throw new Error(error.error || 'Failed to send report email');
  }

  const result = await response.json();
  return result.data;
}
