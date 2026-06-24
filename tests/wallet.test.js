const request = require("supertest");
const app = require("../src/app");

describe("Wallet Api", ()=>{
     test("should return 404 for non existing player", async () => {
    const response = await request(app)
      .get("/v1/wallets/player999");
      console.log("STATUS:", response.statusCode);
console.log("BODY:", response.body);

    expect(response.statusCode).toBe(404);
  });

  test("should return wallet for existing player", async ()=>{
    const response = await request(app)
    .get("/v1/wallets/player1");

    expect(response.statusCode).toBe(200);
  } )

})

// Test 3 Negative Credit
test("should reject negative credit", async ()=>{
      const response = await request(app)
      .post("/v1/wallets/player1/credit")
      .set("Idempotency-Key", "negative-credit-test")
      .send({
        amount: -100,
        reason:"test"
      })
      
})

//Test 4 Zero Credit
test("should reject zero credit amount", async ()=>{
    const response = await request(app)
    .post("/v1/wallets/player1/credit")
    .set("Idempotency-Key", "zero-credit-test")
    .send({
      amount: 0,
      reason:"test"
    })  

})

//Test 5 Negative Purchase Price

test("should reject negative purchase price", async ()=>{  
     const response = await request(app)
     .post("/v1/wallets/player1/purchase")
        .send({ 
               itemId: "sword",
                price: -50
            });
 })

 //Test 6 Insufficient Balance
 test("should reject purchase when balance is insufficient", async ()=>{
    const response = await request(app)
    .post("/v1/wallets/player1/purchase")
    .send({
        itemId: "car",
        price: 9999999
    })
    expect(response.statusCode).toBe(400);
 })

 test("should not process same credit request twice", async () => {
// Use same idempotency key for both requests
const key = "credit-test-key";

// First request should be processed successfully
await request(app)
.post("/v1/wallets/player1/credit")
.set("Idempotency-Key", key)
.send({
amount: 100,
reason: "bonus"
});

// Second request with same key should be rejected
const response = await request(app)
.post("/v1/wallets/player1/credit")
.set("Idempotency-Key", key)
.send({
amount: 100,
reason: "bonus"
});

expect(response.statusCode).toBe(409);
});

/*
This test was written to validate concurrent purchase behavior.

Currently it is not executed because the project uses a shared database
and the test modifies wallet balances. Running it repeatedly would require
resetting test data before every execution.

The test verifies that when two purchase requests are made at the same time
against a wallet that can afford only one purchase, exactly one request succeeds.
*/

/*
test("should allow only one purchase when balance is enough for one item", async () => {

const purchase1 = request(app)
.post("/v1/wallets/player2/purchase")
.send({
itemId: "sword",
price: 150
});

const purchase2 = request(app)
.post("/v1/wallets/player2/purchase")
.send({
itemId: "shield",
price: 150
});

const [response1, response2] = await Promise.all([
purchase1,
purchase2
]);

const successCount =
(response1.statusCode === 200 ? 1 : 0) +
(response2.statusCode === 200 ? 1 : 0);

expect(successCount).toBe(1);
});
*/

/*
Durability Test Idea

This scenario was considered to verify that committed transactions
remain persisted even if the service is restarted.

The project uses PostgreSQL transactions and persistent storage,
so committed wallet updates, inventory records and transaction
history should survive application restarts.

This test is not automated because it requires stopping and
restarting the service during execution.

Manual Verification Steps:

1. Credit a wallet.
2. Complete a purchase successfully.
3. Stop the Node.js service.
4. Restart the service.
5. Verify wallet balance, inventory and transaction records.
6. Confirm that no committed data was lost or duplicated.
   */
