"use client"

import { NavBar } from "@/components/ui/nav-bar"

export default function PurchaseOrdersPage() {
  return (
    <div className="fixed inset-0 flex flex-col bg-background">
      <NavBar />
      <div className="flex-1 p-6 overflow-auto">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold mb-6">Purchase Orders</h1>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-card rounded-lg shadow-sm p-6 border">
                <h3 className="text-lg font-semibold mb-2">Purchase Order #{i}</h3>
                <p className="text-muted-foreground mb-4">Created: {new Date().toLocaleDateString()}</p>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Status:</span>
                    <span className="font-medium">Pending</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Items:</span>
                    <span className="font-medium">{i * 3}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total:</span>
                    <span className="font-medium">${(i * 100).toFixed(2)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
