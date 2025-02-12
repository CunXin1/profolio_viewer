let chart;
let viewType = "percentage"; // 默认显示百分比

// 1. 从后端读取组合, 渲染饼图
function fetchPortfolio() {
  fetch("http://localhost:3000/portfolio")
    .then(response => response.json())
    .then(data => {
      renderChart(data);
    })
    .catch(err => console.error("获取组合出错:", err));
}

// 2. 绘制 Chart.js 饼图
function renderChart(data) {
  const ctx = document.getElementById("portfolioChart").getContext("2d");
  if (chart) chart.destroy();

  chart = new Chart(ctx, {
    type: "pie",
    data: {
      labels: data.map(item => item.name),
      datasets: [{
        data: data.map(item => item[viewType]), // amount 或 percentage
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

// 3. 添加新投资
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
      // 清空输入框
      document.getElementById("newInvestmentName").value = "";
      document.getElementById("newInvestmentAmount").value = "";
      // 重新获取数据并刷新图表
      fetchPortfolio();
    }
  })
  .catch(err => console.error("添加新投资出错:", err));
}

// 4. 切换金额 / 百分比
function toggleView() {
  viewType = (viewType === "percentage") ? "amount" : "percentage";
  fetchPortfolio();
}

// 5. 初始化时获取一次组合数据
fetchPortfolio();

