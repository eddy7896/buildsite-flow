import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, MapPin, Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { format } from 'date-fns';

interface AttendanceRecord {
  id: string;
  employee_id: string;
  date: string;
  check_in_time: string | null;
  check_out_time: string | null;
  total_hours: number | null;
  location: string | null;
  status: string;
}

interface ClockInOutProps {
  compact?: boolean;
}

const ClockInOut = ({ compact = false }: ClockInOutProps) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [todayAttendance, setTodayAttendance] = useState<AttendanceRecord | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update current time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Fetch today's attendance record
  useEffect(() => {
    if (user) {
      fetchTodayAttendance();
    }
  }, [user]);

  const fetchTodayAttendance = async () => {
    if (!user) return;

    const today = format(new Date(), 'yyyy-MM-dd');
    
    const { data, error } = await supabase
      .from('attendance')
      .select('*')
      .eq('employee_id', user.id)
      .eq('date', today)
      .maybeSingle();

    if (error) {
      console.error('Error fetching attendance:', error);
      return;
    }

    setTodayAttendance(data);
  };

  const getCurrentLocation = async (): Promise<{ lat: number; lng: number; address: string }> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported by this browser.'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          
          try {
            // Simple fallback location format
            const address = `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
            const locationData = { lat: latitude, lng: longitude, address };
            resolve(locationData);
          } catch (error) {
            const fallbackLocation = { 
              lat: latitude, 
              lng: longitude, 
              address: `${latitude.toFixed(6)}, ${longitude.toFixed(6)}` 
            };
            resolve(fallbackLocation);
          }
        },
        (error) => {
          reject(new Error('Unable to retrieve location'));
        },
        {
          enableHighAccuracy: true,
          timeout: 5000,
          maximumAge: 0
        }
      );
    });
  };

  const calculateHours = (checkInTime: string, checkOutTime: string): number => {
    const checkIn = new Date(checkInTime);
    const checkOut = new Date(checkOutTime);
    const diffInMs = checkOut.getTime() - checkIn.getTime();
    return Math.round((diffInMs / (1000 * 60 * 60)) * 100) / 100;
  };

  const handleClockIn = async () => {
    if (!user) return;
    
    setLoading(true);
    
    try {
      const locationData = await getCurrentLocation();
      const now = new Date().toISOString();
      const today = format(new Date(), 'yyyy-MM-dd');

      const attendanceData = {
        employee_id: user.id,
        date: today,
        check_in_time: now,
        location: locationData.address,
        status: 'present'
      };

      const { data, error } = await supabase
        .from('attendance')
        .insert(attendanceData)
        .select()
        .single();

      if (error) throw error;

      setTodayAttendance(data);
      toast({
        title: "Clocked In Successfully",
        description: `Checked in at ${format(new Date(), 'HH:mm:ss')}`
      });
    } catch (error: any) {
      toast({
        title: "Clock In Failed",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClockOut = async () => {
    if (!user || !todayAttendance) return;
    
    setLoading(true);
    
    try {
      const locationData = await getCurrentLocation();
      const now = new Date().toISOString();
      
      const totalHours = todayAttendance.check_in_time 
        ? calculateHours(todayAttendance.check_in_time, now)
        : 0;

      const { data, error } = await supabase
        .from('attendance')
        .update({
          check_out_time: now,
          total_hours: totalHours,
          location: `${todayAttendance.location} | Out: ${locationData.address}`
        })
        .eq('id', todayAttendance.id)
        .select()
        .single();

      if (error) throw error;

      setTodayAttendance(data);
      toast({
        title: "Clocked Out Successfully",
        description: `Total hours worked: ${totalHours.toFixed(2)} hours`
      });
    } catch (error: any) {
      toast({
        title: "Clock Out Failed",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const canClockIn = !todayAttendance || !todayAttendance.check_in_time;
  const canClockOut = todayAttendance && todayAttendance.check_in_time && !todayAttendance.check_out_time;

  if (compact) {
    return (
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between gap-4">
            {/* Current Time */}
            <div className="flex items-center gap-3">
              <Clock className="h-5 w-5 text-primary" />
              <div>
                <div className="font-mono font-bold text-lg">
                  {format(currentTime, 'HH:mm:ss')}
                </div>
                <div className="text-xs text-muted-foreground">
                  {format(currentTime, 'MMM dd, yyyy')}
                </div>
              </div>
            </div>

            {/* Status */}
            <div className="text-center">
              {todayAttendance?.check_in_time && !todayAttendance?.check_out_time && (
                <div className="text-sm">
                  <Badge variant="outline" className="text-green-600 border-green-200">
                    Working since {format(new Date(todayAttendance.check_in_time), 'HH:mm')}
                  </Badge>
                </div>
              )}
              {todayAttendance?.check_out_time && (
                <div className="text-sm">
                  <Badge variant="secondary">
                    Completed ({todayAttendance.total_hours?.toFixed(1)}h)
                  </Badge>
                </div>
              )}
            </div>

            {/* Action Button */}
            <div>
              {canClockIn && (
                <Button 
                  onClick={handleClockIn} 
                  disabled={loading}
                  size="sm"
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    'Clock In'
                  )}
                </Button>
              )}

              {canClockOut && (
                <Button 
                  onClick={handleClockOut} 
                  disabled={loading}
                  variant="destructive"
                  size="sm"
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    'Clock Out'
                  )}
                </Button>
              )}

              {todayAttendance && todayAttendance.check_out_time && (
                <Badge variant="outline" className="text-muted-foreground">
                  Day Complete
                </Badge>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Original full component for dedicated attendance page
  return (
    <Card className="w-full max-w-md mx-auto">
      {/* Keep the original detailed implementation for the attendance page */}
      <CardContent className="p-6 space-y-6">
        <div className="text-center">
          <div className="text-3xl font-mono font-bold">
            {format(currentTime, 'HH:mm:ss')}
          </div>
          <div className="text-sm text-muted-foreground">
            {format(currentTime, 'EEEE, MMMM do, yyyy')}
          </div>
        </div>

        {/* Today's Status */}
        {todayAttendance && (
          <div className="space-y-3">
            <h4 className="font-medium">Today's Activity</h4>
            <div className="space-y-2">
              {todayAttendance.check_in_time && (
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Clock In:</span>
                  <Badge variant="outline">
                    {format(new Date(todayAttendance.check_in_time), 'HH:mm:ss')}
                  </Badge>
                </div>
              )}
              
              {todayAttendance.check_out_time && (
                <>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Clock Out:</span>
                    <Badge variant="outline">
                      {format(new Date(todayAttendance.check_out_time), 'HH:mm:ss')}
                    </Badge>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Total Hours:</span>
                    <Badge variant="secondary">
                      {todayAttendance.total_hours?.toFixed(2) || '0.00'}h
                    </Badge>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-3">
          {canClockIn && (
            <Button 
              onClick={handleClockIn} 
              disabled={loading}
              className="w-full"
              size="lg"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Clocking In...
                </>
              ) : (
                'Clock In'
              )}
            </Button>
          )}

          {canClockOut && (
            <Button 
              onClick={handleClockOut} 
              disabled={loading}
              variant="destructive"
              className="w-full"
              size="lg"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Clocking Out...
                </>
              ) : (
                'Clock Out'
              )}
            </Button>
          )}

          {todayAttendance && todayAttendance.check_out_time && (
            <div className="text-center text-sm text-muted-foreground">
              You have completed your shift for today
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ClockInOut;