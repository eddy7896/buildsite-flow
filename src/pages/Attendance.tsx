import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { useState, useEffect } from "react";
import { Clock, Calendar as CalendarIcon, Users, TrendingUp, Loader2 } from "lucide-react";
import { db } from '@/lib/database';
import { useToast } from "@/hooks/use-toast";

interface AttendanceRecord {
  id: string;
  name: string;
  checkIn: string;
  checkOut: string;
  status: string;
  hours: string;
  employee_id?: string;
}

interface AttendanceStats {
  present: number;
  absent: number;
  late: number;
  onLeave: number;
}

const Attendance = () => {
  const { toast } = useToast();
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [loading, setLoading] = useState(true);
  const [attendanceStats, setAttendanceStats] = useState<AttendanceStats>({
    present: 0,
    absent: 0,
    late: 0,
    onLeave: 0
  });
  const [todayAttendance, setTodayAttendance] = useState<AttendanceRecord[]>([]);

  useEffect(() => {
    if (date) {
      fetchAttendanceData(date);
    }
  }, [date]);

  const fetchAttendanceData = async (selectedDate: Date) => {
    try {
      setLoading(true);
      
      // Format date for query (YYYY-MM-DD)
      const dateStr = selectedDate.toISOString().split('T')[0];
      
      // Fetch attendance records for the selected date
      const { data: attendanceData, error: attendanceError } = await db
        .from('attendance')
        .select('*')
        .eq('date', dateStr)
        .order('check_in_time', { ascending: true });

      if (attendanceError) throw attendanceError;

      // Fetch all active employees to check who's absent
      const { data: employeesData, error: employeesError } = await db
        .from('employee_details')
        .select('user_id, first_name, last_name, is_active')
        .eq('is_active', true);

      if (employeesError) throw employeesError;

      // Fetch profiles for employee names
      const employeeIds = employeesData?.map(e => e.user_id).filter(Boolean) || [];
      let profiles: any[] = [];
      
      if (employeeIds.length > 0) {
        const { data: profilesData, error: profilesError } = await db
          .from('profiles')
          .select('user_id, full_name')
          .in('user_id', employeeIds);

        if (profilesError) throw profilesError;
        profiles = profilesData || [];
      }

      const profileMap = new Map(profiles.map((p: any) => [p.user_id, p.full_name]));

      // Check for leave requests that include this date (between start_date and end_date)
      const { data: leaveData, error: leaveError } = await db
        .from('leave_requests')
        .select('employee_id, status, start_date, end_date')
        .lte('start_date', dateStr)
        .gte('end_date', dateStr)
        .in('status', ['approved', 'pending']);

      if (leaveError) throw leaveError;

      const onLeaveIds = new Set((leaveData || []).map((l: any) => l.employee_id));

      // Transform attendance data
      const attendanceRecords: AttendanceRecord[] = [];
      const presentIds = new Set<string>();
      const lateIds = new Set<string>();

      (attendanceData || []).forEach((record: any) => {
        const employee = employeesData?.find(e => e.user_id === record.employee_id);
        const fullName = profileMap.get(record.employee_id) || 
          (employee ? `${employee.first_name} ${employee.last_name}`.trim() : 'Unknown Employee');
        
        presentIds.add(record.employee_id);
        
        // Determine if late (check-in after 9:15 AM)
        let status = 'present';
        if (record.check_in_time) {
          const checkInTime = new Date(record.check_in_time);
          const hours = checkInTime.getHours();
          const minutes = checkInTime.getMinutes();
          if (hours > 9 || (hours === 9 && minutes > 15)) {
            status = 'late';
            lateIds.add(record.employee_id);
          }
        }

        const checkIn = record.check_in_time 
          ? new Date(record.check_in_time).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
          : '-';
        const checkOut = record.check_out_time 
          ? new Date(record.check_out_time).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
          : '-';
        const hours = record.total_hours ? record.total_hours.toFixed(1) : '0.0';

        attendanceRecords.push({
          id: record.id,
          name: fullName,
          checkIn,
          checkOut,
          status,
          hours,
          employee_id: record.employee_id
        });
      });

      // Add absent employees (not in attendance, not on leave)
      employeesData?.forEach((employee: any) => {
        if (!presentIds.has(employee.user_id) && !onLeaveIds.has(employee.user_id)) {
          const fullName = profileMap.get(employee.user_id) || 
            `${employee.first_name} ${employee.last_name}`.trim();
          
          attendanceRecords.push({
            id: `absent-${employee.user_id}`,
            name: fullName,
            checkIn: '-',
            checkOut: '-',
            status: 'absent',
            hours: '0.0',
            employee_id: employee.user_id
          });
        }
      });

      // Add employees on leave
      (leaveData || []).forEach((leave: any) => {
        if (!presentIds.has(leave.employee_id)) {
          const employee = employeesData?.find(e => e.user_id === leave.employee_id);
          const fullName = profileMap.get(leave.employee_id) || 
            (employee ? `${employee.first_name} ${employee.last_name}`.trim() : 'Unknown Employee');
          
          attendanceRecords.push({
            id: `leave-${leave.employee_id}`,
            name: fullName,
            checkIn: '-',
            checkOut: '-',
            status: 'on-leave',
            hours: '0.0',
            employee_id: leave.employee_id
          });
        }
      });

      setTodayAttendance(attendanceRecords);

      // Calculate stats
      const present = attendanceRecords.filter(r => r.status === 'present').length;
      const absent = attendanceRecords.filter(r => r.status === 'absent').length;
      const late = attendanceRecords.filter(r => r.status === 'late').length;
      const onLeave = attendanceRecords.filter(r => r.status === 'on-leave').length;

      setAttendanceStats({ present, absent, late, onLeave });

    } catch (error: any) {
      console.error('Error fetching attendance data:', error);
      toast({
        title: "Error",
        description: "Failed to load attendance data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'present': return 'default';
      case 'late': return 'secondary';
      case 'absent': return 'destructive';
      case 'on-leave': return 'outline';
      default: return 'secondary';
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex justify-center items-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2 text-muted-foreground">Loading attendance data...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Attendance</h1>
          <p className="text-muted-foreground">Track and manage employee attendance</p>
        </div>
        <Button>
          <CalendarIcon className="mr-2 h-4 w-4" />
          View Reports
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Present</p>
                <p className="text-2xl font-bold">{attendanceStats.present}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <Clock className="h-8 w-8 text-yellow-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Late</p>
                <p className="text-2xl font-bold">{attendanceStats.late}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <TrendingUp className="h-8 w-8 text-red-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Absent</p>
                <p className="text-2xl font-bold">{attendanceStats.absent}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <CalendarIcon className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">On Leave</p>
                <p className="text-2xl font-bold">{attendanceStats.onLeave}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Today's Attendance</CardTitle>
              <CardDescription>Employee check-in and check-out records for today</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {todayAttendance.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">No attendance records found for this date.</p>
                  </div>
                ) : (
                  todayAttendance.map((record) => (
                  <div key={record.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                        <span className="text-sm font-semibold text-primary">
                          {record.name.split(' ').map(n => n[0]).join('')}
                        </span>
                      </div>
                      <div>
                        <h4 className="font-medium">{record.name}</h4>
                        <div className="flex gap-4 text-sm text-muted-foreground">
                          <span>In: {record.checkIn}</span>
                          <span>Out: {record.checkOut}</span>
                          <span>Hours: {record.hours}</span>
                        </div>
                      </div>
                    </div>
                    <Badge variant={getStatusColor(record.status)}>
                      {record.status}
                    </Badge>
                  </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Calendar</CardTitle>
              <CardDescription>Select a date to view attendance</CardDescription>
            </CardHeader>
            <CardContent>
              <Calendar
                mode="single"
                selected={date}
                onSelect={setDate}
                className="rounded-md border"
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Attendance;