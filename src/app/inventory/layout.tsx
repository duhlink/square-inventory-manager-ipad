export default function InventoryLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="h-full">
      {children}
    </div>
  )
}

export const metadata = {
  title: 'Inventory',
  description: 'Inventory management system',
}
