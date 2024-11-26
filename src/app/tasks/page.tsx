"use client"

import { NavBar } from "@/components/ui/nav-bar"

const tasks = [
  {
    id: 1,
    title: "Review Inventory",
    priority: "High",
    dueDate: "2024-02-01",
    status: "In Progress"
  },
  {
    id: 2,
    title: "Update Product Prices",
    priority: "Medium",
    dueDate: "2024-02-03",
    status: "Pending"
  },
  {
    id: 3,
    title: "Check Stock Levels",
    priority: "High",
    dueDate: "2024-02-02",
    status: "Completed"
  }
]

export default function TaskListPage() {
  return (
    <div className="fixed inset-0 flex flex-col bg-background">
      <NavBar />
      <div className="flex-1 p-6 overflow-auto">
        <div className="max-w-5xl mx-auto">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold">Task List</h1>
            <button className="bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90">
              New Task
            </button>
          </div>
          <div className="space-y-4">
            {tasks.map((task) => (
              <div 
                key={task.id} 
                className="bg-card rounded-lg shadow-sm p-4 border flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
              >
                <div className="space-y-1">
                  <h3 className="font-semibold">{task.title}</h3>
                  <p className="text-sm text-muted-foreground">Due: {task.dueDate}</p>
                </div>
                <div className="flex flex-wrap gap-2 sm:flex-nowrap">
                  <span className={`px-3 py-1 rounded-full text-sm ${
                    task.priority === "High" 
                      ? "bg-red-100 text-red-700" 
                      : "bg-yellow-100 text-yellow-700"
                  }`}>
                    {task.priority}
                  </span>
                  <span className={`px-3 py-1 rounded-full text-sm ${
                    task.status === "Completed"
                      ? "bg-green-100 text-green-700"
                      : task.status === "In Progress"
                      ? "bg-blue-100 text-blue-700"
                      : "bg-gray-100 text-gray-700"
                  }`}>
                    {task.status}
                  </span>
                  <button className="px-3 py-1 text-sm text-primary hover:underline">
                    Edit
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
