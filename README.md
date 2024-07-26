# UniBiz

 [Project Plan](https://docs.google.com/document/d/1XQFS5vd7NfyrooN3eNToGnlcszpfmNe0TV1gD2lIBkM/edit?usp=sharing)

# Introduction

UniBiz is a web application designed to enhance campus life by connecting students with student-run businesses offering essential services like hairdressing, cooking, and more. UniBiz makes it easy for students to find, book, and review services from their peers, promoting local business and community engagement.

# Techstack
Frontend: React
Backend: Express
Database: PostgreSQL
ORM: Prisma
Authentication: JWT, bcrypt
APIs: Google Calender
Others: WebSockets,  Node.js

# Project Structure

UniBiz
├── backend
│   ├── routes
│   │   ├── recommendationHelpers.js
│   │   ├── recommendationHelpers.test.js
│   │   ├── user-route.js
│   ├── middlewares
│   │   ├── authenticateJWT.js
│   │   ├── GoogleOAuthConfig.js
│   ├── prisma
│   │   └── schema.prisma
│   ├── websocketServer.js
│   ├── websocket-client.js
│   ├── index.js
│   └── .env
├── frontend
│   ├── src
│   │   ├── components
│   │   ├── assets
│   │   ├── App.js
│   │   ├── App.css
│   │   ├── index.css
│   │   └── main.jsx
│   ├── public
│   ├── index.html
│   └── .env
├── .gitignore
├── package-lock.json
├── package.json
├── README.md
└── vite.config.js

# Database Structure

model User {
  id                    Int                   @id @default(autoincrement())
  firstName             String
  lastName              String
  email                 String                @unique
  username              String                @unique
  password              String
  accessToken           String?
  refreshToken          String?
  tokenExpiry           DateTime?
  profileComplete       Boolean               @default(false)
  profile               BusinessProfile?
  reviews               ReviewAndRating[]     @relation("UserReviews")
  services              Service[]
  favorites             Favorite[]
  bookings              Booking[]
  notifications         Notification[]
  googleCalendarEvents  GoogleCalendar[]
  unreadCount           Int                   @default(0)
}

model BusinessProfile {
  id                    Int                   @id @default(autoincrement())
  businessName          String
  logo                  Bytes?
  bio                   String
  userId                Int                   @unique
  user                  User                  @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model Service {
  id                    Int                   @id @default(autoincrement())
  serviceType           String
  serviceName           String
  description           String
  price                 Float
  image                 Bytes?
  userId                Int
  user                  User                  @relation(fields: [userId], references: [id])
  reviewsAndRatings     ReviewAndRating[]     @relation("ServiceReviews")
  favoritedBy           Favorite[]
  availableTimes        AvailableTime[]
  bookings              Booking[]
  notifications         Notification[]
}

model ReviewAndRating {
  id                    Int                   @id @default(autoincrement())
  userId                Int
  serviceId             Int
  rating                Int
  reviewText            String?
  createdAt             DateTime              @default(now())
  user                  User                  @relation(fields: [userId], references: [id], onDelete: Cascade, name: "UserReviews")
  service               Service               @relation(fields: [serviceId], references: [id], onDelete: Cascade, name: "ServiceReviews")
}

model Favorite {
  userId                Int
  serviceId             Int
  user                  User                  @relation(fields: [userId], references: [id], onDelete: Cascade)
  service               Service               @relation(fields: [serviceId], references: [id], onDelete: Cascade)

  @@id([userId, serviceId])
}

model AvailableTime {
  id                    Int                   @id @default(autoincrement())
  serviceId             Int
  startTime             DateTime
  endTime               DateTime
  isBooked              Boolean               @default(false)
  service               Service               @relation(fields: [serviceId], references: [id], onDelete: Cascade)
  bookings              Booking[]
}

model Booking {
  id                    Int                   @id @default(autoincrement())
  userId                Int
  serviceId             Int
  timeId                Int?
  user                  User                  @relation(fields: [userId], references: [id], onDelete: Cascade)
  service               Service               @relation(fields: [serviceId], references: [id], onDelete: Cascade)
  time                  AvailableTime?        @relation(fields: [timeId], references: [id], onDelete: Cascade)
  createdAt             DateTime              @default(now())
}

model GoogleCalendar {
  id                    Int                   @id @default(autoincrement())
  googleId              String                @unique
  title                 String
  startAt               DateTime
  endAt                 DateTime
  allDay                Boolean
  userId                Int
  user                  User                  @relation(fields: [userId], references: [id])
}

model Notification {
  id                    Int                   @id @default(autoincrement())
  content               String
  timestamp             DateTime              @default(now())
  read                  Boolean               @default(false)
  userId                Int?
  user                  User?                 @relation(fields: [userId], references: [id], onDelete: Cascade)
  serviceId             Int?
  service               Service?              @relation(fields: [serviceId], references: [id], onDelete: Cascade)
}


# Features

Sign Up with Campus Credentials: Users can sign up using their campus email, first name, last name, and password.
Email Verification: Users receive a confirmation email to activate their account.
Login: Users can log in using their campus email and password.
Browsing and Viewing Services

Browse Service Listings: Users can browse a list of local services offered by businesses on campus.
View Service Details: Users can view detailed information about services, including pricing, description, and reviews.
Rating and Reviewing Services

Rate Services: Users can provide a rating (1-5 stars) for services they have used.
Review Services: Users can write and submit reviews for services they have used.
Business Profile Management

Create Business Profile: Business owners can create profiles for their services, including business name, logo, and bio.
Manage Service Listings: Business owners can add, edit, and delete service listings.


Book Services: Users can book appointments for services directly through the app by selecting a date and time.
Booking Confirmation: Users receive a confirmation notification after booking a service.
Adding Services to Favorites

Add to Favorites: Users can add services to their favorites list for easy access.
View Favorites: Users can view a list of their favorite services.
Service Recommendations

Personalized Recommendations: Users receive service recommendations based on an algorithm that considers their previous bookings, ratings, and favorites.


# Future Improvements

Enhanced Recommendation Algorithm: Further improve the recommendation system.
Mobile App: Develop a mobile application for iOS and Android platforms.
Social Features: Add more social features like following other users and sharing services you like.

