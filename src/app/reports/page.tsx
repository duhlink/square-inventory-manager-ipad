"use client"

import { NavBar } from "@/components/ui/nav-bar"

export default function ReportsPage() {
  return (
    <div className="fixed inset-0 flex flex-col bg-background">
      <NavBar />
      <div className="flex-1 p-6 overflow-auto">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold mb-6">Reports</h1>
          
          {/* Stats Overview */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
            {[
              { label: "Total Sales", value: "$12,345", change: "+12%" },
              { label: "Orders", value: "156", change: "+5%" },
              { label: "Inventory Value", value: "$45,678", change: "-2%" },
              { label: "Active SKUs", value: "234", change: "+8%" }
            ].map((stat, i) => (
              <div key={i} className="bg-card rounded-lg shadow-sm p-6 border">
                <h3 className="text-sm font-medium text-muted-foreground mb-2">{stat.label}</h3>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold">{stat.value}</span>
                  <span className={`text-sm ${
                    stat.change.startsWith('+') ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {stat.change}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Report Cards */}
          <div className="grid gap-6 md:grid-cols-2">
            {[
              {
                title: "Sales Analysis",
                description: "Monthly revenue and order trends",
                lastUpdated: "Updated 1 hour ago"
              },
              {
                title: "Inventory Status",
                description: "Stock levels and reorder points",
                lastUpdated: "Updated 2 hours ago"
              },
              {
                title: "Category Performance",
                description: "Sales by product category",
                lastUpdated: "Updated 3 hours ago"
              },
              {
                title: "Vendor Analysis",
                description: "Performance metrics by supplier",
                lastUpdated: "Updated 4 hours ago"
              }
            ].map((report, i) => (
              <div key={i} className="bg-card rounded-lg shadow-sm p-6 border hover:border-primary/50 cursor-pointer transition-colors">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-semibold mb-1">{report.title}</h3>
                    <p className="text-sm text-muted-foreground">{report.description}</p>
                  </div>
                  <button className="text-primary hover:underline text-sm">
                    View
                  </button>
                </div>
                <div className="h-[200px] bg-muted/20 rounded-md mb-4 flex items-center justify-center">
                  <span className="text-muted-foreground">Chart Placeholder</span>
                </div>
                <p className="text-xs text-muted-foreground">{report.lastUpdated}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
