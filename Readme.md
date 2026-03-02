 #  endpoint - https://bitespeed-assignment-yb9q.onrender.com/identify
🧠 Bitespeed Backend Task – Identity Reconciliation
📌 Overview
This project implements the Identity Reconciliation service for Bitespeed.

The system links multiple contacts belonging to the same customer using shared:

email

phoneNumber

It ensures:

The oldest contact is marked as primary

All related contacts are marked as secondary

Multiple identities can be merged safely

🚀 Tech Stack

Node.js

Express

TypeScript

PostgreSQL

pg (node-postgres driver)

No ORM used — raw SQL queries with transaction support.

📂 API Endpoint
POST /identify
Request Body (JSON)
{
  "email": "mcfly@hillvalley.edu",
  "phoneNumber": "123456"
}

Both fields are optional, but at least one must be provided.

✅ Sample Response
{
  "contact": {
    "primaryContatctId": 1,
    "emails": [
      "lorraine@hillvalley.edu",
      "mcfly@hillvalley.edu"
    ],
    "phoneNumbers": [
      "123456"
    ],
    "secondaryContactIds": [23]
  }
}
🧠 Logic Summary

If no existing contact → create new primary

If contact exists → return consolidated identity

If new email/phone provided → create secondary

If two primary contacts become connected →

Oldest remains primary

Newer primary becomes secondary

All operations are handled inside a database transaction

🛠 Database Schema
CREATE TABLE "Contact" (
    id SERIAL PRIMARY KEY,
    "phoneNumber" TEXT,
    email TEXT,
    "linkedId" INT,
    "linkPrecedence" TEXT CHECK ("linkPrecedence" IN ('primary','secondary')) NOT NULL,
    "createdAt" TIMESTAMP DEFAULT NOW(),
    "updatedAt" TIMESTAMP DEFAULT NOW(),
    "deletedAt" TIMESTAMP
);
🧪 Running Locally
1️⃣ Install dependencies
npm install
2️⃣ Create .env file
DATABASE_URL=your_postgres_connection_string
3️⃣ Run in development
npm run dev
4️⃣ Build for production
npm run build
npm start
🌐 Hosted Endpoint
https://your-render-url.onrender.com/identify
✨ Key Features

Raw SQL implementation (no ORM)

Transaction-safe merging

Handles primary → secondary conversion

Handles identity graph merging

Clean folder structure

Production-ready TypeScript setup

👨‍💻 Author

Aditya Rawat
NIT Allahabad