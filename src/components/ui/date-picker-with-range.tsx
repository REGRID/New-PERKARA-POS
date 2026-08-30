"use client"

import * as React from "react"
import { format } from "date-fns"
import { CalendarIcon, X } from "lucide-react"
import { type DateRange } from "react-day-picker"

import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from "@/lib/utils"

interface DatePickerWithRangeProps {
  date?: DateRange | undefined
  setDate: (date: DateRange | undefined) => void
  className?: string
  placeholder?: string
}

export function DatePickerWithRange({
  date,
  setDate,
  className,
  placeholder = "Pilih rentang tanggal",
}: DatePickerWithRangeProps) {
  const [open, setOpen] = React.useState(false)

  return (
    <div className={cn("flex items-center gap-1.5", className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger
          render={
            <Button
              variant="outline"
              id="date-picker-range"
              className={cn(
                "justify-start px-3 py-2 text-xs font-medium bg-slate-50 border-slate-200 hover:bg-slate-100 min-h-[38px] rounded-xl cursor-pointer text-slate-700",
                !date && "text-slate-500"
              )}
            >
              <CalendarIcon className="mr-2 h-3.5 w-3.5 text-slate-500 shrink-0" />
              {date?.from ? (
                date.to ? (
                  <>
                    {format(date.from, "dd MMM yyyy")} - {format(date.to, "dd MMM yyyy")}
                  </>
                ) : (
                  format(date.from, "dd MMM yyyy")
                )
              ) : (
                <span>{placeholder}</span>
              )}
            </Button>
          }
        />
        <PopoverContent className="w-auto p-3 rounded-2xl bg-white border border-slate-200 shadow-xl" align="start">
          <div className="space-y-3">
            <Calendar
              mode="range"
              defaultMonth={date?.from || new Date()}
              selected={date}
              onSelect={setDate}
              numberOfMonths={2}
            />
            <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setDate(undefined)
                  setOpen(false)
                }}
                className="text-xs text-slate-500 hover:text-slate-800"
              >
                Reset Tanggal
              </Button>
              <Button
                size="sm"
                onClick={() => setOpen(false)}
                className="bg-stone-800 hover:bg-stone-900 text-white text-xs font-medium rounded-lg"
              >
                Terapkan
              </Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>

      {date?.from && (
        <button
          onClick={() => setDate(undefined)}
          className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
          title="Hapus filter tanggal"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  )
}
