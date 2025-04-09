"use client"

export default function NotAuthorizedPage() {
  return (
    <div className="flex flex-1 flex-col gap-6 p-4">
      {/* Header */}
      <div className="space-y-1">
        <div className="h-8 w-48 rounded-md bg-muted/50" />
        <div className="h-4 w-96 rounded-md bg-muted/40" />
      </div>

      {/* Button placeholder area*/}
      <div className="rounded-xl bg-muted/50 p-4 w-full max-w-sm">
        <div className="h-10 rounded-md bg-muted/30" />
      </div>
    </div>
  )
}
