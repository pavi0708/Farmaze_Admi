import * as React from "react";
import { format, addDays, addMonths, subMonths, startOfMonth, endOfMonth } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import { DateRange } from "react-day-picker";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface MyDateRangePickerProps {
  dateRange: DateRange | undefined;
  onDateRangeChange: (range: DateRange | undefined) => void;
  className?: string;
  presets?: { label: string; range: DateRange }[];
}

export function MyDateRangePicker({
  dateRange,
  onDateRangeChange,
  className,
  presets
}: MyDateRangePickerProps) {
  const [showCalendar, setShowCalendar] = React.useState(false);
  const [showMonthPicker, setShowMonthPicker] = React.useState(false);

  const monthOptions = React.useMemo(() => {
    return Array.from({ length: 12 }, (_, i) => {
      const d = subMonths(new Date(), i);
      return {
        label: format(d, "MMMM yyyy"),
        from: startOfMonth(d),
        to: i === 0 ? new Date() : endOfMonth(d),
      };
    });
  }, []);

  const defaultPresets = [
    {
      label: "Last 7 days",
      range: {
        from: addDays(new Date(), -7),
        to: new Date(),
      },
    },
    {
      label: "Last 30 days",
      range: {
        from: addDays(new Date(), -30),
        to: new Date(),
      },
    },
    {
      label: "Last 90 days",
      range: {
        from: addDays(new Date(), -90),
        to: new Date(),
      },
    },
    {
      label: "This month",
      range: {
        from: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
        to: new Date(),
      },
    },
    {
      label: "Last 6 months",
      range: {
        from: addMonths(new Date(), -6),
        to: new Date(),
      },
    },
    {
      label: "This Year",
      range: {
        from: new Date(new Date().getFullYear(), 0, 1),
        to: new Date(),
      },
    },
    {
      label: "Last Year",
      range: {
        from: new Date(new Date().getFullYear() - 1, 0, 1),
        to: new Date(new Date().getFullYear() - 1, 11, 31),
      },
    },
    {
      label: "Custom Range",
      range: {
        from: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
        to: new Date(),
      },
    },
  ];

  const availablePresets = presets || defaultPresets;

  return (
    <div className={cn("grid gap-2", className)}>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            id="date"
            variant={"outline"}
            className={cn(
              "w-[300px] justify-start text-left font-normal",
              !dateRange && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {dateRange?.from ? (
              dateRange.to ? (
                <>
                  {format(dateRange.from, "LLL dd, y")} -{" "}
                  {format(dateRange.to, "LLL dd, y")}
                </>
              ) : (
                format(dateRange.from, "LLL dd, y")
              )
            ) : (
              <span>Select date range</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <div className="flex flex-col sm:flex-row">
            <div className="border-r p-2">
              {showMonthPicker ? (
                <div className="flex flex-col gap-1 text-sm">
                  <Button
                    variant="ghost"
                    className="justify-start font-normal text-muted-foreground"
                    onClick={() => setShowMonthPicker(false)}
                  >
                    &larr; Back
                  </Button>
                  <div className="max-h-48 overflow-y-auto flex flex-col gap-1">
                    {monthOptions.map((m) => (
                      <Button
                        key={m.label}
                        variant="ghost"
                        className="justify-start font-normal"
                        onClick={() => {
                          setShowCalendar(false);
                          setShowMonthPicker(false);
                          onDateRangeChange({ from: m.from, to: m.to });
                        }}
                      >
                        {m.label}
                      </Button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-1 text-sm">
                  {availablePresets.map((preset) => (
                    <Button
                      key={preset.label}
                      variant="ghost"
                      className="justify-start font-normal"
                      onClick={() => {
                        const isCustom = preset.label === "Custom Range";
                        setShowCalendar(isCustom);
                        onDateRangeChange(preset.range);
                      }}
                    >
                      {preset.label}
                    </Button>
                  ))}
                  <Button
                    variant="ghost"
                    className="justify-start font-normal text-primary"
                    onClick={() => setShowMonthPicker(true)}
                  >
                    Pick Month
                  </Button>
                </div>
              )}
            </div>
            {showCalendar && (
              <Calendar
                initialFocus
                mode="range"
                defaultMonth={dateRange?.from}
                selected={dateRange}
                onSelect={(range) => {
                  // Keep calendar visible while customizing
                  setShowCalendar(true);
                  onDateRangeChange(range);
                }}
                numberOfMonths={2}
                className="p-3"
              />
            )}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
