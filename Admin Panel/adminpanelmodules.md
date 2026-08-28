Complete Admin Panel Module
0. Admin Panel Foundation
Before the business modules, establish the admin infrastructure.
Admin authentication
Admin Login
   ↓
Email / Phone
   ↓
Password
   ↓
Authentication
   ↓
Admin Dashboard
Support:
- Login
- Logout
- Forgot password
- Reset password
- Session management
- Remember session
- Optional 2FA
- Login activity
- Failed-login protection
Admin roles
Since this is one business, you don't need vendor roles, but you can still have internal staff roles.
Super Admin
Manager
Order Manager
Inventory Manager
Delivery Manager
Customer Support
Finance
Each role gets specific permissions.
1. Admin Dashboard
The dashboard is the business command center.
Top statistics
Today's Sales
₵4,850
↑ 12.4%

Orders
48
↑ 8.2%

Customers
1,240
↑ 5.7%

Products
328

Low Stock
17

Pending Deliveries
12
Sales overview
Allow:
Today
7 Days
30 Days
3 Months
12 Months
Custom
Display:
- Revenue
- Orders
- Average order value
- Completed sales
- Refunds
- Delivery fees
Sales chart
Revenue
│
│             ╭───╮
│        ╭────╯   │
│   ╭────╯        ╰──╮
│───╯                 ╰
└────────────────────────
Recent orders
Order        Customer       Total      Status

#ORD-1024    Ama            ₵250       Processing
#ORD-1023    Kofi           ₵430       Delivered
#ORD-1022    Abena          ₵120       Pending
Low-stock products
Ankara Dress
7 left
[Manage Stock]

Black Handbag
3 left
[Manage Stock]
Recent activity
● Payment received
● New customer registered
● Product stock updated
● Order shipped
● Refund processed
2. Orders Module
This is one of the core modules.
Order statuses
Use:
Pending Payment
Paid
Processing
Ready for Delivery
Out for Delivery
Delivered
Cancelled
Refund Requested
Refunded
Orders page
Orders

[ Search orders... ]

All | Pending | Processing | Ready | Out for Delivery
Delivered | Cancelled | Refunded
Table:
Order ID
Customer
Items
Subtotal
Delivery
Total
Payment
Status
Date
Action
Example:
#ORD-1024
Ama Mensah
3 items
₵450
₵30
₵480
Paid
Processing
Aug 28
[View]
3. Order Details
This needs to be a detailed workspace.
ORDER #ORD-1024

● Processing

Customer
Ama Mensah
+233 XX XXX XXXX
email@example.com

────────────────────────

ITEMS

Ankara Dress
Qty: 2
₵300

Leather Bag
Qty: 1
₵150

────────────────────────

PAYMENT

Subtotal             ₵450
Delivery              ₵30
Discount               ₵0
────────────────────────
Total                 ₵480

Payment Method
Paystack

Reference
PSK_xxxxxxxxx

Payment Status
✓ Paid
Delivery section
DELIVERY

Location:
East Legon, Accra

GPS:
5.6201, -0.1712

Distance:
4.2 km

Delivery Fee:
₵30

Provider:
Yango

Status:
Out for Delivery

[ View Map ]
Order timeline
✓ Order created
✓ Payment received
✓ Order confirmed
✓ Preparing
✓ Ready for delivery
● Driver assigned
○ Picked up
○ Delivered
4. Products Module
The admin controls the entire product catalog.
Product sections
Products
├── All Products
├── Add Product
├── Categories
├── Featured Products
├── Out of Stock
├── Low Stock
└── Archived
Product table
Image
Product
Category
Price
Stock
Status
Created
Actions
5. Add/Edit Product
Product form:
Basic information
Product Name
Description
Short Description
Category
Subcategory
Brand
SKU
Images
Support:
- Main image
- Additional images
- Image reordering
- Image deletion
- Image optimization
Pricing
Price
₵250

Sale Price
₵220

Cost Price
₵150
Inventory
Track Inventory       ☑

Stock Quantity
50

Low Stock Threshold
10

Allow Backorders     ☐
Product options
If needed:
Size
Color
Weight
Variant
Each variant can have its own:
SKU
Price
Stock
Image
Product status
Draft
Active
Archived
6. Categories
Admin can create:
Fashion
Beauty
Groceries
Electronics
Home & Living
Kids
Accessories
Category management:
- Add
- Edit
- Delete
- Enable/disable
- Reorder
- Category image
- SEO title
- SEO description
7. Inventory Module
This connects directly to your automatic stock system.
Inventory dashboard
Total Products
328

Total Units
8,420

Low Stock
17

Out of Stock
6
Stock behavior
When customer purchases:
Stock = 20

Customer buys 3

Payment confirmed

Stock = 17
Then:
17 > threshold
→ Normal
If:
Stock = 8
Threshold = 10
system automatically flags:
⚠ LOW STOCK
8. Inventory History
Every stock change should be recorded.
Product
Action
Previous
Change
New
Reason
Date
Example:
Ankara Dress
Sale
20
-3
17
Order #1024
Aug 28

Ankara Dress
Manual Adjustment
17
+10
27
Restock
Aug 28
Admin should never be able to silently change inventory.
9. Customers Module
Customer list
Customers

Search...

Name
Phone
Email
Orders
Total Spent
Last Order
Status
Customer profile
AMA MENSAH

Phone
+233 XX XXX XXXX

Email
ama@example.com

Joined
Jan 12, 2026

Orders
24

Total Spent
₵4,850
Customer information
Profile
Orders
Addresses
Payments
Reviews
Activity
Admin can:
- View customer
- Disable account
- Restore account
- View order history
- View addresses
- View payment history
- View reviews
10. Customer Addresses
Since delivery is GPS-based, this deserves its own section inside the customer profile.
ADDRESSES

Home
East Legon, Accra

GPS:
5.6201
-0.1712

Digital Address:
GA-123-4567

Accuracy:
18m

Default ✓
Admin can see the location on a map.
11. Payments Module — Paystack
This handles all payment activity.
Payments

Overview
Transactions
Successful
Pending
Failed
Refunds
Payment dashboard
Today's Payments

Successful
₵24,500

Pending
₵1,200

Failed
₵800

Refunded
₵350
Transactions
Reference
Order
Customer
Amount
Channel
Status
Date
Possible channels:
Card
Mobile Money
Bank
Other Paystack-supported channels
12. Paystack Payment Flow
Your backend flow should be:
Customer Checkout
       ↓
Server validates cart
       ↓
Calculate final amount
       ↓
Calculate delivery
       ↓
Create Pending Order
       ↓
Initialize Paystack
       ↓
Customer Pays
       ↓
Paystack Webhook
       ↓
Verify Transaction
       ↓
Payment = SUCCESS
       ↓
Order = PROCESSING
       ↓
Reduce Inventory
The webhook should be the reliable server-side confirmation mechanism rather than trusting the browser redirect.
13. Refunds
Admin can handle refund requests.
Refunds

Order
Customer
Amount
Reason
Status
Date
Action
Flow:
Customer requests refund
        ↓
Admin reviews
        ↓
Approve
        ↓
Process Paystack refund
        ↓
Payment updated
        ↓
Order updated
        ↓
Customer notified
14. Delivery Module
This is where your GPS system lives.
Delivery
├── Overview
├── Store Location
├── Delivery Zones
├── Pricing Rules
├── Active Deliveries
├── Delivery History
├── Providers
└── Settings
15. Store Location
The admin configures the business location.
STORE LOCATION

Business Name
Client's Business

Address
East Legon, Accra

Latitude
5.6037

Longitude
-0.1870

[ Use Current Location ]

[ Select On Map ]

[ Save Location ]
This becomes the origin for delivery calculations.
16. Delivery Zones
Admin can draw zones on a map.








3



Example:
ZONE: EAST LEGON

Type:
Radius

Radius:
5 km

Delivery Fee:
₵20

Priority:
1

Status:
Active
Or polygon-based:
ZONE: ACCRA CENTRAL

[ Draw Area On Map ]

Pricing Rule:
Accra Standard

Status:
Active
17. Delivery Pricing Rules
Admin controls exactly how delivery fees are calculated.
Fixed fee
East Legon
₵20
Distance-based
Base fee:
₵15

Included:
3 km

Additional:
₵3/km

Maximum:
20 km
Free delivery
Orders above:
₵500

Delivery:
FREE
18. Customer GPS Delivery Calculation
Checkout:
Customer
   ↓
Use Current Location
   ↓
GPS permission
   ↓
Latitude + Longitude
   ↓
Backend
   ↓
Find Delivery Zone
   ↓
Calculate Distance
   ↓
Apply Pricing Rule
   ↓
Return Delivery Fee
Example:
Store
5.6037,-0.1870

Customer
5.6201,-0.1712

Distance
3.1 km

Zone
East Legon

Delivery
₵20
19. Delivery Availability
If outside the service area:
Customer GPS
      ↓
No matching zone
      ↓
Delivery unavailable
Checkout should show:
Sorry, we currently don't deliver to this location.

The customer can then:
[ Change Location ]
20. Active Deliveries
Admin gets a live delivery dashboard.
ACTIVE DELIVERIES

12 Active

┌───────────────────────────┐
│           MAP             │
│                           │
│ 📦 Store                  │
│      🚗 Driver            │
│                 📍 Customer│
│                           │
└───────────────────────────┘
Click delivery:
Order #1024

Customer:
Ama

Driver:
Kwame

Status:
In Transit

Distance:
2.1 km

ETA:
8 minutes
21. Yango Delivery Integration
Keep Yango as a delivery provider, not as part of your pricing engine.
Your System
     │
     ├── GPS
     ├── Zones
     └── Pricing
            ↓
       Delivery Fee
            ↓
        Paystack
            ↓
      Payment Success
            ↓
      Create Delivery
            ↓
          Yango
That way, if your client later switches delivery providers, the rest of the system doesn't need to be rebuilt.
22. Delivery History
Order
Customer
Driver
Distance
Fee
Provider
Status
Delivered At
Useful filters:
Today
Yesterday
This Week
This Month
Custom
23. Promotions Module
Admin can create:
Coupons
Code:
WELCOME20

Type:
Percentage

Discount:
20%

Minimum Order:
₵100

Maximum Discount:
₵50

Usage:
500

Start:
Aug 28

End:
Sep 30
Product discounts
Product
Original
Sale

Ankara Dress
₵250
₵220
Free delivery promotions
Orders above ₵500
→ Free delivery
24. Reviews & Ratings
Admin can manage customer reviews.
Reviews

Pending
Published
Reported
Hidden
Review:
★★★★★

"Very good quality..."

Customer:
Ama

Product:
Ankara Dress

[ Publish ]
[ Hide ]
[ Delete ]
25. Notifications
Admin notification center:
🔔 Notifications

● New order
  #1024 — ₵480

● Payment successful
  #1024

● Low stock
  Ankara Dress — 7 left

● Delivery completed
  #1020

● Refund request
  #1019
26. Customer Notifications
Your system should automatically notify customers for:
Order placed
Payment successful
Order processing
Order ready
Driver assigned
Out for delivery
Delivered
Payment failed
Order cancelled
Refund processed
Channels can eventually include:
- In-app
- Email
- SMS
- WhatsApp
27. Analytics
Create a proper analytics section.
Sales
Revenue
Orders
Average Order Value
Discounts
Delivery Revenue
Refunds
Products
Best Sellers
Worst Sellers
Most Viewed
Low Stock
Out of Stock
Customers
New Customers
Returning Customers
Top Customers
Average Spend
Customer Retention
Delivery
Total Deliveries
Average Delivery Distance
Average Delivery Fee
Average Delivery Time
Failed Deliveries
Completed Deliveries
28. Reports
Admin should be able to export:
Sales Report
Orders Report
Customer Report
Inventory Report
Payment Report
Delivery Report
Product Report
Formats:
CSV
Excel
PDF
29. Settings
Break settings into separate sections.
Store
Business Name
Logo
Phone
Email
Address
Currency
Timezone
Payments
Paystack
Public Key
Secret Key
Webhook
Test/Live Mode
Payment Channels
Delivery
Store Location
Zones
Pricing
Maximum Distance
Delivery Providers
Inventory
Low Stock Threshold
Out-of-stock behavior
Backorders
Stock notifications
Orders
Order numbering
Cancellation rules
Refund rules
Auto-confirmation
Notifications
Email
SMS
Push
Admin alerts
Customer alerts
30. Audit Logs
Every important admin action should be recorded.
AUDIT LOG

Admin
Action
Resource
Date

Super Admin
Changed product price
Ankara Dress
10:42

Manager
Updated delivery fee
East Legon
10:30

Finance
Processed refund
#1020
09:54
This is particularly important for:
- Price changes
- Inventory changes
- Refunds
- Order cancellation
- Admin permissions
- Delivery pricing changes
- Paystack settings
31. Admin Profile
Admin can manage:
Profile
Name
Email
Phone
Profile Image

Security
Change Password
2FA
Login History
Active Sessions
Logout Other Devices
32. System Health
Finally:
SYSTEM HEALTH

Database
● Operational

API
● Operational

Paystack
● Connected

Delivery Provider
● Connected

Email
● Operational

Notifications
● Operational

Storage
● Operational
If Paystack fails:
⚠ Paystack connection issue
If delivery API fails:
⚠ Delivery provider unavailable
33. Final Sidebar
So the correct final sidebar for your client's single-business store should be:
┌──────────────────────────────┐
│ LOGO                         │
│ Admin Panel                  │
├──────────────────────────────┤
│                              │
│ MAIN                         │
│   Dashboard                  │
│   Orders                     │
│   Products                   │
│   Inventory                  │
│   Customers                  │
│                              │
│ COMMERCE                     │
│   Payments                   │
│   Refunds                    │
│   Promotions                 │
│   Reviews                    │
│                              │
│ DELIVERY                     │
│   Overview                   │
│   Store Location             │
│   Delivery Zones             │
│   Pricing Rules              │
│   Active Deliveries          │
│   Delivery History           │
│                              │
│ ANALYTICS                    │
│   Sales                      │
│   Products                   │
│   Customers                  │
│   Delivery                   │
│   Reports                    │
│                              │
│ COMMUNICATION                │
│   Notifications              │
│                              │
│ SYSTEM                       │
│   Admin Users                │
│   Roles & Permissions        │
│   Audit Logs                 │
│   System Health              │
│   Settings                   │
│                              │
├──────────────────────────────┤
│ 👤 Admin                     │
│    Account                   │
│    Logout                    │
└──────────────────────────────┘
34. The Complete Business Flow
And everything in the admin panel ultimately connects like this:
                         ADMIN
                           │
        ┌──────────────────┼──────────────────┐
        ↓                  ↓                  ↓
     PRODUCTS          CUSTOMERS           SETTINGS
        │                  │
        ↓                  ↓
    INVENTORY           ADDRESSES
        │                  │
        └──────────┬───────┘
                   ↓
                 ORDERS
                   │
                   ↓
              CHECKOUT
                   │
             ┌─────┴─────┐
             ↓           ↓
            GPS        PAYMENT
             │           │
             ↓           ↓
       DELIVERY FEE   PAYSTACK
             │           │
             └─────┬─────┘
                   ↓
             PAYMENT VERIFIED
                   │
          ┌────────┴────────┐
          ↓                 ↓
     INVENTORY          DELIVERY
       - STOCK             │
                           ↓
                         YANGO
                           │
                           ↓
                      CUSTOMER
                           │
                           ↓
                       DELIVERED
This is the architecture I would use for your client's website going forward. No vendors, vendor dashboards, vendor commissions, vendor approvals, or multi-vendor fulfillment.
The next logical step is to turn this into the actual screen-by-screen UI/UX specification—starting with the admin dashboard, then every page, modal, drawer, table, form, empty state, loading state, confirmation dialog, and mobile/responsive behavior—so you can give it directly to your coding agent.