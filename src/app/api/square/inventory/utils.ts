import * as Sentry from '@sentry/nextjs'
import { NextResponse } from 'next/server'
import { ApiResponse } from './types'

export function serializeResponse(obj: any): any {
  if (!obj) return obj
  try {
    return JSON.parse(JSON.stringify(obj, (_, value) =>
      typeof value === 'bigint' ? Number(value) : value
    ))
  } catch (error) {
    Sentry.captureException(error, {
      extra: { context: 'serializeResponse', objectType: typeof obj }
    })
    return obj
  }
}

export function errorResponse(code: string, message: string, status: number = 400): NextResponse<ApiResponse> {
  return NextResponse.json({
    success: false,
    error: { code, message }
  }, { status })
}

export function successResponse<T>(data?: T): NextResponse<ApiResponse<T>> {
  return NextResponse.json({
    success: true,
    data
  })
}
