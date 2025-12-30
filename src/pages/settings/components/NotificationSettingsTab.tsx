/**
 * Notification Settings Tab Component
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Save, Bell, Mail, Loader2 } from "lucide-react";
import { useNotificationSettings } from '../hooks/useNotificationSettings';

export const NotificationSettingsTab = () => {
  const {
    notificationSettings,
    setNotificationSettings,
    loading,
    saveNotificationSettings,
  } = useNotificationSettings();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Notification Preferences
        </CardTitle>
        <CardDescription>Configure how and when you receive notifications</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Delivery Methods */}
        <div className="space-y-4">
          <h3 className="font-medium flex items-center gap-2">
            <Mail className="h-4 w-4" />
            Delivery Methods
          </h3>
          
          <div className="flex items-center justify-between p-4 rounded-lg border">
            <div className="space-y-0.5">
              <Label htmlFor="emailNotifications" className="font-medium">Email Notifications</Label>
              <p className="text-sm text-muted-foreground">Receive notifications via email</p>
            </div>
            <Switch
              id="emailNotifications"
              checked={notificationSettings.email_notifications}
              onCheckedChange={(checked) => setNotificationSettings(prev => ({ ...prev, email_notifications: checked }))}
            />
          </div>

          <div className="flex items-center justify-between p-4 rounded-lg border">
            <div className="space-y-0.5">
              <Label htmlFor="pushNotifications" className="font-medium">Push Notifications</Label>
              <p className="text-sm text-muted-foreground">Receive browser push notifications</p>
            </div>
            <Switch
              id="pushNotifications"
              checked={notificationSettings.push_notifications}
              onCheckedChange={(checked) => setNotificationSettings(prev => ({ ...prev, push_notifications: checked }))}
            />
          </div>
        </div>

        <Separator />

        {/* Notification Categories */}
        <div className="space-y-4">
          <h3 className="font-medium">Notification Categories</h3>
          
          <div className="flex items-center justify-between p-4 rounded-lg border">
            <div className="space-y-0.5">
              <Label htmlFor="taskReminders" className="font-medium">Task Reminders</Label>
              <p className="text-sm text-muted-foreground">Get reminded about upcoming and overdue tasks</p>
            </div>
            <Switch
              id="taskReminders"
              checked={notificationSettings.task_reminders}
              onCheckedChange={(checked) => setNotificationSettings(prev => ({ ...prev, task_reminders: checked }))}
            />
          </div>

          <div className="flex items-center justify-between p-4 rounded-lg border">
            <div className="space-y-0.5">
              <Label htmlFor="leaveNotifications" className="font-medium">Leave Notifications</Label>
              <p className="text-sm text-muted-foreground">Updates about leave requests and approvals</p>
            </div>
            <Switch
              id="leaveNotifications"
              checked={notificationSettings.leave_notifications}
              onCheckedChange={(checked) => setNotificationSettings(prev => ({ ...prev, leave_notifications: checked }))}
            />
          </div>

          <div className="flex items-center justify-between p-4 rounded-lg border">
            <div className="space-y-0.5">
              <Label htmlFor="payrollNotifications" className="font-medium">Payroll Notifications</Label>
              <p className="text-sm text-muted-foreground">Salary processing and reimbursement updates</p>
            </div>
            <Switch
              id="payrollNotifications"
              checked={notificationSettings.payroll_notifications}
              onCheckedChange={(checked) => setNotificationSettings(prev => ({ ...prev, payroll_notifications: checked }))}
            />
          </div>

          <div className="flex items-center justify-between p-4 rounded-lg border">
            <div className="space-y-0.5">
              <Label htmlFor="projectUpdates" className="font-medium">Project Updates</Label>
              <p className="text-sm text-muted-foreground">Project status changes and milestones</p>
            </div>
            <Switch
              id="projectUpdates"
              checked={notificationSettings.project_updates}
              onCheckedChange={(checked) => setNotificationSettings(prev => ({ ...prev, project_updates: checked }))}
            />
          </div>

          <div className="flex items-center justify-between p-4 rounded-lg border">
            <div className="space-y-0.5">
              <Label htmlFor="systemAlerts" className="font-medium">System Alerts</Label>
              <p className="text-sm text-muted-foreground">Important system announcements and alerts</p>
            </div>
            <Switch
              id="systemAlerts"
              checked={notificationSettings.system_alerts}
              onCheckedChange={(checked) => setNotificationSettings(prev => ({ ...prev, system_alerts: checked }))}
            />
          </div>

          <div className="flex items-center justify-between p-4 rounded-lg border">
            <div className="space-y-0.5">
              <Label htmlFor="marketingEmails" className="font-medium">Marketing & Promotional</Label>
              <p className="text-sm text-muted-foreground">News, updates, and promotional content</p>
            </div>
            <Switch
              id="marketingEmails"
              checked={notificationSettings.marketing_emails}
              onCheckedChange={(checked) => setNotificationSettings(prev => ({ ...prev, marketing_emails: checked }))}
            />
          </div>
        </div>

        <Button onClick={saveNotificationSettings} disabled={loading} className="w-full md:w-auto">
          {loading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Save className="mr-2 h-4 w-4" />
          )}
          Save Notification Preferences
        </Button>
      </CardContent>
    </Card>
  );
};

