import { Resource} from "@shared/schema";
import { Card, CardContent, CardHeader, CardFooter } from "./ui/card";
import { Badge } from "./ui/badge";
import { Phone, Mail, Pencil, Trash2, Plus, Minus } from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useAuth } from "@/hooks/use-auth";
import { useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { EditResourceForm } from "./edit-resource-form";
import { useState, useEffect } from "react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from "@/components/ui/carousel";

interface ResourceCardProps {
  resource: Resource & {
    isWatched?: boolean;
  };
  showEditControls?: boolean;
  onToggleAvailability?: (available: boolean) => void;
  onDelete?: () => void;
}

export function ResourceCard({
  resource,
  showEditControls = false,
  onToggleAvailability,
  onDelete,
}: ResourceCardProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const isOwner = user?.id === resource.userId;
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(0);
  const [count, setCount] = useState(0);

  const addToWatchlistMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/watchlist/${resource.id}`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to add to watchlist');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/watchlist"] });
      toast({
        title: "Added to watchlist",
        description: "Resource has been added to your watchlist",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const removeFromWatchlistMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/watchlist/${resource.id}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to remove from watchlist');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/watchlist"] });
      toast({
        title: "Removed from watchlist",
        description: "Resource has been removed from your watchlist",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const toggleAvailability = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/resources/${resource.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ available: !resource.available }),
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });
      if (!response.ok) {
        throw new Error('Failed to update resource availability');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/resources"] });
      queryClient.invalidateQueries({ queryKey: ["/api/resources/owned"] });
      if (onToggleAvailability) {
        onToggleAvailability(!resource.available);
      }
      toast({
        title: "Resource updated",
        description: `Resource is now ${!resource.available ? "available" : "unavailable"}.`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Update failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  useEffect(() => {
    if (!api) return;

    setCount(api.scrollSnapList().length);
    setCurrent(api.selectedScrollSnap());

    const onSelect = () => {
      setCurrent(api.selectedScrollSnap());
    };

    api.on("select", onSelect);
    return () => {
      api.off("select", onSelect);
    };
  }, [api]);

  return (
    <Card className="h-full flex flex-col">
      {resource.imageUrls && resource.imageUrls.length > 0 && (
        <div className="w-full h-[300px] overflow-hidden">
          <Carousel
            className="w-full h-full"
            opts={{
              align: 'start',
              loop: true,
            }}
            setApi={setApi}
          >
            <CarouselContent className="-ml-1">
              {resource.imageUrls.map((url, index) => (
                <CarouselItem key={index} className="pl-1 relative h-[300px]">
                  <img
                    src={url}
                    alt={`${resource.title} - Image ${index + 1}`}
                    className="w-full h-full object-cover rounded-t-lg"
                  />
                </CarouselItem>
              ))}
            </CarouselContent>
            {resource.imageUrls.length > 1 && (
              <>
                <CarouselPrevious
                  className="left-2"
                  disabled={current === 0}
                />
                <CarouselNext
                  className="right-2"
                  disabled={current === count - 1}
                />
              </>
            )}
          </Carousel>
        </div>
      )}

      <CardHeader>
        <div className="flex justify-between items-start">
          <div className="flex-grow">
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-semibold">{resource.title}</h3>
              {isOwner && !showEditControls && (
                <Badge variant="secondary" className="text-xs">
                  Your Resource
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              {resource.types.join(", ")}
            </p>
          </div>
          <div className="flex gap-2">
            {showEditControls ? (
              <>
                <Sheet open={isEditOpen} onOpenChange={setIsEditOpen}>
                  <SheetTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <Pencil className="h-4 w-4" />
                    </Button>
                  </SheetTrigger>
                  <SheetContent className="flex flex-col h-full p-6">
                    <div className="text-lg font-semibold mb-4">Edit Resource</div>
                    <div className="flex-grow overflow-hidden">
                      <EditResourceForm
                        resource={resource}
                        onSuccess={() => setIsEditOpen(false)}
                      />
                    </div>
                  </SheetContent>
                </Sheet>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onDelete}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </>
            ) : null}
            <Badge
              variant={resource.available ? "default" : "secondary"}
              className={isOwner && showEditControls ?
                "transition-colors duration-200 cursor-pointer hover:bg-primary/90 flex items-center gap-1"
                : undefined
              }
              onClick={isOwner && showEditControls ? () => toggleAvailability.mutate() : undefined}
            >
              {isOwner && showEditControls && (
                <span className="w-2 h-2 rounded-full bg-current inline-block" />
              )}
              {resource.available ? "Available" : "Unavailable"}
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex-grow">
        <p className="text-sm mb-4">{resource.description}</p>
        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2">
            <span>{format(new Date(resource.createdAt), "PPp")}</span>
          </div>

          {resource.capacity && (
            <div className="flex items-center gap-2">
              <span>Capacity: {resource.capacity} people</span>
            </div>
          )}

   
        </div>
      </CardContent>

      <CardFooter className="flex flex-col gap-4 w-full">
        <p className="text-sm text-muted-foreground w-full">
          Location: {resource.location}
        </p>

        {!isOwner && !showEditControls && (
          <>
            {resource.isWatched ? (
              <Button
                className="w-full"
                variant="outline"
                onClick={() => removeFromWatchlistMutation.mutate()}
                disabled={removeFromWatchlistMutation.isPending}
              >
                <Minus className="h-4 w-4 mr-2" />
                Remove from Watchlist
              </Button>
            ) : (
              <Button
                className="w-full"
                variant="outline"
                onClick={() => addToWatchlistMutation.mutate()}
                disabled={addToWatchlistMutation.isPending}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add to Watchlist
              </Button>
            )}
          </>
        )}

        <Dialog>
          <DialogTrigger asChild>
            <Button
              className="w-full"
              variant={resource.available ? "default" : "secondary"}
              disabled={!resource.available}
            >
              Contact Provider
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Contact Information</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              {resource.phone && (
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  <a href={`tel:${resource.phone}`} className="text-primary hover:underline">
                    {resource.phone}
                  </a>
                </div>
              )}
              {resource.email && (
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  <a href={`mailto:${resource.email}`} className="text-primary hover:underline">
                    {resource.email}
                  </a>
                </div>
              )}
              {!resource.phone && !resource.email && (
                <p className="text-sm text-muted-foreground">
                  No contact information provided.
                </p>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </CardFooter>
    </Card>
  );
}