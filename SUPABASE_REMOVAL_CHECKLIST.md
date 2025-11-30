# Supabase Removal & PostgreSQL Migration Checklist

## Phase 1: Preparation ✅ COMPLETE

### Configuration Updates
- [x] Updated `src/config/env.ts` - Removed Supabase environment variables
- [x] Updated `src/config/index.ts` - Removed Supabase configuration
- [x] Created `.env.example` - New environment variables documented
- [x] Created `POSTGRESQL_MIGRATION_COMPLETE.md` - Complete migration guide

### New PostgreSQL Infrastructure
- [x] Created `src/integrations/postgresql/client.ts` - Database connection pool
- [x] Created `src/integrations/postgresql/types.ts` - TypeScript types for all tables
- [x] Created `src/services/api/auth-postgresql.ts` - Authentication service
- [x] Created `src/services/api/postgresql-service.ts` - Generic database operations
- [x] Created `src/services/file-storage.ts` - File storage service

---

## Phase 2: Code Migration (IN PROGRESS)

### Files Requiring Updates

#### Authentication & Authorization
- [ ] `src/hooks/useAuth.tsx` - Replace Supabase auth with PostgreSQL auth
- [ ] `src/pages/Auth.tsx` - Update login/signup pages
- [ ] `src/pages/SignUp.tsx` - Update signup flow
- [ ] `src/components/ProtectedRoute.tsx` - Update route protection
- [ ] `src/components/AuthRedirect.tsx` - Update auth redirect logic
- [ ] `src/stores/authStore.ts` - Update auth state management

#### API Services
- [ ] `src/services/api/base.ts` - Replace Supabase queries with PostgreSQL
- [ ] `src/services/api/auth.ts` - Update authentication endpoints

#### Pages (Data Operations)
- [ ] `src/pages/Users.tsx` - Replace Supabase queries
- [ ] `src/pages/Employees.tsx` - Replace Supabase queries
- [ ] `src/pages/Clients.tsx` - Replace Supabase queries
- [ ] `src/pages/Projects.tsx` - Replace Supabase queries
- [ ] `src/pages/Tasks.tsx` - Replace Supabase queries
- [ ] `src/pages/Invoices.tsx` - Replace Supabase queries
- [ ] `src/pages/Quotations.tsx` - Replace Supabase queries
- [ ] `src/pages/Jobs.tsx` - Replace Supabase queries
- [ ] `src/pages/Leads.tsx` - Replace Supabase queries
- [ ] `src/pages/Reimbursements.tsx` - Replace Supabase queries
- [ ] `src/pages/Attendance.tsx` - Replace Supabase queries
- [ ] `src/pages/LeaveRequests.tsx` - Replace Supabase queries
- [ ] `src/pages/Payroll.tsx` - Replace Supabase queries
- [ ] `src/pages/DepartmentManagement.tsx` - Replace Supabase queries
- [ ] `src/pages/MyProfile.tsx` - Replace Supabase queries
- [ ] `src/pages/MyTeam.tsx` - Replace Supabase queries
- [ ] `src/pages/MyAttendance.tsx` - Replace Supabase queries
- [ ] `src/pages/MyLeave.tsx` - Replace Supabase queries
- [ ] `src/pages/Settings.tsx` - Replace Supabase queries
- [ ] `src/pages/Analytics.tsx` - Replace Supabase queries
- [ ] `src/pages/CRM.tsx` - Replace Supabase queries
- [ ] `src/pages/FinancialManagement.tsx` - Replace Supabase queries
- [ ] `src/pages/ProjectManagement.tsx` - Replace Supabase queries
- [ ] `src/pages/GstCompliance.tsx` - Replace Supabase queries
- [ ] `src/pages/HolidayManagement.tsx` - Replace Supabase queries
- [ ] `src/pages/CreateEmployee.tsx` - Replace Supabase queries
- [ ] `src/pages/AssignUserRoles.tsx` - Replace Supabase queries
- [ ] `src/pages/AIFeatures.tsx` - Replace Supabase edge functions
- [ ] `src/pages/AgencySignUp.tsx` - Replace Supabase edge functions

#### Components (Data Operations)
- [ ] `src/components/UserFormDialog.tsx` - Replace Supabase queries
- [ ] `src/components/ClientFormDialog.tsx` - Replace Supabase queries
- [ ] `src/components/ProjectFormDialog.tsx` - Replace Supabase queries
- [ ] `src/components/TaskFormDialog.tsx` - Replace Supabase queries
- [ ] `src/components/InvoiceFormDialog.tsx` - Replace Supabase queries
- [ ] `src/components/QuotationFormDialog.tsx` - Replace Supabase queries
- [ ] `src/components/JobFormDialog.tsx` - Replace Supabase queries
- [ ] `src/components/LeadFormDialog.tsx` - Replace Supabase queries
- [ ] `src/components/DepartmentFormDialog.tsx` - Replace Supabase queries
- [ ] `src/components/HolidayFormDialog.tsx` - Replace Supabase queries
- [ ] `src/components/ReimbursementFormDialog.tsx` - Replace Supabase queries
- [ ] `src/components/ReimbursementReviewDialog.tsx` - Replace Supabase queries
- [ ] `src/components/ReceiptUpload.tsx` - Replace Supabase storage
- [ ] `src/components/TaskKanbanBoard.tsx` - Replace Supabase queries
- [ ] `src/components/TeamAssignmentPanel.tsx` - Replace Supabase queries
- [ ] `src/components/RoleChangeRequests.tsx` - Replace Supabase queries
- [ ] `src/components/LeaveBalanceWidget.tsx` - Replace Supabase queries
- [ ] `src/components/NotificationCenter.tsx` - Replace Supabase queries
- [ ] `src/components/DemoDataManager.tsx` - Replace Supabase queries
- [ ] `src/components/CreateDemoUsers.tsx` - Replace Supabase queries
- [ ] `src/components/ClockInOut.tsx` - Replace Supabase queries
- [ ] `src/components/PaymentDialog.tsx` - Replace Supabase edge functions
- [ ] `src/components/OnboardingWizard.tsx` - Replace Supabase queries
- [ ] `src/components/ReimbursementWorkflow.tsx` - Replace Supabase queries
- [ ] `src/components/documents/DocumentManager.tsx` - Replace Supabase storage
- [ ] `src/components/communication/MessageCenter.tsx` - Replace Supabase queries
- [ ] `src/components/system/RealTimeUsageWidget.tsx` - Replace Supabase real-time
- [ ] `src/components/system/SupportTicketsWidget.tsx` - Replace Supabase queries

#### Hooks (Data Operations)
- [ ] `src/hooks/useAuth.tsx` - Replace Supabase auth
- [ ] `src/hooks/useAnalytics.ts` - Replace Supabase queries
- [ ] `src/hooks/useAgencyAnalytics.ts` - Replace Supabase queries
- [ ] `src/hooks/useSystemAnalytics.ts` - Replace Supabase queries
- [ ] `src/hooks/usePermissions.ts` - Replace Supabase queries
- [ ] `src/hooks/useGST.ts` - Replace Supabase queries
- [ ] `src/hooks/useCurrency.tsx` - Replace Supabase queries
- [ ] `src/hooks/usePlanManagement.ts` - Replace Supabase queries

#### Configuration
- [ ] `src/config/services.ts` - Update API endpoint configuration

---

## Phase 3: Database Setup

### PostgreSQL Installation
- [ ] Install PostgreSQL 14+
- [ ] Create database `buildflow_db`
- [ ] Create user `app_user`
- [ ] Grant permissions

### Schema Migration
- [ ] Run `supabase/migrations/00_core_auth_schema.sql`
- [ ] Run `supabase/migrations/01_phase2_business_tables.sql`
- [ ] Run all additional migration files
- [ ] Verify all tables created
- [ ] Verify all indexes created
- [ ] Verify all functions created
- [ ] Verify all triggers created

### Data Migration
- [ ] Export data from Supabase
- [ ] Transform data format if needed
- [ ] Import data to PostgreSQL
- [ ] Verify record counts
- [ ] Verify data integrity
- [ ] Check for orphaned records

---

## Phase 4: Dependencies

### Package Updates
- [ ] Install `pg` - PostgreSQL client
- [ ] Install `@types/pg` - TypeScript types
- [ ] Install `bcryptjs` - Password hashing
- [ ] Install `@types/bcryptjs` - TypeScript types
- [ ] Install `jsonwebtoken` - JWT tokens
- [ ] Install `@types/jsonwebtoken` - TypeScript types
- [ ] Remove `@supabase/supabase-js` - No longer needed
- [ ] Update `package.json`

### Environment Setup
- [ ] Create `.env.local` file
- [ ] Set `VITE_DATABASE_URL`
- [ ] Set `VITE_API_URL`
- [ ] Set `VITE_JWT_SECRET`
- [ ] Set `VITE_FILE_STORAGE_PATH`
- [ ] Verify all required variables set

---

## Phase 5: Testing

### Unit Tests
- [ ] Test authentication functions
- [ ] Test database query functions
- [ ] Test file storage functions
- [ ] Test password hashing
- [ ] Test JWT token generation/verification

### Integration Tests
- [ ] Test user registration flow
- [ ] Test user login flow
- [ ] Test data CRUD operations
- [ ] Test file upload/download
- [ ] Test multi-tenant isolation
- [ ] Test role-based access

### End-to-End Tests
- [ ] Test complete user workflow
- [ ] Test all page functionality
- [ ] Test all component functionality
- [ ] Test error handling
- [ ] Test edge cases

### Performance Tests
- [ ] Load test database
- [ ] Load test API endpoints
- [ ] Monitor query performance
- [ ] Check connection pool usage
- [ ] Verify indexes are used

### Security Tests
- [ ] Test SQL injection prevention
- [ ] Test authentication bypass attempts
- [ ] Test authorization bypass attempts
- [ ] Test password security
- [ ] Test token security
- [ ] Test file access controls

---

## Phase 6: Deployment

### Pre-Deployment
- [ ] All tests passing
- [ ] Code review completed
- [ ] Documentation updated
- [ ] Backups configured
- [ ] Monitoring set up
- [ ] Rollback plan documented

### Deployment
- [ ] Deploy to staging environment
- [ ] Run smoke tests
- [ ] Verify all features working
- [ ] Check performance metrics
- [ ] Monitor error logs
- [ ] Get stakeholder approval

### Production Deployment
- [ ] Schedule maintenance window
- [ ] Notify users of downtime
- [ ] Backup Supabase database
- [ ] Backup PostgreSQL database
- [ ] Deploy application
- [ ] Verify application health
- [ ] Monitor for errors
- [ ] Notify users of completion

### Post-Deployment
- [ ] Monitor application performance
- [ ] Monitor database performance
- [ ] Monitor error rates
- [ ] Verify user access
- [ ] Collect user feedback
- [ ] Document any issues

---

## Phase 7: Cleanup

### Supabase Decommissioning
- [ ] Verify all data migrated
- [ ] Verify no dependencies on Supabase
- [ ] Export final backup from Supabase
- [ ] Cancel Supabase subscription
- [ ] Document decommissioning

### Code Cleanup
- [ ] Remove Supabase integration folder (after verification)
- [ ] Remove Supabase types file (after verification)
- [ ] Remove Supabase-related comments
- [ ] Update documentation
- [ ] Update README

### Documentation
- [ ] Update README.md
- [ ] Update deployment guide
- [ ] Update troubleshooting guide
- [ ] Update API documentation
- [ ] Archive old documentation

---

## Phase 8: Optimization

### Database Optimization
- [ ] Analyze query performance
- [ ] Add missing indexes
- [ ] Optimize slow queries
- [ ] Tune PostgreSQL settings
- [ ] Vacuum and analyze tables

### Application Optimization
- [ ] Implement caching
- [ ] Optimize API responses
- [ ] Reduce database queries
- [ ] Implement pagination
- [ ] Optimize file storage

### Monitoring Setup
- [ ] Set up performance monitoring
- [ ] Set up error tracking
- [ ] Set up log aggregation
- [ ] Set up alerting
- [ ] Set up dashboards

---

## Supabase Removal Summary

### Files to Remove (After Verification)
```
src/integrations/supabase/
├── client.ts (DEPRECATED - use src/integrations/postgresql/client.ts)
└── types.ts (DEPRECATED - use src/integrations/postgresql/types.ts)
```

### Files to Keep (For Reference)
```
supabase/
├── migrations/ (Keep for schema reference)
├── functions/ (Keep for edge function reference)
└── config.toml (Keep for reference)
```

### Environment Variables Removed
```
VITE_SUPABASE_URL
VITE_SUPABASE_PUBLISHABLE_KEY
VITE_SUPABASE_PROJECT_ID
```

### Environment Variables Added
```
VITE_DATABASE_URL
VITE_API_URL
VITE_JWT_SECRET
VITE_FILE_STORAGE_PATH
```

---

## Verification Checklist

### Database Verification
- [ ] PostgreSQL running
- [ ] Database created
- [ ] User configured
- [ ] All tables created
- [ ] All indexes created
- [ ] All functions created
- [ ] All triggers created
- [ ] Data migrated
- [ ] Data integrity verified

### Application Verification
- [ ] Application starts without errors
- [ ] Login works
- [ ] All pages load
- [ ] All CRUD operations work
- [ ] File upload/download works
- [ ] Multi-tenant isolation works
- [ ] Role-based access works
- [ ] Error handling works
- [ ] Performance acceptable

### Security Verification
- [ ] Passwords hashed
- [ ] JWT tokens working
- [ ] SQL injection prevented
- [ ] Authentication required
- [ ] Authorization enforced
- [ ] File access controlled
- [ ] Audit logging working

---

## Rollback Plan

If migration fails:

1. **Immediate Actions (0-5 minutes)**
   - Stop application
   - Revert to Supabase configuration
   - Restart application with Supabase

2. **Investigation (5-30 minutes)**
   - Identify root cause
   - Assess data integrity
   - Determine if rollback necessary

3. **Rollback Execution (30-60 minutes)**
   - Restore from pre-migration backup
   - Verify data integrity
   - Notify users

4. **Post-Rollback (60+ minutes)**
   - Analyze what went wrong
   - Plan corrective actions
   - Schedule retry

---

## Support & Resources

### Documentation
- PostgreSQL Migration Guide: `POSTGRESQL_MIGRATION_COMPLETE.md`
- Supabase to PostgreSQL Plan: `SUPABASE_TO_POSTGRESQL_MIGRATION_PLAN.md`
- Core Auth Schema: `CORE_AUTH_SCHEMA_DOCUMENTATION.md`

### External Resources
- PostgreSQL Documentation: https://www.postgresql.org/docs/
- pg Library: https://node-postgres.com/
- JWT Documentation: https://jwt.io/
- Bcrypt Documentation: https://github.com/kelektiv/node.bcrypt.js

### Team Communication
- [ ] Notify development team
- [ ] Notify operations team
- [ ] Notify QA team
- [ ] Notify stakeholders
- [ ] Schedule kickoff meeting
- [ ] Schedule daily standups

---

## Timeline Estimate

- **Phase 1 (Preparation):** 1 day ✅ COMPLETE
- **Phase 2 (Code Migration):** 5-7 days
- **Phase 3 (Database Setup):** 1 day
- **Phase 4 (Dependencies):** 1 day
- **Phase 5 (Testing):** 3-5 days
- **Phase 6 (Deployment):** 1-2 days
- **Phase 7 (Cleanup):** 1 day
- **Phase 8 (Optimization):** 2-3 days

**Total Estimated Time:** 15-21 days

---

## Sign-Off

- [ ] Project Manager Approval
- [ ] Technical Lead Approval
- [ ] QA Lead Approval
- [ ] Operations Lead Approval
- [ ] Security Lead Approval

---

**Document Version:** 1.0  
**Last Updated:** 2025-01-15  
**Status:** Phase 1 Complete - Ready for Phase 2
