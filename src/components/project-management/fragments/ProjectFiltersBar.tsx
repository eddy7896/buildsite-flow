import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { DatePickerWithRange } from "@/components/ui/date-picker";
import { DateRange } from "react-day-picker";
import {
  Filter,
  Search,
  X,
  Grid3x3,
  List,
  Kanban,
  GanttChart as GanttChartIcon,
  Calendar as CalendarIcon,
  ArrowUpDown,
  Bookmark,
  HelpCircle,
  Archive,
  Star,
  Trash2
} from "lucide-react";
import { SavedView } from "./types";

interface ProjectFiltersBarProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  statusFilter: string;
  onStatusFilterChange: (value: string) => void;
  priorityFilter: string;
  onPriorityFilterChange: (value: string) => void;
  allTags: string[];
  selectedTags: string[];
  onToggleTag: (tag: string) => void;
  tagFilterOpen: boolean;
  onTagFilterOpenChange: (open: boolean) => void;
  dateRange?: DateRange;
  onDateRangeChange: (range: DateRange | undefined) => void;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  onSortChange: (value: string) => void;
  savedViews: SavedView[];
  currentViewId: string | null;
  onLoadSavedView: (viewId: string) => void;
  onSaveCurrentView: () => void;
  onClearAllFilters: () => void;
  showArchived: boolean;
  onToggleArchived: () => void;
  selectedProjectIds: Set<string>;
  bulkActionOpen: boolean;
  onBulkActionOpenChange: (open: boolean) => void;
  onBulkStatusChange: (status: string) => void;
  onBulkDelete: () => void;
  onClearSelection: () => void;
  viewMode: 'grid' | 'list' | 'kanban' | 'gantt' | 'timeline';
  onViewModeChange: (mode: 'grid' | 'list' | 'kanban' | 'gantt' | 'timeline') => void;
}

export function ProjectFiltersBar({
  searchTerm,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  priorityFilter,
  onPriorityFilterChange,
  allTags,
  selectedTags,
  onToggleTag,
  tagFilterOpen,
  onTagFilterOpenChange,
  dateRange,
  onDateRangeChange,
  sortBy,
  sortOrder,
  onSortChange,
  savedViews,
  currentViewId,
  onLoadSavedView,
  onSaveCurrentView,
  onClearAllFilters,
  showArchived,
  onToggleArchived,
  selectedProjectIds,
  bulkActionOpen,
  onBulkActionOpenChange,
  onBulkStatusChange,
  onBulkDelete,
  onClearSelection,
  viewMode,
  onViewModeChange
}: ProjectFiltersBarProps) {
  const hasActiveFilters = statusFilter !== 'all' || priorityFilter !== 'all' || selectedTags.length > 0 || dateRange;

  return (
    <div className="flex items-center justify-between flex-wrap gap-4">
      <div className="flex items-center space-x-2 flex-1 min-w-[300px] flex-wrap">
        <div className="relative flex-1 max-w-md min-w-[200px]">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search projects..."
            value={searchTerm}
            onChange={(e) => {
              const value = e.target.value.substring(0, 200);
              onSearchChange(value);
            }}
            className="pl-8"
            maxLength={200}
            aria-label="Search projects"
          />
        </div>
        <Select value={statusFilter} onValueChange={onStatusFilterChange}>
          <SelectTrigger className="w-[150px]">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="favorites">
              <Star className="h-4 w-4 mr-2 inline" />
              Favorites
            </SelectItem>
            <SelectItem value="planning">Planning</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="in_progress">In Progress</SelectItem>
            <SelectItem value="on_hold">On Hold</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
        <Select value={priorityFilter} onValueChange={onPriorityFilterChange}>
          <SelectTrigger className="w-[130px]">
            <SelectValue placeholder="Priority" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Priority</SelectItem>
            <SelectItem value="low">Low</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="high">High</SelectItem>
            <SelectItem value="critical">Critical</SelectItem>
          </SelectContent>
        </Select>
        
        {allTags.length > 0 && (
          <Popover open={tagFilterOpen} onOpenChange={onTagFilterOpenChange}>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-auto">
                <Filter className="h-4 w-4 mr-2" />
                Tags
                {selectedTags.length > 0 && (
                  <Badge variant="secondary" className="ml-2">
                    {selectedTags.length}
                  </Badge>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-64" align="start">
              <div className="space-y-2">
                <div className="font-medium text-sm mb-2">Filter by Tags</div>
                <div className="max-h-64 overflow-y-auto space-y-2">
                  {allTags.map(tag => (
                    <div key={tag} className="flex items-center space-x-2">
                      <Checkbox
                        id={`tag-${tag}`}
                        checked={selectedTags.includes(tag)}
                        onCheckedChange={() => onToggleTag(tag)}
                      />
                      <label
                        htmlFor={`tag-${tag}`}
                        className="text-sm cursor-pointer flex-1"
                      >
                        {tag}
                      </label>
                    </div>
                  ))}
                </div>
                {selectedTags.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full mt-2"
                    onClick={() => selectedTags.forEach(tag => onToggleTag(tag))}
                  >
                    <X className="h-4 w-4 mr-2" />
                    Clear Tags
                  </Button>
                )}
              </div>
            </PopoverContent>
          </Popover>
        )}
        
        <div className="w-[300px]">
          <DatePickerWithRange
            date={dateRange}
            setDate={onDateRangeChange}
          />
        </div>
        
        <Select value={`${sortBy}_${sortOrder}`} onValueChange={onSortChange}>
          <SelectTrigger className="w-[160px]">
            <ArrowUpDown className="h-4 w-4 mr-2" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="created_at_desc">Recently Created</SelectItem>
            <SelectItem value="created_at_asc">Oldest First</SelectItem>
            <SelectItem value="name_asc">Name (A-Z)</SelectItem>
            <SelectItem value="name_desc">Name (Z-A)</SelectItem>
            <SelectItem value="status_asc">Status</SelectItem>
            <SelectItem value="priority_desc">Priority (High to Low)</SelectItem>
            <SelectItem value="priority_asc">Priority (Low to High)</SelectItem>
            <SelectItem value="budget_desc">Budget (High to Low)</SelectItem>
            <SelectItem value="budget_asc">Budget (Low to High)</SelectItem>
            <SelectItem value="deadline_asc">Deadline (Earliest)</SelectItem>
            <SelectItem value="deadline_desc">Deadline (Latest)</SelectItem>
            <SelectItem value="progress_desc">Progress (High to Low)</SelectItem>
            <SelectItem value="progress_asc">Progress (Low to High)</SelectItem>
          </SelectContent>
        </Select>
        
        {savedViews.length > 0 && (
          <Select value={currentViewId || 'default'} onValueChange={(value) => {
            if (value === 'default') {
              onClearAllFilters();
            } else {
              onLoadSavedView(value);
            }
          }}>
            <SelectTrigger className="w-[140px]">
              <Bookmark className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Views" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="default">Default View</SelectItem>
              {savedViews.map(view => (
                <SelectItem key={view.id} value={view.id}>
                  {view.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        
        {hasActiveFilters && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onSaveCurrentView}
                >
                  <Bookmark className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Save current filters as a view</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
        
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearAllFilters}
            aria-label="Clear all filters"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
        
        <Button
          variant={showArchived ? "default" : "outline"}
          size="sm"
          onClick={onToggleArchived}
        >
          <Archive className="h-4 w-4 mr-2" />
          {showArchived ? 'Hide' : 'Show'} Archived
        </Button>
      </div>
      <div className="flex items-center space-x-2">
        {selectedProjectIds.size > 0 && (
          <div className="flex items-center space-x-2 mr-2 pr-2 border-r">
            <span className="text-sm text-muted-foreground">
              {selectedProjectIds.size} selected
            </span>
            <Popover open={bulkActionOpen} onOpenChange={onBulkActionOpenChange}>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm">
                  Bulk Actions
                </Button>
              </PopoverTrigger>
              <PopoverContent align="end">
                <div className="space-y-1">
                  <div className="font-medium text-sm mb-2">Change Status</div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start"
                    onClick={() => onBulkStatusChange('active')}
                  >
                    Set to Active
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start"
                    onClick={() => onBulkStatusChange('in_progress')}
                  >
                    Set to In Progress
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start"
                    onClick={() => onBulkStatusChange('on_hold')}
                  >
                    Set to On Hold
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start"
                    onClick={() => onBulkStatusChange('completed')}
                  >
                    Set to Completed
                  </Button>
                  <div className="border-t my-2" />
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start text-red-600"
                    onClick={onBulkDelete}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Selected
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start"
                    onClick={onClearSelection}
                  >
                    Clear Selection
                  </Button>
                </div>
              </PopoverContent>
            </Popover>
          </div>
        )}
        
        <Button
          variant={viewMode === 'grid' ? 'default' : 'outline'}
          size="sm"
          onClick={() => onViewModeChange('grid')}
          aria-label="Grid view"
        >
          <Grid3x3 className="h-4 w-4" />
        </Button>
        <Button
          variant={viewMode === 'list' ? 'default' : 'outline'}
          size="sm"
          onClick={() => onViewModeChange('list')}
          aria-label="List view"
        >
          <List className="h-4 w-4" />
        </Button>
        <Button
          variant={viewMode === 'kanban' ? 'default' : 'outline'}
          size="sm"
          onClick={() => onViewModeChange('kanban')}
          aria-label="Kanban view"
        >
          <Kanban className="h-4 w-4" />
        </Button>
        <Button
          variant={viewMode === 'gantt' ? 'default' : 'outline'}
          size="sm"
          onClick={() => onViewModeChange('gantt')}
          aria-label="Gantt chart view"
        >
          <GanttChartIcon className="h-4 w-4" />
        </Button>
        <Button
          variant={viewMode === 'timeline' ? 'default' : 'outline'}
          size="sm"
          onClick={() => onViewModeChange('timeline')}
          aria-label="Timeline view"
        >
          <CalendarIcon className="h-4 w-4" />
        </Button>
        
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="sm" aria-label="Help">
                <HelpCircle className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="left" className="max-w-xs">
              <div className="space-y-2 text-sm">
                <p className="font-semibold">Keyboard Shortcuts:</p>
                <p>Ctrl/Cmd + K: Focus search</p>
                <p>Ctrl/Cmd + N: New project</p>
                <p>Escape: Close dialogs</p>
              </div>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </div>
  );
}
