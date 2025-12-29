import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";
import { DateRange } from "react-day-picker";

interface ActiveFilterBadgesProps {
  selectedTags: string[];
  dateRange?: DateRange;
  onToggleTag: (tag: string) => void;
  onClearDateRange: () => void;
}

export function ActiveFilterBadges({
  selectedTags,
  dateRange,
  onToggleTag,
  onClearDateRange
}: ActiveFilterBadgesProps) {
  if (selectedTags.length === 0 && !dateRange) {
    return null;
  }

  return (
    <div className="flex flex-wrap gap-2">
      {selectedTags.map(tag => (
        <Badge key={tag} variant="secondary" className="flex items-center gap-1">
          {tag}
          <button
            onClick={() => onToggleTag(tag)}
            className="ml-1 hover:bg-destructive/20 rounded-full p-0.5"
            aria-label={`Remove ${tag} filter`}
          >
            <X className="h-3 w-3" />
          </button>
        </Badge>
      ))}
      {dateRange && (dateRange.from || dateRange.to) && (
        <Badge variant="secondary" className="flex items-center gap-1">
          {dateRange.from && dateRange.to
            ? `${dateRange.from.toLocaleDateString()} - ${dateRange.to.toLocaleDateString()}`
            : dateRange.from
            ? `From ${dateRange.from.toLocaleDateString()}`
            : `Until ${dateRange.to?.toLocaleDateString()}`
          }
          <button
            onClick={onClearDateRange}
            className="ml-1 hover:bg-destructive/20 rounded-full p-0.5"
            aria-label="Clear date range"
          >
            <X className="h-3 w-3" />
          </button>
        </Badge>
      )}
    </div>
  );
}
