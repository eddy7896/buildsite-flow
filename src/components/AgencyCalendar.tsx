import React, { useState, useEffect } from 'react';
import { Calendar, Clock, Users, Gift, MapPin } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { db } from '@/lib/database';
import { format, isSameDay, startOfMonth, endOfMonth } from 'date-fns';
import { CalendarEventDialog } from './CalendarEventDialog';
import { cn } from '@/lib/utils';

interface CalendarEvent {
  id: string;
  title: string;
  date: Date;
  type: 'event' | 'holiday' | 'leave' | 'birthday';
  description?: string;
  color?: string;
  employee_name?: string;
}

interface AgencyCalendarProps {
  compact?: boolean;
}

export function AgencyCalendar({ compact = false }: AgencyCalendarProps) {
  const { userRole } = useAuth();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [showEventDialog, setShowEventDialog] = useState(false);

  const canManageEvents = userRole === 'admin' || userRole === 'hr' || userRole === 'super_admin';

  useEffect(() => {
    fetchCalendarData();
  }, [selectedDate]);

  const fetchCalendarData = async () => {
    try {
      setLoading(true);
      const startDate = startOfMonth(selectedDate);
      const endDate = endOfMonth(selectedDate);

      const allEvents: CalendarEvent[] = [];

      // Fetch company events
      const { data: companyEvents } = await db
        .from('company_events')
        .select('*')
        .gte('start_date', startDate.toISOString())
        .lte('start_date', endDate.toISOString())
        .order('start_date');

      if (companyEvents) {
        allEvents.push(...companyEvents.map(event => ({
          id: event.id,
          title: event.title,
          date: new Date(event.start_date),
          type: 'event' as const,
          description: event.description,
          color: event.color
        })));
      }

      // Fetch holidays
      const { data: holidays } = await db
        .from('holidays')
        .select('*')
        .gte('date', format(startDate, 'yyyy-MM-dd'))
        .lte('date', format(endDate, 'yyyy-MM-dd'))
        .order('date');

      if (holidays) {
        allEvents.push(...holidays.map(holiday => {
          // Map database fields to expected format
          const holidayType = holiday.is_national_holiday ? 'public' : holiday.is_company_holiday ? 'company' : 'optional';
          return {
            id: holiday.id,
            title: holiday.name,
            date: new Date(holiday.date),
            type: 'holiday' as const,
            description: holiday.description,
            color: holidayType === 'public' ? '#ef4444' : holidayType === 'company' ? '#3b82f6' : '#22c55e'
          };
        }));
      }

      // Fetch approved leave requests
      const { data: leaveRequests } = await db
        .from('leave_requests')
        .select('*')
        .eq('status', 'approved')
        .gte('start_date', format(startDate, 'yyyy-MM-dd'))
        .lte('end_date', format(endDate, 'yyyy-MM-dd'))
        .order('start_date');

      // Fetch employee details and profiles for leave requests
      let employeeProfileMap = new Map<string, string>();
      if (leaveRequests && leaveRequests.length > 0) {
        const employeeIds = leaveRequests.map(lr => lr.employee_id).filter(Boolean);
        if (employeeIds.length > 0) {
          // Try to find employee_details by id (UUID) first
          const { data: employeeDetails } = await db
            .from('employee_details')
            .select('id, user_id')
            .in('id', employeeIds);
          
          if (employeeDetails) {
            const userIds = employeeDetails.map(ed => ed.user_id).filter(Boolean);
            if (userIds.length > 0) {
              const { data: profiles } = await db
                .from('profiles')
                .select('user_id, full_name')
                .in('user_id', userIds);
              
              if (profiles) {
                const userToProfileMap = new Map(profiles.map(p => [p.user_id, p.full_name]));
                employeeDetails.forEach(ed => {
                  const fullName = userToProfileMap.get(ed.user_id);
                  if (fullName) {
                    employeeProfileMap.set(ed.id, fullName);
                  }
                });
              }
            }
          }
        }
      }

      if (leaveRequests) {
        leaveRequests.forEach(leave => {
          const startDate = new Date(leave.start_date);
          const endDate = new Date(leave.end_date);
          const currentDate = new Date(startDate);
          const employeeName = employeeProfileMap.get(leave.employee_id) || 'Employee';

          while (currentDate <= endDate) {
            allEvents.push({
              id: `${leave.id}-${currentDate.toISOString()}`,
              title: `${employeeName} - Leave`,
              date: new Date(currentDate),
              type: 'leave' as const,
              description: leave.reason,
              color: '#f59e0b',
              employee_name: employeeName
            });
            currentDate.setDate(currentDate.getDate() + 1);
          }
        });
      }

      // Fetch birthdays
      const { data: employees } = await db
        .from('employee_details')
        .select('*')
        .not('date_of_birth', 'is', null);

      // Fetch profiles for employees
      let employeeNameMap = new Map<string, string>();
      if (employees && employees.length > 0) {
        const userIds = employees.map(emp => emp.user_id).filter(Boolean);
        if (userIds.length > 0) {
          const { data: profiles } = await db
            .from('profiles')
            .select('user_id, full_name')
            .in('user_id', userIds);
          
          if (profiles) {
            profiles.forEach(profile => {
              employeeNameMap.set(profile.user_id, profile.full_name);
            });
          }
        }
      }

      if (employees) {
        employees.forEach(employee => {
          if (employee.date_of_birth) {
            const birthday = new Date(employee.date_of_birth);
            const currentYear = selectedDate.getFullYear();
            const birthdayThisYear = new Date(currentYear, birthday.getMonth(), birthday.getDate());
            const employeeName = employeeNameMap.get(employee.user_id) || 'Employee';

            if (birthdayThisYear >= startDate && birthdayThisYear <= endDate) {
              allEvents.push({
                id: `birthday-${employee.id}`,
                title: `🎂 ${employeeName}'s Birthday`,
                date: birthdayThisYear,
                type: 'birthday' as const,
                color: '#8b5cf6',
                employee_name: employeeName
              });
            }
          }
        });
      }

      setEvents(allEvents);
    } catch (error) {
      console.error('Error fetching calendar data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getEventsForDate = (date: Date) => {
    return events.filter(event => isSameDay(event.date, date));
  };

  const selectedDateEvents = getEventsForDate(selectedDate);

  const getEventIcon = (type: CalendarEvent['type']) => {
    switch (type) {
      case 'event':
        return <Calendar className="h-3 w-3" />;
      case 'holiday':
        return <MapPin className="h-3 w-3" />;
      case 'leave':
        return <Users className="h-3 w-3" />;
      case 'birthday':
        return <Gift className="h-3 w-3" />;
      default:
        return <Clock className="h-3 w-3" />;
    }
  };

  const getEventTypeLabel = (type: CalendarEvent['type']) => {
    switch (type) {
      case 'event':
        return 'Event';
      case 'holiday':
        return 'Holiday';
      case 'leave':
        return 'Leave';
      case 'birthday':
        return 'Birthday';
      default:
        return 'Event';
    }
  };

  if (compact) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Calendar</CardTitle>
          <Calendar className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {selectedDateEvents.slice(0, 3).map((event) => (
              <div key={event.id} className="flex items-center space-x-2">
                {getEventIcon(event.type)}
                <span className="text-sm truncate" style={{ color: event.color }}>
                  {event.title}
                </span>
              </div>
            ))}
            {selectedDateEvents.length > 3 && (
              <p className="text-xs text-muted-foreground">
                +{selectedDateEvents.length - 3} more events
              </p>
            )}
            {selectedDateEvents.length === 0 && (
              <p className="text-sm text-muted-foreground">No events today</p>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Agency Calendar</CardTitle>
          {canManageEvents && (
            <Button onClick={() => setShowEventDialog(true)} size="sm">
              Add Event
            </Button>
          )}
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <CalendarComponent
                mode="single"
                selected={selectedDate}
                onSelect={(date) => date && setSelectedDate(date)}
                className="rounded-md border"
                modifiers={{
                  hasEvents: (date) => getEventsForDate(date).length > 0
                }}
                modifiersClassNames={{
                  hasEvents: 'bg-primary/10 font-bold'
                }}
              />
            </div>
            
            <div className="space-y-4">
              <div>
                <h3 className="font-medium mb-2">
                  {format(selectedDate, 'EEEE, MMMM d, yyyy')}
                </h3>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {selectedDateEvents.map((event) => (
                    <div
                      key={event.id}
                      className={cn(
                        "p-3 rounded-lg border border-border",
                        "hover:bg-accent/50 transition-colors"
                      )}
                    >
                      <div className="flex items-start space-x-2">
                        <div className="flex-shrink-0 mt-1">
                          {getEventIcon(event.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2">
                            <h4 className="text-sm font-medium truncate">
                              {event.title}
                            </h4>
                            <Badge variant="outline" className="text-xs">
                              {getEventTypeLabel(event.type)}
                            </Badge>
                          </div>
                          {event.description && (
                            <p className="text-xs text-muted-foreground mt-1">
                              {event.description}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                  {selectedDateEvents.length === 0 && (
                    <div className="text-center py-4">
                      <Calendar className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">
                        No events on this date
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {showEventDialog && (
        <CalendarEventDialog
          open={showEventDialog}
          onOpenChange={setShowEventDialog}
          onEventCreated={fetchCalendarData}
        />
      )}
    </div>
  );
}