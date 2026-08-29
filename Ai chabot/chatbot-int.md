Integrate the Google Gemini API into my existing e-commerce website to power the customer AI chatbot.

IMPORTANT:

- First inspect my existing project structure, tech stack, authentication, MongoDB models, cart system, products, orders, users, and checkout flow.
- Do not unnecessarily rewrite or break existing functionality.
- Reuse my existing components, APIs, database models, authentication and business logic wherever possible.
- If something already exists, extend it instead of creating a duplicate implementation.

1. Gemini integration

Use the official Google Gemini JavaScript SDK:

"@google/genai"

Install it if it is not already installed.

Use the environment variable:

"GEMINI_API_KEY"

Never expose the API key to the browser/client-side code.

Create the Gemini integration on the server side using the existing Next.js/Node.js backend architecture.

If ".env.local" does not already contain the variable, create/update it with:

"GEMINI_API_KEY=YOUR_KEY_HERE"

Do not hardcode the actual API key anywhere in the source code.

2. Chatbot functionality

Connect the existing customer chatbot UI to Gemini.

The chatbot should be able to naturally answer questions about:

- Products
- Product prices
- Product categories
- Product availability
- Stock
- Product descriptions
- Product recommendations
- Cart
- Orders
- Order status
- Delivery
- Payment
- General customer support

The AI must NOT invent product information, prices, stock quantities, order statuses or delivery information.

Whenever the customer asks about actual store data, retrieve the information from my database/backend.

3. Give the AI access to controlled backend tools

Create server-side functions/tools such as:

- searchProducts()
- getProduct()
- getProductsByCategory()
- checkStock()
- getCart()
- addToCart()
- removeFromCart()
- updateCartQuantity()
- getCustomerOrders()
- getOrderStatus()
- getDeliveryInformation()

Only expose the functions that are appropriate for the currently authenticated customer.

The AI should use these tools when necessary rather than guessing.

4. Product search example

If a customer says:

"Do you have Voltic water?"

The chatbot should search the actual product database.

If the product exists, respond using the real:

- Product name
- Price
- Available quantity
- Description
- Relevant product information

If it doesn't exist, clearly tell the customer that it is unavailable.

5. Cart actions

Allow the chatbot to understand requests such as:

"Add 3 packs of Voltic to my cart."

The AI should:

1. Identify the product.
2. Verify that the product exists.
3. Check available stock.
4. Add the requested quantity using the existing cart API/service.
5. Confirm the action to the customer.

Never allow the AI to directly modify MongoDB without going through controlled backend functions.

6. Order-related questions

If a logged-in customer asks:

"Where is my order?"

Use their authenticated user ID to retrieve their actual orders.

Never allow one customer to access another customer's orders.

Return useful information such as:

- Order number
- Items
- Order date
- Total
- Current status
- Delivery information

7. Checkout

The chatbot may guide customers toward checkout.

Do NOT allow Gemini itself to process payments or bypass the existing Paystack checkout flow.

If the customer says:

"I want to checkout."

Use the existing cart/checkout functionality and direct them to the appropriate checkout interface.

8. Authentication

Connect chatbot functionality to the existing authentication system.

For guests:

- Allow product searches
- Product recommendations
- General questions
- Store information
- Cart actions only if the existing application supports guest carts

For authenticated users:

- Allow personalized cart/order functionality
- Use their authenticated account ID
- Never trust a user ID supplied by the chatbot/client

9. Security

Implement proper server-side validation.

Do not expose:

- Gemini API key
- MongoDB 
Paystack secret key
Other server secrets
Do not allow the chatbot to execute arbitrary database queries.
Do not allow the AI to directly execute arbitrary code.
All database mutations must go through predefined backend functions with validation.
10. Conversation experience
The chatbot should feel like a real e-commerce shopping assistant.
It should:
Understand natural language
Remember relevant context during the conversation
Ask clarifying questions when necessary
Give concise but helpful answers
Recommend products based on the customer's request
Confirm important actions before performing them when appropriate
Examples:
Customer: "What's the cheapest water you have?"
→ Search the actual database and return the cheapest relevant products.
Customer: "I need 5 packs for tomorrow."
→ Ask for clarification about which product if necessary, then check availability and guide the customer through delivery/checkout.
Customer: "Add 2 of those to my cart."
→ Use the previous conversation context to identify the product and add it.
11. Error handling
Handle:
Gemini API failures
Rate limits
Database errors
Invalid products
Out-of-stock products
Invalid quantities
Unauthenticated requests
Network failures
The chatbot should show a friendly fallback message instead of exposing technical errors.
12. UI
Preserve my existing chatbot design.
Improve the UI only where necessary.
Include:
Loading/typing state
Error state
Message history
User/AI message distinction
Product cards where appropriate
Add-to-cart actions where appropriate
Mobile responsiveness
13. Testing
After implementation:
Run the project.
Test the Gemini API connection.
Test product searches.
Test product recommendations.
Test stock checking.
Test adding products to cart.
Test authenticated order lookup.
Test guest access restrictions.
Test API-key security.
Check for TypeScript/build/lint errors.
Fix any errors you find.
Do not stop after installing the Gemini SDK. Complete the integration end-to-end and verify that the chatbot actually works with my existing e-commerce database and functionality.
At the end, provide a concise summary of:
Files created/modified
Gemini model/API integration used
Backend tools/functions created
Environment variables required
Tests performed
Any remaining issues