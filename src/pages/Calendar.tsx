import React from 'react';
import { AgencyCalendar } from '@/components/AgencyCalendar';

export default function Calendar() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Calendar</h1>
          <p className="text-muted-foreground">
            View company events, holidays, team leave, and birthdays
          </p>
        </div>
      </div>
      
      <AgencyCalendar />
    </div>
  );
}