import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Search, MoreHorizontal, Users, Building2, Calendar, DollarSign } from 'lucide-react';
import type { AgencyData } from '@/hooks/useSystemAnalytics';

interface AgencyManagementProps {
  agencies: AgencyData[];
  onRefresh: () => void;
}

export const AgencyManagement = ({ agencies, onRefresh }: AgencyManagementProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPlan, setSelectedPlan] = useState<string>('all');

  const filteredAgencies = agencies.filter(agency => {
    const matchesSearch = agency.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         agency.domain.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesPlan = selectedPlan === 'all' || agency.subscription_plan === selectedPlan;
    return matchesSearch && matchesPlan;
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getPlanColor = (plan: string) => {
    switch (plan) {
      case 'basic': return 'bg-blue-100 text-blue-800';
      case 'pro': return 'bg-green-100 text-green-800';
      case 'enterprise': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Agency Management</CardTitle>
          <Button onClick={onRefresh} variant="outline" size="sm">
            Refresh
          </Button>
        </div>
        
        {/* Search and Filter Controls */}
        <div className="flex items-center gap-4 mt-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search agencies..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                Plan: {selectedPlan === 'all' ? 'All' : selectedPlan}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => setSelectedPlan('all')}>
                All Plans
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSelectedPlan('basic')}>
                Basic
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSelectedPlan('pro')}>
                Pro
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSelectedPlan('enterprise')}>
                Enterprise
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Agency</TableHead>
              <TableHead>Domain</TableHead>
              <TableHead>Plan</TableHead>
              <TableHead>Users</TableHead>
              <TableHead>Projects</TableHead>
              <TableHead>Created</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-[70px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredAgencies.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                  {agencies.length === 0 ? 'No agencies found' : 'No agencies match your search criteria'}
                </TableCell>
              </TableRow>
            ) : (
              filteredAgencies.map((agency) => (
                <TableRow key={agency.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <div className="font-medium">{agency.name}</div>
                        <div className="text-sm text-muted-foreground">ID: {agency.id.slice(0, 8)}...</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">{agency.domain || 'Not set'}</div>
                  </TableCell>
                  <TableCell>
                    <Badge className={`capitalize ${getPlanColor(agency.subscription_plan)}`}>
                      {agency.subscription_plan}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Users className="h-3 w-3 text-muted-foreground" />
                      <span className="text-sm">{agency.user_count}/{agency.max_users}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">{agency.project_count}</div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3 text-muted-foreground" />
                      <span className="text-sm">{formatDate(agency.created_at)}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={agency.is_active ? "default" : "secondary"}>
                      {agency.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          Manage Users
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          View Usage
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          Billing History
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive">
                          {agency.is_active ? 'Deactivate' : 'Activate'}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};