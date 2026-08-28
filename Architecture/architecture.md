Here's the **complete rewritten specification from beginning to end**. This is the version I would use as the master blueprint for building the project with **Next.js + MongoDB**.

# Water E-Commerce & Delivery Platform — Complete Build Blueprint

## 1. Project Overview

The platform is a nationwide online water ordering and delivery website where customers can purchase **water packs from different brands**, choose the quantity they need, pay online, provide their delivery location, and have the order delivered to them.

The platform should support:

- Multiple water brands
- Pack-only purchases
- Quantity-based pricing
- Brand-specific pricing
- Nationwide delivery in Ghana
- Location-based delivery fees
- Mobile Money payments
- Bank payments
- Guest checkout
- Registered customer accounts
- Automatic inventory deduction
- Stock reservations
- Low-stock alerts
- Out-of-stock handling
- Yango Delivery integration
- Bulk/event orders
- Order cancellation
- Refund handling
- Order tracking
- Customer notifications
- Admin management
- Delivery management
- Sales and inventory reporting

The architecture should be designed so that future features such as subscriptions, loyalty programs, corporate accounts, WhatsApp ordering, and additional delivery providers can be added without rebuilding the core system.

---

# 2. Technology Stack

## Frontend

Use:

- Next.js
- TypeScript
- Tailwind CSS
- shadcn/ui
- React
- Next.js App Router

## Backend

Use Next.js as the main backend layer:

- Route Handlers
- Server Actions
- Server Components
- API endpoints
- Background jobs where necessary

## Database

Use:

- MongoDB Atlas
- Mongoose

## Authentication

Support:

- Customer authentication
- Admin authentication
- Delivery personnel authentication
- Role-based access control

## Product Images

Use:

- Cloudinary

## Payments

The architecture should support:

- Mobile Money
- Bank payments

Use a payment gateway/aggregator appropriate for Ghana rather than attempting to integrate directly with individual telecom operators.

The payment architecture should be provider-independent so you can change providers later.

## Delivery

Primary delivery provider:

**Yango Delivery**

Create a delivery abstraction so another provider can be added later.

---

# 3. High-Level System Architecture

The system has three major applications/portals.

```text
                    WATER E-COMMERCE PLATFORM
                              │
             ┌────────────────┼────────────────┐
             │                │                │
         CUSTOMER           ADMIN           DELIVERY
         WEBSITE           PORTAL            PORTAL
             │                │                │
             └────────────────┼────────────────┘
                              │
                          NEXT.JS
                              │
             ┌────────────────┼────────────────┐
             │                │                │
          MongoDB          Payments        Cloudinary
             │
      ┌──────┼───────┐
      │      │       │
   Orders  Stock   Pricing
      │
   Delivery
      │
    Yango
```

---

# 4. User Roles

Create four roles.

## Customer

Can:

- Browse products
- Search
- Filter
- Add products to cart
- Checkout as guest
- Create account
- Manage addresses
- Make payments
- Track orders
- Cancel eligible orders
- View order history
- Reorder
- Submit bulk requests

## Admin

Can:

- Manage products
- Manage brands
- Manage categories
- Manage prices
- Manage inventory
- Manage orders
- Manage customers
- Manage delivery zones
- Manage Yango deliveries
- Manage bulk orders
- Manage payments
- Process refunds
- View reports
- Manage settings

## Delivery Personnel

If the business eventually uses its own drivers, this role can be enabled.

Can:

- View assigned deliveries
- View customer details
- View address
- Navigate to customer
- Update delivery status
- Confirm delivery
- Record failed delivery

For the initial implementation, however, Yango handles the actual delivery personnel.

## Super Admin

Optional but recommended if the platform grows.

Can:

- Manage admins
- Manage permissions
- View audit logs
- Configure system settings
- Manage integrations

---

# 5. Application Structure

Recommended Next.js structure:

```text
src/
│
├── app/
│   ├── (store)/
│   │   ├── page.tsx
│   │   ├── shop/
│   │   ├── brands/
│   │   ├── products/
│   │   ├── cart/
│   │   ├── checkout/
│   │   ├── orders/
│   │   ├── account/
│   │   └── bulk-orders/
│   │
│   ├── (auth)/
│   │   ├── login/
│   │   ├── register/
│   │   └── forgot-password/
│   │
│   ├── admin/
│   │   ├── dashboard/
│   │   ├── orders/
│   │   ├── products/
│   │   ├── brands/
│   │   ├── categories/
│   │   ├── pricing/
│   │   ├── inventory/
│   │   ├── customers/
│   │   ├── deliveries/
│   │   ├── payments/
│   │   ├── bulk-orders/
│   │   ├── reports/
│   │   └── settings/
│   │
│   ├── delivery/
│   │
│   └── api/
│
├── components/
│   ├── ui/
│   ├── store/
│   ├── products/
│   ├── cart/
│   ├── checkout/
│   ├── orders/
│   ├── admin/
│   └── delivery/
│
├── models/
│
├── services/
│   ├── payment/
│   ├── inventory/
│   ├── pricing/
│   ├── delivery/
│   ├── notification/
│   └── order/
│
├── lib/
│   ├── db/
│   ├── auth/
│   ├── validation/
│   ├── utils/
│   └── constants/
│
├── hooks/
│
├── types/
│
└── config/
```

---

# 6. PHASE 1 — Project Foundation

First establish the application foundation.

## Tasks

- [ ] Create Next.js project
- [ ] Configure TypeScript
- [ ] Configure Tailwind
- [ ] Install shadcn/ui
- [ ] Configure MongoDB Atlas
- [ ] Configure Mongoose
- [ ] Create environment variables
- [ ] Configure authentication
- [ ] Configure Cloudinary
- [ ] Configure payment provider
- [ ] Configure notification provider
- [ ] Prepare Yango integration configuration
- [ ] Configure error handling
- [ ] Configure logging
- [ ] Configure validation

Environment variables should include things like:

```text
MONGODB_URI
AUTH_SECRET
CLOUDINARY_URL
PAYMENT_SECRET_KEY
PAYMENT_PUBLIC_KEY
PAYMENT_WEBHOOK_SECRET
YANGO_API_KEY
YANGO_API_SECRET
NOTIFICATION_API_KEY
```

Never expose secret keys to the client.

---

# 7. PHASE 2 — Authentication & Authorization

Build authentication before the business modules.

## Customer authentication

Support:

- Register
- Login
- Logout
- Forgot password
- Reset password
- Email/phone verification where appropriate

## Guest checkout

Customers must not be forced to create accounts.

They can:

```text
Browse
↓
Cart
↓
Checkout
↓
Enter details
↓
Pay
↓
Receive order
```

---

# 8. Guest Customer System

A guest customer should provide:

- Full name
- Phone
- Email
- Delivery address

The order is created without requiring a full account.

After successful purchase:

```text
Order successful
↓
Create account prompt
↓
Customer creates password
↓
Existing order attached to account
```

This should allow the customer to immediately see:

- Previous order
- Saved address
- Order history

---

# 9. PHASE 3 — Database Architecture

Create the core MongoDB collections.

```text
users
brands
categories
products
productVariants
pricingRules

carts
cartItems

addresses

orders
orderItems
orderStatusHistory

payments
paymentTransactions

inventory
inventoryTransactions
stockReservations

deliveryZones
deliveryOrders

bulkOrderRequests
bulkQuotes

notifications
coupons
reviews

auditLogs
settings
```

---

# 10. User Model

```text
User
├── name
├── email
├── phone
├── passwordHash/authId
├── role
├── avatar
├── isActive
├── emailVerified
├── phoneVerified
├── addresses
├── createdAt
└── updatedAt
```

Roles:

```text
CUSTOMER
ADMIN
DELIVERY
SUPER_ADMIN
```

---

# 11. Brand Model

```text
Brand
├── name
├── slug
├── logo
├── description
├── isActive
├── displayOrder
├── createdAt
└── updatedAt
```

Examples:

```text
Voltic
Bel-Aqua
Verna
```

---

# 12. Category Model

Categories should be configurable.

Examples:

```text
Bottled Water
Sachet Water
Bulk Water
Event Water
```

Model:

```text
Category
├── name
├── slug
├── description
├── image
├── isActive
└── displayOrder
```

---

# 13. Product Architecture

Don't make every pack a completely unrelated product.

Structure it as:

```text
Brand
 ↓
Product
 ↓
Pack/Variant
```

Example:

```text
Voltic
 └── Natural Mineral Water
       ├── 500ml × 12
       ├── 500ml × 24
       └── 1.5L × 6
```

---

# 14. Product Model

```text
Product
├── name
├── slug
├── brandId
├── categoryId
├── description
├── images
├── isFeatured
├── isActive
├── createdAt
└── updatedAt
```

---

# 15. Product Variant / Pack Model

Each pack should have its own inventory and pricing.

```text
ProductVariant
├── productId
├── name
├── sku
├── bottleSize
├── unitsPerPack
├── price
├── stockQuantity
├── reservedQuantity
├── lowStockThreshold
├── isAvailable
└── createdAt
```

Example:

```text
Voltic 500ml × 24

Price: GH₵30
Stock: 100
Reserved: 5
Available: 95
Threshold: 10
```

---

# 16. PHASE 4 — Pricing Engine

Pricing should not be hard-coded.

Create a dedicated pricing service.

It determines:

```text
Product
+
Brand
+
Pack
+
Quantity
+
Pricing Rules
=
Final Unit Price
```

---

# 17. Quantity-Based Pricing

Example:

```text
1–4 packs
GH₵30

5–9 packs
GH₵28

10–49 packs
GH₵26

50+ packs
GH₵24
```

The system automatically selects the correct tier.

---

# 18. Brand-Based Pricing

Each brand can have different pricing.

Example:

### Voltic

```text
1–4     GH₵30
5–9     GH₵28
10+     GH₵26
```

### Bel-Aqua

```text
1–4     GH₵27
5–9     GH₵25
10+     GH₵23
```

The pricing engine handles this automatically.

---

# 19. Price Snapshot

When an order is created, save:

```text
productName
brandName
variantName
unitPrice
quantity
totalPrice
```

Don't calculate old orders from the current product price.

This protects historical orders when the admin changes prices.

---

# 20. PHASE 5 — Inventory Management

Inventory is central to the system.

Every pack has:

```text
stockQuantity
reservedQuantity
availableQuantity
lowStockThreshold
```

Formula:

```text
Available =
Stock Quantity - Reserved Quantity
```

---

# 21. Stock Reservation

When the customer starts checkout:

```text
Stock = 20
```

Customer orders:

```text
5 packs
```

System:

```text
Stock = 20
Reserved = 5
Available = 15
```

The system temporarily holds the stock.

---

# 22. Payment Success

After successful payment:

```text
Reserved stock
↓
Finalize sale
↓
Stock decreases
↓
Reservation removed
```

Example:

```text
Stock = 20
Reserved = 5

Payment successful

Stock = 15
Reserved = 0
```

---

# 23. Payment Failure

If payment fails:

```text
Payment failed
↓
Order payment failed
↓
Reservation released
↓
Stock becomes available
```

This prevents inventory from being locked unnecessarily.

---

# 24. Low Stock System

Admin configures:

```text
Low Stock Threshold = 10
```

When:

```text
Available ≤ 10
```

system flags:

```text
LOW_STOCK
```

When:

```text
Available = 0
```

system flags:

```text
OUT_OF_STOCK
```

---

# 25. Inventory Transactions

Create an inventory history.

Types:

```text
INITIAL_STOCK
RESTOCK
SALE
RESERVATION
RELEASE
ADJUSTMENT
DAMAGED
RETURN
CANCELLED_ORDER
```

Example:

```text
Voltic 500ml × 24

+100 Initial Stock
-5 Sale
+20 Restock
-2 Damaged
```

Admin can see the entire history.

---

# 26. PHASE 6 — Storefront

Now build the customer-facing website.

Main pages:

```text
/
 /shop
 /brands
 /brands/[slug]
 /products/[slug]
 /cart
 /checkout
 /orders
 /orders/[id]
 /account
 /account/addresses
 /bulk-orders
```

---

# 27. Homepage

The homepage should focus on one objective:

> **Order water quickly.**

Sections:

### Hero

Headline:

> Your favourite water, delivered to your doorstep.

CTA:

**Shop Water**

### Brands

Show:

```text
Voltic
Bel-Aqua
Verna
...
```

### Popular Packs

Product cards.

### How It Works

```text
Choose your water
↓
Select quantity
↓
Pay online
↓
Get it delivered
```

### Why Choose Us

- Nationwide delivery
- Multiple brands
- Secure payment
- Fast ordering

---

# 28. Shop Page

Features:

- Search
- Brand filtering
- Category filtering
- Pack size filtering
- Price filtering
- Availability filtering
- Sort by price
- Sort by popularity
- Sort by newest

---

# 29. Product Card

Each card should show:

```text
Product image

Brand
Product name
Pack size

GH₵ XX

Stock status

[-] 1 [+]
Add to Cart
```

If out of stock:

```text
OUT OF STOCK
```

and disable the purchase action.

---

# 30. Product Details Page

Show:

- Product images
- Brand
- Product name
- Pack size
- Bottle size
- Units per pack
- Current price
- Quantity selector
- Stock status
- Description
- Delivery information
- Related products

Quantity changes should immediately update the price according to the pricing engine.

---

# 31. PHASE 7 — Cart

Cart contains:

```text
Product
Pack
Quantity
Unit price
Total
```

Example:

```text
Voltic 500ml × 24
Quantity: 5

Unit price:
GH₵28

Total:
GH₵140
```

The pricing engine should recalculate when quantity changes.

---

# 32. Cart Validation

Before checkout:

- Confirm product still exists
- Confirm product is active
- Confirm product isn't out of stock
- Confirm quantity is available
- Recalculate price
- Recalculate discounts
- Validate cart totals

Never trust totals sent from the frontend.

The server must recalculate everything.

---

# 33. PHASE 8 — Checkout

Checkout steps:

```text
1. Customer Information
2. Delivery Location
3. Delivery Fee
4. Order Summary
5. Payment
6. Confirmation
```

---

# 34. Customer Information

Guest:

```text
Full Name
Phone
Email
```

Registered:

Automatically load:

```text
Name
Phone
Email
```

Customer can edit them.

---

# 35. Delivery Address

Fields:

```text
Region
City/Town
Area
House/Building
Landmark
Delivery Instructions
```

Optional:

```text
GPS Coordinates
```

Button:

**Use my current location**

---

# 36. Saved Addresses

Registered customers can save:

```text
Home
Office
Other
```

Example:

```text
Home
East Legon
Accra

[Use Address]
```

---

# 37. PHASE 9 — Location-Based Delivery

Customer location determines delivery pricing.

Flow:

```text
Customer enters location
↓
System identifies delivery zone
↓
Zone pricing retrieved
↓
Delivery fee calculated
↓
Checkout total updated
```

Example:

```text
Products       GH₵200
Delivery       GH₵35
────────────────────
Total          GH₵235
```

---

# 38. Nationwide Delivery Zones

Admin manages zones.

Example:

```text
Greater Accra
Ashanti
Eastern
Western
Northern
Volta
Central
Bono
...
```

Each zone can have:

- Areas
- Delivery fee
- Estimated delivery time
- Active/inactive status

---

# 39. PHASE 10 — Order Summary

Before payment:

```text
ORDER SUMMARY

Voltic 500ml × 24
5 packs
GH₵140

Bel-Aqua 500ml × 24
2 packs
GH₵50

Subtotal
GH₵190

Delivery
GH₵30

Total
GH₵220
```

Then:

**Pay GH₵220**

---

# 40. PHASE 11 — Payments

Payment methods:

```text
Mobile Money
Bank Payment
```

Architecture:

```text
Checkout
↓
Create pending order
↓
Reserve stock
↓
Initialize payment
↓
Customer completes payment
↓
Payment provider webhook
↓
Verify transaction
↓
Mark payment successful
↓
Finalize stock
↓
Confirm order
```

---

# 41. Payment Security

Never do:

```text
Frontend says payment succeeded
↓
Mark order paid
```

Instead:

```text
Payment Provider
↓
Server webhook
↓
Verify signature
↓
Verify amount
↓
Verify reference
↓
Mark payment successful
```

This follows the server-side webhook/reconciliation pattern already established in your other Ghana-focused system work. 

---

# 42. Payment Model

```text
Payment
├── orderId
├── provider
├── reference
├── amount
├── currency
├── method
├── status
├── transactionId
├── paidAt
└── metadata
```

Statuses:

```text
PENDING
PROCESSING
SUCCESS
FAILED
REFUND_PENDING
REFUNDED
```

---

# 43. PHASE 12 — Order Management

Order statuses:

```text
PENDING_PAYMENT
PAID
CONFIRMED
PROCESSING
READY_FOR_DELIVERY
OUT_FOR_DELIVERY
DELIVERED
CANCELLED
FAILED_DELIVERY
REFUND_PENDING
REFUNDED
```

---

# 44. Customer Order Timeline

Customer should see:

```text
✓ Order Placed
      ↓
✓ Payment Confirmed
      ↓
✓ Order Processing
      ↓
✓ Ready for Delivery
      ↓
🚚 Out for Delivery
      ↓
✓ Delivered
```

---

# 45. Order Model

```text
Order
├── orderNumber
├── customerId
├── guestInformation
├── items
├── subtotal
├── discount
├── deliveryFee
├── total
├── paymentId
├── deliveryId
├── deliveryAddress
├── coordinates
├── status
├── cancellation
├── refund
├── createdAt
└── updatedAt
```

---

# 46. Order Item

Each item stores its historical pricing.

```text
OrderItem
├── productId
├── variantId
├── productName
├── brandName
├── variantName
├── quantity
├── unitPrice
├── totalPrice
└── pricingTier
```

---

# 47. PHASE 13 — Cancellation

Customer can cancel while the order is:

```text
PAID
CONFIRMED
PROCESSING
```

Cancellation should be blocked once:

```text
OUT_FOR_DELIVERY
```

Customer receives:

> This order can no longer be cancelled because it is already out for delivery.

---

# 48. Cancellation Flow

```text
Customer requests cancellation
↓
Server checks status
↓
If eligible:
    Cancel order
↓
Release stock
↓
If already paid:
    Start refund process
↓
Notify customer
```

---

# 49. PHASE 14 — Refunds

Refund statuses:

```text
NOT_REQUIRED
PENDING
PROCESSING
COMPLETED
FAILED
```

Admin should be able to:

- View refund
- Approve/process refund
- Record refund reference
- View refund status

---

# 50. PHASE 15 — Yango Delivery Integration

Create:

```text
DeliveryService
```

Then:

```text
DeliveryService
      ↓
YangoAdapter
      ↓
Yango API
```

Don't put Yango logic directly inside your order controller.

---

# 51. Delivery Creation

When order becomes:

```text
READY_FOR_DELIVERY
```

system can create a Yango delivery.

Send:

```text
Pickup location
Customer name
Customer phone
Customer address
Customer coordinates
Order reference
Delivery instructions
```

Save Yango's response.

---

# 52. Delivery Model

```text
DeliveryOrder
├── orderId
├── provider
├── providerOrderId
├── pickupAddress
├── destinationAddress
├── destinationCoordinates
├── driverName
├── driverPhone
├── trackingUrl
├── deliveryFee
├── providerCost
├── status
├── assignedAt
├── pickedUpAt
├── deliveredAt
└── failedAt
```

---

# 53. Delivery Status

```text
PENDING
CREATED
DRIVER_ASSIGNED
PICKED_UP
OUT_FOR_DELIVERY
DELIVERED
FAILED
CANCELLED
```

---

# 54. Delivery Financials

Keep these separate:

```text
Customer Delivery Fee
Provider Cost
Business Delivery Margin
```

Example:

```text
Customer pays: GH₵30

Yango cost: GH₵24

Delivery margin: GH₵6
```

This will make delivery profitability visible in reports.

---

# 55. PHASE 16 — Admin Dashboard

Dashboard should show:

```text
Today's Sales
Today's Orders
Pending Orders
Orders Out for Delivery
Delivered Orders
Low Stock Products
```

Example:

```text
Today's Revenue
GH₵4,250

Orders
48

Processing
12

Out for Delivery
8

Delivered
28
```

---

# 56. Admin Sidebar

```text
Dashboard

Orders
├── All Orders
├── Pending
├── Processing
├── Ready
├── Out for Delivery
├── Delivered
└── Cancelled

Products
├── Products
├── Brands
├── Categories
└── Pricing

Inventory
├── Stock Overview
├── Stock In
├── Adjustments
├── Reservations
└── Low Stock

Customers
├── Customers
└── Guest Customers

Deliveries
├── Active
├── History
├── Delivery Zones
└── Yango

Bulk Orders

Payments
├── Transactions
├── Failed
└── Refunds

Reports

Notifications

Settings
```

---

# 57. PHASE 17 — Admin Product Management

Admin can:

- Create product
- Edit product
- Delete/archive product
- Add images
- Assign brand
- Assign category
- Add packs
- Set stock
- Set threshold
- Set pricing
- Disable product
- Feature product

---

# 58. Add Product Form

```text
Product Name
Brand
Category
Description
Images

Pack/Variant
Bottle Size
Units Per Pack
SKU

Base Price
Low Stock Threshold
Initial Stock

Pricing Rules

Active
Featured
```

---

# 59. PHASE 18 — Inventory Dashboard

Show:

```text
Total Products
Total Stock
Low Stock
Out of Stock
Reserved Stock
```

Then:

```text
Recent Inventory Activity
```

Admin can:

- Restock
- Adjust
- Record damaged products
- View reservations
- View stock history

---

# 60. PHASE 19 — Customer Management

Admin sees:

```text
Customer
Phone
Orders
Total Spent
Last Order
Status
```

Customer details:

```text
Profile
Orders
Addresses
Payments
Total Spending
```

---

# 61. PHASE 20 — Guest Customers

Admin should also be able to see guest orders.

For example:

```text
Guest Order
#ORD-10923

John Doe
+233 XX XXX XXXX
Guest
```

When the customer later creates an account, the system can attach eligible previous guest orders.

---

# 62. PHASE 21 — Bulk Orders

Add a prominent:

**Bulk Orders / Event Orders**

section.

Customers can request large quantities for:

- Weddings
- Funerals
- Parties
- Offices
- Schools
- Churches
- Hotels
- Restaurants
- Events

---

# 63. Bulk Order Request

Fields:

```text
Name
Phone
Email

Preferred Brand
Pack Type
Quantity

Delivery Date
Region
City
Area
Address

Notes
```

---

# 64. Bulk Order Admin Flow

```text
Request Received
↓
Admin Reviews
↓
Admin Creates Quote
↓
Customer Receives Quote
↓
Customer Accepts
↓
Payment
↓
Order Created
↓
Delivery
```

---

# 65. PHASE 22 — Bulk Pricing

Support:

```text
1–49 packs
Normal price

50–99
Bulk price

100–499
Wholesale price

500+
Custom quote
```

Admin can configure these tiers.

---

# 66. PHASE 23 — Notifications

Create a central notification service.

Events:

### Customer

- Order placed
- Payment successful
- Payment failed
- Order confirmed
- Order processing
- Delivery assigned
- Out for delivery
- Delivered
- Cancellation
- Refund
- Bulk quote

### Admin

- New order
- Payment received
- Low stock
- Out of stock
- Bulk request
- Failed payment
- Failed delivery

---

# 67. Notification Channels

Support:

```text
Email
SMS
In-app
```

WhatsApp can be added later.

Keep notification logic abstract:

```text
NotificationService
├── EmailProvider
├── SMSProvider
└── WhatsAppProvider
```

---

# 68. PHASE 24 — Customer Account

Customer dashboard:

```text
Account Overview

Active Order
Recent Orders
Saved Addresses
Account Details
```

Sections:

```text
My Orders
Addresses
Profile
Notifications
Security
```

---

# 69. PHASE 25 — Order History

Tabs:

```text
All
Processing
Out for Delivery
Delivered
Cancelled
```

Order card:

```text
#ORD-10923

3 items
GH₵230

Out for Delivery

[Track Order]
[View Details]
```

---

# 70. PHASE 26 — Reorder

This is particularly valuable for water.

Customer opens an old order:

```text
Voltic × 5
Bel-Aqua × 2
```

Clicks:

**Order Again**

System:

```text
Check current stock
↓
Calculate current prices
↓
Add available products to cart
```

Important:

The reorder should use **current prices**, not the old order's prices.

---

# 71. PHASE 27 — Search

Search should support:

```text
Voltic
Bel-Aqua
500ml
1.5L
24 pack
bottled water
```

Features:

- Search suggestions
- Recent searches
- Popular searches
- Brand results
- Product results

---

# 72. PHASE 28 — SEO

Create SEO-friendly pages for:

```text
Water delivery in Accra
Water delivery in Kumasi
Buy Voltic water online
Buy Bel-Aqua water online
Water delivery Ghana
```

Implement:

- Metadata
- Open Graph
- Sitemap
- Robots.txt
- Canonical URLs
- Product structured data
- Brand pages
- Category pages

---

# 73. PHASE 29 — Business Settings

Admin can configure:

### Business

```text
Business name
Logo
Phone
Email
WhatsApp
Address
```

### Ordering

```text
Minimum order
Maximum order
Ordering enabled
```

### Business hours

```text
Monday
Tuesday
...
Sunday
```

Remember: business hours should influence **delivery/processing**, not prevent customers from placing orders.

---

# 74. PHASE 30 — Delivery Settings

Admin configures:

```text
Delivery zones
Delivery fees
Estimated delivery times
Minimum order
Free delivery thresholds
```

Future:

```text
Distance-based pricing
```

---

# 75. PHASE 31 — Payment Settings

Admin can configure:

```text
Mobile Money
Bank Payment
```

and view:

```text
Payment provider
Transaction fees
Successful payments
Failed payments
Refunds
```

---

# 76. PHASE 32 — Analytics

Dashboard reports:

### Sales

- Revenue
- Orders
- Average order value

### Products

- Best sellers
- Slow sellers
- Low stock
- Out of stock

### Brands

- Most purchased brands
- Brand revenue

### Customers

- New customers
- Returning customers
- Guest customers
- Top customers

### Delivery

- Delivery costs
- Delivery revenue
- Delivery margin
- Successful deliveries
- Failed deliveries

---

# 77. PHASE 33 — Security

Implement:

- Authentication
- Authorization
- Role-based permissions
- Server-side validation
- Rate limiting
- Secure cookies
- Input sanitization
- API protection
- Webhook verification
- Payment amount verification
- File upload validation
- Audit logging

Never trust:

- Client-side price
- Client-side stock
- Client-side payment status
- Client-side permissions

Everything important must be recalculated and verified server-side.

---

# 78. PHASE 34 — Audit Logs

Track important administrative actions.

Example:

```text
Admin Mohammed

Changed:
Voltic 500ml × 24

Price:
GH₵30 → GH₵32

Date:
26 Aug 2026
```

Also record:

- Product deletion
- Stock adjustment
- Price changes
- Order cancellation
- Refund
- Admin login
- Delivery changes

---

# 79. PHASE 35 — Error Handling

Every important operation needs proper error states.

Examples:

### Payment failure

> Payment could not be completed. Your stock reservation has been released. Try again.

### Out of stock

> This pack is currently unavailable.

### Delivery unavailable

> We currently cannot deliver to this location.

### Yango failure

> Delivery could not be created. Our team has been notified.

### Network failure

Don't lose cart/order state.

---

# 80. PHASE 36 — Loading & Empty States

Every page should have:

- Loading state
- Skeleton
- Empty state
- Error state
- Success state

Examples:

```text
No orders yet

You haven't placed an order yet.

[Shop Water]
```

---

# 81. PHASE 37 — Mobile Optimization

This should be **mobile-first** because customers are likely to order from phones.

Prioritize:

- Fast loading
- Large buttons
- Simple checkout
- Sticky cart button
- Easy quantity selection
- Easy location entry
- Minimal form fields
- Mobile Money payment flow

Desktop should then adapt naturally.

---

# 82. PHASE 38 — Performance

Optimize:

- Image loading
- Cloudinary transformations
- Server Components
- Database indexes
- API response sizes
- Caching
- Product queries
- Search queries

MongoDB indexes should exist on frequently searched fields such as:

```text
slug
brandId
categoryId
sku
isActive
createdAt
```

Orders:

```text
customerId
status
createdAt
orderNumber
```

---

# 83. PHASE 39 — Testing

Test the entire business flow.

### Customer

- [ ] Browse
- [ ] Search
- [ ] Filter
- [ ] Add to cart
- [ ] Quantity pricing
- [ ] Checkout
- [ ] Guest checkout
- [ ] Account checkout
- [ ] Payment
- [ ] Order tracking
- [ ] Cancellation
- [ ] Reorder

### Inventory

- [ ] Stock deduction
- [ ] Reservation
- [ ] Reservation release
- [ ] Low stock
- [ ] Out of stock
- [ ] Restocking

### Payments

- [ ] Successful payment
- [ ] Failed payment
- [ ] Duplicate webhook
- [ ] Incorrect amount
- [ ] Refund

### Delivery

- [ ] Zone calculation
- [ ] Delivery fee
- [ ] Yango creation
- [ ] Driver assignment
- [ ] Delivery completion
- [ ] Failed delivery

### Guest conversion

- [ ] Guest purchase
- [ ] Account creation
- [ ] Previous order linking
- [ ] Saved address

---

# 84. Complete Customer Journey

The final customer experience should be:

```text
LANDING PAGE
      ↓
Browse Brands
      ↓
Browse Products
      ↓
Product Details
      ↓
Select Pack
      ↓
Select Quantity
      ↓
Pricing Automatically Updates
      ↓
Add To Cart
      ↓
Cart Validation
      ↓
Checkout
      ↓
Guest OR Login
      ↓
Customer Details
      ↓
Delivery Location
      ↓
Delivery Zone Detection
      ↓
Delivery Fee
      ↓
Order Summary
      ↓
Stock Reservation
      ↓
Payment
      ↓
Payment Verification
      ↓
Order Confirmed
      ↓
Inventory Finalized
      ↓
Order Processing
      ↓
Yango Delivery Created
      ↓
Out For Delivery
      ↓
Delivered
      ↓
Post-Purchase
      ↓
Create Account / Reorder
```

---

# 85. Complete Admin Flow

```text
ADMIN LOGIN
      ↓
DASHBOARD
      ↓
NEW ORDER
      ↓
PAYMENT VERIFIED
      ↓
ORDER CONFIRMED
      ↓
STOCK CHECK
      ↓
ORDER PROCESSING
      ↓
READY FOR DELIVERY
      ↓
CREATE YANGO DELIVERY
      ↓
DRIVER ASSIGNED
      ↓
OUT FOR DELIVERY
      ↓
DELIVERED
      ↓
ORDER COMPLETED
```

---

# 86. Complete Inventory Flow

```text
Admin Adds Stock
       ↓
Inventory +100
       ↓
Customer Orders 5
       ↓
Reserve 5
       ↓
Available = 95
       ↓
Payment Successful
       ↓
Finalize Sale
       ↓
Stock = 95
       ↓
Inventory Transaction Created
       ↓
Check Threshold
       ↓
LOW STOCK if necessary
```

---

# 87. Complete Failed Payment Flow

```text
Customer Checkout
       ↓
Reserve Stock
       ↓
Payment
       ↓
FAILED
       ↓
Order = PAYMENT_FAILED
       ↓
Release Reservation
       ↓
Stock Available Again
       ↓
Customer Can Retry
```

---

# 88. Complete Cancellation Flow

```text
Customer Requests Cancellation
       ↓
Check Order Status
       ↓
Eligible?
   ┌───┴───┐
  YES      NO
   │        │
Cancel    Reject
   │
Release Stock
   │
Refund if necessary
   │
Notify Customer
```

---

# 89. Complete Guest Customer Flow

```text
Visitor
 ↓
Shop
 ↓
Cart
 ↓
Guest Checkout
 ↓
Enter Details
 ↓
Pay
 ↓
Order Confirmed
 ↓
"Create an account for faster ordering"
 ↓
Create Password
 ↓
Account Created
 ↓
Previous Order Linked
 ↓
Address Saved
```

---

# 90. Complete Bulk Order Flow

```text
Bulk Order Request
        ↓
Admin Review
        ↓
Quotation
        ↓
Customer Receives Quote
        ↓
Accept Quote
        ↓
Payment
        ↓
Order Created
        ↓
Inventory Reserved
        ↓
Delivery
        ↓
Completed
```

---

# 91. Final MongoDB Collection Architecture

The final database should look approximately like:

```text
MongoDB
│
├── users
│
├── brands
├── categories
├── products
├── productVariants
├── pricingRules
│
├── carts
├── cartItems
│
├── addresses
│
├── orders
├── orderItems
├── orderStatusHistory
│
├── payments
├── paymentTransactions
│
├── inventory
├── inventoryTransactions
├── stockReservations
│
├── deliveryZones
├── deliveryOrders
│
├── bulkOrderRequests
├── bulkQuotes
│
├── notifications
├── coupons
├── reviews
│
├── auditLogs
└── settings
```

---

# 92. Recommended Build Phases

Now we can reduce the entire project into actual development phases.

## Phase 1 — Foundation

- [ ] Next.js
- [ ] TypeScript
- [ ] Tailwind
- [ ] shadcn/ui
- [ ] MongoDB
- [ ] Mongoose
- [ ] Authentication
- [ ] Environment configuration
- [ ] Project architecture

## Phase 2 — Database

- [ ] Users
- [ ] Brands
- [ ] Categories
- [ ] Products
- [ ] Product packs
- [ ] Pricing
- [ ] Inventory
- [ ] Orders
- [ ] Payments
- [ ] Addresses
- [ ] Delivery

## Phase 3 — Authentication

- [ ] Customer login
- [ ] Registration
- [ ] Guest checkout
- [ ] Admin login
- [ ] Role permissions
- [ ] Password recovery

## Phase 4 — Admin Product System

- [ ] Brands
- [ ] Categories
- [ ] Products
- [ ] Packs
- [ ] Images
- [ ] Pricing
- [ ] Availability

## Phase 5 — Inventory

- [ ] Stock
- [ ] Reservations
- [ ] Stock deduction
- [ ] Stock release
- [ ] Low-stock alerts
- [ ] Inventory history

## Phase 6 — Storefront

- [ ] Homepage
- [ ] Shop
- [ ] Brands
- [ ] Search
- [ ] Filters
- [ ] Product details

## Phase 7 — Cart

- [ ] Add products
- [ ] Quantity
- [ ] Dynamic pricing
- [ ] Cart validation
- [ ] Stock validation

## Phase 8 — Checkout

- [ ] Guest checkout
- [ ] Customer information
- [ ] Address
- [ ] GPS
- [ ] Delivery zones
- [ ] Delivery fee
- [ ] Order summary

## Phase 9 — Payments

- [ ] Mobile Money
- [ ] Bank payment
- [ ] Payment initialization
- [ ] Webhooks
- [ ] Verification
- [ ] Failed payments
- [ ] Refunds

## Phase 10 — Orders

- [ ] Order creation
- [ ] Status management
- [ ] Order tracking
- [ ] Cancellation
- [ ] Refund flow
- [ ] Order history
- [ ] Reorder

## Phase 11 — Delivery

- [ ] Delivery service abstraction
- [ ] Yango integration
- [ ] Delivery creation
- [ ] Tracking
- [ ] Delivery status
- [ ] Delivery history

## Phase 12 — Bulk Orders

- [ ] Bulk request
- [ ] Admin review
- [ ] Quotes
- [ ] Bulk pricing
- [ ] Payment
- [ ] Fulfillment

## Phase 13 — Notifications

- [ ] Email
- [ ] SMS
- [ ] In-app
- [ ] Order alerts
- [ ] Payment alerts
- [ ] Delivery alerts
- [ ] Stock alerts

## Phase 14 — Customer Account

- [ ] Profile
- [ ] Addresses
- [ ] Orders
- [ ] Notifications
- [ ] Reorder
- [ ] Guest conversion

## Phase 15 — Reports

- [ ] Sales
- [ ] Orders
- [ ] Products
- [ ] Brands
- [ ] Customers
- [ ] Inventory
- [ ] Delivery
- [ ] Payment

## Phase 16 — Security & Testing

- [ ] Authorization
- [ ] Validation
- [ ] Rate limiting
- [ ] Webhook security
- [ ] Payment testing
- [ ] Inventory testing
- [ ] Order testing
- [ ] Delivery testing

## Phase 17 — Production

- [ ] SEO
- [ ] Performance
- [ ] Mobile optimization
- [ ] Error monitoring
- [ ] Analytics
- [ ] Database backups
- [ ] Production deployment
- [ ] Domain
- [ ] SSL
- [ ] Final QA

---

# 93. MVP Scope

For the first production release, build:

### Customer

- Homepage
- Shop
- Brands
- Product pages
- Pack selection
- Quantity selection
- Dynamic pricing
- Cart
- Guest checkout
- Account checkout
- Address
- Location
- Delivery fee
- Mobile Money
- Bank payment
- Order confirmation
- Order tracking
- Order history
- Cancellation
- Reorder

### Admin

- Dashboard
- Products
- Brands
- Categories
- Pricing
- Inventory
- Low-stock alerts
- Orders
- Customers
- Delivery zones
- Payments
- Yango delivery
- Bulk orders
- Basic reports
- Settings

### Infrastructure

- Authentication
- MongoDB
- Payment webhooks
- Inventory reservation
- Notification system
- Yango integration
- Security
- Error handling

---

# 94. Phase 2 Features

After the MVP is stable:

- Loyalty points
- Coupons
- Referral system
- Product reviews
- Corporate accounts
- Recurring orders
- Water subscriptions
- WhatsApp ordering
- Advanced bulk ordering
- Automated promotions
- Multiple delivery providers
- Advanced analytics
- Customer segmentation

---

# 95. The Most Important Technical Rules

There are a few rules I would make **non-negotiable** during development:

### Rule 1 — Never trust frontend prices

Always calculate prices on the server.

### Rule 2 — Never trust frontend payment success

Only verified server-side payment callbacks/webhooks confirm payment.

### Rule 3 — Never permanently deduct stock when something enters the cart

Use stock reservations.

### Rule 4 — Never calculate historical orders using current product prices

Snapshot the price into `OrderItem`.

### Rule 5 — Never hard-code delivery fees

Use configurable delivery zones/rules.

### Rule 6 — Never hard-code Yango throughout the application

Use a `DeliveryService` abstraction.

### Rule 7 — Never require account creation for checkout

Guest checkout must work.

### Rule 8 — Don't lose guest orders

Allow guest customers to convert into registered accounts and claim eligible previous orders.

### Rule 9 — Don't disable ordering outside business hours

Allow orders and schedule fulfillment for the next available period.

### Rule 10 — Every important business operation needs a transaction/history record

Especially:

- Payments
- Inventory
- Orders
- Refunds
- Price changes
- Admin actions

---

# 96. Final System

When everything is completed, the platform effectively becomes:

```text
                    WATER DELIVERY PLATFORM
                              │
          ┌───────────────────┼───────────────────┐
          │                   │                   │
       CUSTOMER             ADMIN              DELIVERY
          │                   │                   │
          │                   │                   │
       Browse              Products             Yango
       Search              Pricing              Delivery
       Cart                Inventory             │
       Checkout            Orders                │
       Payment             Customers             │
       Tracking            Payments              │
       Account             Deliveries            │
       Reorder             Bulk Orders           │
                           Reports               │
          │                   │                   │
          └───────────────────┼───────────────────┘
                              │
                           NEXT.JS
                              │
                           MONGODB
                              │
         ┌────────────────────┼────────────────────┐
         │                    │                    │
      PAYMENTS             INVENTORY            PRICING
         │                    │                    │
      MoMo/Bank          Reservations        Quantity tiers
                            Stock             Brand pricing
         │                    │                    │
         └────────────────────┼────────────────────┘
                              │
                          YANGO DELIVERY
```

