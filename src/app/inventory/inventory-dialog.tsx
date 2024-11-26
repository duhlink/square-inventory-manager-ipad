"use client"

import { useState, useCallback } from "react"
import { useHotkeys } from "@/hooks/use-hotkeys"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { InventoryItem } from "./types"
import { useInventory } from "./inventory-context"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
  categories: z.array(z.string()).min(1, "At least one category is required"),
  price: z.coerce.number().min(0, "Price must be a positive number"),
  unitCost: z.coerce.number().min(0, "Cost must be a positive number"),
  quantity: z.coerce.number().min(0, "Quantity must be a positive number"),
  reorderPoint: z.coerce.number().min(0, "Reorder point must be a positive number"),
  vendorId: z.string().min(1, "Vendor is required"),
  vendorName: z.string().min(1, "Vendor name is required"),
  unitType: z.string().min(1, "Unit type is required"),
  trackInventory: z.boolean().default(true),
  visibility: z.enum(['PUBLIC', 'PRIVATE']).default('PUBLIC'),
  isTaxable: z.boolean().default(true)
})

type FormValues = z.infer<typeof formSchema>

interface InventoryDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  item?: InventoryItem
}

export function InventoryDialog({ open, onOpenChange, item }: InventoryDialogProps) {
  const { addItem, updateItem } = useInventory()
  const [loading, setLoading] = useState(false)

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: item?.name || "",
      description: item?.description || "",
      sku: item?.sku || "",
      categories: item?.categories || [],
      price: item?.price || 0,
      unitCost: item?.unitCost || 0,
      quantity: item?.quantity || 0,
      reorderPoint: item?.reorderPoint || 0,
      vendorId: item?.vendorId || "",
      vendorName: item?.vendorName || "",
      unitType: item?.unitType || "",
      trackInventory: item?.trackInventory ?? true,
      visibility: item?.visibility || 'PUBLIC',
      isTaxable: item?.isTaxable ?? true
    },
  })

  const onSubmit = useCallback(async (values: FormValues) => {
    try {
      setLoading(true)
      if (item) {
        await updateItem({
          ...item,
          ...values,
        })
      } else {
        await addItem(values)
      }
      onOpenChange(false)
      form.reset()
    } catch (error) {
      console.error("Error submitting form:", error)
    } finally {
      setLoading(false)
    }
  }, [item, updateItem, addItem, onOpenChange, form])

  useHotkeys({
    'ctrl+s': (e) => {
      if (open) {
        e.preventDefault()
        form.handleSubmit(onSubmit)()
      }
    }
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{item ? "Edit" : "Add"} Inventory Item</DialogTitle>
          <DialogDescription>
            {item ? "Update the details of an existing item" : "Add a new item to your inventory"}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
                      className="flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      placeholder="Enter item description..."
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
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
                    defaultValue={field.value?.[0]}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="beverages">Beverages</SelectItem>
                      <SelectItem value="snacks">Snacks</SelectItem>
                      <SelectItem value="groceries">Groceries</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
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
            <FormField
              control={form.control}
              name="vendorName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Vendor Name</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="unitType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Unit Type</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a unit type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="each">Each</SelectItem>
                      <SelectItem value="pound">Pound</SelectItem>
                      <SelectItem value="ounce">Ounce</SelectItem>
                      <SelectItem value="case">Case</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button 
                type="submit" 
                disabled={loading}
                className="relative"
              >
                {loading ? "Saving..." : item ? "Save Changes" : "Add Item"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
