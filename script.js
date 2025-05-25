const fileInput = document.getElementById("fileInput");
const summaryEl = document.getElementById("summary");
const metricsEl = document.getElementById("metrics");
const reportSection = document.getElementById("report");
const extraEl = document.getElementById("extra");

const L = document.getElementById("loader");
if (L) L.style.display = "none";

fileInput.addEventListener("change", async (event) => {
  const file = event.target.files[0];
  if (!file) return;

  const loader = document.getElementById("loader");
  loader.style.display = "flex";

  try {
    const text = await file.text();
    const data = JSON.parse(text);

    const result = await estimateCarbon(data);

    summaryEl.textContent = `
🧾 Total tokens: ${result.totalTokens.toLocaleString()}

🤖 GPT-4 tokens: ${result.gpt4Tokens.toLocaleString()}

⚡ GPT-3.5 tokens: ${result.gpt35Tokens.toLocaleString()}

💬 Total messages: ${result.totalMessages.toLocaleString()}

🌍 Estimated CO₂ Emissions: ${result.totalCO2} kg
`.trim();

    metricsEl.innerHTML = generateEquivalentsGrid(result.totalCO2);

    extraEl.textContent = generateExtraMetrics(result);

    reportSection.hidden = false;
  } catch (err) {
    alert(
      "Error reading or parsing the JSON file. Make sure it's a valid ChatGPT export."
    );
    console.error(err);
  } finally {
    loader.style.display = "none";
  }
});

function estimateCarbon(data) {
  return new Promise((resolve) => {
    let totalTokens = 0;
    let gpt4Tokens = 0;
    let gpt35Tokens = 0;
    let totalMessages = 0;

    data.forEach((chat) => {
      if (!chat.mapping) return;

      Object.values(chat.mapping).forEach((node) => {
        const msg = node.message;
        if (msg && msg.author?.role === "user" && msg.content?.parts) {
          const text = msg.content.parts.join(" ");
          const tokens = Math.ceil(text.length / 4); 
          totalTokens += tokens;
          totalMessages++;

          const model = msg.metadata?.model_slug || "";
          if (model.includes("gpt-4")) {
            gpt4Tokens += tokens;
          } else {
            gpt35Tokens += tokens;
          }
        }
      });
    });

    const kWhPerToken = 0.0005;
    const kgCO2PerKWh = 0.233;

    const totalKWh = totalTokens * kWhPerToken;
    const totalCO2 = totalKWh * kgCO2PerKWh;

    resolve({
      totalTokens,
      gpt4Tokens,
      gpt35Tokens,
      totalCO2: totalCO2.toFixed(3),
      totalMessages,
    });
  });
}

function generateEquivalentsGrid(co2) {
  co2 = parseFloat(co2);
  if (isNaN(co2) || co2 <= 0)
    return '<div class="metric">No meaningful CO₂ emissions detected.</div>';

  const petrol = (co2 / 2.31).toFixed(1);
  const kmDriven = (co2 / 0.021).toFixed(0);
  const phones = (co2 / 0.00186).toFixed(0);
  const householdFraction = co2 / 3100;
  const trees = Math.ceil(co2 / 21);
  const ledHours = (co2 / (0.233 * 0.01)).toFixed(0);
  const flightHours = (co2 / 90).toFixed(2);
  const bags = (co2 / 0.03).toFixed(0);

  return `
    <div class="metric"><span class="metric-icon">🚗</span><span class="metric-label">Car travel</span><span class="metric-value">${kmDriven} km</span></div>
    <div class="metric"><span class="metric-icon">⛽</span><span class="metric-label">Petrol burned</span><span class="metric-value">${petrol} L</span></div>
    <div class="metric"><span class="metric-icon">🔋</span><span class="metric-label">Smartphones charged</span><span class="metric-value">${phones}</span></div>
    <div class="metric"><span class="metric-icon">🏠</span><span class="metric-label">Fraction of Indian household/year</span><span class="metric-value">1⁄${Math.round(
      1 / householdFraction
    )}</span></div>
    <div class="metric"><span class="metric-icon">🌳</span><span class="metric-label">Trees to offset</span><span class="metric-value">${trees}</span></div>
    <div class="metric"><span class="metric-icon">💡</span><span class="metric-label">LED bulb (10W) hours</span><span class="metric-value">${ledHours}</span></div>
    <div class="metric"><span class="metric-icon">✈️</span><span class="metric-label">Flight hours</span><span class="metric-value">${flightHours}</span></div>
    <div class="metric"><span class="metric-icon">🥤</span><span class="metric-label">Plastic bags produced</span><span class="metric-value">${bags}</span></div>
  `;
}

function generateExtraMetrics(result) {
  const co2 = parseFloat(result.totalCO2);
  if (isNaN(co2) || co2 <= 0) return "";

  const co2PerMsg = (co2 / result.totalMessages).toFixed(4);
  const co2PerKTokens = (co2 / (result.totalTokens / 1000)).toFixed(3);
  const teaCups = Math.round(co2 / 0.03);
  const googleSearches = Math.round(co2 / 0.0003);

  return `
📊 More Metrics:

• CO₂ per message: ${co2PerMsg} kg
• CO₂ per 1000 tokens: ${co2PerKTokens} kg
• Equivalent to brewing ~${teaCups} cups of tea
• Equivalent to ~${googleSearches} Google searches
`.trim();
}
window.addEventListener("error", () => {
  const loader = document.getElementById("loader");
  if (loader) loader.style.display = "none";
});
window.addEventListener("unhandledrejection", () => {
  const loader = document.getElementById("loader");
  if (loader) loader.style.display = "none";
});
