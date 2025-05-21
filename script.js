
function openTab(tabId) {
  document.querySelectorAll(".tab-content").forEach(el => el.style.display = "none");
  document.getElementById(tabId).style.display = "block";
}

function annualRent(weeklyRent) {
  return weeklyRent * 52;
}

function totalExpenses(rent, water, land, council, body, agentPercent, letting, ads, maintenance, insurance, interest) {
  const agentFee = (agentPercent / 100) * rent;
  return water + land + council + body + agentFee + letting + ads + maintenance + insurance + interest;
}

function calculate() {
  const rent1 = annualRent(Number(document.getElementById("rent1").value || 0));
  const exp1 = totalExpenses(rent1,
    Number(document.getElementById("water1").value || 0),
    Number(document.getElementById("land1").value || 0),
    Number(document.getElementById("council1").value || 0),
    Number(document.getElementById("body1").value || 0),
    Number(document.getElementById("agent1").value || 0),
    Number(document.getElementById("letting1").value || 0),
    Number(document.getElementById("ads1").value || 0),
    Number(document.getElementById("maintenance1").value || 0),
    Number(document.getElementById("insurance1").value || 0),
    Number(document.getElementById("interest1").value || 0)
  );

  const rent2 = annualRent(Number(document.getElementById("rent2").value || 0));
  const exp2 = totalExpenses(rent2,
    Number(document.getElementById("water2").value || 0),
    Number(document.getElementById("land2").value || 0),
    Number(document.getElementById("council2").value || 0),
    Number(document.getElementById("body2").value || 0),
    Number(document.getElementById("agent2").value || 0),
    Number(document.getElementById("letting2").value || 0),
    Number(document.getElementById("ads2").value || 0),
    Number(document.getElementById("maintenance2").value || 0),
    Number(document.getElementById("insurance2").value || 0),
    Number(document.getElementById("interest2").value || 0)
  );

  const totalRent = rent1 + rent2;
  const totalExp = exp1 + exp2;
  const netPosition = totalRent - totalExp;

  document.getElementById("results").innerHTML = \`
    <h3>Results</h3>
    <p>Total Annual Rent: \$\${totalRent.toFixed(2)}</p>
    <p>Total Annual Expenses: \$\${totalExp.toFixed(2)}</p>
    <p>Net Rental Position: <strong>\${netPosition < 0 ? 'Negative' : 'Positive'}</strong> \$\${netPosition.toFixed(2)}</p>
  \`;
}
