// script.js

// Chart.js 实例
let chart;
// 当前显示 "amount" 或 "percentage"
let viewType = "percentage";

// 注册 plugin (Chart.js v3+/v4+ 需要显式注册)
Chart.register(ChartDataLabels);

/** 从后端获取投资组合 */
function fetchPortfolio() {
  fetch("http://localhost:3000/portfolio")
    .then((res) => res.json())
    .then((data) => {
      // 渲染图表
      renderChart(data);
      // 渲染表格列表
      renderList(data);
    })
    .catch((err) => {
      console.error("获取组合出错:", err);
    });
}

/** 绘制/更新饼状图 */
function renderChart(data) {
  const ctx = document.getElementById("portfolioChart").getContext("2d");

  // 如果所有 amount 都是 0，我们做个“白色全屏显示”，或者分几片都是白色。
  // 这里简单判断 sum(amount)
  const totalAmount = data.reduce((sum, item) => sum + Number(item.amount), 0);

  // 如果原有 chart 存在，先销毁
  if (chart) {
    chart.destroy();
  }

  // 如果 totalAmount === 0，说明没有任何实际金额
  // 我们让每个默认项目分配一个“伪”数值 1，从而让 Chart.js 能渲染出分片。
  // 并把背景都设置成白色
  let datasetValues, backgroundColors;
  if (totalAmount === 0 && data.length > 0) {
    datasetValues = data.map(() => 1);
    backgroundColors = data.map(() => "#FFFFFF"); // 全白
  } else {
    // 否则，按真实数据
    datasetValues = data.map((item) => Number(item[viewType]));
    // 可以自定义一套多彩色
    const colorPalette = [
      "#FF6384", "#36A2EB", "#FFCE56", "#4BC0C0",
      "#9966FF", "#8B0000", "#32CD32", "#FFD700",
      "#00CED1", "#FFA500", "#008080", "#C71585"
    ];
    // 如果项目多，颜色循环使用
    backgroundColors = data.map((_, i) => colorPalette[i % colorPalette.length]);
  }

  chart = new Chart(ctx, {
    type: "pie",
    data: {
      labels: data.map((item) => item.name),
      datasets: [
        {
          data: datasetValues,
          backgroundColor: backgroundColors
        }
      ]
    },
    options: {
      responsive: true,
      plugins: {
        legend: {
          position: "bottom",
        },
        // 使用 chartjs-plugin-datalabels 在图上显示数值
        datalabels: {
          color: "#000",    // 字体颜色
          font: {
            weight: "bold"
          },
          // 居中显示
          anchor: "center",
          align: "center",
          // 格式化: 显示 name + amount/percentage
          formatter: function (value, context) {
            // 如果 totalAmount === 0，value 是我们硬塞的 “1”
            // 其实就是显示 0
            if (totalAmount === 0) {
              return `${context.chart.data.labels[context.dataIndex]}: 0`;
            }

            // 否则正常显示
            const label = context.chart.data.labels[context.dataIndex];
            // “amount” 直接显示数值
            if (viewType === "amount") {
              return `${label}: ${value.toFixed(2)}`;
            } else {
              // “percentage” 显示带百分号
              return `${label}: ${value.toFixed(2)}%`;
            }
          }
        }
      }
    }
  });
}

/** 切换 金额 / 百分比 */
function toggleView() {
  viewType = (viewType === "percentage") ? "amount" : "percentage";
  fetchPortfolio();
}

/** 添加新投资 */
function addInvestment() {
  const name = document.getElementById("newInvestmentName").value.trim();
  const amount = parseFloat(document.getElementById("newInvestmentAmount").value);

  if (!name || !amount || amount <= 0) {
    alert("请输入有效的投资名称和金额");
    return;
  }

  fetch("http://localhost:3000/add", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ name, amount })
  })
    .then((res) => res.json())
    .then((result) => {
      if (result.error) {
        alert(result.error);
      } else {
        // 添加成功，清空输入框，然后刷新数据
        document.getElementById("newInvestmentName").value = "";
        document.getElementById("newInvestmentAmount").value = "";
        fetchPortfolio();
      }
    })
    .catch((err) => {
      console.error("添加新投资出错:", err);
    });
}

/** 渲染下方表格 */
function renderList(data) {
  const tbody = document.querySelector("#investmentList tbody");
  tbody.innerHTML = "";

  data.forEach((item) => {
    const tr = document.createElement("tr");

    // 名称
    const tdName = document.createElement("td");
    tdName.textContent = item.name;
    tr.appendChild(tdName);

    // 金额
    const tdAmount = document.createElement("td");
    tdAmount.textContent = item.amount;
    tr.appendChild(tdAmount);

    // 百分比
    const tdPerc = document.createElement("td");
    tdPerc.textContent = item.percentage.toFixed(2) + "%";
    tr.appendChild(tdPerc);

    // 操作 - 删除按钮
    const tdAction = document.createElement("td");
    const delBtn = document.createElement("button");
    delBtn.textContent = "删除";
    delBtn.onclick = () => {
      deleteItem(item.id);
    };
    tdAction.appendChild(delBtn);
    tr.appendChild(tdAction);

    tbody.appendChild(tr);
  });
}

/** 删除投资项 */
function deleteItem(id) {
  if (!confirm("确定要删除这条投资吗？")) return;

  fetch("http://localhost:3000/delete", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id })
  })
    .then((res) => res.json())
    .then((result) => {
      if (result.error) {
        alert(result.error);
      } else {
        // 删除成功，刷新
        fetchPortfolio();
      }
    })
    .catch((err) => {
      console.error("删除投资出错:", err);
    });
}
