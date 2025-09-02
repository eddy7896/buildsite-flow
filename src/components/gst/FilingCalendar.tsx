import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, CalendarIcon, Clock, AlertTriangle, CheckCircle, FileText } from 'lucide-react';
import { format, addDays, isSameDay, parseISO, isPast, isToday } from 'date-fns';

interface FilingEvent {
  id: string;
  return_type: string;
  due_date: string;
  filing_period: string;
  status: 'pending' | 'filed' | 'late' | 'upcoming';
  penalty_amount?: number;
}

interface FilingCalendarProps {
  filings: FilingEvent[];
  onFileReturn: (filing: FilingEvent) => void;
  onViewDetails: (filing: FilingEvent) => void;
}

export const FilingCalendar: React.FC<FilingCalendarProps> = ({
  filings,
  onFileReturn,
  onViewDetails
}) => {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [upcomingDeadlines, setUpcomingDeadlines] = useState<FilingEvent[]>([]);

  useEffect(() => {
    // Get upcoming deadlines in next 30 days
    const upcoming = filings.filter(filing => {
      const dueDate = parseISO(filing.due_date);
      const thirtyDaysFromNow = addDays(new Date(), 30);
      return dueDate <= thirtyDaysFromNow && dueDate >= new Date() && filing.status === 'pending';
    }).sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime());
    
    setUpcomingDeadlines(upcoming);
  }, [filings]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'filed': return 'bg-success text-success-foreground';
      case 'pending': return 'bg-warning text-warning-foreground';
      case 'late': return 'bg-destructive text-destructive-foreground';
      case 'upcoming': return 'bg-primary text-primary-foreground';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'filed': return <CheckCircle className="h-4 w-4" />;
      case 'pending': return <Clock className="h-4 w-4" />;
      case 'late': return <AlertTriangle className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  const getDaysUntilDue = (dueDate: string) => {
    const due = parseISO(dueDate);
    const today = new Date();
    const diffTime = due.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getPriorityLevel = (daysUntil: number) => {
    if (daysUntil < 0) return 'overdue';
    if (daysUntil <= 3) return 'urgent';
    if (daysUntil <= 7) return 'high';
    if (daysUntil <= 15) return 'medium';
    return 'low';
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Upcoming Deadlines */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5" />
            Upcoming Deadlines
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {upcomingDeadlines.length === 0 ? (
            <div className="text-center text-muted-foreground py-4">
              <CheckCircle className="h-8 w-8 mx-auto mb-2 text-success" />
              <p>All returns up to date!</p>
            </div>
          ) : (
            upcomingDeadlines.map((filing) => {
              const daysUntil = getDaysUntilDue(filing.due_date);
              const priority = getPriorityLevel(daysUntil);
              
              return (
                <div key={filing.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(filing.status)}
                    <div>
                      <div className="font-medium">{filing.return_type}</div>
                      <div className="text-sm text-muted-foreground">
                        Period: {format(parseISO(filing.filing_period), 'MMM yyyy')}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Due: {format(parseISO(filing.due_date), 'dd MMM yyyy')}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge 
                      variant={priority === 'urgent' || priority === 'overdue' ? 'destructive' : 'secondary'}
                    >
                      {daysUntil < 0 ? `${Math.abs(daysUntil)} days overdue` : 
                       daysUntil === 0 ? 'Due today' : 
                       `${daysUntil} days left`}
                    </Badge>
                    <Button 
                      size="sm" 
                      onClick={() => onFileReturn(filing)}
                      variant={priority === 'urgent' || priority === 'overdue' ? 'destructive' : 'default'}
                    >
                      File Now
                    </Button>
                  </div>
                </div>
              );
            })
          )}
        </CardContent>
      </Card>

      {/* Filing Status Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Filing Status Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-4 bg-success/10 rounded-lg border border-success/20">
              <div className="text-2xl font-bold text-success">
                {filings.filter(f => f.status === 'filed').length}
              </div>
              <div className="text-sm text-muted-foreground">Filed Returns</div>
            </div>
            <div className="text-center p-4 bg-warning/10 rounded-lg border border-warning/20">
              <div className="text-2xl font-bold text-warning">
                {filings.filter(f => f.status === 'pending').length}
              </div>
              <div className="text-sm text-muted-foreground">Pending Returns</div>
            </div>
            <div className="text-center p-4 bg-destructive/10 rounded-lg border border-destructive/20">
              <div className="text-2xl font-bold text-destructive">
                {filings.filter(f => f.status === 'late').length}
              </div>
              <div className="text-sm text-muted-foreground">Late Returns</div>
            </div>
            <div className="text-center p-4 bg-primary/10 rounded-lg border border-primary/20">
              <div className="text-2xl font-bold text-primary">
                {upcomingDeadlines.length}
              </div>
              <div className="text-sm text-muted-foreground">Due Soon</div>
            </div>
          </div>

          {/* Penalty Summary */}
          {filings.some(f => f.penalty_amount && f.penalty_amount > 0) && (
            <div className="mt-4 p-4 bg-destructive/10 rounded-lg border border-destructive/20">
              <div className="flex items-center gap-2 text-destructive">
                <AlertTriangle className="h-4 w-4" />
                <span className="font-medium">Total Penalties:</span>
                <span className="font-bold">
                  ₹{filings.reduce((sum, f) => sum + (f.penalty_amount || 0), 0).toLocaleString()}
                </span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};