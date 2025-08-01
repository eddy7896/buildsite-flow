import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { useState } from "react";
import { Clock, Calendar as CalendarIcon, Play, Square, TrendingUp, Award } from "lucide-react";

const MyAttendance = () => {
  const [date, setDate] = useState<Date | undefined>(new Date());

  // Mock data - replace with actual user attendance data
  const attendanceStats = {
    totalHours: 168.5,
    averageDaily: 8.4,
    onTimePercentage: 95,
    currentStreak: 12
  };

  const todayStatus = {
    isCheckedIn: true,
    checkInTime: "09:00 AM",
    checkOutTime: null,
    totalHours: "7h 30m",
    status: "working"
  };

  const recentAttendance = [
    { date: "2024-01-25", checkIn: "09:00 AM", checkOut: "06:00 PM", hours: "9.0", status: "present" },
    { date: "2024-01-24", checkIn: "09:15 AM", checkOut: "06:15 PM", hours: "9.0", status: "late" },
    { date: "2024-01-23", checkIn: "09:00 AM", checkOut: "06:00 PM", hours: "9.0", status: "present" },
    { date: "2024-01-22", checkIn: "09:00 AM", checkOut: "06:00 PM", hours: "9.0", status: "present" },
    { date: "2024-01-21", checkIn: "-", checkOut: "-", hours: "0.0", status: "weekend" },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'present': return 'default';
      case 'late': return 'secondary';
      case 'absent': return 'destructive';
      case 'weekend': return 'outline';
      default: return 'secondary';
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">My Attendance</h1>
          <p className="text-muted-foreground">Track your work hours and attendance records</p>
        </div>
        <div className="flex gap-2">
          {todayStatus.isCheckedIn ? (
            <Button variant="destructive">
              <Square className="mr-2 h-4 w-4" />
              Check Out
            </Button>
          ) : (
            <Button>
              <Play className="mr-2 h-4 w-4" />
              Check In
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <Clock className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Total Hours</p>
                <p className="text-2xl font-bold">{attendanceStats.totalHours}h</p>
                <p className="text-xs text-muted-foreground">This month</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <TrendingUp className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Daily Average</p>
                <p className="text-2xl font-bold">{attendanceStats.averageDaily}h</p>
                <p className="text-xs text-muted-foreground">Per day</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <Award className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">On Time</p>
                <p className="text-2xl font-bold">{attendanceStats.onTimePercentage}%</p>
                <p className="text-xs text-muted-foreground">This month</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <CalendarIcon className="h-8 w-8 text-orange-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Current Streak</p>
                <p className="text-2xl font-bold">{attendanceStats.currentStreak}</p>
                <p className="text-xs text-muted-foreground">Days on time</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Today's Status</CardTitle>
              <CardDescription>Your current work session</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between p-4 bg-primary/5 rounded-lg">
                <div className="flex items-center space-x-4">
                  <div className={`w-3 h-3 rounded-full ${todayStatus.isCheckedIn ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                  <div>
                    <h3 className="font-semibold">
                      {todayStatus.isCheckedIn ? 'Currently Working' : 'Not Checked In'}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {todayStatus.isCheckedIn 
                        ? `Checked in at ${todayStatus.checkInTime}` 
                        : 'Start your work session'
                      }
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-lg">{todayStatus.totalHours}</p>
                  <p className="text-sm text-muted-foreground">Today</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent Attendance</CardTitle>
              <CardDescription>Your attendance history for the past few days</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentAttendance.map((record, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div>
                        <p className="font-medium">{new Date(record.date).toLocaleDateString('en-US', { weekday: 'long' })}</p>
                        <p className="text-sm text-muted-foreground">{record.date}</p>
                      </div>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground">In: {record.checkIn}</p>
                      <p className="text-sm text-muted-foreground">Out: {record.checkOut}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{record.hours}h</p>
                      <Badge variant={getStatusColor(record.status)} className="text-xs">
                        {record.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <div>
          <Card>
            <CardHeader>
              <CardTitle>Calendar</CardTitle>
              <CardDescription>View attendance for specific dates</CardDescription>
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

export default MyAttendance;