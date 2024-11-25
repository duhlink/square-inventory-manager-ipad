import { NextResponse } from 'next/server'
import { fetchVendors } from '@/services/square/vendors'
import * as Sentry from '@sentry/nextjs'

export async function GET() {
  try {
    const vendors = await fetchVendors()
    
    return NextResponse.json({
      success: true,
      data: vendors
    })

  } catch (error: any) {
    console.error('Error fetching vendors:', error)
    Sentry.captureException(error, {
      extra: { context: 'vendors_api_route' }
    })
    return NextResponse.json({ 
      success: false,
      error: {
        code: error.code || 'UNKNOWN_ERROR',
        message: error.message || 'An unexpected error occurred',
        details: error
      }
    }, { status: 500 })
  }
}
