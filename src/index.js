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

// step 1 credit api
app.post("/v1/wallets/:playerId/credit", async (req, res) => {
     const { playerId } = req.params;
     const { amount ,reason} = req.body;

     try {
    const { playerId } = req.params;
    const { amount, reason } = req.body;

    const result = await pool.query(
      `UPDATE wallets
       SET balance = balance + $1
       WHERE player_id = $2
       RETURNING *`,
      [amount, playerId]
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

const PORT = 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});