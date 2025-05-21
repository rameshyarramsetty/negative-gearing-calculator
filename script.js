function openTab(tabId) {
  document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
  document.querySelectorAll('.tab-button').forEach(btn => btn.classList.remove('active'));
  document.getElementById(tabId).classList.add('active');
  document.querySelector(`.tab-button[onclick="openTab('${tabId}')"]`).classList.add('active');
}

function getPropertyData(prefix) {
  const rent = parseFloat(document.getElementById(`rent${prefix}`).value) || 0;
  const annualRent = rent * 52;
  const expenses = [
    'water', 'land', 'council', 'body', 'agent', 'letting',
    'advertising', 'maintenance', 'insurance', 'interest'
  ].reduce((total, field) => {
    let val = parseFloat(document.getElementById(`${field}${prefix}`).value) || 0;
    if (field === 'agent') val = (val / 100) * annualRent;
    return total + val;
  }, 0);
  return { annualRent, expenses };
}

function calculate() {
  const p1 = getPropertyData('1');
  const p2 = getPropertyData('2');
  const totalRent = p1.annualRent + p2.annualRent;
  const totalExpenses = p1.expenses + p2.expenses;
  const net = totalRent - totalExpenses;
  const gearing = net < 0 ? "Negatively Geared" : "Positively Geared";
  document.getElementById('results').innerText =
    `Total Rent: $${totalRent.toFixed(2)}\n` +
    `Total Expenses: $${totalExpenses.toFixed(2)}\n` +
    `Net Rental Position: $${net.toFixed(2)} (${gearing})`;
}
