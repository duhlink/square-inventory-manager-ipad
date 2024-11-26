"use client"

import { NavBar } from "@/components/ui/nav-bar"

export default function SettingsPage() {
  return (
    <div className="fixed inset-0 flex flex-col bg-background">
      <NavBar />
      <div className="flex-1 p-6 overflow-auto">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-6">Settings</h1>
          
          <div className="space-y-6">
            {/* General Settings */}
            <div className="bg-card rounded-lg shadow-sm p-6 border">
              <h2 className="text-xl font-semibold mb-4">General Settings</h2>
              <div className="space-y-4">
                <div className="grid gap-2">
                  <label className="text-sm font-medium">Company Name</label>
                  <input 
                    type="text" 
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    placeholder="Enter company name"
                  />
                </div>
                <div className="grid gap-2">
                  <label className="text-sm font-medium">Time Zone</label>
                  <select className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring">
                    <option>Pacific Time (PT)</option>
                    <option>Mountain Time (MT)</option>
                    <option>Central Time (CT)</option>
                    <option>Eastern Time (ET)</option>
                  </select>
                </div>
                <div className="flex items-center gap-2">
                  <input type="checkbox" id="notifications" className="h-4 w-4 rounded border-gray-300" />
                  <label htmlFor="notifications" className="text-sm font-medium">
                    Enable Email Notifications
                  </label>
                </div>
              </div>
            </div>

            {/* Inventory Settings */}
            <div className="bg-card rounded-lg shadow-sm p-6 border">
              <h2 className="text-xl font-semibold mb-4">Inventory Settings</h2>
              <div className="space-y-4">
                <div className="grid gap-2">
                  <label className="text-sm font-medium">Default Reorder Point</label>
                  <input 
                    type="number" 
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    placeholder="Enter default reorder point"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <input type="checkbox" id="autoReorder" className="h-4 w-4 rounded border-gray-300" />
                  <label htmlFor="autoReorder" className="text-sm font-medium">
                    Enable Automatic Reordering
                  </label>
                </div>
              </div>
            </div>

            {/* Integration Settings */}
            <div className="bg-card rounded-lg shadow-sm p-6 border">
              <h2 className="text-xl font-semibold mb-4">Integrations</h2>
              <div className="space-y-4">
                {[
                  { name: "Square POS", connected: true },
                  { name: "QuickBooks", connected: false },
                  { name: "Shopify", connected: false }
                ].map((integration, i) => (
                  <div key={i} className="flex items-center justify-between py-2">
                    <div>
                      <h3 className="font-medium">{integration.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {integration.connected ? "Connected" : "Not connected"}
                      </p>
                    </div>
                    <button className={`px-4 py-2 rounded-md text-sm ${
                      integration.connected
                        ? "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                        : "bg-primary text-primary-foreground hover:bg-primary/90"
                    }`}>
                      {integration.connected ? "Disconnect" : "Connect"}
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Save Button */}
            <div className="flex justify-end">
              <button className="bg-primary text-primary-foreground px-6 py-2 rounded-md hover:bg-primary/90">
                Save Changes
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
