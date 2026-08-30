"use client"

import * as React from "react"
import { format } from "date-fns"
import { CalendarIcon, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from "@/lib/utils"

interface DatePickerProps {
  date?: Date | undefined
  setDate: (date: Date | undefined) => void
  className?: string
  placeholder?: string
}

export function DatePicker({
  date,
  setDate,
  className,
  placeholder = "Pilih tanggal",
}: DatePickerProps) {
  const [open, setOpen] = React.useState(false)

  return (
    <div className={cn("flex items-center gap-1.5", className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger
          render={
            <Button
              variant="outline"
              className={cn(
                "justify-start px-3 py-2 text-xs font-medium bg-slate-50 border-slate-200 hover:bg-slate-100 min-h-[38px] rounded-xl cursor-pointer text-slate-700 w-full",
                !date && "text-slate-500"
              )}
            >
              <CalendarIcon className="mr-2 h-3.5 w-3.5 text-slate-500 shrink-0" />
              {date ? format(date, "dd MMM yyyy") : <span>{placeholder}</span>}
            </Button>
          }
        />
        <PopoverContent className="w-auto p-3 rounded-2xl bg-white border border-slate-200 shadow-xl" align="start">
          <Calendar
            mode="single"
            selected={date}
            onSelect={(newDate) => {
              setDate(newDate)
              setOpen(false)
            }}
            defaultMonth={date || new Date()}
          />
          {date && (
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
                Reset
              </Button>
              <Button
                size="sm"
                onClick={() => setOpen(false)}
                className="bg-stone-800 hover:bg-stone-900 text-white text-xs font-medium rounded-lg"
              >
                Tutup
              </Button>
            </div>
          )}
        </PopoverContent>
      </Popover>

      {date && (
        <button
          onClick={() => setDate(undefined)}
          className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
          title="Hapus tanggal"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  )
}
