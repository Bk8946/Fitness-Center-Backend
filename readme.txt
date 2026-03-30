FitBook
Backend API Documentation
Online Personalized Fitness Class Booking Platform
Stack: Node.js  •  Express.js  •  MongoDB (Mongoose)  •  JWT  •  Stripe  •  Nodemailer  •  Cloudinary
Deployment: Render  •  MongoDB Atlas
Version: 1.0.0

Table of Contents
1.  Project Overview	
2.  Tech Stack	
3.  Folder Structure	
4.  Environment Variables	
5.  Running the Server	
6.  Database Models	
7.  API Endpoints	
8.  Authentication Flow	
9.  Payment Flow (Stripe)	
10.  Email Notifications	
11.  File Uploads (Cloudinary)	
12.  Deployment to Render	
13.  Error Handling	

1. Project Overview
FitBook is a full-stack MERN application that allows users to discover, book, and pay for personalized fitness classes with professional trainers. This document covers the Node.js/Express backend, its API design, database schema, and deployment configuration.

Feature	Description
Auth	JWT-based register/login with role-based access (user, trainer, admin)
Class Management	CRUD for fitness classes with type, difficulty, duration, capacity filters
Booking System	Reserve, view, cancel bookings with capacity enforcement
Payments	Stripe PaymentIntent flow with confirmation emails
Reviews	Post-class ratings and reviews; trainer response support
Recommendations	Preference + history based class suggestions
Email Notifications	Nodemailer via Gmail SMTP for confirmations and reminders
Media Uploads	Cloudinary integration for trainer photos and intro videos

2. Tech Stack
Package	Version	Purpose
express	^4.18.x	HTTP server and routing
mongoose	^8.x	MongoDB ODM — schema validation and queries
jsonwebtoken	^9.x	JWT generation and verification
bcryptjs	^2.4.x	Password hashing (12 salt rounds)
stripe	^14.x	Payment processing — PaymentIntent API
nodemailer	^6.x	Email sending via Gmail SMTP
cloudinary	^1.x	Cloud media storage for photos/videos
multer-storage-cloudinary	^4.x	Multer storage engine for Cloudinary
cors	^2.8.x	Cross-Origin Resource Sharing headers
dotenv	^16.x	Environment variable loader
express-validator	^7.x	Request body validation middleware
nodemon	^3.x (dev)	Auto-restart on file changes

3. Folder Structure

server/
├── config/
│   ├── db.js               # MongoDB connection
│   └── cloudinary.js       # Cloudinary + Multer setup
├── middleware/
│   ├── auth.js             # JWT protect + authorize(roles)
│   └── errorHandler.js     # Global error handler
├── models/
│   ├── User.js             # User schema + password hash
│   ├── Trainer.js          # Trainer profile + availability
│   ├── Class.js            # Fitness class schema
│   ├── Booking.js          # Booking with status lifecycle
│   ├── Review.js           # Rating + trainer response
│   └── Payment.js          # Stripe payment records
├── controllers/
│   ├── authController.js
│   ├── classController.js
│   ├── bookingController.js
│   ├── paymentController.js
│   ├── reviewController.js
│   └── trainerController.js
├── routes/
│   ├── auth.js
│   ├── classes.js
│   ├── bookings.js
│   ├── payments.js
│   ├── reviews.js
│   └── trainers.js
├── utils/
│   └── sendEmail.js        # Nodemailer email helper
├── .env                    # Environment variables (git-ignored)
├── .gitignore
└── index.js                # Entry point


4. Environment Variables
Create a .env file in the server/ root. Never commit this file to GitHub.

# server/.env


Variable	Example / Description	Status
PORT	5000 — Server port	Optional
MONGO_URI	mongodb+srv://user:pass@cluster.mongodb.net/fitness	Required
JWT_SECRET	A long random secret string (min 32 chars)	Required
JWT_EXPIRE	7d — Token expiry duration	Optional
EMAIL_USER	yourgmail@gmail.com	Required
EMAIL_PASS	Gmail App Password (not account password)	Required
STRIPE_SECRET_KEY	sk_test_... — From Stripe Dashboard	Required
CLOUDINARY_CLOUD_NAME	From Cloudinary dashboard	Required
CLOUDINARY_API_KEY	From Cloudinary dashboard	Required
CLOUDINARY_API_SECRET	From Cloudinary dashboard	Required
CLIENT_URL	http://localhost:5173 (dev) or Vercel URL (prod)	Required
Important: For Gmail SMTP, enable 2-Factor Authentication on your Google account, then generate an App Password under Google Account > Security > App Passwords. Use that 16-character code as EMAIL_PASS, not your real password.

5. Running the Server
Prerequisites
•Node.js v18 or later
•MongoDB Atlas account (free tier)
•Stripe account (free test mode)
•Cloudinary account (free tier)
•Gmail account with App Password
Installation

# Clone the repository
git clone https://github.com/y/fitness-booking.git
cd fitness-booking/server
 
# Install dependencies
npm install
 
# Create and fill in .env file
cp .env.example .env
# (edit .env with your values)
 
# Run in development mode (auto-restart)
npm run dev
 
# Run in production mode
npm start

Package.json Scripts
Script	Command
npm run dev	nodemon index.js — hot-reload for development
npm start	node index.js — production start
Server starts on http://localhost:5000 and logs: Server on port 5000 and MongoDB connected: cluster.mongodb.net

6. Database Models
User
Handles both regular users and trainers. Role field controls access levels.

Field            Type           Notes
─────────────────────────────────────────────────────────
name             String         Required, trimmed
email            String         Unique, lowercase
password         String         Bcrypt hashed (12 rounds)
role             String         'user' | 'trainer' | 'admin'
avatar           String         Cloudinary URL
fitnessGoals     [String]       e.g. ['weight loss', 'flexibility']
preferences      Object         classTypes, preferredTime, difficultyLevel
bookingHistory   [ObjectId]     Refs to Booking documents
timestamps       Auto           createdAt, updatedAt

Trainer
Separate profile document linked to a User. Stores professional details and schedule.

Field            Type           Notes
─────────────────────────────────────────────────────────
user             ObjectId       Ref: User (required)
bio              String         Max 1000 chars
qualifications   [String]       e.g. ['ACE Certified', 'CPR']
specializations  [String]       yoga | strength | cardio | pilates | hiit | ...
experience       Number         Years of experience
photos           [String]       Cloudinary URLs
introVideo       String         Cloudinary video URL
availability     [Object]       { day, slots: [{ start, end, isBooked }] }
rating           Number         Computed average (0–5)
totalReviews     Number         Updated on each review
pricePerSession  Number         Base price in USD
isVerified       Boolean        Admin-verified trainer badge

Class
Represents a scheduled fitness session with capacity management.

Field            Type           Notes
─────────────────────────────────────────────────────────
title            String         Required
description      String         Optional
trainer          ObjectId       Ref: Trainer
type             String         yoga | strength | cardio | pilates | hiit | ...
difficulty       String         beginner | intermediate | advanced
duration         Number         Minutes
price            Number         USD
maxCapacity      Number         Default: 10
enrolled         Number         Current count (auto-incremented on booking)
scheduledAt      Date           ISO datetime
thumbnail        String         Cloudinary image URL
tags             [String]       Search/filter tags
isActive         Boolean        Soft-delete / archive flag

Booking
Tracks the full lifecycle of a user booking a class.

Field            Type           Notes
─────────────────────────────────────────────────────────
user             ObjectId       Ref: User
class            ObjectId       Ref: Class
trainer          ObjectId       Ref: Trainer
status           String         pending | confirmed | cancelled | completed
paymentStatus    String         pending | paid | refunded
paymentId        String         Stripe PaymentIntent ID
amount           Number         Final charged amount
notes            String         Optional user notes

Review
User feedback after completing a class. Linked to a specific booking to prevent duplicate reviews.

Field            Type           Notes
─────────────────────────────────────────────────────────
user             ObjectId       Ref: User
trainer          ObjectId       Ref: Trainer
booking          ObjectId       Ref: Booking (unique — one review per booking)
rating           Number         1–5 integer
comment          String         Max 500 chars
trainerResponse  String         Optional trainer reply

Payment
Immutable record of every Stripe transaction for auditing.

Field                   Type      Notes
─────────────────────────────────────────────────────────
user                    ObjectId  Ref: User
booking                 ObjectId  Ref: Booking
stripePaymentIntentId   String    Required — from Stripe
amount                  Number    In USD
currency                String    Default 'usd'
status                  String    pending | succeeded | failed | refunded


7. API Endpoints
Base URL (local): http://localhost:5000/api  |  Base URL (prod): https://your-app.onrender.com/api
Auth: Endpoints marked Private require the header:  Authorization: Bearer <token>
Authentication  —  /api/auth
Method	Endpoint	Auth	Description
POST	/auth/register	Public	Register new user/trainer, receive JWT
POST	/auth/login	Public	Login, receive JWT token
GET	/auth/me	Private	Get current user profile with booking history
Classes  —  /api/classes
Method	Endpoint	Auth	Description
GET	/classes	Public	List all classes. Query: type, difficulty, duration, date
GET	/classes/:id	Public	Get single class detail with trainer info
GET	/classes/recommendations	Private	Personalized class recommendations
POST	/classes	Trainer+	Create a new class (trainer or admin only)
PUT	/classes/:id	Trainer+	Update class details
DELETE	/classes/:id	Trainer+	Soft-delete (set isActive: false)
Bookings  —  /api/bookings
Method	Endpoint	Auth	Description
POST	/bookings	Private	Create a booking (checks capacity, sends email)
GET	/bookings/my	Private	Get all bookings for the logged-in user
GET	/bookings/:id	Private	Get single booking detail
PATCH	/bookings/:id/cancel	Private	Cancel booking, decrement class capacity
PATCH	/bookings/:id/reschedule	Private	Reschedule to new class time
GET	/bookings/trainer	Trainer+	Get all bookings for trainer's classes
Payments  —  /api/payments
Method	Endpoint	Auth	Description
POST	/payments/create-intent	Private	Create Stripe PaymentIntent, return clientSecret
POST	/payments/confirm	Private	Confirm payment, update booking + send receipt
GET	/payments/my	Private	Get user's full payment history
Reviews  —  /api/reviews
Method	Endpoint	Auth	Description
POST	/reviews	Private	Submit review (1 per booking; updates trainer rating)
GET	/reviews/trainer/:id	Public	Get all reviews for a specific trainer
PATCH	/reviews/:id/respond	Trainer+	Trainer adds a response to a review
DELETE	/reviews/:id	Admin	Admin removes a review
Trainers  —  /api/trainers
Method	Endpoint	Auth	Description
GET	/trainers	Public	List all trainers. Filter by specialization, rating
GET	/trainers/:id	Public	Get trainer profile with reviews and classes
POST	/trainers	Trainer+	Create trainer profile (linked to User account)
PUT	/trainers/:id	Trainer+	Update trainer profile and availability
POST	/trainers/:id/media	Trainer+	Upload photo or intro video to Cloudinary

8. Authentication Flow
Register

POST /api/auth/register
 
Request body:
{
  "name": "Ravi Kumar",
  "email": "ravi@example.com",
  "password": "secret123",
  "role": "user"          // or "trainer"
}
 
Response 201:
{
  "token": "eyJhbGci...",
  "user": { "id": "...", "name": "Ravi Kumar", "email": "...", "role": "user" }
}

Login

POST /api/auth/login
 
Request body:
{
  "email": "ravi@example.com",
  "password": "secret123"
}
 
Response 200:
{
  "token": "eyJhbGci...",
  "user": { "id": "...", "name": "Ravi Kumar", "role": "user" }
}

Using the Token
Include the JWT in every protected request header:

Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

Role-Based Access Control
Role	Middleware	Access
user	protect	Browse, book, pay, review
trainer	protect + authorize('trainer')	All of user + create/manage classes, view their bookings, respond to reviews
admin	protect + authorize('admin')	Full access — delete reviews, verify trainers, manage all data

9. Payment Flow (Stripe)
FitBook uses Stripe PaymentIntents — the recommended server-side flow for secure card payments.
Step-by-Step Flow
1.User books a class → Booking document created with status: pending, paymentStatus: pending
2.Frontend calls POST /payments/create-intent with bookingId
3.Backend creates Stripe PaymentIntent (amount × 100 for cents) → returns clientSecret
4.Frontend uses Stripe.js Elements to collect card + confirm payment with clientSecret
5.Frontend calls POST /payments/confirm with paymentIntentId + bookingId
6.Backend verifies intent.status === 'succeeded' → updates Booking (confirmed/paid) → creates Payment record → sends receipt email
Test Card Numbers

Card Number         Scenario
────────────────────────────────────────
4242 4242 4242 4242  Payment succeeds
4000 0000 0000 9995  Payment fails (card declined)
4000 0025 0000 3155  Requires 3D Secure authentication
 
Expiry: any future date  |  CVC: any 3 digits  |  ZIP: any 5 digits


10. Email Notifications
All emails are sent via Nodemailer using Gmail SMTP. Triggered automatically by booking/payment events.
Event	Trigger	Email Content
User Registration	POST /auth/register	Welcome message with user name
Booking Created	POST /bookings	Class name, date/time, amount
Payment Confirmed	POST /payments/confirm	Class name, payment ID, amount
Booking Cancelled	PATCH /bookings/:id/cancel	Cancellation confirmation

11. File Uploads (Cloudinary)
Trainer profile photos and intro videos are uploaded to Cloudinary via Multer middleware.
Upload Endpoint

POST /api/trainers/:id/media
Content-Type: multipart/form-data
 
Field: photo    (image — jpg/jpeg/png)
Field: video    (video — mp4)

Supported Formats
•Images: jpg, jpeg, png — stored in /fitness-platform/photos/
•Videos: mp4 — stored in /fitness-platform/videos/
•File size limit: 10MB images, 100MB videos (configure in Multer options)
•Returns: Cloudinary secure_url saved to Trainer.photos[] or Trainer.introVideo

12. Deployment to Render
Step-by-Step
7.Push server/ folder to GitHub
8.Go to render.com → New → Web Service → Connect GitHub repo
9.Set Root Directory to server/
10.Build Command: npm install  |  Start Command: node index.js
11.Add all .env variables in Render → Environment tab
12.Deploy — your API URL will be https://your-app.onrender.com
Required package.json Addition

"engines": {
  "node": "18.x"
}

CORS Configuration
Update CLIENT_URL in .env to your Vercel frontend URL after deploying the frontend:

CLIENT_URL=https://your-app.vercel.app

MongoDB Atlas Network Access
•Go to MongoDB Atlas → Network Access → Add IP Address
•Add 0.0.0.0/0 (Allow from anywhere) for Render deployment
•Or whitelist specific Render IP addresses for better security

13. Error Handling
All controllers use try/catch. Errors return consistent JSON shape:

// Error response shape
{
  "message": "Human-readable error description",
  "stack": "..."   // Only in development mode
}


Status Code	Meaning	When it occurs
200	OK	Successful GET / PATCH / DELETE
201	Created	Successful POST (new resource created)
400	Bad Request	Validation error, duplicate email, class full
401	Unauthorized	Missing or invalid JWT token
403	Forbidden	Valid token but insufficient role
404	Not Found	Resource ID not found in database
500	Server Error	Unexpected database or runtime error

Submitted for Assessment
This backend was built as part of a technical assessment for an Online Personalized Fitness Class Booking Platform. All source code is open-sourced on GitHub as per the assessment terms and conditions.
GitHub: https://github.com/Bk8946/fitness center backend
