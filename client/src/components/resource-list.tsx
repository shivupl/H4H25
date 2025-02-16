import { useMutation } from "@tanstack/react-query";
import { Resource, Rating } from "@shared/schema";
import { ResourceCard } from "./resource-card";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useState } from "react";

interface ResourceListProps {
  filters: {
    type: string[];
    query: string;
    available: boolean;
  };
  resources: Resource[];
  showEditControls?: boolean;
}

export function ResourceList({ filters, resources, showEditControls = false }: ResourceListProps) {
  const { toast } = useToast();
  const [resourceToDelete, setResourceToDelete] = useState<number | null>(null);

  const deleteResourceMutation = useMutation({
    mutationFn: async (resourceId: number) => {
      const response = await fetch(`/api/resources/${resourceId}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to delete resource');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/resources"] });
      queryClient.invalidateQueries({ queryKey: ["/api/resources/owned"] });
      toast({
        title: "Resource deleted",
        description: "The resource has been successfully deleted.",
      });
      setResourceToDelete(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Error deleting resource",
        description: error.message,
        variant: "destructive",
      });
      setResourceToDelete(null);
    },
  });

  if (!resources?.length) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">No resources found</p>
      </div>
    );
  }

  const filteredResources = resources.filter((resource) => {
    const matchesType = !filters.type.length || 
      resource.types.some(type => filters.type.includes(type));
    const matchesQuery = !filters.query || 
      resource.title.toLowerCase().includes(filters.query.toLowerCase()) ||
      resource.description.toLowerCase().includes(filters.query.toLowerCase()) ||
      resource.location.toLowerCase().includes(filters.query.toLowerCase());
    const matchesAvailability = !filters.available || resource.available;

    return matchesType && matchesQuery && matchesAvailability;
  });

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredResources.map((resource) => (
          <ResourceCard
            key={resource.id}
            resource={resource}
            showEditControls={showEditControls}
            onDelete={() => setResourceToDelete(resource.id)}
          />
        ))}
      </div>

      <AlertDialog open={resourceToDelete !== null} onOpenChange={() => setResourceToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this resource. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => resourceToDelete && deleteResourceMutation.mutate(resourceToDelete)}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}