import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { DayPicker } from "react-day-picker";

import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";

export type CalendarProps = React.ComponentProps<typeof DayPicker>;

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: CalendarProps) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("p-2 sm:p-4 md:p-6", className)}
      classNames={{
        months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
        month: "space-y-3 sm:space-y-4",
        caption: "flex justify-center pt-2 sm:pt-3 relative items-center mb-2 sm:mb-4",
        caption_label: "text-base sm:text-lg md:text-xl font-semibold text-foreground",
        nav: "space-x-1 flex items-center",
        nav_button: cn(
          buttonVariants({ variant: "outline" }),
          "h-8 w-8 sm:h-9 sm:w-9 md:h-10 md:w-10 bg-transparent p-0 opacity-70 hover:opacity-100 transition-opacity rounded-full border-2 hover:border-primary/50"
        ),
        nav_button_previous: "absolute left-0 sm:left-2",
        nav_button_next: "absolute right-0 sm:right-2",
        table: "w-full border-collapse space-y-1 sm:space-y-2",
        head_row: "flex justify-between",
        head_cell:
          "text-muted-foreground rounded-md font-semibold text-xs sm:text-sm md:text-base w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 flex items-center justify-center",
        row: "flex w-full mt-1 sm:mt-2 justify-between",
        cell: "h-10 w-10 sm:h-12 sm:w-12 md:h-14 md:w-14 text-center text-sm sm:text-base p-0 relative [&:has([aria-selected].day-range-end)]:rounded-r-md [&:has([aria-selected].day-outside)]:bg-accent/50 [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20 flex items-center justify-center",
        day: cn(
          buttonVariants({ variant: "ghost" }),
          "h-10 w-10 sm:h-12 sm:w-12 md:h-14 md:w-14 p-0 font-medium sm:font-semibold aria-selected:opacity-100 rounded-lg transition-all duration-200 hover:scale-105 active:scale-95 text-sm sm:text-base md:text-lg"
        ),
        day_range_end: "day-range-end",
        day_selected:
          "bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground shadow-md shadow-primary/20 scale-105",
        day_today: "bg-accent text-accent-foreground font-bold border-2 border-primary/30",
        day_outside:
          "day-outside text-muted-foreground opacity-40 aria-selected:bg-accent/50 aria-selected:text-muted-foreground aria-selected:opacity-30",
        day_disabled: "text-muted-foreground opacity-30 cursor-not-allowed",
        day_range_middle:
          "aria-selected:bg-accent aria-selected:text-accent-foreground",
        day_hidden: "invisible",
        ...classNames,
      }}
      components={{
        IconLeft: ({ ..._props }) => <ChevronLeft className="h-4 w-4 sm:h-5 sm:w-5" />,
        IconRight: ({ ..._props }) => <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5" />,
      }}
      {...props}
    />
  );
}
Calendar.displayName = "Calendar";

export { Calendar };
