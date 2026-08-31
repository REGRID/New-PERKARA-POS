"use client";

import React from "react";
import { AppShell } from "@/components/layout/app-shell";
import { AttendanceCalendarView } from "@/components/attendance-calendar-view";

export default function AttendancePage() {
  return (
    <AppShell>
      <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
        <AttendanceCalendarView />
      </div>
    </AppShell>
  );
}
