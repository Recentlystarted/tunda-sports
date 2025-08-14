import * as React from "react"
import { CalendarIcon } from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

interface DatePickerProps {
  date?: Date
  onDateChange?: (date: Date | undefined) => void
  placeholder?: string
  disabled?: boolean
  className?: string
  allowFutureDates?: boolean // New prop to control future date selection
}

export function DatePicker({
  date,
  onDateChange,
  placeholder = "Pick a date",
  disabled = false,
  className,
  allowFutureDates = false, // Default to false for backward compatibility
}: DatePickerProps) {
  // helper to normalise the picked day to local-midnight
  const handleSelect = (d: Date | undefined) => {
    if (!d) {
      onDateChange?.(undefined)
      return
    }
    const corrected = new Date(
      d.getFullYear(),
      d.getMonth(),
      d.getDate(),      // ← local midnight, not UTC
      0, 0, 0, 0
    )
    onDateChange?.(corrected)
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-full justify-start text-left font-normal",
            !date && "text-muted-foreground",
            className
          )}
          disabled={disabled}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {date ? format(date, "PPP") : <span>{placeholder}</span>}
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={date}
          onSelect={handleSelect}
          disabled={(d) => {
            // Allow future dates when allowFutureDates is true
            if (allowFutureDates) {
              return d < new Date("1900-01-01")
            }
            // Original behavior: disable future dates
            return d > new Date() || d < new Date("1900-01-01")
          }}
          captionLayout="dropdown"
          fromYear={1950}
          toYear={allowFutureDates ? new Date().getFullYear() + 10 : new Date().getFullYear()}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  )
}
