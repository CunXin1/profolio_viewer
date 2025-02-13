let chart;
let viewType = "percentage"; // 默认视图是百分比

// 1. 从后端获取组合
function fetchPortfolio() {
  fetch("http://localhost:3000/portfolio")
    .then(response => response.json())
    .then(data => {
      renderChart(data);  // 更新饼图
      renderTable(data);  // 更新表格
    })
    .catch(err => console.error("获取组合出错:", err));
}

// 2. 渲染饼图
function renderChart(data) {
  const ctx = document.getElementById("portfolioChart").getContext("2d");
  if (chart) chart.destroy();

  chart = new Chart(ctx, {
    type: "pie",
    data: {
      labels: data.map(item => item.name),
      datasets: [{
        data: data.map(item => item[viewType]), // "amount" 或 "percentage"
        backgroundColor: [
          "#FF6384", "#36A2EB", "#FFCE56", "#4BC0C0",
          "#9966FF", "#8B0000", "#32CD32", "#FFD700",
          "#00CED1", "#FFA500", "#008080", "#C71585"
        ]
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { position: "bottom" }
      }
    }
  });
}

// 3. 渲染表格 (可选)
function renderTable(data) {
  const tbody = document.querySelector("#portfolioTable tbody");
  tbody.innerHTML = "";

  data.forEach(item => {
    const tr = document.createElement("tr");

    // 投资名称
    const tdName = document.createElement("td");
    tdName.textContent = item.name;
    tr.appendChild(tdName);

    // 投资金额 (保留 2 位小数)
    const tdAmount = document.createElement("td");
    tdAmount.textContent = parseFloat(item.amount).toFixed(2);
    tr.appendChild(tdAmount);

    // 持仓占比 (保留 2 位小数 + %)
    const tdPct = document.createElement("td");
    tdPct.textContent = parseFloat(item.percentage).toFixed(2) + "%";
    tr.appendChild(tdPct);

    tbody.appendChild(tr);
  });
}

// 4. 添加新投资
function addInvestment() {
  const name = document.getElementById("newInvestmentName").value;
  const amount = parseFloat(document.getElementById("newInvestmentAmount").value);

  if (!name || !amount || amount <= 0) {
    alert("请输入有效的投资名称和金额");
    return;
  }

  fetch("http://localhost:3000/add", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, amount })
  })
    .then(response => response.json())
    .then(result => {
      if (result.error) {
        alert(result.error);
      } else {
        // 清空输入
        document.getElementById("newInvestmentName").value = "";
        document.getElementById("newInvestmentAmount").value = "";
        // 刷新图表 / 表格
        fetchPortfolio();
      }
    })
    .catch(err => console.error("添加新投资出错:", err));
}

// 5. 清空数据库（无确认）
function clearAll() {
  fetch("http://localhost:3000/clear", { method: "POST" })
    .then(response => response.json())
    .then(result => {
      if (result.success) {
        fetchPortfolio();
      } else {
        alert("清空数据库失败。");
      }
    })
    .catch(err => console.error("清空数据库出错:", err));
}

// 6. 切换金额 / 百分比
function toggleView() {
  viewType = (viewType === "percentage") ? "amount" : "percentage";
  fetchPortfolio();
}

// 7. 页面初始时，获取数据
fetchPortfolio();
