import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Plus } from "lucide-react";
import { AddResourceForm } from "@/components/add-resource-form";
import { ResourceList } from "@/components/resource-list";
import { SearchFilters } from "@/components/search-filters";
import { useQuery } from "@tanstack/react-query";
import { Resource } from "@shared/schema";
import { NavigationBar } from "@/components/navigation-bar";

export default function HomePage() {
  const [filters, setFilters] = useState({
    type: [] as string[],
    query: "",
    available: false,
  });
  const [isAddResourceOpen, setIsAddResourceOpen] = useState(false);

  const { data: resources = [] } = useQuery<Resource[]>({
    queryKey: ["/api/resources"],
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <NavigationBar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col gap-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <SearchFilters
              filters={filters}
              onFiltersChange={setFilters}
              showAvailableToggle={true}
            />

            <Sheet open={isAddResourceOpen} onOpenChange={setIsAddResourceOpen}>
              <SheetTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Resource
                </Button>
              </SheetTrigger>
              <SheetContent>
                <AddResourceForm onSuccess={() => setIsAddResourceOpen(false)} />
              </SheetContent>
            </Sheet>
          </div>

          <ResourceList
            filters={filters}
            resources={resources}
            showEditControls={false}
          />
        </div>
      </main>
    </div>
  );
}