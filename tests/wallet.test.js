const request = require("supertest");
const app = require("../src/app");

describe("Wallet Api", ()=>{
     test("should return 404 for non existing player", async () => {
    const response = await request(app)
      .get("/v1/wallets/player999");

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