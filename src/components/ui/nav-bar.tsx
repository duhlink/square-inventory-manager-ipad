"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
} from "@/components/ui/navigation-menu"

const navItems = [
  { href: "/inventory", label: "Inventory" },
  { href: "/purchase-orders", label: "Purchase Orders" },
  { href: "/tasks", label: "Task List" },
  { href: "/reports", label: "Reports" },
  { href: "/settings", label: "Settings" },
]

export function NavBar() {
  const pathname = usePathname()

  return (
    <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-14 items-center">
        <NavigationMenu className="ml-4">
          <NavigationMenuList className="gap-2">
            {navItems.map((item) => (
              <NavigationMenuItem key={item.href}>
                <Link href={item.href} legacyBehavior passHref>
                  <NavigationMenuLink
                    className={cn(
                      "inline-flex h-9 items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition-colors hover:text-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none disabled:pointer-events-none disabled:opacity-50",
                      pathname === item.href
                        ? "bg-red-600 text-white hover:bg-red-700"
                        : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                    )}
                  >
                    {item.label}
                  </NavigationMenuLink>
                </Link>
              </NavigationMenuItem>
            ))}
          </NavigationMenuList>
        </NavigationMenu>
      </div>
    </div>
  )
}
