import "@/app/globals.css"
import { NavBar } from "@/components/ui/nav-bar"

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="h-[100dvh] overflow-hidden">
      <body className="h-full overflow-hidden">
        <div className="flex flex-col h-full bg-background font-sans antialiased">
          <div className="flex-none">
            <NavBar />
          </div>
          <main className="flex-1 min-h-0 overflow-hidden">
            {children}
          </main>
        </div>
      </body>
    </html>
  )
}
