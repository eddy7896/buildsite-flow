/**
 * Suspense Route Wrapper Component
 * Provides loading fallback for lazy-loaded routes
 */

import React from "react";

const LoadingFallback = () => (
  <div className="flex items-center justify-center p-8">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
  </div>
);

export const SuspenseRoute = ({ children }: { children: React.ReactNode }) => (
  <React.Suspense fallback={<LoadingFallback />}>
    {children}
  </React.Suspense>
);

