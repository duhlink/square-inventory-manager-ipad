import Link from 'next/link'

export default function Home() {
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-4xl font-bold mb-8">Canyon Market POS</h1>
      
      <nav className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Link 
          href="/inventory" 
          className="p-6 border rounded-lg hover:bg-gray-50 transition-colors"
        >
          <h2 className="text-2xl font-semibold mb-2">Inventory Management</h2>
          <p className="text-gray-600">Manage product catalog and stock levels</p>
        </Link>

        <Link 
          href="/purchase-orders" 
          className="p-6 border rounded-lg hover:bg-gray-50 transition-colors"
        >
          <h2 className="text-2xl font-semibold mb-2">Purchase Orders</h2>
          <p className="text-gray-600">Create and manage purchase orders</p>
        </Link>

        <Link 
          href="/settings" 
          className="p-6 border rounded-lg hover:bg-gray-50 transition-colors"
        >
          <h2 className="text-2xl font-semibold mb-2">Settings</h2>
          <p className="text-gray-600">Manage users and permissions</p>
        </Link>
      </nav>
    </div>
  )
}