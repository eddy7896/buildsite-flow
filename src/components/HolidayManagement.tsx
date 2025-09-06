import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CalendarDays, Plus, Search, Filter, Calendar as CalendarIcon, Trash2, Edit2 } from 'lucide-react';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { HolidayFormDialog } from './HolidayFormDialog';
import { DeleteConfirmDialog } from './DeleteConfirmDialog';

interface Holiday {
  id: string;
  name: string;
  description: string | null;
  date: string;
  holiday_type: string;
  is_recurring: boolean;
  color: string;
  created_at: string;
}

export function HolidayManagement() {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [yearFilter, setYearFilter] = useState(new Date().getFullYear().toString());
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [holidayToDelete, setHolidayToDelete] = useState<Holiday | null>(null);

  const fetchHolidays = async () => {
    try {
      const { data, error } = await supabase
        .from('holidays')
        .select('*')
        .eq('agency_id', profile?.agency_id)
        .order('date', { ascending: true });

      if (error) throw error;
      setHolidays(data || []);
    } catch (error) {
      console.error('Error fetching holidays:', error);
      toast({
        title: "Error",
        description: "Failed to load holidays",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (profile?.agency_id) {
      fetchHolidays();
    }
  }, [profile?.agency_id]);

  const filteredHolidays = holidays.filter(holiday => {
    const matchesSearch = holiday.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         holiday.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === 'all' || holiday.holiday_type === typeFilter;
    const matchesYear = yearFilter === 'all' || new Date(holiday.date).getFullYear().toString() === yearFilter;
    
    return matchesSearch && matchesType && matchesYear;
  });

  const handleDeleteHoliday = async () => {
    if (!holidayToDelete) return;

    try {
      const { error } = await supabase
        .from('holidays')
        .delete()
        .eq('id', holidayToDelete.id);

      if (error) throw error;

      toast({
        title: "Holiday Deleted",
        description: `${holidayToDelete.name} has been removed.`
      });

      setHolidays(holidays.filter(h => h.id !== holidayToDelete.id));
    } catch (error) {
      console.error('Error deleting holiday:', error);
      toast({
        title: "Error",
        description: "Failed to delete holiday",
        variant: "destructive"
      });
    } finally {
      setDeleteDialogOpen(false);
      setHolidayToDelete(null);
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'national': return 'National';
      case 'company': return 'Company';
      case 'religious': return 'Religious';
      case 'optional': return 'Optional';
      default: return type;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'national': return 'bg-red-100 text-red-800';
      case 'company': return 'bg-blue-100 text-blue-800';
      case 'religious': return 'bg-purple-100 text-purple-800';
      case 'optional': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Holiday Management</h2>
          <p className="text-muted-foreground">
            Manage company holidays and observances
          </p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Holiday
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search holidays..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="national">National</SelectItem>
                <SelectItem value="company">Company</SelectItem>
                <SelectItem value="religious">Religious</SelectItem>
                <SelectItem value="optional">Optional</SelectItem>
              </SelectContent>
            </Select>

            <Select value={yearFilter} onValueChange={setYearFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by year" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Years</SelectItem>
                {years.map(year => (
                  <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="flex items-center text-sm text-muted-foreground">
              <CalendarDays className="mr-2 h-4 w-4" />
              {filteredHolidays.length} holidays
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Holidays List */}
      {filteredHolidays.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center">
            <CalendarIcon className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No holidays found</h3>
            <p className="text-muted-foreground mb-4">
              {searchTerm || typeFilter !== 'all' || yearFilter !== 'all' 
                ? 'Try adjusting your filters to see more holidays.'
                : 'Start by adding your first holiday.'}
            </p>
            {(!searchTerm && typeFilter === 'all' && yearFilter === 'all') && (
              <Button onClick={() => setShowCreateDialog(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Add Holiday
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredHolidays.map((holiday) => (
            <Card key={holiday.id}>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4">
                    <div 
                      className="w-4 h-4 rounded-full mt-1"
                      style={{ backgroundColor: holiday.color }}
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold text-lg">{holiday.name}</h3>
                        <Badge className={getTypeColor(holiday.holiday_type)}>
                          {getTypeLabel(holiday.holiday_type)}
                        </Badge>
                        {holiday.is_recurring && (
                          <Badge variant="outline">Recurring</Badge>
                        )}
                      </div>
                      
                      <p className="text-sm text-muted-foreground mb-2">
                        {format(new Date(holiday.date), 'EEEE, MMMM d, yyyy')}
                      </p>
                      
                      {holiday.description && (
                        <p className="text-sm">{holiday.description}</p>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex space-x-2">
                    <Button variant="outline" size="sm" disabled>
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => {
                        setHolidayToDelete(holiday);
                        setDeleteDialogOpen(true);
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <HolidayFormDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onHolidayCreated={fetchHolidays}
      />

      <DeleteConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleDeleteHoliday}
        title="Delete Holiday"
        description={`Are you sure you want to delete "${holidayToDelete?.name}"? This action cannot be undone.`}
      />
    </div>
  );
}