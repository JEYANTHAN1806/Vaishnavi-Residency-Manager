---
name: Hotel Mgmt API Schema
description: Critical field name mapping for Vaishnavi Residency hotel management app generated types
---

## Guest type field names (CRITICAL)
- `mobile` (not `phone` or `email`)
- `advancePaid` (not `advance`)
- `balanceAmount` (not `balanceDue`)
- `expectedCheckOutDate` (not `checkOutDate`) — for planned checkout
- `actualCheckOutDate` — for actual checkout after guest leaves
- `idProofType` (not `idType`)
- `aadhaarNumber` (not `idNumber`)
- `pax` (not `adults`/`children`)
- No `email`, `purpose`, `adults`, `children` fields in Guest/GuestInput

## Status values use HYPHENS not underscores
- GuestStatus: `'booked' | 'checked-in' | 'checked-out' | 'cancelled'`
- RoomStatus / RoomUpdateStatus: `'available' | 'occupied' | 'reserved' | 'cleaning'` (not `'maintenance'`)
- ReservationStatus: `'reserved' | 'confirmed' | 'cancelled'`

## Payment type
- PaymentInputType: `'receipt' | 'payment'` only (not `'advance'` or `'refund'`)
- Payment has `paymentMode` not `method`

## Report period values
- GetRevenueReportPeriod / GetOccupancyReportPeriod: `'today' | 'week' | 'month' | 'year'` (not `'day'`)

**Why:** The OpenAPI spec was written with these exact field names matching the DB schema. Pages written before checking the generated types used wrong field names causing TypeScript errors.

**How to apply:** Always check `lib/api-client-react/src/generated/api.schemas.ts` before writing pages that use these types.
