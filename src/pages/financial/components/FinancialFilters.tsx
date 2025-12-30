/**
 * Financial Filters Component
 * Shared filter component for financial data
 */

import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Filter } from "lucide-react";

interface FinancialFiltersProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  dateRange: { start: string; end: string };
  onDateRangeChange: (range: { start: string; end: string }) => void;
  accountTypeFilter: string;
  onAccountTypeFilterChange: (value: string) => void;
  statusFilter: string;
  onStatusFilterChange: (value: string) => void;
  showFilters: boolean;
  onToggleFilters: () => void;
  onClearFilters: () => void;
}

export const FinancialFilters = ({
  searchTerm,
  onSearchChange,
  dateRange,
  onDateRangeChange,
  accountTypeFilter,
  onAccountTypeFilterChange,
  statusFilter,
  onStatusFilterChange,
  showFilters,
  onToggleFilters,
  onClearFilters,
}: FinancialFiltersProps) => {
  return (
    <div className="space-y-4">
      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search across all financial data..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button 
          variant="outline" 
          onClick={onToggleFilters}
        >
          <Filter className="h-4 w-4 mr-2" />
          Filters
        </Button>
      </div>

      {showFilters && (
        <Card>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label>Date Range (Start)</Label>
                <Input
                  type="date"
                  value={dateRange.start}
                  onChange={(e) => onDateRangeChange({ start: e.target.value, end: dateRange.end })}
                />
              </div>
              <div className="space-y-2">
                <Label>Date Range (End)</Label>
                <Input
                  type="date"
                  value={dateRange.end}
                  onChange={(e) => onDateRangeChange({ start: dateRange.start, end: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Account Type</Label>
                <Select value={accountTypeFilter} onValueChange={onAccountTypeFilterChange}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="asset">Asset</SelectItem>
                    <SelectItem value="liability">Liability</SelectItem>
                    <SelectItem value="equity">Equity</SelectItem>
                    <SelectItem value="revenue">Revenue</SelectItem>
                    <SelectItem value="expense">Expense</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={statusFilter} onValueChange={onStatusFilterChange}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="posted">Posted</SelectItem>
                    <SelectItem value="reversed">Reversed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <Button 
                variant="outline" 
                size="sm"
                onClick={onClearFilters}
              >
                Clear Filters
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

