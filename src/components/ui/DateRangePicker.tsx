import React, { useState, useEffect } from 'react';
import { Calendar, ChevronDown } from 'lucide-react';
import { Button } from './button';
import { Popover, PopoverContent, PopoverTrigger } from './popover';
import { Calendar as CalendarComponent } from './calendar';
import { format } from 'date-fns';

interface DateRangePickerProps {
  startDate: Date;
  endDate: Date;
  onDateRangeChange: (startDate: Date, endDate: Date) => void;
  className?: string;
}

type DatePreset = {
  label: string;
  days: number;
};

const datePresets: DatePreset[] = [
  { label: 'Today', days: 0 },
  { label: 'Yesterday', days: 1 },
  { label: 'Last 7 days', days: 7 },
  { label: 'Last 14 days', days: 14 },
  { label: 'Last 30 days', days: 30 },
  { label: 'Last 90 days', days: 90 },
  { label: 'Last 6 months', days: 180 },
  { label: 'Last year', days: 365 },
];

const DateRangePicker: React.FC<DateRangePickerProps> = ({
  startDate,
  endDate,
  onDateRangeChange,
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState<string>('Last 7 days');
  const [tempStartDate, setTempStartDate] = useState<Date>(startDate);
  const [tempEndDate, setTempEndDate] = useState<Date>(endDate);

  // Format the date range for display
  const formattedDateRange = `${format(startDate, 'dd/MM/yyyy')} - ${format(endDate, 'dd/MM/yyyy')}`;

  // Apply a preset date range
  const applyPreset = (preset: DatePreset) => {
    const today = new Date();
    let newStartDate = new Date();
    
    if (preset.days === 0) {
      // Today only
      newStartDate = new Date(today);
      setTempEndDate(today);
    } else if (preset.days === 1) {
      // Yesterday only
      newStartDate = new Date();
      newStartDate.setDate(today.getDate() - 1);
      setTempEndDate(newStartDate);
    } else {
      // Other ranges
      newStartDate = new Date();
      newStartDate.setDate(today.getDate() - preset.days);
      setTempEndDate(today);
    }
    
    setTempStartDate(newStartDate);
    setSelectedPreset(preset.label);
  };

  // Apply the selected date range
  const applyDateRange = () => {
    onDateRangeChange(tempStartDate, tempEndDate);
    setIsOpen(false);
  };

  // Reset to the current date range
  const resetDateRange = () => {
    setTempStartDate(startDate);
    setTempEndDate(endDate);
  };

  // Update temp dates when props change
  useEffect(() => {
    setTempStartDate(startDate);
    setTempEndDate(endDate);
  }, [startDate, endDate]);

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={`flex items-center gap-2 bg-white hover:bg-gray-50 ${className}`}
          onClick={() => setIsOpen(true)}
        >
          <Calendar size={16} className="text-farmaze-green" />
          <span className="sm:inline text-sm font-medium">{formattedDateRange}</span>
          <ChevronDown size={14} />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="end">
        <div className="grid grid-cols-2 gap-4 p-4">
          <div className="space-y-4">
            <h3 className="font-medium text-sm">Date Range</h3>
            <div className="space-y-2 max-h-[280px] overflow-y-auto pr-2">
              {datePresets.map((preset) => (
                <Button
                  key={preset.label}
                  variant={selectedPreset === preset.label ? "default" : "outline"}
                  size="sm"
                  className={`w-full justify-start ${selectedPreset === preset.label ? 'bg-farmaze-green hover:bg-farmaze-green/90' : ''}`}
                  onClick={() => applyPreset(preset)}
                >
                  {preset.label}
                </Button>
              ))}
            </div>
          </div>
          <div className="border-l pl-4">
            <div className="space-y-4">
              <h3 className="font-medium text-sm">Start Date</h3>
              <CalendarComponent
                mode="single"
                selected={tempStartDate}
                onSelect={(date) => date && setTempStartDate(date)}
                disabled={(date) => date > tempEndDate || date > new Date()}
                initialFocus
              />
            </div>
            <div className="space-y-4 mt-4">
              <h3 className="font-medium text-sm">End Date</h3>
              <CalendarComponent
                mode="single"
                selected={tempEndDate}
                onSelect={(date) => date && setTempEndDate(date)}
                disabled={(date) => date < tempStartDate || date > new Date()}
                initialFocus
              />
            </div>
          </div>
        </div>
        <div className="flex items-center justify-end gap-2 p-4 border-t">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              resetDateRange();
              setIsOpen(false);
            }}
          >
            Cancel
          </Button>
          <Button size="sm" onClick={applyDateRange}>
            Apply Range
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default DateRangePicker;
