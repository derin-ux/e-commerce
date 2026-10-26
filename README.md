# E-Commerce Site
A backend for an online fashion marketplace where many shops sell in one place.
Shop owners register a shop, an admin approves it, and customers can then browse,
add to cart, check out and order from any approved shop.

## Built with

- Node.js and Express
- MongoDB (Atlas) with Mongoose
- JSON Web Tokens (JWT) for login
- bcrypt-style password hashing (done in the User model)

## Who can do what (roles)

| Role         | What they can do                                                       |
| ------------ | ---------------------------------------------------------------------- |
| Visitor      | Browse approved shops and products, register, log in                   |
| `customer`   | Cart, checkout, pay, cancel orders, favourites, report a shop          |
| `shopOwner`  | Register a shop, manage own products, see and ship own orders          |
| `admin`      | Approve or reject shops, review reports, suspend shops                 |
| `superAdmin` | Everything an admin can do, plus create new admin accounts             |

## Getting started

1. Install the packages:

   ```bash
   cd backend
   npm install
   ```

2. Create a `.env` file in the `backend` folder (see the next section).

3. Create the super admin account (run this once):

   ```bash
   node seed/createSuperAdmin.js
   ```

4. Start the server:

   ```bash
   npm start
   ```

## Environment variables

Create a file called `.env` in the `backend` folder:

```
PORT=5000
MONGO_URI=your-mongodb-atlas-connection-string
JWT_SECRET=a-long-random-secret
JWT_EXPIRES_IN=7d
SUPER_ADMIN_NAME=Super Admin
SUPER_ADMIN_EMAIL=admin@example.com
SUPER_ADMIN_PASSWORD=choose-a-strong-password
```

Never upload your real `.env` to GitHub.

## Logging in

Register or log in to get a token, then send it with every request that needs a login:

```
Authorization: Bearer <your token>
```

Errors always come back as JSON, like `{ "message": "Something went wrong" }`.

## Routes

### Auth: `/api/auth`

| Method | Route         | Who         | What it does                         |
| ------ | ------------- | ----------- | ------------------------------------ |
| POST   | `/register`   | Anyone      | Create an account (customer or shopOwner) |
| POST   | `/login`      | Anyone      | Log in and get a token (limited to 10 tries per 15 minutes) |
| GET    | `/me`         | Logged in   | Who am I?                            |
| POST   | `/admins`     | superAdmin  | Create a new admin account           |

### Shops: `/api/shops`

| Method | Route             | Who        | What it does                                   |
| ------ | ----------------- | ---------- | ---------------------------------------------- |
| POST   | `/`               | shopOwner  | Register a shop (starts as pending)            |
| GET    | `/`               | Anyone     | List approved shops                            |
| GET    | `/my-shop`        | shopOwner  | See my shop, its status and any rejection reason |
| GET    | `/pending`        | admin      | List shops waiting for approval                |
| GET    | `/:id`            | Anyone     | See one approved shop                          |
| PATCH  | `/:id/approve`    | admin      | Approve a shop                                 |
| PATCH  | `/:id/reject`     | admin      | Reject a shop (with a reason)                  |

### Products: `/api/products`

| Method | Route   | Who        | What it does                                              |
| ------ | ------- | ---------- | --------------------------------------------------------- |
| GET    | `/`     | Anyone     | List products from approved shops. Optional: `?category=` and `?search=` |
| GET    | `/:id`  | Anyone     | See one product                                           |
| POST   | `/`     | shopOwner  | Add a product to my shop (shop must be approved)          |
| PUT    | `/:id`  | shopOwner  | Edit my own product                                       |
| DELETE | `/:id`  | shopOwner  | Delete my own product                                     |

### Cart: `/api/cart` (customers only)

| Method | Route         | What it does                                  |
| ------ | ------------- | --------------------------------------------- |
| GET    | `/`           | See my cart and the total                     |
| POST   | `/`           | Add a product. Body: `{ "productId", "quantity" }` |
| PUT    | `/:productId` | Change the quantity. Body: `{ "quantity" }`   |
| DELETE | `/:productId` | Remove one item                               |
| DELETE | `/`           | Empty the cart                                |

### Orders: `/api/orders`

| Method | Route                            | Who        | What it does                                         |
| ------ | -------------------------------- | ---------- | ---------------------------------------------------- |
| POST   | `/`                              | customer   | Check out my cart. Body: `{ "shippingAddress": {...} }` |
| GET    | `/`                              | customer   | List my orders                                       |
| GET    | `/:id`                           | customer   | See one of my orders                                 |
| POST   | `/:id/pay`                       | customer   | Pay (simulated). Body: `{ "simulate": "success" }` or `"fail"` |
| PATCH  | `/:id/cancel`                    | customer   | Cancel an order that has not shipped; stock goes back |
| GET    | `/shop/incoming`                 | shopOwner  | See paid orders, showing only my shop's items        |
| PATCH  | `/:orderId/items/:itemId/status` | shopOwner  | Set my item to `processing`, `shipped` or `delivered` |

### Favourites: `/api/favourites` (customers only)

| Method | Route         | What it does                                       |
| ------ | ------------- | -------------------------------------------------- |
| POST   | `/:productId` | Add to favourites, or remove it if already there   |
| GET    | `/`           | List my favourite products                         |

### Reports: `/api/reports`

| Method | Route                | Who       | What it does                                              |
| ------ | -------------------- | --------- | --------------------------------------------------------- |
| POST   | `/`                  | customer  | Report a shop. Body: `{ "shopId", "reason", "details" }`  |
| GET    | `/`                  | admin     | List reports (`?status=open` by default)                  |
| PATCH  | `/:id/dismiss`       | admin     | Dismiss a report                                          |
| PATCH  | `/:id/suspend-shop`  | admin     | Suspend the shop and close all its open reports           |

Report reasons: `scam`, `counterfeit`, `prohibited_items`, `misleading`, `other`.

## How it works

- **Shop approval:** a new shop is `pending`. Only after an admin approves it do its
  shop page and products show to the public.
- **Suspended shops disappear:** once a shop is suspended, its products vanish from
  browsing, favourites and carts.
- **Stock:** checkout reduces stock safely, so two customers can't buy the last item.
  Cancelling an order puts it back.
- **Prices:** a cart shows live prices, but an order keeps the prices from checkout.
- **Payment:** payment is simulated. No real money or card details are used.
- **Shops only see paid orders,** and only their own items.

## Project folders

```
backend/
  config/        database connection
  controllers/   the logic for each route
  middleware/    login and role checks
  models/        MongoDB models (User, Shop, Product, Cart, Order, Favourite, Report)
  routes/        route definitions
  seed/          createSuperAdmin.js
  app.js         express setup
  server.js      starts the server
```