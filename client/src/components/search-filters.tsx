import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { RESOURCE_TYPES } from "@shared/schema";
import { Search } from "lucide-react";

interface SearchFiltersProps {
  filters: {
    type: string[];
    query: string;
    available: boolean;
  };
  onFiltersChange: (filters: SearchFiltersProps["filters"]) => void;
  showAvailableToggle?: boolean;
}

export function SearchFilters({ 
  filters, 
  onFiltersChange,
  showAvailableToggle = true,
}: SearchFiltersProps) {
  const toggleType = (type: string) => {
    const newTypes = filters.type.includes(type)
      ? filters.type.filter((t) => t !== type)
      : [...filters.type, type];
    onFiltersChange({ ...filters, type: newTypes });
  };

  return (
    <div className="w-full space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search resources..."
          value={filters.query}
          onChange={(e) => onFiltersChange({ ...filters, query: e.target.value })}
          className="pl-10"
        />
      </div>

      <div className="flex flex-wrap gap-2">
        {RESOURCE_TYPES.map((type) => (
          <Badge
            key={type}
            variant={filters.type.includes(type) ? "default" : "outline"}
            className="cursor-pointer"
            onClick={() => toggleType(type)}
          >
            {type.charAt(0).toUpperCase() + type.slice(1)}
          </Badge>
        ))}
      </div>

      {showAvailableToggle && (
        <div className="flex items-center space-x-2">
          <Switch
            checked={filters.available}
            onCheckedChange={(checked) =>
              onFiltersChange({ ...filters, available: checked })
            }
          />
          <span className="text-sm text-muted-foreground">
            Show available only
          </span>
        </div>
      )}
    </div>
  );
}