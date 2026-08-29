"use client";

import React from "react";
import { AttendanceCalendarView } from "@/components/attendance-calendar-view";

export default function AttendancePage() {
  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto">
      <AttendanceCalendarView />
    </div>
  );
}
