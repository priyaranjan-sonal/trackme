"use client"

import WorkspaceView from "@/components/WorkspaceView"

export default function WorkspacePage() {
  return (
    <div className="relative min-h-screen overflow-x-hidden bg-prsBg">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-32 left-1/2 h-[480px] w-[720px] -translate-x-1/2 rounded-full bg-prsPrimary/[0.06] blur-[140px]" />
      </div>
      <div className="relative pt-28">
        <WorkspaceView />
      </div>
    </div>
  )
}
