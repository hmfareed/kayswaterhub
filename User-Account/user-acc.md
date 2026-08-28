**Brief Account Details**
Let's work on the user account section. In the notifications panel, it should give user updates about their order status (pending, confirmed, picked-up by delivery man, delivered, cancelled) etc, payment confirmed. And other notifications. In the Order panel, it should be have the list of order status the customer can navigate through.. while having their products under them respectively with a refresh button. In the delivery address, it should have a gps tracker that finds the location by area name and exact location also manual configuration. Under the payment method it should be MTN MOMO, TELECEL CASH, AT MONEY, BANK TRANSFER. My cart panel would serve as the cart, wishlist panel for storing/adding products to wishlist, recently viewed for displaying recently viewed items. setting panel should contain Change password, change email, change phone number(user must enter password before changing) turn on notifications, notifications will have a drop down of order updates, delivery updates, promotional updates, wishlist price drop or increase alert, security alert so they choose which to turn on. Also under the settings there should be dark mode toggle.

**Account details**
When the customer taps their profile card or Edit Profile:
Fields
Profile photo
First name
Last name
Email
Phone number
Date of birth — optional
Gender — optional
Password
Account creation date
Actions
Change profile photo
Allow:
Camera
Gallery
Remove photo
Change email
Require:
New email
Verification code
Confirm
Change phone
Require OTP verification.
Change password
Current Password
New Password
Confirm New Password

[Update Password]
Security
If the customer changes sensitive account information:
Send verification email/SMS
Invalidate suspicious sessions
Show confirmation notification
3. Account Statistics
The three cards in your screenshot are useful.
In Bag
Shows:
Number of products currently in cart
Example:
3
Tapping it → Cart.
Saved
Shows:
Number of wishlist products
Example:
8
Tapping it → Wishlist.
Orders
Shows:
Total orders placed
Example:
13
Tapping it → My Orders.
Better version
You could eventually expand this to:
Orders       Wishlist       Cart
13           8              3

**Notifications**

Notification examples
Order Confirmed
Your order #AFR-10492 has been confirmed.
Out for Delivery
Your order is currently out for delivery.
Delivered
Your package has been delivered.
Promotion
Get 20% off selected products this weekend.
Notification card
[Icon]

Order Delivered
Your order #AFR-10492 was delivered.

2 hours ago
Unread notifications should have:
Dot indicator
Slightly different background
Bold title
Functionality
Mark as read
Mark all as read
Delete notification
Notification filtering
Push notifications
Deep link to relevant order/product
Notification count badge

**Order tracking**

Order Tracking
Give the customer a visual timeline.
ORDER CONFIRMED
✓
│
PROCESSING
✓
│
OUT FOR DELIVERY
●
│
DELIVERED
○
For delivery orders, you can eventually integrate:
Rider name
Rider phone
Delivery vehicle
Estimated arrival
Live location
Delivery OTP
Example:
Your rider is approximately
15 minutes away.

[View Live Location]

**Delivery Address**
Delivery Address
Customers should be able to save multiple addresses.
Page
← Delivery Addresses

[+ Add New Address]

┌─────────────────────────────────┐
│ 🏠 Home                         │
│ Mohammed Fareed                 │
│ Tamale, Northern Region         │
│ Ghana                           │
│                                 │
│ DEFAULT                          │
│                                 │
│ [Edit]                    [...] │
└─────────────────────────────────┘

┌─────────────────────────────────┐
│ 🏢 Work                         │
│ Mohammed Fareed                 │
│ Tamale, Northern Region         │
│                                 │
│ [Edit]                    [...] │
└─────────────────────────────────┘
Address fields
Address name
Full name
Phone number
Region
City
Area
Street
House number
Digital address
Landmark
Delivery instructions
GPS location
Ghana-specific improvement
Support:
GhanaPost GPS
Example:
GA-123-4567
Also allow:
Use my current location
This can retrieve GPS coordinates.
Address functionality
Add
Edit
Delete
Set default
Select during checkout
Save multiple addresses