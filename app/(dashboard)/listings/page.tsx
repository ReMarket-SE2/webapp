export default function ListingsPage() {
  return (
    <div className="flex flex-1 flex-col gap-4 p-4">
      {Array.from({ length: 10 }).map((_, index) => (
        <div key={index} className="h-64 bg-muted/50 rounded-xl" />
      ))}
    </div>
  )
} 
