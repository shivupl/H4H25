import { useQuery } from "@tanstack/react-query";
import { Resource } from "@shared/schema";
import { ResourceList } from "@/components/resource-list";
import { SearchFilters } from "@/components/search-filters";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { NavigationBar } from "@/components/navigation-bar";

interface FilterState {
  type: string[];
  query: string;
  available: boolean;
}

interface WatchlistResource extends Resource {
  isWatched: boolean;
}

export default function WatchlistPage() {
  const { toast } = useToast();
  const [filters, setFilters] = useState<FilterState>({
    type: [],
    query: "",
    available: false,
  });

  const { data: resources, isLoading, error } = useQuery<WatchlistResource[]>({
    queryKey: ["/api/watchlist"],
    queryFn: async () => {
      const response = await fetch("/api/watchlist", {
        credentials: 'include',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch watchlist');
      }

      return response.json();
    },
  });

  if (error) {
    toast({
      title: "Error loading watchlist",
      description: error instanceof Error ? error.message : "Unknown error occurred",
      variant: "destructive",
    });
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <NavigationBar title="Your Watchlist" />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col gap-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <SearchFilters 
              filters={filters} 
              onFiltersChange={setFilters}
              showAvailableToggle={true}
            />
          </div>

          <ResourceList 
            filters={filters} 
            resources={resources || []}
            showEditControls={false}
          />
        </div>
      </main>
    </div>
  );
}