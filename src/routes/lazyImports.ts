/**
 * Lazy-loaded page component imports
 * Organized by feature/module for better maintainability
 */

import React from "react";

// Public/Unauthenticated Pages
export const Landing = React.lazy(() => import("../pages/Landing"));
export const Pricing = React.lazy(() => import("../pages/Pricing"));
export const Auth = React.lazy(() => import("../pages/Auth"));
export const SignupSuccess = React.lazy(() => import("../pages/SignupSuccess"));
export const ForgotPassword = React.lazy(() => import("../pages/ForgotPassword"));
export const NotFound = React.lazy(() => import("../pages/NotFound"));
export const OnboardingWizard = React.lazy(() => import("../components/onboarding/OnboardingWizard"));
export const SuperAdminSetup = React.lazy(() => import("../pages/SuperAdminSetup"));

// Static Pages
export const ContactPage = React.lazy(() => import("../pages/StaticPages").then(m => ({ default: m.ContactPage })));
export const AboutPage = React.lazy(() => import("../pages/StaticPages").then(m => ({ default: m.AboutPage })));
export const BlogPage = React.lazy(() => import("../pages/StaticPages").then(m => ({ default: m.BlogPage })));
export const CareersPage = React.lazy(() => import("../pages/StaticPages").then(m => ({ default: m.CareersPage })));
export const HelpCenterPage = React.lazy(() => import("../pages/StaticPages").then(m => ({ default: m.HelpCenterPage })));
export const DocsPage = React.lazy(() => import("../pages/StaticPages").then(m => ({ default: m.DocsPage })));
export const APIReferencePage = React.lazy(() => import("../pages/StaticPages").then(m => ({ default: m.APIReferencePage })));
export const PrivacyPolicyPage = React.lazy(() => import("../pages/StaticPages").then(m => ({ default: m.PrivacyPolicyPage })));
export const TermsPage = React.lazy(() => import("../pages/StaticPages").then(m => ({ default: m.TermsPage })));
export const CookiePolicyPage = React.lazy(() => import("../pages/StaticPages").then(m => ({ default: m.CookiePolicyPage })));
export const GDPRPage = React.lazy(() => import("../pages/StaticPages").then(m => ({ default: m.GDPRPage })));
export const ChangelogPage = React.lazy(() => import("../pages/StaticPages").then(m => ({ default: m.ChangelogPage })));
export const RoadmapPage = React.lazy(() => import("../pages/StaticPages").then(m => ({ default: m.RoadmapPage })));
export const IntegrationsPublicPage = React.lazy(() => import("../pages/StaticPages").then(m => ({ default: m.IntegrationsPage })));
export const TemplatesPage = React.lazy(() => import("../pages/StaticPages").then(m => ({ default: m.TemplatesPage })));
export const CommunityPage = React.lazy(() => import("../pages/StaticPages").then(m => ({ default: m.CommunityPage })));
export const PressPage = React.lazy(() => import("../pages/StaticPages").then(m => ({ default: m.PressPage })));

// Dashboard & Core
export const Index = React.lazy(() => import("../pages/Index"));
export const AgencyDashboard = React.lazy(() => import("../pages/AgencyDashboard"));
export const AgencyAdminDashboard = React.lazy(() => import("../pages/AgencyAdminDashboard"));
export const AgencySetup = React.lazy(() => import("../pages/AgencySetup"));
export const AgencySetupProgress = React.lazy(() => import("../pages/AgencySetupProgress"));
export const SuperAdminDashboard = React.lazy(() => import("../pages/super-admin/SuperAdminDashboard"));
export const AgencyManagement = React.lazy(() => import("../pages/super-admin/AgencyManagement"));
export const AgencyDataViewer = React.lazy(() => import("../pages/super-admin/AgencyDataViewer"));
export const SystemSettings = React.lazy(() => import("../pages/super-admin/SystemSettings"));
export const PlanManagement = React.lazy(() => import("../pages/super-admin/PlanManagement"));
export const PageCatalogManagement = React.lazy(() => import("../pages/super-admin/PageCatalogManagement"));
export const SuperAdminAnalytics = React.lazy(() => import("../pages/super-admin/Analytics"));
export const SuperAdminLayout = React.lazy(() => import("../components/super-admin/SuperAdminLayout").then(m => ({ default: m.SuperAdminLayout })));
export const SystemDashboard = React.lazy(() => import("../pages/SystemDashboard"));
export const SystemHealth = React.lazy(() => import("../pages/SystemHealth"));

// Employee Management
export const EmployeeManagement = React.lazy(() => import("../pages/EmployeeManagement"));
export const MyTeam = React.lazy(() => import("../pages/MyTeam"));
export const CreateEmployee = React.lazy(() => import("../pages/CreateEmployee"));
export const AssignUserRoles = React.lazy(() => import("../pages/AssignUserRoles"));
export const EmployeeProjects = React.lazy(() => import("../pages/EmployeeProjects"));
export const EmployeePerformance = React.lazy(() => import("../pages/EmployeePerformance"));
export const MyProfile = React.lazy(() => import("../pages/MyProfile"));
export const MyAttendance = React.lazy(() => import("../pages/MyAttendance"));
export const MyLeave = React.lazy(() => import("../pages/MyLeave"));

// Project Management
export const Projects = React.lazy(() => import("../pages/Projects"));
export const ProjectManagement = React.lazy(() => import("../pages/ProjectManagement"));
export const ProjectDetails = React.lazy(() => import("../pages/ProjectDetails"));
export const TaskDetails = React.lazy(() => import("../pages/TaskDetails"));

// Settings
export const Settings = React.lazy(() => import("../pages/Settings"));

// HR & Attendance
export const Attendance = React.lazy(() => import("../pages/Attendance"));
export const LeaveRequests = React.lazy(() => import("../pages/LeaveRequests"));
export const HolidayManagement = React.lazy(() => import('../pages/HolidayManagement'));

// Financial Management
export const Payroll = React.lazy(() => import("../pages/Payroll"));
export const Invoices = React.lazy(() => import("../pages/Invoices"));
export const Payments = React.lazy(() => import("../pages/Payments"));
export const Receipts = React.lazy(() => import("../pages/Receipts"));
export const Ledger = React.lazy(() => import("../pages/Ledger"));
export const CreateJournalEntry = React.lazy(() => import("../pages/CreateJournalEntry"));
export const FinancialManagement = React.lazy(() => import("../pages/FinancialManagement"));
export const GstCompliance = React.lazy(() => import("../pages/GstCompliance"));
export const Reimbursements = React.lazy(() => import("../pages/Reimbursements").then(m => ({ default: m.Reimbursements })));

// Clients & CRM
export const Clients = React.lazy(() => import("../pages/Clients"));
export const CreateClient = React.lazy(() => import("../pages/CreateClient"));
export const CRM = React.lazy(() => import("../pages/CRM"));
export const LeadDetail = React.lazy(() => import("../pages/LeadDetail"));
export const ActivityDetail = React.lazy(() => import("../pages/ActivityDetail"));

// Reports & Analytics
export const Reports = React.lazy(() => import("../pages/Reports"));
export const Analytics = React.lazy(() => import("../pages/Analytics"));
export const CentralizedReports = React.lazy(() => import("../pages/CentralizedReports"));
export const ReportingDashboard = React.lazy(() => import("../pages/ReportingDashboard"));
export const CustomReports = React.lazy(() => import("../pages/CustomReports"));
export const ScheduledReports = React.lazy(() => import("../pages/ScheduledReports"));
export const ReportExports = React.lazy(() => import("../pages/ReportExports"));
export const AnalyticsDashboard = React.lazy(() => import("../pages/AnalyticsDashboard"));

// Inventory
export const InventoryManagement = React.lazy(() => import("../pages/InventoryManagement"));
export const InventoryProducts = React.lazy(() => import("../pages/InventoryProducts"));
export const InventoryBOM = React.lazy(() => import("../pages/InventoryBOM"));
export const InventorySerialBatch = React.lazy(() => import("../pages/InventorySerialBatch"));
export const InventoryReports = React.lazy(() => import("../pages/InventoryReports"));
export const InventorySettings = React.lazy(() => import("../pages/InventorySettings"));
export const InventoryWarehouses = React.lazy(() => import("../pages/InventoryWarehouses"));
export const InventoryStockLevels = React.lazy(() => import("../pages/InventoryStockLevels"));
export const InventoryTransfers = React.lazy(() => import("../pages/InventoryTransfers"));
export const InventoryAdjustments = React.lazy(() => import("../pages/InventoryAdjustments"));

// Procurement
export const ProcurementManagement = React.lazy(() => import("../pages/ProcurementManagement"));
export const ProcurementVendors = React.lazy(() => import("../pages/ProcurementVendors"));
export const ProcurementPurchaseOrders = React.lazy(() => import("../pages/ProcurementPurchaseOrders"));
export const ProcurementRequisitions = React.lazy(() => import("../pages/ProcurementRequisitions"));
export const ProcurementGoodsReceipts = React.lazy(() => import("../pages/ProcurementGoodsReceipts"));
export const ProcurementRFQ = React.lazy(() => import("../pages/ProcurementRFQ"));
export const ProcurementVendorContracts = React.lazy(() => import("../pages/ProcurementVendorContracts"));
export const ProcurementVendorPerformance = React.lazy(() => import("../pages/ProcurementVendorPerformance"));
export const ProcurementReports = React.lazy(() => import("../pages/ProcurementReports"));
export const ProcurementSettings = React.lazy(() => import("../pages/ProcurementSettings"));

// Assets
export const Assets = React.lazy(() => import("../pages/Assets"));
export const AssetCategories = React.lazy(() => import("../pages/AssetCategories"));
export const AssetLocations = React.lazy(() => import("../pages/AssetLocations"));
export const AssetMaintenance = React.lazy(() => import("../pages/AssetMaintenance"));
export const AssetDepreciation = React.lazy(() => import("../pages/AssetDepreciation"));
export const AssetDisposals = React.lazy(() => import("../pages/AssetDisposals"));
export const AssetReports = React.lazy(() => import("../pages/AssetReports"));
export const AssetSettings = React.lazy(() => import("../pages/AssetSettings"));

// Workflows
export const Workflows = React.lazy(() => import("../pages/Workflows"));
export const WorkflowInstances = React.lazy(() => import("../pages/WorkflowInstances"));
export const WorkflowBuilder = React.lazy(() => import("../pages/WorkflowBuilder"));
export const WorkflowApprovals = React.lazy(() => import("../pages/WorkflowApprovals"));
export const WorkflowAutomation = React.lazy(() => import("../pages/WorkflowAutomation"));
export const WorkflowSettings = React.lazy(() => import("../pages/WorkflowSettings"));

// Integrations
export const Integrations = React.lazy(() => import("../pages/Integrations"));
export const IntegrationSettings = React.lazy(() => import("../pages/IntegrationSettings"));

// Quotations & Job Costing
export const Quotations = React.lazy(() => import("../pages/Quotations"));
export const QuotationForm = React.lazy(() => import("../pages/QuotationForm"));
export const JobCosting = React.lazy(() => import("../pages/JobCosting"));

// Other Features
export const DepartmentManagement = React.lazy(() => import("../pages/DepartmentManagement"));
export const AIFeatures = React.lazy(() => import("../pages/AIFeatures"));
export const Calendar = React.lazy(() => import("../pages/Calendar"));
export const Notifications = React.lazy(() => import("../pages/Notifications"));
export const PageRequestCenter = React.lazy(() => import("../pages/PageRequestCenter"));
export const EmailTesting = React.lazy(() => import("../pages/EmailTesting"));
export const ViewAsUser = React.lazy(() => import('./../pages/ViewAsUser'));

// Component Modules
export const RoleChangeRequests = React.lazy(() => import('../components/RoleChangeRequests').then(m => ({ default: m.RoleChangeRequests })));
export const AdvancedPermissions = React.lazy(() => import('../components/AdvancedPermissions'));
export const AdvancedDashboard = React.lazy(() => import('../components/analytics/AdvancedDashboard').then(m => ({ default: m.AdvancedDashboard })));
export const DocumentManager = React.lazy(() => import('../components/documents/DocumentManager').then(m => ({ default: m.DocumentManager })));
export const MessageCenter = React.lazy(() => import('../components/communication/MessageCenter').then(m => ({ default: m.MessageCenter })));

