const express = require("express");
const cors = require("cors");
const mysql = require("mysql2/promise"); // 使用 promise 版的 mysql2

const app = express();
const PORT = 3000;


// 中间件
app.use(cors());
app.use(express.json());

// 连接池设置（请修改为你的 MySQL 配置）
const pool = mysql.createPool({
    host: "localhost",
    user: "CunXin",
    password: "QRB20031001notch",
    database: "my_investment_db"
  });

/**
 * GET /portfolio
 * 读取数据库中的所有投资信息，并返回
 */
app.get("/portfolio", async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM portfolio");
    res.json(rows); // 直接返回数组给前端
  } catch (err) {
    console.error("Error in GET /portfolio:", err);
    res.status(500).json({ error: "Database error." });
  }
});

/**
 * POST /add
 * 添加新投资，并重新计算所有投资的 percentage
 * body: { name, amount }
 */
app.post("/add", async (req, res) => {
  try {
    const { name, amount } = req.body;

    // 基础校验
    if (!name || !amount || amount <= 0) {
      return res.status(400).json({ error: "请输入有效的投资名称和金额" });
    }

    // 先计算当前总金额
    const [rows] = await pool.query("SELECT SUM(amount) as total FROM portfolio");
    const totalAmountBefore = rows[0].total || 0; // 如果为空则为 0
    const newTotalAmount = totalAmountBefore + amount;

    // 1) 往数据库里插入这条新投资记录 (先插入, percentage 暂时随便写个 0)
    await pool.query(
      "INSERT INTO portfolio (name, amount, percentage) VALUES (?, ?, 0)",
      [name, amount]
    );

    // 2) 重新查询数据库, 拿到所有投资的 id 和 amount
    const [allItems] = await pool.query("SELECT id, amount FROM portfolio");

    // 3) 重新计算所有记录的 percentage, 并更新
    //    (老数据不变，amount 不变，但它们在新 totalAmount 中的占比会变)
    for (let item of allItems) {
      const newPercentage = item.amount / newTotalAmount * 100;
      await pool.query(
        "UPDATE portfolio SET percentage = ? WHERE id = ?",
        [newPercentage, item.id]
      );
    }

    // 4) 返回成功
    res.json({ success: true });
  } catch (err) {
    console.error("Error in POST /add:", err);
    res.status(500).json({ error: "Database error." });
  }
});

// 启动服务器
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
