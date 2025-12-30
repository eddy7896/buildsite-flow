/**
 * Main Routes Configuration
 * Combines all route groups into a single Routes component
 */

import { Routes, Route } from "react-router-dom";
import { SuspenseRoute } from "./SuspenseRoute";
import * as Pages from "./lazyImports";
import {
  PublicRoutes,
  StaticPageRoutes,
  DashboardRoutes,
  EmployeeRoutes,
  ProjectRoutes,
  HRRoutes,
  FinancialRoutes,
  ClientRoutes,
  ReportRoutes,
  InventoryRoutes,
  ProcurementRoutes,
  AssetRoutes,
  WorkflowRoutes,
  IntegrationRoutes,
  QuotationRoutes,
  OtherFeatureRoutes,
} from "./routeGroups";

export const AppRoutes = () => (
  <Routes>
    {PublicRoutes()}
    {StaticPageRoutes()}
    {DashboardRoutes()}
    {EmployeeRoutes()}
    {ProjectRoutes()}
    {HRRoutes()}
    {FinancialRoutes()}
    {ClientRoutes()}
    {ReportRoutes()}
    {InventoryRoutes()}
    {ProcurementRoutes()}
    {AssetRoutes()}
    {WorkflowRoutes()}
    {IntegrationRoutes()}
    {QuotationRoutes()}
    {OtherFeatureRoutes()}
    <Route path="*" element={<SuspenseRoute><Pages.NotFound /></SuspenseRoute>} />
  </Routes>
);

