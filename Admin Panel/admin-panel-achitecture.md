For this project, I would build the admin panel as a **production e-commerce operations system**, not just a collection of dashboard pages. Every screen should connect to real data, and every important action should update the rest of the system.

The architecture below is specifically for **your client's single-business store**:

- One business
- One admin/business owner
- No vendors
- Paystack payments
- GPS/location-based delivery
- Yango Delivery integration
- Automatic inventory deduction
- Customer accounts
- Real-time order updates
- Responsive admin UI

---

# 1. Overall System Architecture

The system should ultimately look like this:

```text
                         CUSTOMER WEBSITE
                               │
             ┌─────────────────┼──────────────────┐
             ↓                 ↓                  ↓
          Products          Cart              Account
             │                 │                  │
             └─────────────────┼──────────────────┘
                               ↓
                           CHECKOUT
                               │
                   ┌───────────┴───────────┐
                   ↓                       ↓
             CUSTOMER GPS             ADDRESS
                   │                       │
                   └───────────┬───────────┘
                               ↓
                       DELIVERY ENGINE
                               │
                               ↓
                         DELIVERY FEE
                               │
                               ↓
                        ORDER CREATION
                               │
                               ↓
                           PAYSTACK
                               │
                               ↓
                       PAYMENT WEBHOOK
                               │
                               ↓
                      PAYMENT VERIFICATION
                               │
                 ┌─────────────┴─────────────┐
                 ↓                           ↓
            INVENTORY                    ORDER
            DEDUCTION                   PROCESSING
                                             │
                                             ↓
                                      DELIVERY SYSTEM
                                             │
                                             ↓
                                           YANGO
                                             │
                                             ↓
                                         CUSTOMER
```

The **Admin Panel** sits over all of this:

```text
                         ADMIN PANEL
                              │
       ┌──────────┬───────────┼───────────┬──────────┐
       ↓          ↓           ↓           ↓          ↓
    Products   Inventory    Orders     Payments   Delivery
       │          │           │           │          │
       └──────────┴───────────┴───────────┴──────────┘
                              │
                    ┌─────────┴─────────┐
                    ↓                   ↓
                Customers          Analytics
                    │
                    ↓
              Notifications
```

---

# PHASE 1 — ADMIN FOUNDATION

## Module 1: Admin Authentication

Build this first.

### Screens

```text
/admin/login
/admin/forgot-password
/admin/reset-password
/admin/verify
```

### Login

```text
Email
Password

[ Sign In ]
```

Optional:

```text
Remember me
2FA
```

### Backend

Create:

```text
POST /api/admin/auth/login
POST /api/admin/auth/logout
POST /api/admin/auth/forgot-password
POST /api/admin/auth/reset-password
POST /api/admin/auth/verify
```

### Security

Implement:

- Secure sessions
- Password hashing
- Rate limiting
- Login attempt tracking
- Session expiration
- CSRF protection where applicable
- Secure cookies
- 2FA if enabled

---

# Module 2: Admin Roles & Permissions

Even though this is one business, don't give every employee full access.

### Roles

```text
Super Admin
Manager
Order Manager
Inventory Manager
Delivery Manager
Finance
Customer Support
```

### Permission structure

```text
dashboard.view

products.view
products.create
products.edit
products.delete

inventory.view
inventory.adjust

orders.view
orders.update
orders.cancel

payments.view
payments.refund

delivery.view
delivery.manage

customers.view

analytics.view

settings.manage
```

The backend must enforce these permissions.

Don't rely on hiding buttons in the frontend.

---

# Module 3: Admin Layout

Build the reusable shell before individual pages.

### Components

```text
AdminSidebar
AdminHeader
Breadcrumbs
GlobalSearch
NotificationBell
AdminProfileMenu
PageHeader
DataTable
Pagination
FilterBar
Modal
Drawer
ConfirmDialog
Toast
EmptyState
LoadingState
ErrorState
```

### Sidebar

```text
Dashboard

Orders
Products
Inventory
Customers

Payments
Refunds
Promotions
Reviews

Delivery
  Overview
  Store Location
  Delivery Zones
  Pricing Rules
  Active Deliveries
  Delivery History

Analytics
  Sales
  Products
  Customers
  Delivery
  Reports

Notifications

Admin Users
Roles & Permissions
Audit Logs
System Health

Settings
```

---

# PHASE 2 — DASHBOARD

# Module 4: Admin Dashboard

The dashboard aggregates information from every major module.

### KPI cards

```text
Today's Sales
₵4,850

Orders
48

Customers
1,240

Products
328

Low Stock
17

Pending Deliveries
12
```

### Data sources

Don't store these values separately unless necessary.

Calculate them from:

```text
Orders
Payments
Customers
Products
Inventory
Deliveries
```

### Dashboard sections

```text
Sales Overview
Order Status
Recent Orders
Low Stock
Recent Activity
Pending Deliveries
```

### Date filtering

```text
Today
Yesterday
7 Days
30 Days
3 Months
12 Months
Custom
```

---

# PHASE 3 — PRODUCT MANAGEMENT

# Module 5: Categories

Build categories before products.

### Functions

Admin can:

- Create category
- Edit category
- Delete category
- Disable category
- Reorder categories
- Upload category image
- Assign parent category

Example:

```text
Fashion
├── Dresses
├── Shoes
└── Accessories

Beauty
├── Hair
├── Skincare
└── Makeup
```

### API

```text
GET    /api/admin/categories
POST   /api/admin/categories
PATCH  /api/admin/categories/:id
DELETE /api/admin/categories/:id
```

---

# Module 6: Products

### Product list

Features:

- Search
- Filter
- Sort
- Pagination
- Bulk actions
- Status filtering
- Category filtering
- Stock filtering

### Product states

```text
Draft
Active
Out of Stock
Archived
```

### Product creation

```text
Basic Information
Images
Category
Pricing
Inventory
Variants
SEO
Status
```

---

# Module 7: Product Variants

If products have sizes/colors:

```text
Product
  ↓
Variants

Small / Black
Medium / Black
Large / Black
Small / White
```

Each variant can have:

```text
SKU
Price
Stock
Image
```

Inventory should operate at the **variant level** when variants exist.

---

# Module 8: Product Images

Implement:

```text
Upload
Delete
Reorder
Set Main Image
Optimize
Compress
```

Store files in your chosen object/media storage rather than your application server if possible.

---

# PHASE 4 — INVENTORY

# Module 9: Inventory Engine

This is critical.

Every stock-changing operation should go through a centralized inventory service.

```text
InventoryService
```

It handles:

```text
increaseStock()
decreaseStock()
adjustStock()
reserveStock()
releaseStock()
checkAvailability()
```

Don't scatter stock manipulation throughout random order code.

---

# Module 10: Automatic Stock Deduction

The flow should be:

```text
Customer buys 3
        ↓
Payment successful
        ↓
Inventory service
        ↓
Stock -3
```

Example:

```text
Before: 20
Purchased: 3
After: 17
```

### Important

Don't deduct stock merely because the customer:

- Opens product
- Adds to cart
- Starts checkout
- Opens Paystack

Payment confirmation should trigger the permanent deduction.

---

# Module 11: Stock Reservation

For high-demand products, you can add temporary reservations.

```text
Customer starts checkout
        ↓
Reserve stock
        ↓
Payment
   ├── Success → Deduct permanently
   └── Failed/Expired → Release reservation
```

Example:

```text
Actual stock: 20
Reserved: 3
Available: 17
```

This prevents multiple people from paying for the last available units.

Use an expiration time for reservations.

---

# Module 12: Low Stock System

Each product:

```text
stockQuantity: 20
lowStockThreshold: 10
```

After purchase:

```text
Stock = 8
Threshold = 10
```

System creates:

```text
LOW_STOCK
```

Admin notification:

> Ankara Dress has only 8 units remaining.

---

# Module 13: Inventory History

Every adjustment gets recorded.

```text
Product
Previous Stock
Change
New Stock
Reason
Performed By
Reference
Timestamp
```

Example:

```text
Ankara Dress

20 → 17

Reason:
Order #ORD-1024

Performed by:
System
```

---

# PHASE 5 — CUSTOMER MANAGEMENT

# Module 14: Customers

Admin can:

```text
View customers
Search customers
Filter customers
View profile
Disable account
Restore account
```

### Customer profile

```text
Profile
Orders
Addresses
Payments
Reviews
Activity
```

---

# Module 15: Customer Addresses

Each address should support:

```text
Full name
Phone
Region
City
Area
Street
Landmark
Digital Address
Latitude
Longitude
GPS Accuracy
Delivery instructions
```

This becomes important for delivery.

---

# PHASE 6 — ORDER ENGINE

# Module 16: Order Creation

Orders should have a lifecycle.

```text
PENDING_PAYMENT
     ↓
PAID
     ↓
PROCESSING
     ↓
READY_FOR_DELIVERY
     ↓
OUT_FOR_DELIVERY
     ↓
DELIVERED
```

Alternative endings:

```text
CANCELLED
REFUND_REQUESTED
REFUNDED
FAILED_DELIVERY
RETURNED
```

---

# Module 17: Order Validation

When checkout begins:

```text
Cart
 ↓
Server
 ↓
Validate products
 ↓
Validate prices
 ↓
Validate stock
 ↓
Validate address
 ↓
Calculate delivery
 ↓
Calculate discount
 ↓
Calculate final amount
```

Never trust:

```text
frontend price
frontend delivery fee
frontend discount
frontend total
```

The server recalculates everything.

---

# Module 18: Order Snapshot

Once created, save the important information as a snapshot.

```text
Order
├── Items
├── Product names
├── Prices
├── Quantities
├── Delivery address
├── GPS coordinates
├── Delivery fee
├── Distance
├── Zone
├── Discount
└── Final total
```

Why?

Because the product might later change from:

```text
₵200 → ₵250
```

But the old order must still show:

```text
₵200
```

---

# Module 19: Order Management

Admin can:

- View
- Search
- Filter
- Update status
- Cancel
- Print
- Contact customer
- View payment
- View delivery
- View timeline

---

# Module 20: Order Timeline

Automatically generate events:

```text
Order Created
Payment Initiated
Payment Confirmed
Order Processing
Order Ready
Delivery Created
Driver Assigned
Picked Up
Out for Delivery
Delivered
```

Don't make the timeline manually editable unless there's an administrative correction function.

---

# PHASE 7 — PAYSTACK

# Module 21: Payment Initialization

The flow:

```text
Checkout
 ↓
Create pending order
 ↓
Backend initializes Paystack
 ↓
Return payment authorization
 ↓
Open Paystack
```

Your secret key stays on the backend.

---

# Module 22: Payment Record

Create a separate payment record.

```text
Payment
├── id
├── orderId
├── reference
├── provider
├── amount
├── currency
├── channel
├── status
├── paidAt
├── metadata
└── providerResponse
```

---

# Module 23: Paystack Webhook

Create:

```text
POST /api/webhooks/paystack
```

Flow:

```text
Paystack
 ↓
Webhook
 ↓
Verify webhook signature
 ↓
Extract reference
 ↓
Find payment
 ↓
Find order
 ↓
Verify transaction with Paystack
 ↓
Check amount
 ↓
Check currency
 ↓
Check status
 ↓
Process payment
```

---

# Module 24: Idempotent Payment Processing

This is extremely important.

If Paystack sends the same event twice:

```text
Webhook 1
 ↓
Process payment
 ↓
Stock -3
```

Webhook 2:

```text
Already processed
 ↓
Do nothing
```

Never deduct inventory twice.

---

# Module 25: Payment States

```text
PENDING
SUCCESS
FAILED
ABANDONED
REFUNDED
PARTIALLY_REFUNDED
```

---

# Module 26: Refunds

Admin:

```text
Orders
 ↓
Refund Request
 ↓
Review
 ↓
Approve
 ↓
Process Paystack Refund
 ↓
Update Payment
 ↓
Update Order
 ↓
Notify Customer
```

---

# PHASE 8 — GPS & DELIVERY

This is one of the biggest parts of your system.

# Module 27: Store Location

Admin configures:

```text
Business Name
Address
Latitude
Longitude
```

Options:

```text
Use Current Location
Pick on Map
Search Location
```

The store coordinates become the delivery origin.

---

# Module 28: Customer Location

At checkout:

```text
Use Current Location
```

Browser/device requests GPS permission.

Then:

```text
Latitude
Longitude
Accuracy
Timestamp
```

Send to backend.

---

# Module 29: Manual Location

GPS should NOT be mandatory.

Allow:

```text
Search Address
Pick on Map
Enter Address
Digital Address
```

The customer can move the map pin to correct inaccurate GPS.

---

# Module 30: Location Confirmation

Show:

```text
Delivery Location

📍 East Legon, Accra

GPS Accuracy:
18m

[ Confirm Location ]

[ Adjust Location ]
```

---

# Module 31: Delivery Zones

Admin creates zones.

Two approaches:

### Radius

```text
Store
 ↓
5 km radius
```

### Polygon

Admin draws an actual geographical boundary.

I recommend supporting both.

---

# Module 32: Delivery Zone Configuration

Each zone:

```text
Name
Description
Type
Geometry/Radius
Priority
Pricing Rule
Minimum Order
Maximum Order
Maximum Distance
Active/Inactive
```

Example:

```text
East Legon

Radius:
5 km

Fee:
₵20

Priority:
1
```

---

# Module 33: Delivery Pricing Engine

Create a centralized:

```text
DeliveryPricingService
```

It receives:

```text
storeLocation
customerLocation
distance
zone
orderSubtotal
```

And returns:

```text
deliveryFee
zone
pricingRule
estimatedDeliveryTime
availability
```

---

# Module 34: Pricing Models

Support:

### Fixed

```text
East Legon = ₵20
```

### Distance

```text
Base = ₵15

Included = 3 km

Additional = ₵3/km
```

### Zone

```text
Zone A = ₵20
Zone B = ₵30
Zone C = ₵45
```

### Free delivery

```text
Order >= ₵500
→ Free
```

---

# Module 35: Delivery Calculation

Example:

```text
Store:
5.6037,-0.1870

Customer:
5.6201,-0.1712

Distance:
3.1 km

Zone:
East Legon

Pricing:
₵20

Delivery:
AVAILABLE
```

Return that to checkout.

---

# Module 36: Delivery Quote

Create an endpoint conceptually:

```text
POST /api/delivery/quote
```

Input:

```text
latitude
longitude
cartTotal
```

Output:

```text
{
  available: true,
  zone: "East Legon",
  distanceKm: 3.1,
  fee: 20,
  estimatedTime: "30-60 minutes"
}
```

---

# Module 37: Delivery Snapshot

When order is created:

```text
deliverySnapshot
```

stores:

```text
customerLatitude
customerLongitude
zone
distance
fee
pricingRule
```

This prevents future pricing changes from altering old orders.

---

# Module 38: Delivery Availability

If no zone matches:

```text
available: false
```

Checkout stops before payment.

```text
We currently don't deliver
to this location.

[ Change Location ]
```

---

# Module 39: Active Deliveries

Admin sees:

```text
Active Deliveries: 12

MAP

Store 📦
   ↓
Driver 🚗
   ↓
Customer 📍
```

Information:

```text
Order
Customer
Driver
Distance
ETA
Status
```

---

# Module 40: Delivery Status

Use:

```text
PENDING
REQUESTED
DRIVER_ASSIGNED
PICKED_UP
IN_TRANSIT
ARRIVING
DELIVERED
FAILED
CANCELLED
```

---

# Module 41: Yango Integration

After payment:

```text
Payment Confirmed
 ↓
Order Processing
 ↓
Order Ready
 ↓
Create Delivery Request
 ↓
Yango API
 ↓
Driver Assigned
 ↓
Pickup
 ↓
Delivery
```

Store:

```text
provider
providerOrderId
driverName
driverPhone
vehicle
status
tracking information
```

Keep Yango behind a generic interface:

```text
DeliveryProvider
```

Then:

```text
YangoProvider
```

implements it.

That means you can replace Yango later without rebuilding your delivery engine.

---

# PHASE 9 — PROMOTIONS

# Module 42: Coupons

Admin creates:

```text
WELCOME20

20% discount

Minimum:
₵100

Maximum:
₵50

Usage:
500

Expires:
September 30
```

Server validates:

- Code exists
- Active
- Not expired
- Usage limit
- Minimum order
- Customer eligibility

---

# Module 43: Product Discounts

Support:

```text
Original Price
Sale Price
Start
End
```

---

# Module 44: Free Delivery Promotions

Example:

```text
Order above ₵500
→ Free delivery
```

The delivery engine should check this before returning the final delivery fee.

---

# PHASE 10 — REVIEWS

# Module 45: Review Management

Customer:

```text
Order delivered
 ↓
Can review product
```

Admin:

```text
Pending
Published
Reported
Hidden
```

Admin can moderate inappropriate reviews.

---

# PHASE 11 — NOTIFICATIONS

# Module 46: Notification Engine

Create a centralized notification service.

```text
NotificationService
```

Events trigger notifications.

Example:

```text
PAYMENT_SUCCESS
        ↓
Customer notification
        ↓
Admin notification
```

---

# Module 47: Customer Notifications

Events:

```text
Order Created
Payment Successful
Payment Failed
Order Processing
Ready for Delivery
Driver Assigned
Out for Delivery
Delivered
Cancelled
Refund Completed
```

---

# Module 48: Admin Notifications

Admin receives:

```text
New Order
Payment Received
Low Stock
Out of Stock
Refund Request
Delivery Failed
New Customer
System Error
```

---

# PHASE 12 — ANALYTICS

# Module 49: Sales Analytics

Track:

```text
Revenue
Orders
Average Order Value
Discounts
Refunds
Delivery Fees
```

Filters:

```text
Today
7 Days
30 Days
3 Months
12 Months
Custom
```

---

# Module 50: Product Analytics

Show:

```text
Best Sellers
Worst Sellers
Most Viewed
Highest Revenue
Lowest Revenue
Low Stock
Out of Stock
```

---

# Module 51: Customer Analytics

Track:

```text
New Customers
Returning Customers
Total Customers
Average Spend
Orders per Customer
Customer Retention
```

---

# Module 52: Delivery Analytics

Track:

```text
Total Deliveries
Completed
Failed
Average Distance
Average Delivery Fee
Average Delivery Time
```

---

# Module 53: Reports

Allow export:

```text
Sales
Orders
Products
Inventory
Customers
Payments
Refunds
Delivery
```

---

# PHASE 13 — ADMIN MANAGEMENT

# Module 54: Admin Users

Create staff accounts:

```text
Name
Email
Phone
Role
Status
```

Statuses:

```text
Active
Suspended
Inactive
```

---

# Module 55: Roles & Permissions

Admin can create custom roles.

Example:

```text
Delivery Manager

✓ View Orders
✓ View Customers
✓ Manage Deliveries
✓ View Delivery Analytics

✕ Refund Payments
✕ Delete Products
✕ Change Settings
```

---

# Module 56: Audit Logs

Record every sensitive action.

```text
Admin
Action
Resource
Before
After
IP
Timestamp
```

Example:

```text
Manager

Changed:
Delivery fee

Before:
₵20

After:
₵25

Zone:
East Legon

10:42 AM
```

---

# PHASE 14 — SETTINGS

# Module 57: Store Settings

```text
Business Name
Logo
Phone
Email
Address
Currency
Timezone
Business Hours
```

---

# Module 58: Payment Settings

```text
Paystack
Public Key
Secret Key
Environment
Webhook
Payment Channels
```

The secret key must only exist server-side.

---

# Module 59: Delivery Settings

```text
Store Location
Default Pricing Rule
Maximum Delivery Distance
Default Delivery Time
Delivery Provider
Yango Configuration
```

---

# Module 60: Inventory Settings

```text
Default Low Stock Threshold
Allow Backorders
Reservation Duration
Out-of-stock behavior
Low-stock notifications
```

---

# Module 61: Order Settings

```text
Order Prefix
Auto-confirm orders
Cancellation rules
Refund rules
Pending-payment timeout
```

---

# Module 62: Notification Settings

```text
Email
SMS
Push
Admin Notifications
Customer Notifications
```

---

# PHASE 15 — SYSTEM HEALTH

# Module 63: System Health

Monitor:

```text
Database
API
Paystack
Yango
Storage
Email
Notifications
Background Jobs
```

Example:

```text
Database       ● Operational
Paystack       ● Operational
Yango          ● Operational
Email          ● Operational
Storage        ● Operational
```

---

# PHASE 16 — BACKEND ARCHITECTURE

I strongly recommend separating business logic into services.

Something conceptually like:

```text
backend/
│
├── auth/
│
├── users/
│
├── products/
│
├── categories/
│
├── inventory/
│
├── orders/
│
├── payments/
│   └── paystack/
│
├── delivery/
│   ├── zones/
│   ├── pricing/
│   ├── location/
│   └── providers/
│       └── yango/
│
├── promotions/
├── reviews/
├── notifications/
├── analytics/
├── reports/
├── admin/
│
├── audit/
└── system/
```

---

# PHASE 17 — DATABASE RELATIONSHIPS

Your core entities should be roughly:

```text
User
 │
 ├── Addresses
 ├── Orders
 ├── Reviews
 └── Notifications

Product
 │
 ├── Category
 ├── Variants
 ├── Inventory
 └── Reviews

Order
 │
 ├── User
 ├── OrderItems
 ├── Payment
 ├── Delivery
 ├── Discount
 └── Timeline

Delivery
 │
 ├── Order
 ├── Zone
 ├── PricingRule
 └── Provider

Payment
 │
 └── Paystack Transaction
```

---

# PHASE 18 — REAL-TIME SYNCHRONIZATION

The admin panel shouldn't require constant refreshing.

When an order is paid:

```text
Paystack
 ↓
Webhook
 ↓
Backend
 ↓
Database
 ↓
Realtime Event
 ↓
Admin Dashboard
```

The admin immediately sees:

```text
New Order
₵480
Payment Successful
```

Likewise:

```text
Inventory updated
        ↓
Admin inventory screen updates
```

And:

```text
Driver status changed
        ↓
Delivery screen updates
```

Depending on your stack, use a realtime mechanism such as WebSockets, Server-Sent Events, or a managed realtime database service.

---

# PHASE 19 — BACKGROUND JOBS

Some processes should not block the user's request.

Create background jobs for:

```text
Email sending
Notifications
Low-stock alerts
Payment reconciliation
Delivery status synchronization
Expired payment cleanup
Stock reservation expiration
Analytics aggregation
Report generation
```

Example:

```text
Payment successful
       ↓
Order processing immediately
       ↓
Queue notification
       ↓
Send email/SMS asynchronously
```

---

# PHASE 20 — ERROR HANDLING

Every module needs:

### Loading state

```text
Skeleton
```

### Empty state

```text
No orders found.

[ Clear Filters ]
```

### Error state

```text
Something went wrong.

[ Try Again ]
```

### Network failure

```text
You're offline.

We'll reconnect automatically.
```

### Payment failure

```text
Payment could not be completed.

[ Try Again ]
```

### Delivery failure

```text
We couldn't calculate delivery
for this location.

[ Change Location ]
```

---

# PHASE 21 — SECURITY

This should be implemented throughout development, not at the end.

### Backend

Implement:

- Authentication
- Authorization
- Rate limiting
- Input validation
- Request validation
- Database validation
- Secure secrets
- Webhook verification
- Idempotency
- Audit logs
- Access control
- Secure file uploads

### Never trust the client for:

```text
Price
Stock
Discount
Delivery fee
Payment status
Order ownership
Admin permissions
```

---

# PHASE 22 — CHECKOUT + ADMIN INTEGRATION

This is the most important complete flow.

```text
CUSTOMER
   │
   ↓
Add Product
   │
   ↓
Cart
   │
   ↓
Checkout
   │
   ├───────────────┐
   ↓               ↓
Address          GPS
   │               │
   └───────┬───────┘
           ↓
     Delivery Engine
           ↓
      Delivery Zone
           ↓
      Pricing Rule
           ↓
      Delivery Fee
           ↓
      Final Total
           ↓
      Create Order
           ↓
   PENDING_PAYMENT
           ↓
      Initialize
       Paystack
           ↓
       Customer
        Pays
           ↓
    Paystack Webhook
           ↓
      Verify Payment
           ↓
        SUCCESS
           ↓
      Payment = PAID
           ↓
    Inventory Service
           ↓
      Stock Deduction
           ↓
   Order = PROCESSING
           ↓
    Admin Notification
           ↓
    Prepare Products
           ↓
 READY_FOR_DELIVERY
           ↓
   Yango Delivery
           ↓
 DRIVER_ASSIGNED
           ↓
      PICKED_UP
           ↓
      IN_TRANSIT
           ↓
       DELIVERED
```

---

# PHASE 23 — ADMIN DEVELOPMENT ORDER

This is the order I would actually build the project.

## Sprint 1 — Foundation

```text
1. Project structure
2. Database
3. Authentication
4. Admin authentication
5. Roles
6. Permissions
7. Admin layout
8. Global components
```

## Sprint 2 — Catalog

```text
9. Categories
10. Products
11. Product creation
12. Product editing
13. Product images
14. Variants
15. Product search/filtering
```

## Sprint 3 — Inventory

```text
16. Inventory
17. Stock tracking
18. Stock adjustments
19. Stock history
20. Low-stock alerts
21. Out-of-stock handling
22. Stock reservations
```

## Sprint 4 — Customers

```text
23. Customers
24. Customer profiles
25. Addresses
26. GPS addresses
27. Customer activity
```

## Sprint 5 — Orders

```text
28. Order creation
29. Order list
30. Order details
31. Order timeline
32. Order status
33. Order cancellation
```

## Sprint 6 — Paystack

```text
34. Payment model
35. Paystack initialization
36. Checkout integration
37. Webhook
38. Transaction verification
39. Idempotency
40. Payment dashboard
41. Refunds
```

## Sprint 7 — GPS Delivery

```text
42. Store coordinates
43. Customer GPS
44. Map selection
45. Location validation
46. Distance calculation
47. Delivery zones
48. Zone editor
49. Pricing rules
50. Delivery quote
51. Delivery availability
```

## Sprint 8 — Yango

```text
52. Delivery provider interface
53. Yango configuration
54. Create delivery
55. Driver assignment
56. Delivery status
57. Delivery tracking
58. Delivery history
```

## Sprint 9 — Business Features

```text
59. Coupons
60. Discounts
61. Free delivery
62. Reviews
63. Notifications
```

## Sprint 10 — Analytics

```text
64. Sales analytics
65. Product analytics
66. Customer analytics
67. Delivery analytics
68. Reports
69. Export
```

## Sprint 11 — Administration

```text
70. Admin users
71. Roles
72. Permissions
73. Audit logs
74. System health
75. Settings
```

## Sprint 12 — Production Hardening

```text
76. Error handling
77. Security audit
78. Payment edge cases
79. Inventory race-condition testing
80. Delivery edge cases
81. Performance optimization
82. Mobile responsiveness
83. Accessibility
84. Automated testing
85. Production deployment
```

---

# PHASE 24 — TEST THE IMPORTANT EDGE CASES

Don't just test the happy path.

### Payment

Test:

```text
Successful payment
Failed payment
Abandoned payment
Duplicate webhook
Wrong amount
Expired transaction
Network interruption
Customer closes Paystack
```

### Inventory

Test:

```text
Last item purchased
Two users buy last item
Payment fails
Payment succeeds twice
Order cancelled
Refunded order
```

### GPS

Test:

```text
GPS allowed
GPS denied
GPS unavailable
Poor accuracy
Location outside zone
Overlapping zones
Boundary location
Manual map location
```

### Delivery

Test:

```text
Yango succeeds
Yango fails
Driver unavailable
Delivery cancelled
Customer unavailable
Delivery completed
```

---

# The Most Important Principle

Don't build the admin panel as:

```text
Page → Button → Database
```

Build it as:

```text
USER ACTION
     ↓
VALIDATION
     ↓
BUSINESS SERVICE
     ↓
DATABASE TRANSACTION
     ↓
EVENT
     ↓
NOTIFICATION / REALTIME UPDATE
     ↓
AUDIT LOG
```

For example, when an order is paid:

```text
Paystack webhook
       ↓
Verify transaction
       ↓
Payment Service
       ↓
Database transaction
       ├── Payment → SUCCESS
       ├── Order → PROCESSING
       ├── Inventory → -quantity
       └── Timeline → PAYMENT_CONFIRMED
       ↓
Event: ORDER_PAID
       ├── Notify Admin
       ├── Notify Customer
       ├── Update Dashboard
       └── Prepare Delivery
```

That architecture will keep the website reliable as it grows.

## Final build map

```text
                         ┌──────────────────┐
                         │   ADMIN PANEL    │
                         └────────┬─────────┘
                                  │
       ┌──────────────┬───────────┼────────────┬──────────────┐
       ↓              ↓           ↓            ↓              ↓
   PRODUCTS       INVENTORY    CUSTOMERS     ORDERS       PAYMENTS
       │              │           │            │              │
       │              └───────────┴────────────┤              │
       │                                       ↓              │
       │                                    CHECKOUT           │
       │                                       │              │
       │                               ┌───────┴──────┐       │
       │                               ↓              ↓       │
       │                             GPS          ADDRESS     │
       │                               │              │       │
       │                               └──────┬───────┘       │
       │                                      ↓               │
       │                              DELIVERY ENGINE         │
       │                                      │               │
       │                               ZONE + PRICING         │
       │                                      │               │
       └──────────────────────────────────────┼───────────────┘
                                              ↓
                                           PAYSTACK
                                              │
                                              ↓
                                      PAYMENT VERIFIED
                                              │
                              ┌───────────────┴──────────────┐
                              ↓                              ↓
                         INVENTORY                       DELIVERY
                         DEDUCTION                          │
                              │                              ↓
                              │                           YANGO
                              │                              │
                              └──────────────┬───────────────┘
                                             ↓
                                          CUSTOMER
                                             ↓
                                         DELIVERED
```
