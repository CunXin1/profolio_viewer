const express = require("express");
const cors = require("cors");
const mysql = require("mysql2/promise");

const app = express();
const PORT = 3000;

// 中间件
app.use(cors());
app.use(express.json());

// 数据库连接池 (请修改为你自己的配置信息)
const pool = mysql.createPool({
  host: "localhost",
  user: "CunXin",
  password: "123",   
  database: "my_investment_db", 
  waitForConnections: true,
  connectionLimit: 10
});

/** 
 * POST /initDefault
 * 初始化默认投资组合，金额全为 0，常见的 5 个或更多。
 */
app.post("/initDefault", async (req, res) => {
  try {
    // 先清空表
    await pool.query("TRUNCATE TABLE portfolio");

    // 想要哪些默认条目，可自行修改
    const defaultItems = [
      { name: "纳指",   amount: 0 },
      { name: "美股",   amount: 0 },
      { name: "黄金",   amount: 0 },
      { name: "标普500", amount: 0 },
      { name: "A股",    amount: 0 }
    ];

    // 插入默认条目（percentage 都先写 0）
    for (let item of defaultItems) {
      await pool.query(
        "INSERT INTO portfolio (name, amount, percentage) VALUES (?, ?, 0)",
        [item.name, item.amount]
      );
    }

    // 返回成功
    res.json({ success: true });
  } catch (err) {
    console.error("Error in /initDefault:", err);
    res.status(500).json({ error: "Database error." });
  }
});

/**
 * GET /portfolio
 * 获取所有投资
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
 * 添加新投资
 * body: { name, amount }
 */
app.post("/add", async (req, res) => {
  try {
    const { name, amount } = req.body;
    if (!name || !amount || amount <= 0) {
      return res.status(400).json({ error: "请输入有效的投资名称和金额" });
    }

    // 先查一下当前总金额
    const [rows] = await pool.query("SELECT SUM(amount) as total FROM portfolio");
    const totalBefore = rows[0].total || 0;
    const newTotal = totalBefore + amount;

    // 插入新条目 (percentage 先置 0)
    await pool.query(
      "INSERT INTO portfolio (name, amount, percentage) VALUES (?, ?, 0)",
      [name, amount]
    );

    // 重新获取全部条目，更新 percentage
    const [allItems] = await pool.query("SELECT id, amount FROM portfolio");

    for (let item of allItems) {
      const percent = (newTotal === 0) ? 0 : (item.amount / newTotal) * 100;
      await pool.query("UPDATE portfolio SET percentage = ? WHERE id = ?", [percent, item.id]);
    }

    res.json({ success: true });
  } catch (err) {
    console.error("Error in POST /add:", err);
    res.status(500).json({ error: "Database error." });
  }
});

/**
 * POST /delete
 * 删除指定 id 的投资
 * body: { id }
 */
app.post("/delete", async (req, res) => {
  try {
    const { id } = req.body;
    if (!id) {
      return res.status(400).json({ error: "缺少 id 参数" });
    }

    // 先删除这条记录
    await pool.query("DELETE FROM portfolio WHERE id = ?", [id]);

    // 再重新计算剩余项目的 percentage
    const [sumRows] = await pool.query("SELECT SUM(amount) as total FROM portfolio");
    const total = sumRows[0].total || 0;

    const [allItems] = await pool.query("SELECT id, amount FROM portfolio");
    for (let item of allItems) {
      const percent = (total === 0) ? 0 : (item.amount / total) * 100;
      await pool.query("UPDATE portfolio SET percentage = ? WHERE id = ?", [percent, item.id]);
    }

    res.json({ success: true });
  } catch (err) {
    console.error("Error in POST /delete:", err);
    res.status(500).json({ error: "Database error." });
  }
});

// 启动服务器
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
