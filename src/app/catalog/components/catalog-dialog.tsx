"use client"

import { useState, useCallback, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogPortal,
  DialogOverlay
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

const formSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  sku: z.string().min(1, "SKU is required"),
  categories: z.array(z.string()),
  price: z.coerce.number().min(0, "Price must be a positive number"),
  unitCost: z.coerce.number().min(0, "Unit cost must be a positive number"),
  quantity: z.coerce.number().min(0, "Quantity must be a positive number"),
  reorderPoint: z.coerce.number().min(0, "Reorder point must be a positive number"),
  vendorId: z.string().optional(),
  trackInventory: z.boolean(),
  sellable: z.boolean(),
  stockable: z.boolean(),
  isTaxable: z.boolean(),
  visibility: z.enum(["PUBLIC", "PRIVATE", "PICKUP_ONLY"]),
  variations: z.array(z.object({
    id: z.string().optional(),
    name: z.string().min(1, "Name is required"),
    sku: z.string().min(1, "SKU is required"),
    price: z.coerce.number().min(0, "Price must be a positive number"),
    unitCost: z.coerce.number().min(0, "Unit cost must be a positive number"),
    ordinal: z.coerce.number().min(0),
    trackInventory: z.boolean(),
    sellable: z.boolean(),
    stockable: z.boolean()
  }))
})

type FormValues = z.infer<typeof formSchema>

interface CatalogDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  item?: any
  categories: Array<{ value: string; label: string }>
}

export function CatalogDialog({ 
  open, 
  onOpenChange, 
  item,
  categories 
}: CatalogDialogProps) {
  const [loading, setLoading] = useState(false)
  const [showVariations, setShowVariations] = useState(false)

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      description: "",
      sku: "",
      categories: [],
      price: 0,
      unitCost: 0,
      quantity: 0,
      reorderPoint: 0,
      vendorId: "",
      trackInventory: false,
      sellable: false,
      stockable: false,
      isTaxable: false,
      visibility: "PRIVATE",
      variations: []
    },
  })

  useEffect(() => {
    if (item && open) {
      console.log('Setting form values:', item)
      form.reset({
        name: item.name || "",
        description: item.description || "",
        sku: item.sku || "",
        categories: item.categoryIds || [],
        price: item.price || 0,
        unitCost: item.unitCost || 0,
        quantity: item.quantity || 0,
        reorderPoint: item.reorderPoint || 0,
        vendorId: item.vendorId || "",
        trackInventory: item.trackInventory || false,
        sellable: item.sellable || false,
        stockable: item.stockable || false,
        isTaxable: item.isTaxable || false,
        visibility: item.visibility || "PRIVATE",
        variations: item.variations || []
      })
    }
  }, [item, open, form])

  const onSubmit = useCallback(async (values: FormValues) => {
    try {
      setLoading(true)
      console.log('Submitting form:', values)
      
      const response = await fetch(`/api/square/catalog/${item.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(values),
      })

      if (!response.ok) {
        throw new Error('Failed to update item')
      }

      onOpenChange(false)
      form.reset()
    } catch (error) {
      console.error("Error submitting form:", error)
    } finally {
      setLoading(false)
    }
  }, [onOpenChange, form, item])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogOverlay className="bg-black/50" />
      <DialogPortal>
        <DialogContent className="sm:max-w-[600px] overflow-y-auto max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Edit Catalog Item</DialogTitle>
            <DialogDescription>
              Update the details of this catalog item
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="flex justify-end space-x-2 mb-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowVariations(false)}
                  className={!showVariations ? "bg-secondary" : ""}
                >
                  Details
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowVariations(true)}
                  className={showVariations ? "bg-secondary" : ""}
                >
                  Variations ({item?.variations?.length || 0})
                </Button>
              </div>

              {!showVariations ? (
                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Name</FormLabel>
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
                          <textarea 
                            {...field}
                            className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="sku"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>SKU</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="categories"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Categories</FormLabel>
                          <Select 
                            onValueChange={(value) => field.onChange([value])}
                            value={field.value?.[0]}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select a category" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {categories.map((category) => (
                                <SelectItem key={category.value} value={category.value}>
                                  {category.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="price"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Price</FormLabel>
                          <FormControl>
                            <Input type="number" step="0.01" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="unitCost"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Unit Cost</FormLabel>
                          <FormControl>
                            <Input type="number" step="0.01" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="quantity"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Quantity</FormLabel>
                          <FormControl>
                            <Input type="number" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="reorderPoint"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Reorder Point</FormLabel>
                          <FormControl>
                            <Input type="number" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="visibility"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Visibility</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="PUBLIC">Public</SelectItem>
                              <SelectItem value="PRIVATE">Private</SelectItem>
                              <SelectItem value="PICKUP_ONLY">Pickup Only</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="vendorId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Vendor ID</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="trackInventory"
                      render={({ field }) => (
                        <FormItem className="flex items-center space-x-2">
                          <FormControl>
                            <input
                              type="checkbox"
                              checked={field.value}
                              onChange={field.onChange}
                              className="h-4 w-4"
                            />
                          </FormControl>
                          <FormLabel className="!mt-0">Track Inventory</FormLabel>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="sellable"
                      render={({ field }) => (
                        <FormItem className="flex items-center space-x-2">
                          <FormControl>
                            <input
                              type="checkbox"
                              checked={field.value}
                              onChange={field.onChange}
                              className="h-4 w-4"
                            />
                          </FormControl>
                          <FormLabel className="!mt-0">Sellable</FormLabel>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="stockable"
                      render={({ field }) => (
                        <FormItem className="flex items-center space-x-2">
                          <FormControl>
                            <input
                              type="checkbox"
                              checked={field.value}
                              onChange={field.onChange}
                              className="h-4 w-4"
                            />
                          </FormControl>
                          <FormLabel className="!mt-0">Stockable</FormLabel>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="isTaxable"
                      render={({ field }) => (
                        <FormItem className="flex items-center space-x-2">
                          <FormControl>
                            <input
                              type="checkbox"
                              checked={field.value}
                              onChange={field.onChange}
                              className="h-4 w-4"
                            />
                          </FormControl>
                          <FormLabel className="!mt-0">Taxable</FormLabel>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {item?.variations?.map((variation: any, index: number) => (
                    <div key={variation.id} className="space-y-4 p-4 border rounded-lg mb-4">
                      <div className="flex justify-between items-center">
                        <h4 className="text-sm font-medium">Variation {index + 1}</h4>
                        <div className="text-sm text-muted-foreground">
                          ID: {variation.id}
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name={`variations.${index}.name`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Name</FormLabel>
                              <FormControl>
                                <Input {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name={`variations.${index}.sku`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>SKU</FormLabel>
                              <FormControl>
                                <Input {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name={`variations.${index}.price`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Price</FormLabel>
                              <FormControl>
                                <Input type="number" step="0.01" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name={`variations.${index}.unitCost`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Unit Cost</FormLabel>
                              <FormControl>
                                <Input type="number" step="0.01" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      <div className="grid grid-cols-3 gap-4">
                        <FormField
                          control={form.control}
                          name={`variations.${index}.trackInventory`}
                          render={({ field }) => (
                            <FormItem className="flex items-center space-x-2">
                              <FormControl>
                                <input
                                  type="checkbox"
                                  checked={field.value}
                                  onChange={field.onChange}
                                  className="h-4 w-4"
                                />
                              </FormControl>
                              <FormLabel className="!mt-0">Track</FormLabel>
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name={`variations.${index}.sellable`}
                          render={({ field }) => (
                            <FormItem className="flex items-center space-x-2">
                              <FormControl>
                                <input
                                  type="checkbox"
                                  checked={field.value}
                                  onChange={field.onChange}
                                  className="h-4 w-4"
                                />
                              </FormControl>
                              <FormLabel className="!mt-0">Sellable</FormLabel>
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name={`variations.${index}.stockable`}
                          render={({ field }) => (
                            <FormItem className="flex items-center space-x-2">
                              <FormControl>
                                <input
                                  type="checkbox"
                                  checked={field.value}
                                  onChange={field.onChange}
                                  className="h-4 w-4"
                                />
                              </FormControl>
                              <FormLabel className="!mt-0">Stockable</FormLabel>
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <DialogFooter>
                <Button 
                  type="submit" 
                  disabled={loading}
                  className="relative"
                >
                  {loading ? "Saving..." : "Save Changes"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </DialogPortal>
    </Dialog>
  )
}
