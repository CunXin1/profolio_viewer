// default.js

// 当页面加载时调用
window.addEventListener("DOMContentLoaded", () => {
    initDefaultPortfolio();
  });
  
  async function initDefaultPortfolio() {
    try {
      // 先看数据库里有没有任何数据
      const resp = await fetch("http://localhost:3000/portfolio");
      const data = await resp.json();
  
      // 如果没有数据(长度为 0)，我们才初始化默认组合
      if (Array.isArray(data) && data.length === 0) {
        console.log("数据库暂无数据，开始初始化默认组合...");
        await fetch("http://localhost:3000/initDefault", {
          method: "POST"
        });
        console.log("默认组合初始化完成。");
      } else {
        console.log("数据库已有数据，无需初始化默认组合。");
      }
  
    } catch (err) {
      console.error("initDefaultPortfolio 出错:", err);
    }
  
    // 初始化完成后，再去获取 + 渲染
    fetchPortfolio();
  }
  