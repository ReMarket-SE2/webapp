import {
  Select,
  SelectItem,
  SelectContent,
  SelectValue,
  SelectTrigger
} from "@/components/ui/select";

export function SelectCategory() {
  return (
    <Select>
      <SelectTrigger className="w-54 py-0">
        <SelectValue placeholder="Filter by category" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="electronics">Electronics</SelectItem>
        <SelectItem value="furniture">Furniture</SelectItem>
        <SelectItem value="home">Home</SelectItem>
        <SelectItem value="outdoors">Outdoors</SelectItem>
        <SelectItem value="sports">Sports</SelectItem>
        <SelectItem value="toys">Toys</SelectItem>
        <SelectItem value="other">Other</SelectItem>
      </SelectContent>
    </Select>
  )
}
