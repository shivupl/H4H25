import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Resource, insertResourceSchema, RESOURCE_TYPES } from "@shared/schema";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Crosshair } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import * as z from 'zod';

interface EditResourceFormProps {
  resource: Resource;
  onSuccess?: () => void;
}

const editResourceSchema = insertResourceSchema.extend({
  imageUrls: z.array(z.string()).optional(),
});

type EditResourceFormData = z.infer<typeof editResourceSchema>;

export function EditResourceForm({ resource, onSuccess }: EditResourceFormProps) {
  const { toast } = useToast();
  const [isLocating, setIsLocating] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<EditResourceFormData>({
    resolver: zodResolver(editResourceSchema),
    defaultValues: {
      title: resource.title,
      description: resource.description,
      types: resource.types,
      location: resource.location,
      capacity: resource.capacity,
      email: resource.email,
      phone: resource.phone,
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

  const updateMutation = useMutation({
    mutationFn: async (data: EditResourceFormData) => {
      console.log("Submitting form with data:", data); // Debug log

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

      // Add image files if they exist
      if (fileInputRef.current?.files?.length) {
        Array.from(fileInputRef.current.files).forEach(file => {
          formData.append('images', file);
        });
      }

      const response = await fetch(`/api/resources/${resource.id}`, {
        method: "PATCH",
        body: formData,
        credentials: 'include',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update resource');
      }

      return response.json();
    },
    onSuccess: () => {
      // Invalidate all relevant queries to refresh data everywhere
      queryClient.invalidateQueries({ queryKey: ["/api/resources"] });
      queryClient.invalidateQueries({ queryKey: ["/api/resources/owned"] });
      queryClient.invalidateQueries({ queryKey: ["/api/watchlist"] });

      toast({
        title: "Success",
        description: "Resource updated successfully.",
      });

      // Reset form and close dialog
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      if (onSuccess) {
        onSuccess();
      }
    },
    onError: (error: Error) => {
      console.error("Update error:", error); // Debug log
      toast({
        title: "Error updating resource",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return (
    <Form {...form}>
      <form className="space-y-6 h-full flex flex-col">
        <ScrollArea className="flex-grow pr-4">
          <div className="space-y-4">
            <div>
              <h4 className="mb-2">Resource Types</h4>
              <div className="flex flex-wrap gap-2">
                {RESOURCE_TYPES.map((type) => (
                  <Badge
                    key={type}
                    variant={form.getValues("types")?.includes(type) ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() => {
                      const currentTypes = form.getValues("types") || [];
                      const newTypes = currentTypes.includes(type)
                        ? currentTypes.filter((t) => t !== type)
                        : [...currentTypes, type];
                      form.setValue("types", newTypes, { shouldValidate: true });
                    }}
                  >
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </Badge>
                ))}
              </div>
              <FormMessage>{form.formState.errors.types?.message}</FormMessage>
            </div>

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

            <FormField
              control={form.control}
              name="location"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Location</FormLabel>
                  <div className="flex gap-2">
                    <FormControl>
                      <Input {...field} placeholder="E.g., 123 Main St, City" />
                    </FormControl>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setIsLocating(true);
                        if ("geolocation" in navigator) {
                          navigator.geolocation.getCurrentPosition(
                            (position) => {
                              const { latitude, longitude } = position.coords;
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
                      }}
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
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email (optional)</FormLabel>
                  <FormControl>
                    <Input type="email" {...field} value={field.value ?? ''} />
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
                  <FormLabel>Phone (optional)</FormLabel>
                  <FormControl>
                    <Input type="tel" {...field} value={field.value ?? ''} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div>
              <FormLabel>Add Images (optional)</FormLabel>
              <Input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={(e) => {
                  const files = Array.from(e.target.files || []);
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
                    return;
                  }
                }}
                className="cursor-pointer"
              />
            </div>

            {resource.imageUrls && resource.imageUrls.length > 0 && (
              <div>
                <FormLabel>Current Images</FormLabel>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {resource.imageUrls.map((url, index) => (
                    <img
                      key={index}
                      src={url}
                      alt={`Resource image ${index + 1}`}
                      className="w-full h-32 object-cover rounded-md"
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        <Button
          type="button"
          className="w-full"
          disabled={updateMutation.isPending}
          onClick={() => {
            const formData = form.getValues();
            console.log("Form data before submission:", formData);
            updateMutation.mutate(formData);
          }}
        >
          {updateMutation.isPending && (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          )}
          Save Changes
        </Button>
      </form>
    </Form>
  );
}