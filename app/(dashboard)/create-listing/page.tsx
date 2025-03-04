export default function CreateListingPage() {
  return (
    <div className="flex flex-1 flex-col gap-4 p-4">
      <div className="w-full h-full grid grid-cols-3 grid-rows-3 gap-4">
        <div className="col-span-2 row-span-2">
          <div className="w-full h-full bg-muted/50 rounded-xl" />
        </div>
        <div className="col-span-1 row-span-2">
          <div className="w-full h-full bg-muted/50 rounded-xl" />
        </div>
        <div className="col-span-1 row-span-1">
          <div className="w-full h-full bg-muted/50 rounded-xl" />
        </div>
        <div className="col-span-2 row-span-1">
          <div className="w-full h-full bg-muted/50 rounded-xl" />
        </div>
      </div>
    </div>
  )
}
