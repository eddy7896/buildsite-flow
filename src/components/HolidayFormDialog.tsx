import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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

const holidayTypes = [
  { value: 'national', label: 'National Holiday' },
  { value: 'company', label: 'Company Holiday' },
  { value: 'religious', label: 'Religious Holiday' },
  { value: 'optional', label: 'Optional Holiday' }
];

const holidayColors = [
  { value: '#ef4444', label: 'Red' },
  { value: '#3b82f6', label: 'Blue' },
  { value: '#22c55e', label: 'Green' },
  { value: '#f59e0b', label: 'Orange' },
  { value: '#8b5cf6', label: 'Purple' },
  { value: '#ec4899', label: 'Pink' }
];

export function HolidayFormDialog({ open, onOpenChange, onHolidayCreated }: HolidayFormDialogProps) {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    holiday_type: '',
    date: undefined as Date | undefined,
    is_recurring: false,
    color: '#3b82f6'
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.date || !formData.holiday_type) {
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
          holiday_type: formData.holiday_type,
          is_recurring: formData.is_recurring,
          color: formData.color,
          agency_id: profile?.agency_id,
          created_by: profile?.user_id
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
        holiday_type: '',
        date: undefined,
        is_recurring: false,
        color: '#3b82f6'
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

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Holiday Type *</Label>
              <Select 
                value={formData.holiday_type} 
                onValueChange={(value) => setFormData({ ...formData, holiday_type: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {holidayTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
          </div>

          <div className="space-y-2">
            <Label>Color</Label>
            <div className="flex gap-2">
              {holidayColors.map((color) => (
                <button
                  key={color.value}
                  type="button"
                  className={cn(
                    "w-8 h-8 rounded-full border-2 transition-all",
                    formData.color === color.value ? "border-primary scale-110" : "border-muted hover:scale-105"
                  )}
                  style={{ backgroundColor: color.value }}
                  onClick={() => setFormData({ ...formData, color: color.value })}
                  title={color.label}
                />
              ))}
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="recurring"
              checked={formData.is_recurring}
              onCheckedChange={(checked) => setFormData({ ...formData, is_recurring: checked as boolean })}
            />
            <Label htmlFor="recurring" className="text-sm">
              Recurring annually
            </Label>
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