#Wallet Service

## Overview

This project is a wallet service built using Node.js,
Express.js, PostgreSQL and Docker.

This service supports wallet credit, item purchases, reward claiming, and idempotent request handling.
The main goal was to build a reliable wallet system that maintains data consistency and prevent duplicate operation.

The service allows players to:

Add credits to their wallet
Purchase items using wallet balance
claim rewards
Prevent duplicate requests using idempotency keys



## Tech Stack

Node.js

Express.js

PostgreSQL

Docker

Docker Compose

Jest

Supertest

## Tool 

Thunder Client

## Setup

git clone https://github.com/sakshikawdker86/cobalt-path.git

cd cobalt-path

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

Run Locally

Start PostgreSQL:

docker compose up -d db

Start the application:

npm run dev


## Docker Setup

The project includes:

* PostgreSQL running in a Docker container.
* Node.js application running in a Docker container.
* Docker Compose for managing both services together.

Build and start all services:

docker compose up --build

The API will be available at:

http://localhost:3000

Stop the containers:

docker compose down

Environment variables for the application are provided through Docker Compose.

## APIs Features

Credit Wallet

Credits a player's wallet balance.

Endpoint

POST /v1/wallets/:playerId/credit

Example Request
{
    "amount":100,
    "reason":"bonus"
}

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

Example Request

{
    "playerId":"player1",
    "rewardId":"bonus"
}



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

Wallet Creation

A wallet is automatically created when a new player receives their first credit 

## Database and Consistency Decisions

### Why PostgreSQL?

I chose PostgreSQL because the wallet system requires transactional consistency. A purchase operation updates wallet balance, inventory and transaction history together, which is well supported through PostgreSQL transactions.

### Transaction Isolation and Safety

The application uses PostgreSQL transactions to ensure that related operations either succeed together or fail together.

To reduce the risk of double spending during concurrent purchases, balance deduction is performed using a conditional update:

```sql
UPDATE wallets
SET balance = balance - $1
WHERE player_id = $2
AND balance >= $1
RETURNING *;
```

This ensures that only requests with sufficient balance can update the wallet.

### Duplicate Request Handling

Idempotency keys are stored in the database and checked before processing a request. If the same request is received again with the same key, the request is rejected instead of being processed twice.

For a long-running production system, old idempotency records could be periodically archived or cleaned up using a retention policy to prevent unbounded table growth.

## Running the Project

1. Clone the Repository
git clone 
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

idempotency_keys

5. Database Schema

The project includes a `sql/schema.sql` file containing all required database tables and constraints.

To create the database schema:

bash

docker exec -i wallet-service-db-1 psql -U admin -d walletdb < sql/schema.sql


The schema creates the following tables:

* wallets
* transactions
* inventory
* reward_claims
* idempotency_keys

It also includes a database constraint to prevent negative wallet balances.

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
item catalog. Before running the application, execute the schema file located at: 

src/sql/schema.sql

This creates the required database table

## Additional Testing

I added automated tests using Jest and Supertest to verify common API scenarios such as invalid input, missing players, insufficient balance and duplicate requests.

I also explored a concurrency test where two purchase requests are sent at the same time for a wallet that can afford only one purchase. To better handle this scenario, I updated the purchase logic to use a conditional balance update in PostgreSQL so that only one request can successfully deduct the balance.

### Tests Not Automated

Two additional scenarios were explored during development:

* Concurrent purchase requests against the same wallet.
* Service restart and durability verification.

These scenarios were not included in the automated test suite because they require database state management and infrastructure-level testing. The related design considerations and implementation approach are documented.

## Atomicity and Durability

Purchase operations are executed inside PostgreSQL transactions.

Atomic operations:

Wallet balance deduction
Inventory update
Transaction record creation

If the process crashes before COMMIT, PostgreSQL rolls back the transaction and no partial state is persisted.

If the process crashes after COMMIT, the committed state remains durable and is recovered when the service restarts.

Isolation

The implementation relies on PostgreSQL's default transaction isolation level (READ COMMITTED).

To reduce the risk of concurrent balance updates, purchases use a conditional balance deduction query that only succeeds when sufficient balance exists.

## Quick Test

Credit a wallet:

```bash
curl -X POST http://localhost:3000/v1/wallets/player1/credit \
-H "Content-Type: application/json" \
-d "{\"amount\":100,\"reason\":\"bonus\"}"
```

Get wallet balance:

```bash
curl http://localhost:3000/v1/wallets/player1
```



## Resilience Notes

The current implementation keeps wallet updates and inventory updates in the same database transaction.

If inventory management were moved to a separate service, I would use idempotency keys, retries and an event-driven approach to reduce the risk of duplicate item grants or lost updates during failures.

## Separate Inventory Service

Assume inventory management is moved to a separate service and can timeout, fail or process requests more than once.

A database transaction can no longer guarantee consistency across services.

### Failure Window

The wallet service may successfully deduct currency while the inventory service fails to grant the item.

The inventory service may also receive duplicate requests due to retries.

### Approach

To support exactly-once behavior:

* Use idempotency keys for inventory requests.
* Store outgoing inventory events durably before sending them.
* Retry transient failures.
* Ensure inventory grants are idempotent.
* Use an outbox pattern for reliable event delivery.

### Duplicate Currency Bug Investigation

If a bug double-credits currency, the transactions table can be used as an audit trail to identify affected players.

In a production system, business reference identifiers and reconciliation jobs would be added to improve duplicate detection and recovery.


## Limitations

A full concurrency test was drafted but not enabled because the project uses a shared development database and the test changes wallet balances, which would require resetting test data before each run.

A service restart test was also considered, but automating it would require infrastructure-level testing beyond the scope of this assignment.

## Possible Improvements

If more time were available, I would consider the following improvements:

* Add a dedicated test database and automated database reset for more reliable integration testing.
* Add fully automated concurrency tests for simultaneous purchase requests.
* Containerize the Node.js application in addition to PostgreSQL.
* Introduce structured logging and monitoring.
* Add rate limiting and request tracing.
* Use an event-driven approach if inventory management is moved to a separate service.
* Add reconciliation and audit tooling for detecting duplicate credits or item grants.
* Expand test coverage for failure recovery and service restart scenarios.

## AI Usage Disclosure

I used ChatGPT for debugging, discussing implementation approaches, reviewing test cases and improving documentation.

The final code was implemented, tested and verified by me.
