const express = require("express");
const cors = require("cors");
const mysql = require("mysql2/promise"); // 使用 promise 版的 mysql2

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

// 数据库连接配置
const pool = mysql.createPool({
  host: "localhost",
  user: "CunXin",
  password: "QRB20031001notch",  
  database: "my_investment_db", 
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

/**
 * GET /portfolio
 * 返回数据库中所有投资信息
 */
app.get("/portfolio", async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM portfolio");
    res.json(rows);
  } catch (err) {
    console.error("Error in GET /portfolio:", err);
    res.status(500).json({ error: "Database error." });
  }
});

/**
 * POST /add
 * 添加新投资，并重新计算所有项目的百分比 (修复版)
 */
app.post("/add", async (req, res) => {
  try {
    const { name, amount } = req.body;

    if (!name || !amount || amount <= 0) {
      return res.status(400).json({ error: "请输入有效的投资名称和金额" });
    }

    // 1) 先插入新项目(percentage 先填 0 占位)
    await pool.query(`
      INSERT INTO portfolio (name, amount, percentage)
      VALUES (?, ?, 0)
    `, [name, amount]);

    // 2) 查询所有项目的总金额 (此时已包含刚插入的新项目)
    const [rows] = await pool.query("SELECT SUM(amount) AS total FROM portfolio");
    const totalAmount = rows[0].total || 0;

    // 3) 重新获取所有项目, 依次更新 percentage
    const [allItems] = await pool.query("SELECT id, amount FROM portfolio");
    for (let item of allItems) {
      const newPct = (item.amount / totalAmount) * 100;
      await pool.query(`
        UPDATE portfolio SET percentage = ? WHERE id = ?
      `, [newPct, item.id]);
    }

    res.json({ success: true });
  } catch (err) {
    console.error("Error in POST /add:", err);
    res.status(500).json({ error: "Database error." });
  }
});

/**
 * POST /clear
 * 清空整张表 (去掉 confirm)
 */
app.post("/clear", async (req, res) => {
  try {
    await pool.query("TRUNCATE TABLE portfolio");
    res.json({ success: true });
  } catch (err) {
    console.error("Error in POST /clear:", err);
    res.status(500).json({ error: "Database error." });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});