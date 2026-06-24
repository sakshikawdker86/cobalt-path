#Wallet Service

## Overview

This project is a wallet service built using Node.js,
Express.js, PostgreSQL and Docker.

This service supports wallet credit, item purchases, reward claiming, and idempotent request handling.
The main goal was to build a reliable wallet system that maintains data consistency and prevent dublicate operation.

The service allows players to:

Add credits to their wallet
Purchase items using wallet balance
claim rewards
Prevent dublicate requests using idempotency keys



## Tech Stack

Node.js

Express.js

PostgreSQL

Docker

Docker Compose

Jest

Supertest

## Setup
git clone <>
cd wallet-service

Install dependencies

npm install

Start PostgreSQL using Docker:

docker compose up -d

Runt the application

npm run dev

Environment Variables

Create a .env file:

DB_HOST=localhost
DB_PORT=5432
DB_USER=admin
DB_PASSWORD=admin
DB_NAME=walletdb


## APIs Features

Credit Wallet

Credits a player's wallet balance.

Endpoint

POST /v1/wallets/:playerId/credit

Features:

Validates amount input
Rejects zero or negative amounts
Supports idempotency
Creates wallet automatically for a new player

Get Wallet

Returns  wallet information for a player

Endpoint

GET /v1/wallets/:playerId

Features

Return current balance

Returns 404 if player is not found

Returns wallet details for player.

Purchase Item

Allows a player to purchase an item using wallet balance.

Endpoint

POST /v1/wallets/:playerId/purchase

Features:

Rejects purchase when balance is insufficient

Rejects negative or invalid prices

Updates wallet balance

Uses database transactions to guarantee consistency

Claim Rewards

Endpoint

POST /v1/rewards/:rewardId/claim

Features

Allows a player to claim a reward once.

Uses idempotency protection

Database Tables

wallets
inventory
transactions
reward_claims
idempotency_keys


## Design Decisions

PostgreSQL Transactions

The purchase flow updates multiple tables.

To avoid partial updates, all purchase operation are executed
inside a PostgreSQL transaction.

This gurantees:

No wallet debit without inventroy update

No inventory update without transaction record

All operations succeed together of fall together

Input Validation

The service validates incoming values and rejects:

Negative amounts

Zero amounts

Negative prices

Insufficient balance purchases

Balance protection

Negative balances are prevented both in application
logic and through a database CHECK constraints 



## Running the Project

1. Clone the Repository
git clone <>
cd wallet service

2. Install Dependencies

npm install

3. Configure Environment Variables

DB_HOST=localhost
DB_PORT=5432
DB_USER=admin
DB_PASSWORD=admin
DB_NAME=walletdb

4. Start PostgreSQL Using Docker

docker compose up -d

Verify that the database container is running

docker ps

5. Create Database Tables

Connect to PostgreSQL


wallets

transactions

inventory

reward_claims

idempotency_keys

6. Start the Application

npm run dev

The service will start on:

http://localhost:3000

7. Verify Databse Connection

Open:

http://localhost:3000/db-test

A successful response confirms that the application can connect to PostgreSQL

8. Run Automates Tests

npm test



## Running Tests

Run automated tests:

npm test

Current test coverage includes:

Existing player lookup

Missing player lookup

Negative credit validation

Zero credit validation

Negative purchase validation

Insufficient balance validations


## Notes

Purchase operations use database transactions.
Duplicate reward clams are prevented using a unique constraint.
Credit requests support idempotency through the Idempotency-Key header.
For simplicity, item prices are currently supplied in the purchase request. In a production 
environment, prices would typically be manages server-side through an 
item catalog.