# Cart Protection Implementation

This document explains the cart protection system implemented for the checkout and order-confirmed pages.

## Overview

The system prevents users from accessing checkout and order-confirmed pages when they don't have items in their cart or a valid order respectively.

## Implementation Details

### 1. Cart Protection Hook (`useCartProtection`)

**File:** `hooks/useCartProtection.tsx`

This hook:
- Checks if the user's cart has items by calling the cart API
- Redirects to the cart page if the cart is empty
- Shows a loading state while checking
- Displays an alert message to inform the user why they're being redirected

**Usage:**
```tsx
const { isChecking, hasItems } = useCartProtection({
  redirectTo: '/cart',
  showMessage: true
});
```

### 2. Order Protection Hook (`useOrderProtection`)

**File:** `hooks/useOrderProtection.tsx`

This hook:
- Checks if there's a valid order number in the URL parameters
- Verifies the order exists and belongs to the current session by calling the orders API with session ID
- Ensures the cart is empty (since successful orders clear the cart)
- Redirects to the marketplace if no valid order is found or order doesn't belong to current session
- Shows a loading state while checking

**Usage:**
```tsx
const { isChecking, isValidOrder } = useOrderProtection({
  redirectTo: '/marketplace',
  showMessage: true
});
```

### 3. Protected Pages

#### Checkout Page (`/checkout`)
- Uses `useCartProtection` to ensure cart has items
- Shows loading spinner while checking cart
- Redirects to `/cart` if cart is empty
- Only renders checkout form if cart has items

#### Order Confirmed Page (`/order-confirmed`)
- Uses `useOrderProtection` to ensure valid order exists
- Shows loading spinner while checking order
- Redirects to `/marketplace` if no valid order
- Only renders order details if order is valid

### 4. Middleware Updates

**File:** `middleware.ts`

Added `/checkout` and `/order-confirmed` to the middleware matcher so these routes are processed by the middleware for additional authentication checks.

## How It Works

1. **User tries to access `/checkout` with empty cart:**
   - `useCartProtection` hook runs
   - Cart API is called to check for items
   - If empty, user is redirected to `/cart` with alert message
   - If has items, checkout page renders normally

2. **User tries to access `/order-confirmed` without valid order:**
   - `useOrderProtection` hook runs
   - Order API is called with session ID to verify order exists and belongs to current session
   - If invalid/missing/not owned by session, user is redirected to `/marketplace` with alert message
   - If valid, order confirmation page renders normally

3. **User tries to access `/order-confirmed` with valid order number:**
   - Order is verified through API with session ID to ensure ownership
   - Cart is checked to ensure it's empty (successful orders clear the cart)
   - If cart has items, user is redirected to checkout
   - If order is valid and cart is empty, page renders with order details

## Benefits

- **Prevents empty checkout:** Users can't proceed to checkout without items
- **Prevents invalid order access:** Users can't access order confirmation without a valid order that belongs to their session
- **Session security:** Orders are tied to specific sessions, preventing unauthorized access
- **Cart validation:** Ensures cart is empty after successful order placement
- **Better UX:** Clear messaging about why access is denied
- **Security:** Server-side validation through API calls with session verification
- **Consistent behavior:** Same protection pattern for both pages

## Testing

To test the protection:

1. **Empty Cart Test:**
   - Clear your cart
   - Try to navigate to `/checkout`
   - Should be redirected to `/cart` with alert

2. **Valid Cart Test:**
   - Add items to cart
   - Navigate to `/checkout`
   - Should load normally

3. **Invalid Order Test:**
   - Try to navigate to `/order-confirmed` without order number
   - Should be redirected to `/marketplace` with alert

4. **Valid Order Test:**
   - Complete a purchase to get order number
   - Navigate to `/order-confirmed?orderNumber=YOUR_ORDER_NUMBER`
   - Should load normally

## API Dependencies

The protection relies on these API endpoints:
- `GET /api/bazaar/cart?sessionId={sessionId}` - For cart validation
- `GET /api/bazaar/orders?orderNumber={orderNumber}` - For order validation
