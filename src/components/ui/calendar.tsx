"use client"

import * as React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { DayPicker } from "react-day-picker"

import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"

export type CalendarProps = React.ComponentProps<typeof DayPicker>

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: CalendarProps) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("p-3 bg-white", className)}
      classNames={{
        months: "flex flex-col sm:flex-row gap-4",
        month: "space-y-3",
        month_caption: "flex justify-center pt-1 relative items-center mb-2",
        caption_label: "text-sm font-bold text-slate-800",
        nav: "space-x-1 flex items-center",
        button_previous: cn(
          buttonVariants({ variant: "outline" }),
          "h-7 w-7 bg-white p-0 opacity-70 hover:opacity-100 rounded-lg absolute left-1 cursor-pointer"
        ),
        button_next: cn(
          buttonVariants({ variant: "outline" }),
          "h-7 w-7 bg-white p-0 opacity-70 hover:opacity-100 rounded-lg absolute right-1 cursor-pointer"
        ),
        month_grid: "w-full border-collapse space-y-1",
        weekdays: "flex justify-between",
        weekday: "text-slate-400 rounded-md w-8 font-semibold text-[0.75rem] text-center",
        weeks: "space-y-1 mt-1",
        week: "flex justify-between w-full mt-1",
        day: "h-8 w-8 p-0 text-center text-sm font-normal relative flex items-center justify-center rounded-lg cursor-pointer hover:bg-slate-100 transition-colors",
        day_button: "h-8 w-8 p-0 font-normal text-center flex items-center justify-center rounded-lg",
        range_start: "bg-stone-800 text-white hover:bg-stone-900 rounded-l-lg font-bold",
        range_end: "bg-stone-800 text-white hover:bg-stone-900 rounded-r-lg font-bold",
        selected: "bg-stone-800 text-white hover:bg-stone-900 font-bold",
        today: "bg-slate-100 text-slate-900 font-bold border border-slate-300",
        outside: "text-slate-300 opacity-50",
        disabled: "text-slate-300 opacity-50 cursor-not-allowed",
        range_middle: "bg-slate-100 text-slate-900 rounded-none",
        hidden: "invisible",
        ...classNames,
      }}
      components={{
        Chevron: ({ orientation }) =>
          orientation === "left" ? (
            <ChevronLeft className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          ),
      }}
      {...props}
    />
  )
}
Calendar.displayName = "Calendar"

export { Calendar }
