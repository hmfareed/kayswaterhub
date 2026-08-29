Based on my client's setup — **products are purchased on the website, Yango/riders handle delivery, and the customer pays the delivery fee separately** — I would architect the delivery system as a **separate delivery subsystem** from the product/payment system.

The most important rule is:

> **The website collects the product payment. The courier collects the delivery payment.**

That distinction should exist throughout the database, checkout, admin panel, order status, notifications, and reporting.

# FULL DELIVERY MODULE ARCHITECTURE

## 1. Overall Architecture

Your system should have these major components:

```text
                    CUSTOMER
                       │
                       ▼
                ┌───────────────┐
                │    WEBSITE    │
                └───────┬───────┘
                        │
             ┌──────────┴──────────┐
             │                     │
             ▼                     ▼
       PRODUCT PAYMENT       DELIVERY REQUEST
             │                     │
             ▼                     ▼
          PAYSTACK             ADMIN / COURIER
             │                     │
             ▼                     ▼
       ORDER CONFIRMED        YANGO / RIDER
                                   │
                                   ▼
                           DELIVERY COMPLETED
                                   │
                                   ▼
                         CUSTOMER PAYS DELIVERY
```

So there are **two separate financial flows**:

### Product payment

```text
Customer
   ↓
Website
   ↓
Paystack
   ↓
Business
```

### Delivery payment

```text
Customer
   ↓
Yango / Rider
   ↓
Delivery fee
```

The delivery fee should **not be included in the Paystack transaction** if this is the arrangement your client has with the courier.

---

# 2. DELIVERY METHODS

I recommend supporting two primary delivery methods.

### Method 1 — Greater Accra

```text
Yango Door Delivery
```

The customer provides their delivery location.

The system uses GPS/location information to determine:

- Region
- City
- Area/Zone
- Latitude
- Longitude
- Delivery address
- Optional landmark
- Phone number

The system can then provide an **estimated delivery fee**.

But the fee is not necessarily charged online.

---

### Method 2 — Nationwide

```text
Nationwide Parcel Delivery
```

This is for customers outside the Greater Accra delivery area.

The customer provides:

- Region
- City/Town
- Destination
- Preferred parcel station, if applicable
- Phone number
- Delivery instructions

The business packages the order and hands it to the appropriate rider/Yango service.

The parcel is transported to the relevant destination/parcel station.

The customer pays the applicable delivery charge separately.

---

# 3. CUSTOMER CHECKOUT FLOW

The checkout should be divided into clear stages.

```text
Cart
 ↓
Delivery Information
 ↓
Delivery Method
 ↓
Order Review
 ↓
Product Payment
 ↓
Order Confirmation
```

---

# 4. STEP 1 — CUSTOMER CART

Example:

```text
Your Cart

Product A
Water Pack × 2
GH₵100

Product B
Water Pack × 1
GH₵50

----------------
Subtotal
GH₵150
```

Then:

**Continue to Delivery**

---

# 5. STEP 2 — DELIVERY LOCATION

The customer sees:

### Delivery Location

```text
[ 📍 Use my current location ]

or

[ Enter delivery address manually ]
```

If they click:

> **Use my current location**

the browser requests location permission.

If permission is granted:

```text
Latitude: 5.xxxxx
Longitude: -0.xxxxx
```

The system sends those coordinates to your location/geocoding service.

It attempts to identify:

```text
Region
Greater Accra

City
Accra

Area
East Legon

Latitude
5.xxxxx

Longitude
-0.xxxxx
```

The customer should still be able to correct the address manually.

---

# 6. LOCATION ARCHITECTURE

Don't make GPS your only source of truth.

Store both:

### Structured location

```text
region
city
area
```

and:

### Exact location

```text
latitude
longitude
```

and:

### Human-readable address

```text
addressLine
landmark
deliveryInstructions
```

For example:

```text
Region:
Greater Accra

City:
Accra

Area:
East Legon

Latitude:
5.6037

Longitude:
-0.1870

Address:
House 24, XYZ Street

Landmark:
Near ABC School
```

This is much more reliable for the rider.

---

# 7. DELIVERY METHOD SELECTION

The system determines which delivery options are available.

For example:

```text
DELIVERY METHOD

○ Yango Door Delivery
  Greater Accra

○ Nationwide Parcel Delivery
  Other regions
```

If the location is within your configured Greater Accra service area:

> Yango Door Delivery

can be displayed.

If outside the supported Greater Accra zone:

> Nationwide Delivery

can be displayed.

---

# 8. ADMIN-CONFIGURED DELIVERY SERVICE AREA

Don't hardcode Greater Accra into the application.

The admin should configure it.

Admin:

```text
Delivery Settings
```

### Service Areas

```text
Greater Accra
Status: Active

Delivery Method:
Yango Door Delivery
```

The admin can configure:

- Region
- Cities
- Areas
- Delivery method
- Whether GPS is required
- Whether manual address is allowed
- Delivery availability
- Estimated fee rules

This allows your client to change things later without developers modifying the application.

---

# 9. GREATER ACCRA DELIVERY FEE

This is where your previous GPS module comes in.

The system can calculate an **estimated delivery fee** based on:

```text
Business Location
        ↓
Customer Coordinates
        ↓
Distance
        ↓
Estimated Delivery Fee
```

For example:

```text
Business location
East Legon

Customer
Madina

Estimated distance
8.4 km

Estimated delivery fee
GH₵35
```

But display:

> **Estimated delivery fee: GH₵35**  
> Paid separately to the Yango rider.

### Important

Do **not** call this:

> Delivery fee paid: GH₵35

because it hasn't been paid through your website.

Call it:

> **Estimated delivery fee**

or:

> **Expected delivery charge**

---

# 10. WHY THE ESTIMATE SHOULD BE SEPARATE

Yango's actual delivery price may differ from your website calculation.

For example:

```text
Website estimate:
GH₵35

Actual courier charge:
GH₵42
```

Therefore:

```text
estimatedDeliveryFee
```

and

```text
actualDeliveryFee
```

should be separate database fields.

---

# 11. NATIONWIDE DELIVERY FLOW

For nationwide orders:

```text
Customer
   ↓
Selects Nationwide
   ↓
Selects Region
   ↓
Selects City/Town
   ↓
Provides destination/parcel station
   ↓
Places order
   ↓
Pays product amount
   ↓
Admin receives order
   ↓
Admin prepares parcel
   ↓
Parcel handed to rider/Yango
   ↓
Parcel transported
   ↓
Parcel reaches destination station
   ↓
Customer notified
   ↓
Customer receives/collects parcel
```

---

# 12. NATIONWIDE FEE HANDLING

For nationwide delivery, I would **not force the website to calculate an exact fee** unless you have a reliable courier pricing integration.

Instead:

```text
Delivery Fee

Determined by courier

Payment:
Pay separately to courier
```

If your client later establishes fixed nationwide rates, you can add:

```text
Accra → Kumasi
GH₵XX

Accra → Tamale
GH₵XX

Accra → Takoradi
GH₵XX
```

through the admin panel.

---

# 13. CHECKOUT PAYMENT SUMMARY

This is extremely important.

The checkout should show:

```text
ORDER SUMMARY

Water Packs
3 × GH₵50
GH₵150

────────────────────

Products
GH₵150

Delivery
Paid separately to courier

────────────────────

PAY NOW
GH₵150
```

The customer then pays:

**GH₵150**

Not:

**GH₵185**

---

# 14. PAYMENT ARCHITECTURE

Your order should have two separate financial concepts.

### Product payment

```text
productSubtotal
discount
tax
amountDueOnline
amountPaidOnline
paymentStatus
paymentReference
```

### Delivery payment

```text
estimatedDeliveryFee
actualDeliveryFee
deliveryPaymentStatus
deliveryPaymentMethod
deliveryPaymentReference
```

For your client's current model:

```text
amountPaidOnline = GH₵150

deliveryPaymentStatus = UNPAID
```

---

# 15. DELIVERY PAYMENT STATUS

Use a dedicated state machine.

```text
NOT_REQUIRED
      │
      ▼
EXPECTED
      │
      ▼
COLLECTED
      │
      ▼
CONFIRMED
```

For example:

### EXPECTED

Customer hasn't paid the rider yet.

### COLLECTED

Customer says they paid the rider, or courier reports payment received.

### CONFIRMED

Your business/courier system has confirmed the payment.

---

# 16. ORDER STATUS AND DELIVERY STATUS MUST BE SEPARATE

This is very important.

Don't use one giant status.

You should have:

### Order status

```text
PENDING_PAYMENT
PAID
PROCESSING
READY_FOR_DELIVERY
COMPLETED
CANCELLED
```

### Delivery status

```text
NOT_ASSIGNED
AWAITING_COURIER
COURIER_ASSIGNED
PICKUP_PENDING
PICKED_UP
IN_TRANSIT
AT_STATION
OUT_FOR_DELIVERY
DELIVERED
FAILED
RETURNED
```

### Delivery payment status

```text
EXPECTED
COLLECTED
CONFIRMED
```

This gives you much better control.

---

# 17. EXAMPLE ORDER

Imagine:

Customer orders:

```text
3 Water Packs

Product total:
GH₵150
```

Customer selects:

```text
Greater Accra
East Legon
Yango
```

System estimates:

```text
Delivery:
GH₵25–35
```

Customer sees:

```text
Pay now:
GH₵150

Delivery:
Pay separately to rider
```

Customer pays Paystack:

```text
GH₵150
```

Then:

```text
Order status:
PAID

Delivery status:
AWAITING_COURIER

Delivery payment:
EXPECTED
```

Admin assigns Yango.

Then:

```text
Delivery:
COURIER_ASSIGNED
```

Yango picks it up:

```text
PICKED_UP
```

Customer pays rider:

```text
GH₵30
```

Delivery completed:

```text
DELIVERED
```

Delivery payment:

```text
CONFIRMED
```

---

# 18. ADMIN DELIVERY DASHBOARD

The admin panel should have a dedicated:

# Delivery Management

with:

```text
Overview
Active Deliveries
Pending Assignment
Ready for Pickup
In Transit
At Parcel Station
Delivered
Failed Deliveries
Delivery Settings
Service Areas
Delivery Rates
Courier Settings
```

---

# 19. DELIVERY OVERVIEW

Dashboard cards:

```text
┌──────────────────┐
│ Active Deliveries│
│       12         │
└──────────────────┘

┌──────────────────┐
│ Awaiting Pickup  │
│        5         │
└──────────────────┘

┌──────────────────┐
│ In Transit       │
│        8         │
└──────────────────┘

┌──────────────────┐
│ Delivered Today  │
│       24         │
└──────────────────┘
```

---

# 20. DELIVERY TABLE

Example:

| Order | Customer | Destination | Method | Courier | Status | Fee |
|---|---|---|---|---|---|---|
| #1045 | John | East Legon | Yango | Yango | In Transit | GH₵30 est. |
| #1044 | Ama | Kumasi | Nationwide | Rider | At Station | Courier |
| #1043 | Kojo | Madina | Yango | Yango | Delivered | GH₵25 |

---

# 21. ORDER DELIVERY DETAILS

Admin clicks an order.

Show:

```text
ORDER #1045

Customer
John Doe

Phone
024 XXX XXXX

────────────────────

Delivery Method
Yango Door Delivery

Region
Greater Accra

City
Accra

Area
East Legon

Address
House 24, XYZ Street

Landmark
Near ABC School

GPS
5.xxxxx, -0.xxxxx

────────────────────

Estimated Delivery Fee
GH₵30

Actual Delivery Fee
GH₵32

Payment
Pay separately to courier

Delivery Payment
Confirmed
```

---

# 22. YANGO ASSIGNMENT

Admin should have:

```text
Assign Delivery

Delivery Provider:
[Yango ▼]

Delivery Type:
[Door Delivery]

Pickup Location:
Business Address

Destination:
Customer Address

Estimated Fee:
GH₵30
```

If Yango integration exists, the system can create/send the delivery request automatically.

If there is **no API integration**, don't fake an automated Yango connection.

Instead:

```text
Create Yango Delivery
```

could simply open/assist with the external Yango workflow and allow admin to record:

```text
Courier
Courier name
Courier phone
Delivery reference
Actual fee
```

---

# 23. NATIONWIDE PARCEL MANAGEMENT

Nationwide deliveries need additional states.

For example:

```text
ORDER PAID
      ↓
PACKING
      ↓
READY FOR HANDOVER
      ↓
HANDED TO COURIER
      ↓
IN TRANSIT
      ↓
ARRIVED AT STATION
      ↓
CUSTOMER NOTIFIED
      ↓
COLLECTED
      ↓
COMPLETED
```

---

# 24. PARCEL RECORD

Each nationwide delivery should have:

```text
parcelId
orderId
courier
origin
destination
destinationRegion
destinationCity
station
trackingReference
handoverDate
expectedArrivalDate
actualArrivalDate
status
```

Example:

```text
Parcel ID:
PKG-00045

Order:
#1045

Destination:
Kumasi

Station:
Kumasi Station

Courier:
Yango / Rider

Tracking Reference:
XXXXXX

Status:
IN TRANSIT
```

---

# 25. CUSTOMER ORDER TRACKING

Under:

**My Orders → Order Details**

customer sees:

```text
Order #1045

✓ Order Confirmed
      │
✓ Payment Received
      │
✓ Package Prepared
      │
✓ Handed to Courier
      │
● In Transit
      │
○ Arrived at Station
      │
○ Completed
```

For Accra:

```text
✓ Order Confirmed
✓ Package Prepared
✓ Rider Assigned
● Out for Delivery
○ Delivered
```

---

# 26. CUSTOMER DELIVERY FEE DISPLAY

Don't confuse the customer.

For Accra:

```text
Delivery Fee

Estimated:
GH₵25–35

Payment:
Pay directly to Yango rider
```

For nationwide:

```text
Delivery Fee

Courier charge:
Determined by courier

Payment:
Pay directly to courier
```

---

# 27. CUSTOMER NOTIFICATIONS

Notifications should be triggered by delivery events.

### Order paid

> Your order #1045 has been confirmed.

### Package ready

> Your order #1045 is ready for delivery.

### Rider assigned

> A Yango rider has been assigned to your order.

### Picked up

> Your package has been picked up and is on its way.

### Nationwide in transit

> Your package is currently in transit to Kumasi.

### Arrived at station

> Your package has arrived at the Kumasi parcel station.

### Delivery completed

> Your order #1045 has been delivered.

---

# 28. DELIVERY FEE NOTIFICATION

For example:

> 🚚 **Delivery Information**
>
> Your product payment of **GH₵150** has been received.
>
> Estimated Yango delivery charge: **GH₵30**
>
> Please pay the delivery charge directly to the rider.

This removes confusion.

---

# 29. ADMIN SETTINGS

Create:

# Delivery Settings

### General

```text
Delivery Enabled: ON

Greater Accra Delivery: ON

Nationwide Delivery: ON
```

### Business Pickup Location

```text
Business Name
Address
Region
City
Latitude
Longitude
```

### Greater Accra

```text
Provider:
Yango

Calculation:
Distance-based

Payment:
Pay courier separately
```

### Nationwide

```text
Provider:
Yango / Manual Rider

Delivery:
Parcel Station

Payment:
Pay courier separately
```

---

# 30. DELIVERY RATE ENGINE

If the client wants your website to estimate Accra fees, build a rate engine.

Example:

```text
Base Fee = GH₵10

Distance:
0–3 km → GH₵15
3–7 km → GH₵25
7–12 km → GH₵35
12–20 km → GH₵50
```

The admin can modify these.

But label the resulting amount:

> **Estimated courier fee**

not guaranteed courier price.

---

# 31. FUTURE YANGO INTEGRATION

Architect the system so Yango can be integrated later.

Create a courier abstraction:

```text
DeliveryProvider
```

with providers such as:

```text
YANGO
MANUAL_RIDER
OTHER
```

Then your application doesn't become dependent on one courier.

Conceptually:

```text
Delivery Service
       │
       ├── Yango Provider
       │
       ├── Manual Rider Provider
       │
       └── Future Courier Provider
```

This is much better architecture.

---

# 32. DATABASE ARCHITECTURE

I would separate the data into these entities.

### Order

```text
Order
```

Contains the commercial purchase.

### OrderItem

```text
OrderItem
```

Contains purchased products.

### Delivery

```text
Delivery
```

Contains delivery information.

### DeliveryAddress

```text
DeliveryAddress
```

Contains location/address.

### DeliveryEvent

```text
DeliveryEvent
```

Contains the tracking timeline.

### Courier

```text
Courier
```

Contains rider/provider information.

### DeliveryPayment

```text
DeliveryPayment
```

Contains delivery-fee payment records.

### DeliveryRate

```text
DeliveryRate
```

Contains configurable estimated pricing.

### ServiceArea

```text
ServiceArea
```

Contains delivery regions/zones.

---

# 33. SIMPLIFIED DATABASE RELATIONSHIP

```text
USER
 │
 └── ORDER
       │
       ├── ORDER ITEMS
       │
       ├── PRODUCT PAYMENT
       │
       └── DELIVERY
              │
              ├── DELIVERY ADDRESS
              │
              ├── COURIER
              │
              ├── DELIVERY PAYMENT
              │
              ├── DELIVERY EVENTS
              │
              └── PARCEL
```

---

# 34. DELIVERY OBJECT

Conceptually:

```text
Delivery {
    id
    orderId

    method
    provider

    status

    region
    city
    area

    addressLine
    landmark
    instructions

    latitude
    longitude

    estimatedFee
    actualFee

    deliveryPaymentStatus
    deliveryPaymentMethod

    courierId
    trackingReference

    createdAt
    updatedAt
}
```

---

# 35. DELIVERY METHODS ENUM

Use something like:

```text
YANGO_DOOR
NATIONWIDE_PARCEL
```

Don't mix the two.

---

# 36. DELIVERY STATUS ENUM

```text
PENDING
AWAITING_ASSIGNMENT
ASSIGNED
PICKUP_PENDING
PICKED_UP
IN_TRANSIT
AT_STATION
OUT_FOR_DELIVERY
DELIVERED
FAILED
RETURNED
CANCELLED
```

---

# 37. DELIVERY PAYMENT ENUM

```text
NOT_REQUIRED
EXPECTED
COLLECTED
CONFIRMED
FAILED
DISPUTED
```

---

# 38. IMPORTANT: NEVER PUT DELIVERY FEE INTO PRODUCT PAYMENT

Your Paystack transaction should conceptually be:

```text
Product subtotal
+ applicable product charges
- discount
=
Online payment amount
```

Not:

```text
Product
+
Delivery
=
Paystack amount
```

unless the client later changes the business model.

---

# 39. WHAT HAPPENS IF CUSTOMER DOESN'T PAY RIDER?

Your system should support:

```text
Delivery Payment:
DISPUTED
```

Admin can investigate.

For example:

```text
Customer says:
"I paid the rider."

Courier says:
"Customer didn't pay."

```

Admin can manually resolve:

```text
CONFIRMED
```

or:

```text
DISPUTED
```

This is much better than simply tying delivery payment to the order's main payment.

---

# 40. WHAT HAPPENS IF YANGO CHARGES MORE THAN ESTIMATE?

Example:

```text
Website estimate:
GH₵25

Actual Yango:
GH₵34
```

The admin can record:

```text
estimatedFee = 25
actualFee = 34
```

The customer is told:

> Final delivery charge is determined by the courier.

This prevents your business from accidentally absorbing the difference.

---

# 41. WHAT HAPPENS IF YANGO CHARGES LESS?

Same thing:

```text
Estimated:
GH₵35

Actual:
GH₵28
```

The actual courier charge remains:

```text
GH₵28
```

The estimate was only an estimate.

---

# 42. SECURITY RULES

Customers should **never** be allowed to edit:

```text
actualDeliveryFee
deliveryPaymentStatus
courier
deliveryStatus
trackingReference
```

Those are admin/courier-controlled fields.

Customers can edit:

```text
delivery address
landmark
instructions
phone number
```

but only before the order reaches a stage where modification is no longer allowed.

---

# 43. ADMIN AUDIT LOG

Every important delivery action should be recorded.

Example:

```text
29 Aug 2026 10:30
Admin assigned Yango

29 Aug 2026 11:02
Courier picked up package

29 Aug 2026 11:45
Actual delivery fee updated:
GH₵32

29 Aug 2026 11:50
Delivery payment marked confirmed

29 Aug 2026 11:51
Order marked delivered
```

This will be very useful when disputes happen.

---

# 44. THE COMPLETE ACCRA FLOW

```text
CUSTOMER
   │
   ▼
Add products
   │
   ▼
Checkout
   │
   ▼
Use GPS
   │
   ▼
System detects location
   │
   ├── Region
   ├── City
   ├── Area
   ├── Latitude
   └── Longitude
   │
   ▼
Greater Accra detected
   │
   ▼
Yango Door Delivery
   │
   ▼
Calculate estimated fee
   │
   ▼
Customer reviews
   │
   ▼
Pays PRODUCT ONLY
   │
   ▼
Paystack confirmation
   │
   ▼
Order = PAID
   │
   ▼
Admin prepares package
   │
   ▼
Yango assigned
   │
   ▼
Customer pays Yango
   │
   ▼
Yango delivers
   │
   ▼
Order = DELIVERED
```

---

# 45. COMPLETE NATIONWIDE FLOW

```text
CUSTOMER
   │
   ▼
Add products
   │
   ▼
Checkout
   │
   ▼
Select Nationwide
   │
   ▼
Select Region
   │
   ▼
Select City/Town
   │
   ▼
Select/enter Parcel Station
   │
   ▼
Delivery fee information
   │
   ▼
Pays PRODUCT ONLY
   │
   ▼
Paystack confirmation
   │
   ▼
Order = PAID
   │
   ▼
Admin packages order
   │
   ▼
Parcel handed to Yango/Rider
   │
   ▼
Tracking reference recorded
   │
   ▼
IN TRANSIT
   │
   ▼
ARRIVES AT STATION
   │
   ▼
Customer notified
   │
   ▼
Customer pays courier
   │
   ▼
Customer receives parcel
   │
   ▼
Order = COMPLETED
```

---

# 46. WHAT THE CUSTOMER SEES VS WHAT ADMIN SEES

### Customer

Keep it simple:

```text
Products             GH₵150
Delivery             Pay separately

TOTAL TO PAY ONLINE  GH₵150
```

Then:

> Delivery fee is paid separately to the courier.

### Admin

Admin gets the full picture:

```text
Products:
GH₵150

Online payment:
GH₵150 PAID

Estimated delivery:
GH₵30

Actual delivery:
GH₵32

Delivery payment:
CONFIRMED

Courier:
Yango

Delivery status:
DELIVERED
```

---

# 47. RECOMMENDED ADMIN SIDEBAR

I'd structure the admin panel like this:

```text
Dashboard

Orders
  ├── All Orders
  ├── Pending
  ├── Processing
  ├── Ready for Delivery
  ├── Delivered
  └── Cancelled

Products
Inventory
Customers

Delivery
  ├── Overview
  ├── Active Deliveries
  ├── Pending Assignment
  ├── Yango Deliveries
  ├── Nationwide Parcels
  ├── Delivery History
  ├── Delivery Payments
  └── Failed Deliveries

Delivery Settings
  ├── General
  ├── Service Areas
  ├── Delivery Rates
  ├── Courier Providers
  └── Business Pickup Location

Payments
Notifications
Reports
Settings
```

---

# 48. MOST IMPORTANT ARCHITECTURAL DECISION

I recommend you build the system around this principle:

### **Order = What the customer bought**

### **Payment = What the customer paid the business**

### **Delivery = How the order gets transported**

### **Delivery Payment = What the customer paid the courier**

Those four things should be related but **not merged together**.

That architecture will make the system much easier to maintain and will also allow your client to change courier providers later without rebuilding checkout.

---

# 49. FINAL SYSTEM MODEL

The complete system becomes:

```text
                    ┌───────────────┐
                    │   CUSTOMER    │
                    └───────┬───────┘
                            │
                            ▼
                    ┌───────────────┐
                    │    CHECKOUT   │
                    └───────┬───────┘
                            │
                ┌───────────┴───────────┐
                │                       │
                ▼                       ▼
        PRODUCT INFORMATION       DELIVERY INFORMATION
                │                       │
                ▼                       ▼
             ORDER                 DELIVERY
                │                       │
                ▼                 ┌─────┴─────┐
           PAYSTACK                │           │
                │                ACCRA      NATIONWIDE
                │                  │           │
                ▼                  ▼           ▼
          PAYMENT PAID          YANGO       PARCEL
                │                  │         STATION
                └──────────┬───────┴───────────┘
                           │
                           ▼
                     ORDER FULFILLED
```

### The core rule for your current business model:

**Customer pays online → product amount only.**

**Customer pays Yango/rider → delivery amount separately.**

**Greater Accra → Yango door delivery + estimated fee.**

**Nationwide → parcel/rider delivery + courier-determined fee.**

**Admin tracks both independently.**

This is the architecture I would use for the website rather than trying to force Yango's delivery charge into the Paystack checkout.