// Main API service exports
export { BaseApiService, type ApiResponse, type ApiOptions } from './base';
export { AuthService } from './auth';
export { NotificationService } from './notifications';
export { EmployeeService } from './employees';

// Attendance service exports
export * from './attendance-service';

// Re-export for convenience
export * from './base';
export * from './auth';
export * from './notifications';
export * from './employees';