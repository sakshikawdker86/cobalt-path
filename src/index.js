require('dotenv').config();
const express = require('express');
const pool = require('./db');

const app = express();

app.use(express.json());


app.get("/db-test", async (req, res) => {
  try {
    const result = await pool.query("SELECT NOW()");
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/v1/wallets/:playerId/credit", async (req, res) => {
  try {
    const { playerId } = req.params;
    const { amount, reason } = req.body;

    const idempotencyKey = req.headers["idempotency-key"];

    if (!idempotencyKey) {
      return res.status(400).json({
        message: "Idempotency-Key header is required"
      });
    }

    const existingKey = await pool.query(
      "SELECT * FROM idempotency_keys WHERE id = $1",
      [idempotencyKey]
    );

    if (existingKey.rows.length > 0) {
      return res.status(409).json({
        message: "Request already processed"
      });
    }

    const result = await pool.query(
      `UPDATE wallets
       SET balance = balance + $1
       WHERE player_id = $2
       RETURNING *`,
      [amount, playerId]
    );

    await pool.query(
      "INSERT INTO idempotency_keys (id) VALUES ($1)",
      [idempotencyKey]
    );

    res.json({
      message: "Wallet credited",
      wallet: result.rows[0]
    });

  } catch (error) {
    res.status(500).json({
      error: error.message
    });
  }
});

app.get("/v1/wallets/:playerId", async (req, res) => {
  try {
    const { playerId } = req.params;

    const result = await pool.query(
      "SELECT * FROM wallets WHERE player_id = $1",
      [playerId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "Player not found"
      });
    }

    res.json(result.rows[0]);

  } catch (error) {
    res.status(500).json({
      error: error.message
    });
  }
});


app.post("/v1/wallets/:playerId/purchase", async (req, res) => {
  const client = await pool.connect();

  try {
    const { playerId } = req.params;
    const { itemId, price } = req.body;

    const walletResult = await client.query(
      "SELECT balance FROM wallets WHERE player_id = $1",
      [playerId]
    );

    if (walletResult.rows.length === 0) {
      return res.status(404).json({
        message: "Player not found"
      });
    }

    const balance = walletResult.rows[0].balance;

    if (balance < price) {
      return res.status(400).json({
        message: "Insufficient balance"
      });
    }

    await client.query("BEGIN");

    await client.query(
      `UPDATE wallets
       SET balance = balance - $1
       WHERE player_id = $2`,
      [price, playerId]
    );

    await client.query(
      `INSERT INTO inventory (player_id, item_id)
       VALUES ($1, $2)`,
      [playerId, itemId]
    );

    await client.query(
      `INSERT INTO transactions (player_id, type, amount)
       VALUES ($1, $2, $3)`,
      [playerId, "purchase", price]
    );

    await client.query("COMMIT");

    res.json({
      message: "Purchase successful"
    });

  } catch (error) {
    await client.query("ROLLBACK");

    res.status(500).json({
      error: error.message
    });
  } finally {
    client.release();
  }
});

app.post("/v1/rewards/:rewardId/claim", async (req, res) => {
  try {
    const { rewardId } = req.params;
    const { playerId } = req.body;

    const result = await pool.query(
      `INSERT INTO reward_claims (player_id, reward_id)
       VALUES ($1, $2)
       RETURNING *`,
      [playerId, rewardId]
    );

    res.json({
      message: "Reward claimed successfully",
      reward: result.rows[0]
    });

  } catch (error) {

    if (error.code === "23505") {
      return res.status(400).json({
        message: "Reward already claimed"
      });
    }

    res.status(500).json({
      error: error.message
    });
  }
});
const PORT = 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});