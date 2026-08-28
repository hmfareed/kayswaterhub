We're using location-based, I would add a proper GPS/location + delivery-zone engine between the customer's address and the final Paystack amount.
The key idea is:
Customer GPS → determine delivery zone/distance → calculate delivery fee → lock the fee into the pending order → Paystack charges the final total.

This should be configurable from the Admin Panel, so the admin doesn't need a developer every time delivery pricing changes.
1. Full Checkout Flow With Location-Based Delivery
Your final flow should be:
PRODUCT
   ↓
ADD TO CART
   ↓
CART
   ↓
CHECKOUT
   ↓
SELECT / ADD DELIVERY ADDRESS
   ↓
USE GPS / ENTER LOCATION
   ↓
LOCATION VALIDATION
   ↓
FIND DELIVERY ZONE
   ↓
CALCULATE DELIVERY FEE
   ↓
SELECT DELIVERY METHOD
   ↓
ORDER SUMMARY
   ↓
PAYMENT — PAYSTACK
   ↓
CREATE PENDING ORDER
   ↓
INITIALIZE PAYSTACK
   ↓
CUSTOMER PAYS
   ↓
PAYSTACK WEBHOOK
   ↓
VERIFY PAYMENT
   ↓
ORDER = PAID
   ↓
REDUCE INVENTORY
   ↓
CREATE DELIVERY REQUEST
   ↓
DRIVER / DELIVERY SERVICE
   ↓
SHIPPED
   ↓
DELIVERED
Paystack recommends initializing transactions from your backend, keeping the secret key server-side, and verifying the transaction before fulfilling the order. Paystack
2. Don't Just Use "GPS Distance"
I would not make your delivery system simply:
Customer is 8 km away → charge ₵X.

Instead, build a Delivery Zone + Pricing Rules system.
For example:
DELIVERY CONFIGURATION

Zone 1
Accra Central
0–5 km
₵20

Zone 2
Greater Accra
5–10 km
₵30

Zone 3
Greater Accra Extended
10–20 km
₵45

Zone 4
Outside Delivery Area
20+ km
Unavailable
This gives your admin much more control.
3. Admin Configures the Store Location
First, the admin needs to configure the business/store pickup location.
Admin → Settings → Delivery
STORE LOCATION

Business Name
AfriCart Warehouse

Address
East Legon, Accra

Latitude
5.6037

Longitude
-0.1870

[ Use Current Location ]

[ Save Location ]
The admin can click:
Use Current Location
The browser asks for GPS permission.
Then:
GPS
 ↓
Latitude
 ↓
Longitude
 ↓
Save store coordinates
The coordinates become the starting point for distance calculations.
4. Admin Delivery Configuration
Create a dedicated section:
Admin Dashboard → Delivery Management
with:
Delivery Management

Overview
Zones
Pricing Rules
Delivery Methods
Coverage
Providers
Orders
Settings
5. Delivery Overview
The admin dashboard could show:
DELIVERY OVERVIEW

Active Zones              12
Covered Areas             47
Active Orders             38
Pending Deliveries        11

Today's Delivery Fees
₵2,450

Average Delivery Distance
8.4 km

Delivery Success Rate
96.8%
6. Delivery Zones
This is where the admin defines geographical areas.
Example:
DELIVERY ZONES

┌───────────────────────────────────────┐
│ Accra Central                         │
│ Radius: 0–5 km                        │
│ Fee: ₵20                              │
│ Status: Active                        │
│                    [Edit] [•••]       │
└───────────────────────────────────────┘

┌───────────────────────────────────────┐
│ Accra Extended                        │
│ Radius: 5–10 km                       │
│ Fee: ₵30                              │
│ Status: Active                        │
│                    [Edit] [•••]       │
└───────────────────────────────────────┘
But there's an even better approach.
7. Use Map-Based Zones
Instead of only entering radius values, allow the admin to draw delivery areas on a map.
For example:







2



Admin sees a map:
              MAP

        ┌─────────────────┐
        │       Zone A    │
        │    ┌────────┐   │
        │    │        │   │
        │    │ STORE  │   │
        │    │   📍   │   │
        │    └────────┘   │
        │                 │
        │       Zone B    │
        └─────────────────┘
Admin can:
- Draw a circle
- Draw a polygon
- Select predefined areas
- Set delivery fee
- Set minimum order
- Set maximum distance
- Enable/disable zone
This becomes much more powerful than hard-coded GPS rules.
8. Two Delivery Pricing Models
I recommend supporting both.
Model A — Zone Based
Example:
0–5 km       ₵20
5–10 km      ₵30
10–15 km     ₵40
15–20 km     ₵55
20+ km       Not available
Model B — Distance Based
Example:
Base fee = ₵15

First 3 km = ₵15

Every additional km = ₵3
So:
2 km → ₵15
5 km → ₵21
8 km → ₵30
12 km → ₵42
The admin can choose which pricing model applies.
9. Admin Pricing Rule UI
I'd make it something like:
CREATE DELIVERY RULE

Rule Name
Greater Accra Standard

Pricing Method

○ Fixed Fee
● Distance Based
○ Zone Based

Base Fee
₵15

Included Distance
3 km

Additional Distance
₵3 / km

Maximum Delivery Distance
20 km

Minimum Order
₵50

[ Save Rule ]
10. Customer GPS Flow
At checkout:
DELIVERY ADDRESS

Where should we deliver your order?

[ 📍 Use my current location ]

OR

[ Enter address manually ]
If they select GPS:
Browser
   ↓
Request location permission
   ↓
GPS coordinates
   ↓
Latitude + Longitude
   ↓
Send to backend
Example:
latitude: 5.6037
longitude: -0.1870
11. Don't Depend Entirely on GPS
This is important.
GPS can be:
- inaccurate
- denied
- unavailable on desktop
- inaccurate inside buildings
- affected by network/device conditions
So the customer should be able to manually select their location too.
I'd provide:
Option 1
Use Current Location
Option 2
Search Location
Option 3
Select on Map
Option 4
Enter Digital Address
For Ghana, this makes the checkout much more practical.
12. Location Confirmation Screen
After GPS detects the location:
CONFIRM DELIVERY LOCATION

          📍

East Legon
Accra, Greater Accra

Location detected successfully.

Accuracy: ~18m

[ Confirm Location ]

[ Adjust Location ]
If accuracy is poor:
⚠ Location accuracy is low.

Move to an open area or adjust your
location manually on the map.

[ Adjust Location ]
13. Backend Calculates Delivery
The frontend sends:
latitude
longitude
to your backend.
Your backend then:
Customer coordinates
        ↓
Find applicable delivery zone
        ↓
Calculate distance
        ↓
Find pricing rule
        ↓
Calculate delivery fee
        ↓
Return result
Example:
Customer:

5.6201
-0.1712

Store:

5.6037
-0.1870

Distance:

3.1 km

Zone:

Accra Central

Delivery:

₵20
14. Show the Calculation to the Customer
Don't just silently add the fee.
Show:
DELIVERY

📍 East Legon, Accra

Distance: 3.1 km

Standard Delivery
₵20

Estimated delivery:
Today / Tomorrow
Then:
ORDER SUMMARY

Items              ₵500
Delivery            ₵20
Discount            -₵0
────────────────────────
TOTAL               ₵520
15. Delivery Availability
The location engine should also answer:
Can we deliver here?

For example:
Customer location
       ↓
Outside all zones
       ↓
❌ Delivery unavailable
Show:
We're currently unable to deliver
to this location.

Please select another delivery
location.
This should happen before Paystack opens.
16. Admin Coverage Configuration
Admin should be able to configure:
DELIVERY COVERAGE

☑ Greater Accra
☑ Accra Central
☑ East Legon
☑ Madina
☑ Adenta
☑ Tema

☐ Outside Greater Accra
But I'd still make the actual determination based on coordinates/zones rather than trusting the customer's selected city.
17. Delivery Zone Priority
You'll also need priority because zones can overlap.
For example:
Zone A
Greater Accra
₵40

Zone B
East Legon
₵25
If customer is in East Legon:
East Legon rule wins
So give every zone:
Priority
1 = highest
10 = lowest
18. Delivery Fee Overrides
Admin should also be able to configure special conditions.
For example:
Free Delivery
Order above ₵500
→ Free delivery
Promotional delivery
Weekend
→ ₵10 discount
Vendor-specific delivery
Vendor A
→ Uses Vendor A delivery zone

Vendor B
→ Uses Vendor B delivery zone
This is especially important if your website remains multi-vendor.
19. Multi-Vendor Delivery
If one cart contains:
Vendor A
Product 1
₵100

Vendor B
Product 2
₵200
You need to decide whether the customer receives:
Option A — One combined delivery
Vendor A ─┐
           ├── Delivery partner → Customer
Vendor B ─┘

Delivery = ₵30
or:
Option B — Separate deliveries
Vendor A
Delivery = ₵20

Vendor B
Delivery = ₵25

Total delivery = ₵45
For your system, I'd recommend supporting separate vendor fulfillment internally, even if the customer sees one combined checkout.
20. Location-Based Delivery + Yango
Since you previously mentioned using Yango Delivery, your architecture can eventually become:
CUSTOMER
   ↓
GPS LOCATION
   ↓
DELIVERY ENGINE
   ↓
Calculate fee
   ↓
PAYMENT
   ↓
PAYSTACK
   ↓
PAYMENT CONFIRMED
   ↓
CREATE DELIVERY REQUEST
   ↓
YANGO
   ↓
DRIVER ASSIGNED
   ↓
PICKUP
   ↓
IN TRANSIT
   ↓
DELIVERED
The delivery fee calculation and delivery-provider integration should remain separate modules.
That way you can change from Yango later without rebuilding your checkout.
21. Admin Delivery Order View
Admin should see:
ORDER #AFR-00125

Customer
Mohammed

Delivery Location
East Legon, Accra

Customer Coordinates
5.6201, -0.1712

Store Coordinates
5.6037, -0.1870

Distance
3.1 km

Delivery Zone
East Legon

Delivery Fee
₵20

Delivery Provider
Yango

Status
Driver Assigned
And:
[ View on Map ]
22. Delivery Map
When admin clicks View on Map:
             CUSTOMER 📍
                  |
                  |
                  |
              🚗 DRIVER
                  |
                  |
               STORE 📦
You can eventually show:
- Store
- Customer
- Driver
- Route
- Estimated distance
- Delivery status
23. Delivery Status System
I recommend:
PENDING
   ↓
PAYMENT_CONFIRMED
   ↓
PREPARING
   ↓
READY_FOR_PICKUP
   ↓
DRIVER_ASSIGNED
   ↓
PICKED_UP
   ↓
IN_TRANSIT
   ↓
ARRIVING
   ↓
DELIVERED
And exceptions:
CANCELLED
FAILED_DELIVERY
CUSTOMER_UNAVAILABLE
ADDRESS_INVALID
RETURNED
24. Database Structure
I'd introduce these models.
DeliveryZone
DeliveryZone
├── id
├── name
├── description
├── type
├── geometry
├── radius
├── priority
├── active
├── pricingRuleId
├── minOrderAmount
├── maxOrderAmount
├── createdAt
└── updatedAt
DeliveryPricingRule
DeliveryPricingRule
├── id
├── name
├── pricingType
├── baseFee
├── includedDistance
├── pricePerKm
├── fixedFee
├── freeDeliveryThreshold
├── maximumDistance
└── active
CustomerAddress
CustomerAddress
├── id
├── userId
├── label
├── fullName
├── phone
├── address
├── region
├── city
├── area
├── digitalAddress
├── latitude
├── longitude
├── accuracy
├── deliveryInstructions
└── isDefault
Delivery
Delivery
├── id
├── orderId
├── provider
├── pickupLocation
├── deliveryLocation
├── distance
├── deliveryFee
├── zoneId
├── providerReference
├── driver
├── status
├── estimatedDeliveryTime
├── pickedUpAt
├── deliveredAt
└── createdAt
25. Order Should Store the Calculated Delivery Fee
This is extremely important.
When checkout calculates:
Distance = 3.1 km
Zone = East Legon
Delivery = ₵20
store those values in the order.
Don't recalculate the price after payment.
Your order should contain a snapshot:
deliverySnapshot: {
    latitude: 5.6201,
    longitude: -0.1712,
    zone: "East Legon",
    distanceKm: 3.1,
    fee: 20,
    pricingRule: "East Legon Standard"
}
That way, if the admin changes delivery pricing tomorrow, yesterday's order remains correct.
26. The Final Checkout Architecture
So I'd now make your checkout:
                    CHECKOUT
                       │
                       ↓
               DELIVERY ADDRESS
                       │
             ┌─────────┴─────────┐
             ↓                   ↓
        USE GPS              MANUAL
             │                   │
             └─────────┬─────────┘
                       ↓
              LOCATION VALIDATION
                       ↓
                COORDINATES
                       ↓
               DELIVERY ENGINE
                       │
             ┌─────────┴─────────┐
             ↓                   ↓
        Find Zone          Calculate Distance
             │                   │
             └─────────┬─────────┘
                       ↓
                PRICING RULE
                       ↓
                 DELIVERY FEE
                       ↓
                ORDER SUMMARY
                       ↓
                 FINAL TOTAL
                       ↓
              CREATE PENDING ORDER
                       ↓
                  PAYSTACK
                       ↓
                 PAYMENT
                       ↓
              PAYSTACK WEBHOOK
                       ↓
                 VERIFY PAYMENT
                       ↓
               PAYMENT = PAID
                       ↓
               REDUCE INVENTORY
                       ↓
             CREATE DELIVERY
                       ↓
                  YANGO
                       ↓
               DRIVER ASSIGNED
                       ↓
                  DELIVERY
Paystack's current documentation supports payment channels including cards, bank, mobile money and others, and Ghana's Mobile Money channel supports providers including MTN, AirtelTigo and Telecel. Paystack
Also, keep the payment and delivery engines independent. Paystack handles payment; your delivery engine determines where the customer is and how much delivery costs. Once payment is confirmed, the delivery module takes over. Paystack specifically recommends webhooks for reliable payment status updates and signature verification for webhook authenticity. Paystack
What I'd build in your Admin Panel
Your final admin sidebar should therefore include:
ADMIN
│
├── Dashboard
│
├── Orders
│
├── Products
├── Inventory
├── Vendors
│
├── Customers
│
├── Delivery
│   ├── Overview
│   ├── Store Locations
│   ├── Delivery Zones
│   ├── Pricing Rules
│   ├── Coverage Areas
│   ├── Delivery Methods
│   ├── Delivery Providers
│   ├── Active Deliveries
│   └── Delivery Settings
│
├── Payments
│   ├── Transactions
│   ├── Paystack
│   ├── Refunds
│   └── Payment Settings
│
├── Promotions
├── Notifications
└── Settings
And the Delivery → Zones screen is where the admin gets the map, draws/configures zones, sets pricing, priority, maximum distance, minimum order, and availability.
That gives you a proper system rather than just adding a GPS field to checkout.

Paystack



 1/2