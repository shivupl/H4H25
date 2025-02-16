import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Resource } from "@shared/schema";
import { ResourceList } from "@/components/resource-list";
import { SearchFilters } from "@/components/search-filters";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { NavigationBar } from "@/components/navigation-bar";

interface FilterState {
  type: string[];
  query: string;
  available: boolean;
}

interface OwnedResource extends Resource {
  isWatched?: boolean;
}

export default function OwnedResourcesPage() {
  const { toast } = useToast();
  const [filters, setFilters] = useState<FilterState>({
    type: [],
    query: "",
    available: true,
  });

  const { data: resources, isLoading, error } = useQuery<OwnedResource[]>({
    queryKey: ["/api/resources/owned"],
    staleTime: 0,
    refetchOnMount: true
   /* queryFn: async () => {
      const response = await fetch("/api/resources/owned", {
        credentials: 'include',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch owned resources');
      }

      return response.json();
    },*/
  });

  if (error) {
    toast({
      title: "Error loading resources",
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
      <NavigationBar title="Your Resources" />

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
            showEditControls={true}
          />
        </div>
      </main>
    </div>
  );
}