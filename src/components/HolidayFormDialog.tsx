import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { Checkbox } from '@/components/ui/checkbox';

interface HolidayFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onHolidayCreated: () => void;
}

export function HolidayFormDialog({ open, onOpenChange, onHolidayCreated }: HolidayFormDialogProps) {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    date: undefined as Date | undefined,
    is_national_holiday: false,
    is_company_holiday: true
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.date) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('holidays')
        .insert({
          name: formData.name,
          description: formData.description,
          date: formData.date.toISOString().split('T')[0],
          is_national_holiday: formData.is_national_holiday,
          is_company_holiday: formData.is_company_holiday,
          agency_id: profile?.agency_id
        });

      if (error) throw error;

      toast({
        title: "Holiday Created",
        description: `${formData.name} has been added to the calendar.`
      });

      // Reset form
      setFormData({
        name: '',
        description: '',
        date: undefined,
        is_national_holiday: false,
        is_company_holiday: true
      });

      onHolidayCreated();
      onOpenChange(false);
    } catch (error) {
      console.error('Error creating holiday:', error);
      toast({
        title: "Error",
        description: "Failed to create holiday. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add Holiday</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Holiday Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., New Year's Day"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Optional description for the holiday"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label>Date *</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !formData.date && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {formData.date ? format(formData.date, "PPP") : "Pick a date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={formData.date}
                  onSelect={(date) => setFormData({ ...formData, date })}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-3">
            <Label>Holiday Type</Label>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="company"
                checked={formData.is_company_holiday}
                onCheckedChange={(checked) => setFormData({ 
                  ...formData, 
                  is_company_holiday: checked as boolean,
                  is_national_holiday: checked ? false : formData.is_national_holiday
                })}
              />
              <Label htmlFor="company" className="text-sm">
                Company Holiday
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="national"
                checked={formData.is_national_holiday}
                onCheckedChange={(checked) => setFormData({ 
                  ...formData, 
                  is_national_holiday: checked as boolean,
                  is_company_holiday: checked ? false : formData.is_company_holiday
                })}
              />
              <Label htmlFor="national" className="text-sm">
                National Holiday
              </Label>
            </div>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Holiday
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}