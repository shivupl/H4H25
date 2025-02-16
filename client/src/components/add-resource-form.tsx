import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { insertResourceSchema, RESOURCE_TYPES, InsertResource } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Label } from "@/components/ui/label";
import { Loader2, Crosshair } from "lucide-react";
import { useState, useRef, useEffect } from 'react';

interface AddResourceFormProps {
  onSuccess?: () => void;
}

export function AddResourceForm({ onSuccess }: AddResourceFormProps) {
  const { toast } = useToast();
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isLocating, setIsLocating] = useState(false);

  const form = useForm<InsertResource>({
    resolver: zodResolver(insertResourceSchema),
    defaultValues: {
      types: [],
      title: "",
      description: "",
      location: "",
      latitude: "",
      longitude: "",
      capacity: 0,
      email: "",
      phone: "",
      imageUrls: null,
    },
  });

  // Watch the types field to show/hide capacity
  const selectedTypes = form.watch("types");
  const isShelter = selectedTypes.includes("shelter");

  // Reset capacity when shelter is deselected
  useEffect(() => {
    if (!isShelter) {
      form.setValue("capacity", 0);
    }
  }, [isShelter, form]);

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);

    // Check if any file is too large
    const tooLargeFiles = files.filter(file => file.size > 5 * 1024 * 1024);
    if (tooLargeFiles.length > 0) {
      toast({
        title: "File too large",
        description: "Please select images under 5MB each",
        variant: "destructive",
      });
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      setImagePreview(null);
      return;
    }

    if (files.length > 0) {
      // Preview the first image
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(files[0]);
    }
  };

  const getCurrentLocation = () => {
    setIsLocating(true);
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          form.setValue("latitude", latitude.toString());
          form.setValue("longitude", longitude.toString());

          // Get address using reverse geocoding
          fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`)
            .then(res => res.json())
            .then(data => {
              form.setValue("location", data.display_name);
            })
            .catch(() => {
              form.setValue("location", `${latitude}, ${longitude}`);
            })
            .finally(() => {
              setIsLocating(false);
            });
        },
        (error) => {
          toast({
            title: "Location Error",
            description: "Could not get your current location. Please enter it manually.",
            variant: "destructive",
          });
          setIsLocating(false);
        }
      );
    } else {
      toast({
        title: "Location Not Supported",
        description: "Your browser doesn't support geolocation.",
        variant: "destructive",
      });
      setIsLocating(false);
    }
  };

  const createResource = useMutation({
    mutationFn: async (data: InsertResource) => {
      const formData = new FormData();

      // Add all form fields to FormData
      Object.entries(data).forEach(([key, value]) => {
        if (value !== null && value !== undefined && key !== 'imageUrls') {
          if (key === 'types' && Array.isArray(value)) {
            value.forEach((type) => formData.append('types', type));
          } else {
            formData.append(key, String(value));
          }
        }
      });

      // Add the image files if they exist
      if (fileInputRef.current?.files) {
        Array.from(fileInputRef.current.files).forEach(file => {
          formData.append('images', file);
        });
      }

      const res = await fetch('/api/resources', {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Failed to create resource');
      }

      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/resources"] });
      queryClient.invalidateQueries({ queryKey: ["/api/resources/owned"] });
      toast({
        title: "Resource added",
        description: "Your resource has been successfully added.",
      });
      form.reset();
      setImagePreview(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      onSuccess?.();
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to add resource",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return (
    <div className="h-full flex flex-col">
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit((data) => createResource.mutate(data))}
          className="space-y-6 flex-1 overflow-y-auto pb-6"
        >
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Add New Resource</h2>

            <FormField
              control={form.control}
              name="types"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Resource Types</FormLabel>
                  <FormControl>
                    <div className="flex flex-wrap gap-2">
                      {RESOURCE_TYPES.map((type) => (
                        <Button
                          key={type}
                          type="button"
                          variant={field.value.includes(type) ? "default" : "outline"}
                          onClick={() => {
                            const newTypes = field.value.includes(type)
                              ? field.value.filter((t) => t !== type)
                              : [...field.value, type];
                            field.onChange(newTypes);
                          }}
                        >
                          {type.charAt(0).toUpperCase() + type.slice(1)}
                        </Button>
                      ))}
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Only show capacity field if shelter is selected */}
            {isShelter && (
              <FormField
                control={form.control}
                name="capacity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Capacity (number of people)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="0"
                        {...field}
                        onChange={(e) => {
                          const value = e.target.value === '' ? 0 : Math.max(0, parseInt(e.target.value, 10));
                          field.onChange(value);
                        }}
                        value={field.value || ''}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <FormField
              control={form.control}
              name="location"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Location Description</FormLabel>
                  <div className="flex gap-2">
                    <FormControl>
                      <Input {...field} placeholder="E.g., 123 Main St, City" />
                    </FormControl>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={getCurrentLocation}
                      disabled={isLocating}
                    >
                      {isLocating ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Crosshair className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Contact Email</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      {...field}
                      value={field.value || ''}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Contact Phone</FormLabel>
                  <FormControl>
                    <Input
                      type="tel"
                      {...field}
                      value={field.value || ''}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-2">
              <Label>Resource Images (Max 5 images, 5MB each)</Label>
              <Input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageChange}
                className="cursor-pointer"
              />
              {imagePreview && (
                <div className="mt-2 relative aspect-video rounded-lg overflow-hidden bg-muted">
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="object-cover w-full h-full"
                  />
                </div>
              )}
            </div>
          </div>
        </form>
      </Form>

      <div className="flex-shrink-0 p-4 bg-background border-t">
        <Button
          type="submit"
          className="w-full"
          disabled={createResource.isPending}
          onClick={form.handleSubmit((data) => createResource.mutate(data))}
        >
          {createResource.isPending && (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          )}
          Add Resource
        </Button>
      </div>
    </div>
  );
}