# MASTER BUILD PROMPT — SINGLE-BUSINESS E-COMMERCE ADMIN PANEL

## PROJECT CONTEXT

You are building a production-ready **single-business e-commerce website and admin panel** for a client's business.

IMPORTANT: This is **NOT a marketplace and NOT a multi-vendor system**.

There is only:

- One business/store
- One business owner
- Customers
- Admin/staff users
- Products owned by the business
- One inventory system
- One payment system using Paystack
- One delivery system using GPS/location-based pricing
- Yango Delivery as the planned delivery provider

DO NOT introduce:

- Vendors
- Vendor dashboards
- Vendor commissions
- Vendor payouts
- Vendor onboarding
- Vendor approval
- Marketplace functionality
- Multi-store functionality
- Vendor-specific inventory
- Vendor-specific orders

The business owner should have complete control over products, inventory, customers, orders, payments, delivery, promotions, analytics, and system settings.

---

# 1. CORE OBJECTIVE

Build a complete, functional admin panel where the business can manage the entire e-commerce operation.

The admin panel must not be a static UI.

Every major button, form, table, filter, status change, calculation, payment action, inventory action, delivery action, notification, and setting must connect to real application logic and persistent data.

The final system should allow this complete flow:

CUSTOMER:

Browse Products
→ Product Details
→ Add to Cart
→ Checkout
→ Select/enter delivery location
→ GPS location detection
→ Delivery zone calculation
→ Delivery fee calculation
→ Order creation
→ Paystack payment
→ Payment verification
→ Order confirmation
→ Delivery processing
→ Yango Delivery
→ Delivery tracking/status
→ Delivered

ADMIN:

Dashboard
→ View order
→ Confirm payment
→ Process order
→ Inventory automatically updated
→ Prepare delivery
→ Create/manage delivery
→ Monitor delivery
→ Complete order
→ Analytics automatically updated

---

# 2. GENERAL DEVELOPMENT RULES

Follow these rules throughout the project.

## Rule 1 — Production functionality

Do not build fake functionality.

Avoid:

- Hardcoded dashboard statistics
- Fake orders
- Fake payments
- Fake inventory
- Fake delivery calculations
- Fake GPS coordinates
- Fake notifications
- Fake API responses

If an integration is not available during development, create a clean service abstraction and development/mock mode, but structure it so the production provider can be connected without rewriting the application.

---

## Rule 2 — Server is authoritative

Never trust frontend values for:

- Product price
- Product stock
- Discount
- Delivery fee
- Order total
- Payment status
- Customer ownership
- Admin permissions

The backend must recalculate and validate important values.

---

## Rule 3 — Centralize business logic

Do not duplicate business logic across components.

Create reusable services such as:

```text
InventoryService
OrderService
PaymentService
DeliveryService
DeliveryPricingService
NotificationService
PromotionService
RefundService
AnalyticsService
AuditService
```

---

## Rule 4 — Database transactions

Use database transactions wherever multiple records must change together.

Examples:

Payment success:

```text
Payment → SUCCESS
Order → PROCESSING
Inventory → decrease
Order Timeline → payment confirmed
```

These operations should be handled safely so partial updates do not leave the system inconsistent.

---

## Rule 5 — Idempotency

Important operations must be idempotent.

Especially:

- Paystack webhooks
- Inventory deduction
- Refund processing
- Delivery creation
- Notifications where appropriate

If the same webhook is received twice, the system must not:

- Deduct inventory twice
- Create two deliveries
- Mark payment twice
- Duplicate order events

---

# 3. ADMIN AUTHENTICATION

Create a secure admin authentication system.

Routes:

```text
/admin/login
/admin/forgot-password
/admin/reset-password
/admin/verify
```

Features:

- Login
- Logout
- Forgot password
- Reset password
- Session management
- Session expiration
- Secure cookies
- Password hashing
- Rate limiting
- Login attempt protection
- Optional 2FA
- Login history

Protect every `/admin/*` route.

Unauthenticated users must be redirected to login.

---

# 4. ADMIN ROLES AND PERMISSIONS

Support internal staff roles.

Default roles:

```text
Super Admin
Manager
Order Manager
Inventory Manager
Delivery Manager
Finance
Customer Support
```

Create granular permissions such as:

```text
dashboard.view

products.view
products.create
products.edit
products.delete

categories.view
categories.create
categories.edit
categories.delete

inventory.view
inventory.adjust

orders.view
orders.update
orders.cancel

customers.view
customers.manage

payments.view
payments.refund

delivery.view
delivery.manage

promotions.view
promotions.manage

reviews.view
reviews.manage

analytics.view
reports.export

admins.view
admins.manage

roles.view
roles.manage

settings.view
settings.manage

audit.view
```

Permissions must be enforced on the backend.

Do not only hide unauthorized buttons in the frontend.

---

# 5. ADMIN LAYOUT

Create a professional responsive admin layout.

Desktop:

```text
Sidebar
Header
Main Content
```

Mobile:

```text
Top Header
Menu Drawer
Main Content
```

Reusable components:

```text
AdminSidebar
AdminHeader
Breadcrumbs
PageHeader
GlobalSearch
NotificationBell
ProfileMenu
DataTable
FilterBar
Pagination
Modal
Drawer
ConfirmDialog
Toast
Dropdown
Tabs
Badge
Tooltip
Skeleton
EmptyState
ErrorState
```

The UI should feel like a modern professional commerce dashboard.

Use a consistent design system.

---

# 6. ADMIN SIDEBAR

Use this structure:

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

Do not add vendor-related navigation.

---

# 7. DASHBOARD MODULE

Create `/admin/dashboard`.

Dashboard cards:

```text
Today's Sales
Orders
Customers
Products
Low Stock
Pending Deliveries
```

Sales overview:

```text
Today
7 Days
30 Days
3 Months
12 Months
Custom
```

Display:

- Revenue
- Order count
- Average order value
- Refunds
- Discounts
- Delivery fees

Additional widgets:

```text
Recent Orders
Order Status Breakdown
Low Stock Products
Recent Activity
Pending Deliveries
Top Products
```

Dashboard data must come from the database.

Implement proper loading, empty and error states.

---

# 8. CATEGORY MODULE

Create category management.

Features:

- List categories
- Create category
- Edit category
- Delete category
- Enable/disable
- Reorder
- Category image
- Parent/child categories if required
- SEO title
- SEO description

API structure:

```text
GET
POST
PATCH
DELETE
```

Prevent deletion of categories that still contain products unless the admin explicitly chooses a safe reassignment/archive workflow.

---

# 9. PRODUCT MODULE

Create:

```text
/admin/products
/admin/products/new
/admin/products/:id
/admin/products/:id/edit
```

Product fields:

```text
Name
Slug
Description
Short Description
Category
SKU
Price
Sale Price
Cost Price
Images
Status
Stock
Low Stock Threshold
Featured
SEO
```

Statuses:

```text
DRAFT
ACTIVE
OUT_OF_STOCK
ARCHIVED
```

Features:

- Search
- Filtering
- Sorting
- Pagination
- Bulk actions
- Activate/deactivate
- Archive
- Delete
- Featured products

---

# 10. PRODUCT VARIANTS

Support variants where necessary.

Example:

```text
Size
Color
```

Each variant can have:

```text
SKU
Price
Stock
Image
```

Inventory must operate at variant level when variants exist.

---

# 11. IMAGE MANAGEMENT

Support:

- Upload
- Delete
- Reorder
- Set primary image
- Image optimization
- Validation
- File size restrictions
- Supported formats

Do not store unnecessarily large original files in the application server.

Use proper media/object storage.

---

# 12. INVENTORY MODULE

Create:

```text
/admin/inventory
```

Display:

```text
Total Products
Total Units
Low Stock
Out of Stock
```

Inventory service:

```text
InventoryService
```

Functions:

```text
checkAvailability()
reserveStock()
releaseReservation()
decreaseStock()
increaseStock()
adjustStock()
```

---

# 13. AUTOMATIC INVENTORY DEDUCTION

This is mandatory.

Example:

```text
Current stock = 20

Customer purchases = 3

Payment confirmed

New stock = 17
```

Do not permanently deduct stock when:

- Product is viewed
- Product is added to cart
- Checkout is opened

Permanent deduction happens only after confirmed successful payment/order processing according to the chosen reservation strategy.

---

# 14. STOCK RESERVATION

Implement safe inventory reservation.

Flow:

```text
Customer starts checkout
↓
Stock availability checked
↓
Stock temporarily reserved
↓
Customer pays
├── SUCCESS → convert reservation to permanent deduction
└── FAILED/EXPIRED → release reservation
```

Reservations must expire automatically.

Prevent overselling when two customers attempt to purchase the same limited stock.

---

# 15. LOW STOCK SYSTEM

Every product should have:

```text
stockQuantity
lowStockThreshold
```

Example:

```text
Stock = 7
Threshold = 10
```

Automatically mark:

```text
LOW STOCK
```

Create admin notification.

When stock reaches zero:

```text
OUT OF STOCK
```

Prevent purchasing unless backorders are explicitly enabled.

---

# 16. INVENTORY HISTORY

Every stock change must be logged.

Fields:

```text
Product
Variant
Previous Quantity
Change
New Quantity
Reason
Reference
Performed By
Timestamp
```

Examples:

```text
SALE
RESTOCK
MANUAL_ADJUSTMENT
RETURN
REFUND
RESERVATION
RESERVATION_RELEASE
```

---

# 17. CUSTOMER MODULE

Create:

```text
/admin/customers
/admin/customers/:id
```

Customer list:

```text
Name
Phone
Email
Orders
Total Spent
Last Order
Status
```

Customer profile:

```text
Overview
Orders
Addresses
Payments
Reviews
Activity
```

Allow admins to:

- View
- Search
- Filter
- Disable
- Restore
- View order history
- View addresses
- View payments
- View reviews

---

# 18. CUSTOMER ADDRESS SYSTEM

Each address should support:

```text
Full Name
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
Delivery Instructions
Default Address
```

Store coordinates when the customer confirms a GPS location.

---

# 19. ORDER MODULE

Create:

```text
/admin/orders
/admin/orders/:id
```

Order statuses:

```text
PENDING_PAYMENT
PAID
PROCESSING
READY_FOR_DELIVERY
OUT_FOR_DELIVERY
DELIVERED
CANCELLED
REFUND_REQUESTED
REFUNDED
FAILED_DELIVERY
RETURNED
```

Order list should support:

- Search
- Filters
- Status filters
- Payment filters
- Date filters
- Customer filters
- Pagination
- Sorting

---

# 20. ORDER DETAILS

Show:

```text
Order Number
Customer
Items
Pricing
Payment
Delivery
Timeline
Notes
```

Items:

```text
Product
Variant
Quantity
Unit Price
Subtotal
```

Pricing:

```text
Subtotal
Discount
Delivery Fee
Tax if applicable
Total
```

Payment:

```text
Provider
Reference
Amount
Status
Channel
Paid At
```

Delivery:

```text
Address
GPS
Zone
Distance
Fee
Provider
Status
Driver
Tracking
```

---

# 21. ORDER SNAPSHOT

When the order is created, store immutable snapshots of:

```text
Product name
Variant
Price
Quantity
Delivery address
Latitude
Longitude
Zone
Distance
Delivery fee
Discount
Final total
```

Historical orders must not change if the product or delivery pricing changes later.

---

# 22. ORDER TIMELINE

Automatically record:

```text
ORDER_CREATED
PAYMENT_INITIATED
PAYMENT_CONFIRMED
ORDER_PROCESSING
ORDER_READY
DELIVERY_CREATED
DRIVER_ASSIGNED
PICKED_UP
OUT_FOR_DELIVERY
DELIVERED
CANCELLED
REFUND_REQUESTED
REFUNDED
```

Display the timeline in the admin order details page.

---

# 23. PAYSTACK INTEGRATION

Use Paystack for payment processing.

Never expose the Paystack secret key to the browser.

Payment architecture:

```text
Checkout
↓
Backend validates cart
↓
Backend calculates total
↓
Create pending order
↓
Initialize Paystack
↓
Customer pays
↓
Paystack webhook
↓
Verify transaction
↓
Confirm payment
↓
Process order
↓
Update inventory
```

---

# 24. PAYMENT MODEL

Create a dedicated payment record.

Fields:

```text
id
orderId
reference
provider
amount
currency
channel
status
paidAt
metadata
providerResponse
createdAt
updatedAt
```

Statuses:

```text
PENDING
SUCCESS
FAILED
ABANDONED
REFUNDED
PARTIALLY_REFUNDED
```

---

# 25. PAYSTACK WEBHOOK

Create a secure webhook endpoint:

```text
/api/webhooks/paystack
```

Webhook processing:

```text
Receive webhook
↓
Verify webhook signature
↓
Extract transaction reference
↓
Find payment
↓
Verify transaction with Paystack
↓
Validate amount
↓
Validate currency
↓
Validate order
↓
Check idempotency
↓
Mark payment successful
↓
Update order
↓
Update inventory
↓
Create timeline event
↓
Notify customer/admin
```

Never rely solely on the frontend payment redirect to confirm payment.

---

# 26. PAYMENT IDEMPOTENCY

If the same Paystack event is received twice:

```text
First webhook
→ process payment

Second webhook
→ detect already processed
→ do nothing
```

Inventory must never be deducted twice.

---

# 27. REFUNDS

Admin can access:

```text
/admin/refunds
```

Refund flow:

```text
Customer refund request
↓
Admin reviews
↓
Approve
↓
Process refund through Paystack
↓
Update payment
↓
Update order
↓
Restore inventory if appropriate
↓
Notify customer
↓
Audit action
```

Support:

```text
Full Refund
Partial Refund
```

---

# 28. STORE LOCATION MODULE

Create:

```text
/admin/delivery/store-location
```

Admin configures:

```text
Business Name
Address
Latitude
Longitude
```

Allow:

```text
Use Current Location
Search Location
Select On Map
Drag Map Pin
```

The saved coordinates become the delivery origin.

---

# 29. CUSTOMER GPS MODULE

At checkout:

```text
Use Current Location
```

Request browser/device location permission.

Capture:

```text
latitude
longitude
accuracy
timestamp
```

Do not automatically assume GPS is accurate.

Display:

```text
Your delivery location
GPS accuracy: 18m
```

Allow customer to adjust the pin manually.

---

# 30. MANUAL LOCATION FALLBACK

GPS must not be the only option.

Support:

```text
Search Address
Pick Location On Map
Enter Address
Digital Address
```

Customer should be able to manually correct their delivery location.

---

# 31. DELIVERY ZONE MODULE

Create:

```text
/admin/delivery/zones
```

Support two zone types:

### Radius

Example:

```text
East Legon
Radius = 5 km
```

### Polygon

Allow admin to draw an actual delivery boundary on a map.

Each zone should have:

```text
Name
Description
Type
Geometry
Priority
Pricing Rule
Minimum Order
Maximum Distance
Status
```

---

# 32. DELIVERY PRICING MODULE

Create:

```text
/admin/delivery/pricing
```

Support:

### Fixed price

```text
East Legon = ₵20
```

### Distance pricing

```text
Base = ₵15
Included = 3km
Additional = ₵3/km
```

### Zone pricing

```text
Zone A = ₵20
Zone B = ₵30
Zone C = ₵45
```

### Free delivery

```text
Order ≥ ₵500
→ Free delivery
```

---

# 33. DELIVERY PRICING SERVICE

Create:

```text
DeliveryPricingService
```

Input:

```text
storeLocation
customerLocation
distance
zone
orderSubtotal
promotion
```

Output:

```text
available
zone
distanceKm
deliveryFee
pricingRule
estimatedDeliveryTime
```

Example:

```text
Store:
5.6037,-0.1870

Customer:
5.6201,-0.1712

Distance:
3.1km

Zone:
East Legon

Fee:
₵20

Available:
true
```

---

# 34. DELIVERY QUOTE API

Create an endpoint such as:

```text
POST /api/delivery/quote
```

Request:

```text
latitude
longitude
cartTotal
```

Response:

```text
{
  available: true,
  zone: "East Legon",
  distanceKm: 3.1,
  fee: 20,
  estimatedDeliveryTime: "30-60 minutes"
}
```

The server must perform the calculation.

Do not allow the customer to submit an arbitrary delivery fee.

---

# 35. DELIVERY AVAILABILITY

If the customer's location is outside all active zones:

```text
available = false
```

Checkout must prevent payment.

Display:

```text
Sorry, we currently don't deliver
to this location.

[Change Location]
```

---

# 36. DELIVERY SNAPSHOT

When the order is created, save:

```text
Customer Latitude
Customer Longitude
Address
Zone
Distance
Delivery Fee
Pricing Rule
Estimated Delivery Time
```

Changing delivery pricing later must not change old orders.

---

# 37. DELIVERY MANAGEMENT

Create:

```text
/admin/delivery
/admin/delivery/active
/admin/delivery/history
```

Dashboard:

```text
Active Deliveries
Pending
Assigned
Picked Up
In Transit
Delivered
Failed
```

---

# 38. YANGO DELIVERY INTEGRATION

Do not tightly couple the application directly to Yango everywhere.

Create:

```text
DeliveryProvider
```

Then:

```text
YangoProvider implements DeliveryProvider
```

This abstraction should support:

```text
createDelivery()
cancelDelivery()
getDelivery()
getStatus()
getTracking()
```

When an order is ready:

```text
Order READY_FOR_DELIVERY
↓
Create Yango delivery
↓
Store provider delivery ID
↓
Driver assigned
↓
Track status
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

If the business later switches providers, only the provider implementation should need major changes.

---

# 39. DELIVERY STATUS SYNCHRONIZATION

Keep the internal status system separate from provider-specific statuses.

Map provider statuses into:

```text
PENDING
DRIVER_ASSIGNED
PICKED_UP
IN_TRANSIT
ARRIVING
DELIVERED
FAILED
CANCELLED
```

If Yango provides webhooks, process them through a dedicated endpoint.

If polling is required, use background jobs.

---

# 40. ACTIVE DELIVERY MAP

Create a live delivery interface.

Show:

```text
Store
Driver
Customer
Route
Delivery status
ETA
```

Clicking a delivery should open:

```text
Order
Customer
Driver
Provider
Distance
ETA
Tracking
Status
```

---

# 41. PROMOTIONS MODULE

Create:

```text
/admin/promotions
```

Support:

```text
Coupons
Percentage discounts
Fixed discounts
Product discounts
Category discounts
Free delivery
Minimum order values
Usage limits
Expiry dates
Customer eligibility
```

Coupon example:

```text
WELCOME20

20% off
Minimum order ₵100
Maximum discount ₵50
Usage limit 500
Expires Sep 30
```

All coupon validation must happen server-side.

---

# 42. REVIEWS MODULE

Create:

```text
/admin/reviews
```

Statuses:

```text
PENDING
PUBLISHED
HIDDEN
REPORTED
```

Admin can:

- Publish
- Hide
- Delete
- Review reports

Only allow legitimate customers to review products based on your business rules.

---

# 43. NOTIFICATION SYSTEM

Create:

```text
NotificationService
```

Customer events:

```text
Order Created
Payment Successful
Payment Failed
Order Processing
Order Ready
Driver Assigned
Out for Delivery
Delivered
Cancelled
Refund Completed
```

Admin events:

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

# 44. NOTIFICATION CHANNELS

Architect the system to support:

```text
In-App
Email
SMS
Push
```

Don't tightly couple notification logic to one provider.

Create a notification abstraction.

---

# 45. ANALYTICS MODULE

Create:

```text
/admin/analytics/sales
/admin/analytics/products
/admin/analytics/customers
/admin/analytics/delivery
```

## Sales

Track:

```text
Revenue
Orders
Average Order Value
Discounts
Refunds
Delivery Fees
```

## Products

Track:

```text
Best Sellers
Worst Sellers
Most Viewed
Highest Revenue
Lowest Revenue
Low Stock
Out of Stock
```

## Customers

Track:

```text
New Customers
Returning Customers
Total Customers
Average Spend
Orders Per Customer
Retention
```

## Delivery

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

# 46. REPORTS

Create:

```text
/admin/reports
```

Reports:

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

Allow:

```text
Date Range
Filters
Export CSV
Export Excel
Export PDF
```

---

# 47. ADMIN USERS

Create:

```text
/admin/users
```

Fields:

```text
Name
Email
Phone
Role
Status
Created At
Last Login
```

Statuses:

```text
ACTIVE
SUSPENDED
INACTIVE
```

---

# 48. ROLE MANAGEMENT

Create:

```text
/admin/roles
```

Allow Super Admin to:

- Create role
- Edit role
- Delete role
- Assign permissions

Display permissions grouped by module.

---

# 49. AUDIT LOGS

Create:

```text
/admin/audit-logs
```

Record sensitive actions.

Example:

```text
Admin:
Manager

Action:
Changed delivery price

Before:
₵20

After:
₵25

Zone:
East Legon

Timestamp:
10:42 AM
```

Log:

```text
Price changes
Inventory changes
Refunds
Order cancellation
Role changes
Permission changes
Settings changes
Product deletion
Delivery pricing changes
Payment configuration changes
```

---

# 50. SETTINGS

Create:

```text
/admin/settings
```

Sections:

```text
Store
Payments
Delivery
Inventory
Orders
Notifications
Security
```

## Store

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

## Payments

```text
Paystack
Public Key
Secret Key
Environment
Webhook configuration
Payment channels
```

Never expose the secret key to frontend code.

## Delivery

```text
Store Location
Zones
Pricing
Maximum Delivery Distance
Provider
Yango settings
```

## Inventory

```text
Default Low Stock Threshold
Allow Backorders
Reservation Duration
Low Stock Notifications
```

## Orders

```text
Order Prefix
Payment Timeout
Cancellation Rules
Refund Rules
```

---

# 51. SYSTEM HEALTH

Create:

```text
/admin/system-health
```

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
Database       Operational
API            Operational
Paystack       Operational
Yango          Operational
Storage        Operational
```

Show errors and last successful checks where possible.

---

# 52. REAL-TIME UPDATES

The admin panel should update important information in real time.

Example:

```text
Paystack webhook
↓
Backend
↓
Database
↓
Realtime event
↓
Admin dashboard
```

When an order is paid, the admin should see the new order without manually refreshing.

Real-time updates should include where appropriate:

```text
New orders
Payment status
Order status
Inventory
Low stock
Delivery status
Notifications
```

Use WebSockets, SSE, or an appropriate managed realtime solution.

---

# 53. BACKGROUND JOBS

Move slow/non-critical processes into background jobs.

Jobs include:

```text
Send email
Send notification
Low-stock alerts
Payment reconciliation
Delivery synchronization
Expire stock reservations
Expire pending payments
Generate reports
Analytics aggregation
```

Example:

```text
Payment Successful
↓
Update order immediately
↓
Queue email
↓
Queue notification
```

---

# 54. ERROR STATES

Every page must have:

## Loading

Use skeletons.

## Empty

Example:

```text
No orders found.

Try adjusting your filters.
```

## Error

```text
Something went wrong.

[Try Again]
```

## Network failure

```text
You're offline.

We'll reconnect automatically.
```

## Permission denied

```text
You don't have permission
to perform this action.
```

---

# 55. FORM VALIDATION

Every form must have:

- Required fields
- Type validation
- Range validation
- Server validation
- Helpful error messages
- Loading state
- Disabled submit while processing
- Success state
- Failure state

Never rely solely on frontend validation.

---

# 56. SECURITY

Implement:

```text
Authentication
Authorization
Role permissions
Rate limiting
Input validation
Output sanitization
Secure cookies
CSRF protection where applicable
Webhook signature validation
Secret management
Audit logging
Secure file uploads
API authorization
```

Protect against:

```text
Unauthorized admin access
IDOR
Privilege escalation
Duplicate payments
Price manipulation
Inventory manipulation
Fake delivery fees
Fake payment confirmation
```

---

# 57. API ARCHITECTURE

Organize backend APIs by domain:

```text
/api/admin/auth
/api/admin/dashboard

/api/admin/products
/api/admin/categories
/api/admin/inventory

/api/admin/customers
/api/admin/orders

/api/admin/payments
/api/admin/refunds

/api/admin/delivery
/api/admin/delivery/zones
/api/admin/delivery/pricing

/api/admin/promotions
/api/admin/reviews

/api/admin/notifications

/api/admin/analytics
/api/admin/reports

/api/admin/users
/api/admin/roles
/api/admin/audit

/api/admin/settings

/api/webhooks/paystack
/api/webhooks/yango
```

Use consistent:

```text
HTTP status codes
Error format
Validation
Pagination
Filtering
Sorting
Authorization
```

---

# 58. DATABASE DESIGN

Create appropriate models/entities for:

```text
User
AdminUser
Role
Permission
RolePermission

Product
ProductVariant
Category
ProductImage

Inventory
InventoryTransaction
StockReservation

Order
OrderItem
OrderTimeline

Payment
Refund

Address

Delivery
DeliveryZone
DeliveryPricingRule
DeliveryProvider

Promotion
Coupon

Review

Notification

AuditLog

SystemSetting
```

Use proper indexes for:

```text
Order ID
Payment reference
Customer ID
Product ID
SKU
Category ID
Status
CreatedAt
Delivery status
```

---

# 59. COMPLETE CHECKOUT FLOW

Implement exactly this:

```text
Customer
↓
Product
↓
Cart
↓
Checkout
↓
Server validates cart
↓
Customer address/location
↓
GPS or manual map selection
↓
Delivery quote
↓
Zone detection
↓
Distance calculation
↓
Delivery pricing
↓
Promotion validation
↓
Final server-side total
↓
Stock validation/reservation
↓
Create pending order
↓
Initialize Paystack
↓
Customer pays
↓
Paystack webhook
↓
Verify payment
↓
Payment SUCCESS
↓
Convert stock reservation to deduction
↓
Order PROCESSING
↓
Admin notification
↓
Customer notification
↓
Prepare order
↓
READY_FOR_DELIVERY
↓
Create Yango delivery
↓
Driver assigned
↓
Picked up
↓
Out for delivery
↓
Delivered
```

---

# 60. CRITICAL PAYMENT + INVENTORY RULE

Avoid this:

```text
Frontend says:
Payment successful

↓
Deduct stock
```

Instead:

```text
Paystack
↓
Webhook
↓
Server verifies transaction
↓
Transaction confirmed
↓
Database transaction
    Payment SUCCESS
    Order PAID/PROCESSING
    Inventory deducted
    Timeline created
↓
Notifications
```

This prevents fraudulent or inconsistent orders.

---

# 61. CRITICAL DELIVERY RULE

Never calculate delivery only in the browser.

The browser may display an estimated quote, but the backend must recalculate:

```text
Customer coordinates
+
Store coordinates
+
Zone
+
Distance
+
Order subtotal
+
Promotion
=
Final delivery fee
```

The backend's result becomes authoritative.

---

# 62. REAL-TIME BUSINESS EVENTS

Create domain events such as:

```text
ORDER_CREATED
PAYMENT_INITIATED
PAYMENT_SUCCESS
PAYMENT_FAILED
ORDER_PROCESSING
ORDER_READY
DELIVERY_CREATED
DRIVER_ASSIGNED
DELIVERY_PICKED_UP
DELIVERY_IN_TRANSIT
DELIVERY_COMPLETED
ORDER_CANCELLED
REFUND_COMPLETED
STOCK_LOW
STOCK_OUT
CUSTOMER_REGISTERED
```

Use these events to trigger:

```text
Notifications
Analytics
Audit logs
Realtime UI updates
Background jobs
```

---

# 63. DEVELOPMENT ORDER

Build the system in this exact order.

## PHASE 1

```text
Project foundation
Database
Authentication
Admin authentication
Roles
Permissions
Admin layout
Reusable components
```

## PHASE 2

```text
Categories
Products
Product images
Variants
Product search/filter
```

## PHASE 3

```text
Inventory
Stock adjustments
Inventory transactions
Low-stock alerts
Stock reservations
```

## PHASE 4

```text
Customers
Customer profiles
Addresses
GPS addresses
```

## PHASE 5

```text
Orders
Order creation
Order details
Order statuses
Order timeline
Order cancellation
```

## PHASE 6

```text
Paystack
Payment records
Payment initialization
Webhook
Transaction verification
Idempotency
Refunds
```

## PHASE 7

```text
Store location
GPS
Map location
Delivery zones
Distance calculation
Pricing rules
Delivery quote
Delivery availability
```

## PHASE 8

```text
Yango abstraction
Yango integration
Delivery creation
Driver assignment
Delivery status
Tracking
Delivery history
```

## PHASE 9

```text
Coupons
Discounts
Free delivery
Reviews
Notifications
```

## PHASE 10

```text
Analytics
Reports
Exports
```

## PHASE 11

```text
Admin users
Roles
Permissions
Audit logs
System health
Settings
```

## PHASE 12

```text
Testing
Security
Performance
Accessibility
Responsive optimization
Error handling
Production deployment
```

---

# 64. TESTING REQUIREMENTS

Do not consider the module complete until it has been tested.

## Payment tests

Test:

```text
Successful payment
Failed payment
Abandoned payment
Duplicate webhook
Wrong amount
Wrong currency
Network interruption
Expired payment
```

## Inventory tests

Test:

```text
Last item purchased
Two customers buying last item
Payment failure
Duplicate webhook
Refund
Cancellation
Stock reservation expiration
```

## GPS tests

Test:

```text
GPS allowed
GPS denied
GPS unavailable
Poor GPS accuracy
Manual location
Outside service area
Zone boundary
Overlapping zones
```

## Delivery tests

Test:

```text
Delivery creation
Yango success
Yango failure
Driver unavailable
Delivery cancellation
Driver assignment
Delivery completion
```

---

# 65. RESPONSIVE REQUIREMENTS

The admin panel must work on:

```text
Desktop
Laptop
Tablet
Mobile
```

Tables should become:

```text
Horizontal scroll
Responsive cards
Condensed rows
Mobile detail views
```

Don't simply shrink desktop UI onto mobile.

---

# 66. ACCESSIBILITY

Implement:

```text
Keyboard navigation
Focus states
Semantic HTML
Accessible labels
ARIA where necessary
Color contrast
Screen-reader friendly controls
```

---

# 67. PERFORMANCE

Optimize:

```text
Database queries
Indexes
Pagination
Image loading
API requests
Caching where appropriate
Lazy loading
Background jobs
Analytics queries
```

Never load thousands of orders/products into the browser at once.

---

# 68. FINAL ACCEPTANCE CRITERIA

The admin panel is only considered complete when:

### Products

```text
Admin can create products
Admin can edit products
Admin can archive products
Admin can manage images
Admin can manage variants
```

### Inventory

```text
Stock automatically decreases after confirmed payment
Low stock is automatically detected
Stock history is recorded
Overselling is prevented
```

### Orders

```text
Orders are created correctly
Statuses work
Timeline works
Order snapshots are preserved
```

### Payments

```text
Paystack works
Webhook works
Transactions are verified server-side
Duplicate webhooks are safe
Refunds work
```

### GPS

```text
Store location can be configured
Customer location can be captured
Manual map location works
Delivery zones work
Distance is calculated
Delivery fee is calculated server-side
Out-of-zone locations are rejected
```

### Delivery

```text
Yango can receive delivery requests
Delivery statuses synchronize
Admin can monitor active deliveries
Delivery history is stored
```

### Admin

```text
Roles work
Permissions work
Audit logs work
Notifications work
Analytics work
Settings work
```

---

# 69. IMPORTANT IMPLEMENTATION PRINCIPLE

Do not attempt to build the entire system in one giant implementation pass.

Build one module at a time.

For every module:

```text
1. Database model
2. Backend service
3. API endpoints
4. Validation
5. Authorization
6. Frontend page
7. UI components
8. Loading states
9. Empty states
10. Error states
11. Success states
12. Audit logging
13. Notifications where required
14. Real-time updates where required
15. Tests
16. Integration with dependent modules
```

Only mark a module complete after its complete workflow works.

---

# 70. FIRST TASK

Start with **PHASE 1 — ADMIN FOUNDATION**.

Do not build Products, Orders, Payments, Delivery, or Analytics yet.

First implement:

```text
Database foundation
↓
Admin authentication
↓
Admin sessions
↓
Admin roles
↓
Permissions
↓
Protected admin routes
↓
Admin layout
↓
Sidebar
↓
Header
↓
Notifications UI
↓
Profile menu
↓
Reusable tables/forms/modals
↓
Loading/error/empty states
```

After completing Phase 1, verify that:

```text
Admin can log in
Admin can log out
Protected routes work
Roles work
Permissions work
Unauthorized actions are blocked
Admin layout works on desktop/tablet/mobile
```

Then proceed to Phase 2.

DO NOT skip ahead.

---

# FINAL INSTRUCTION

Build this as a real production e-commerce system, not a prototype.

Prioritize:

1. Data correctness
2. Payment correctness
3. Inventory correctness
4. Delivery calculation accuracy
5. Security
6. Reliability
7. Maintainability
8. Real-time synchronization
9. Good UX
10. Visual polish

Every module must integrate cleanly with the rest of the system.

Remember:

**This is a single-business store. There are NO vendors anywhere in the architecture.**

The business owns all products, inventory, orders, customers, payments, and deliveries.

Build the system modularly, test each phase, and do not move to the next phase until the current phase is functional.

This is the **master prompt** I’d give the agent first. Then, rather than letting the agent improvise the entire project at once, I’d give it a **separate detailed prompt for Phase 1, then Phase 2, then Phase 3**, etc. That gives you much better control and makes it easier to catch problems with Paystack, inventory, GPS, and Yango before they spread through the system.