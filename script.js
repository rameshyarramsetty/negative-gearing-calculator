document.addEventListener('DOMContentLoaded', () => {
  const financialYearSelect = document.getElementById('financialYear');
  const grossIncomeInput = document.getElementById('grossIncome');
  const otherIncomeInput = document.getElementById('otherIncome');
  const workExpensesInput = document.getElementById('workExpenses');
  const salarySacrificeSuperInput = document.getElementById('salarySacrificeSuper');
  const privateHealthInsuranceSelect = document.getElementById('privateHealthInsurance');
  const dependentsInput = document.getElementById('dependents');
  const relationshipStatusSelect = document.getElementById('relationshipStatus');
  const spouseIncomeInput = document.getElementById('spouseIncome');
  const coupleIncomeGroup = document.querySelector('.couple-income-group');
  const hecsDebtSelect = document.getElementById('hecsDebt');
  const totalNetPropertyIncomeLossSpan = document.getElementById('totalNetPropertyIncomeLoss');
  const totalAssessableIncomeSpan = document.getElementById('totalAssessableIncome');
  const totalDeductionsSpan = document.getElementById('totalDeductions');
  const overallTaxableIncomeSpan = document.getElementById('overallTaxableIncome');
  const incomeTaxSpan = document.getElementById('incomeTax');
  const litoSpan = document.getElementById('lito');
  const netTaxPayableSpan = document.getElementById('netTaxPayable');
  const medicareLevySpan = document.getElementById('medicareLevy');
  const medicareLevySurchargeSpan = document.getElementById('medicareLevySurcharge');
  const totalMedicareChargesSpan = document.getElementById('totalMedicareCharges');
  const hecsRepaymentSpan = document.getElementById('hecsRepayment');
  const superannuationGuaranteeSpan = document.getElementById('superannuationGuarantee');
  const netIncomeSpan = document.getElementById('netIncome');

  const personalIncomeTabButton = document.querySelector('[data-tab="personalIncomeTab"]');
  const propertyTabsContainer = document.getElementById('propertyTabsContainer');
  const addPropertyBtn = document.getElementById('addPropertyBtn');
  const tabContentContainer = document.querySelector('.tab-content');
  const propertyTabTemplate = document.getElementById('propertyTabTemplate');

  let properties = [];
  let nextPropertyId = 0;

  function formatCurrency(amount) {
    return `$${Number(amount).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  }

  function openTab(tabId) {
    document.querySelectorAll('.tab-button').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.tab-content-item').forEach(content => content.classList.remove('active'));
    const button = document.querySelector(`[data-tab="${tabId}"]`);
    const tab = document.getElementById(tabId);
    if (button) button.classList.add('active');
    if (tab) tab.classList.add('active');
    calculateTax();
  }

  personalIncomeTabButton.addEventListener('click', () => openTab('personalIncomeTab'));
  addPropertyBtn.addEventListener('click', () => addPropertyTab());

  relationshipStatusSelect.addEventListener('change', () => {
    coupleIncomeGroup.style.display = relationshipStatusSelect.value === 'couple' ? 'block' : 'none';
    if (relationshipStatusSelect.value === 'single') spouseIncomeInput.value = 0;
    calculateTax();
  });

  [grossIncomeInput, otherIncomeInput, workExpensesInput, salarySacrificeSuperInput,
    privateHealthInsuranceSelect, dependentsInput, spouseIncomeInput, hecsDebtSelect
  ].forEach(input => input.addEventListener('input', calculateTax));

  function addPropertyTab() {
    const propertyId = `property-${nextPropertyId++}`;
    const tabButton = document.createElement('button');
    tabButton.className = 'tab-button';
    tabButton.dataset.tab = propertyId;
    tabButton.textContent = `Property ${properties.length + 1}`;
    tabButton.addEventListener('click', () => openTab(propertyId));
    propertyTabsContainer.appendChild(tabButton);

    const propertyContent = propertyTabTemplate.content.cloneNode(true);
    const tabItem = propertyContent.querySelector('.tab-content-item');
    tabItem.id = propertyId;
    tabItem.querySelector('.property-number').textContent = properties.length + 1;

    const nameInput = tabItem.querySelector('.property-name-input');
    const incomeInput = tabItem.querySelector('.property-rental-income');
    const expenseInputs = Array.from(tabItem.querySelectorAll('input')).filter(input => input !== incomeInput && input !== nameInput);
    const totalIncomeSpan = tabItem.querySelector('.total-property-rental-income');
    const totalExpenseSpan = tabItem.querySelector('.total-property-expenses');
    const netSpan = tabItem.querySelector('.net-property-income-loss');

    function recalculateProperty() {
      const income = parseFloat(incomeInput.value) || 0;
      let expenses = 0;
      expenseInputs.forEach(input => expenses += parseFloat(input.value) || 0);
      const net = income - expenses;
      totalIncomeSpan.textContent = formatCurrency(income);
      totalExpenseSpan.textContent = formatCurrency(expenses);
      netSpan.textContent = formatCurrency(net);
      netSpan.style.color = net < 0 ? '#dc3545' : '#28a745';
      propertyData.net = net;
      calculateTax();
    }

    nameInput.addEventListener('input', () => {
      tabButton.textContent = nameInput.value || `Property ${properties.indexOf(propertyData) + 1}`;
    });
    incomeInput.addEventListener('input', recalculateProperty);
    expenseInputs.forEach(input => input.addEventListener('input', recalculateProperty));
    tabItem.querySelector('.delete-property-btn').addEventListener('click', () => {
      tabItem.remove();
      tabButton.remove();
      properties = properties.filter(p => p.id !== propertyId);
      calculateTax();
    });

    tabContentContainer.appendChild(tabItem);
    const propertyData = { id: propertyId, net: 0 };
    properties.push(propertyData);
    openTab(propertyId);
  }

  function calculateTax() {
    const income = parseFloat(grossIncomeInput.value) || 0;
    const other = parseFloat(otherIncomeInput.value) || 0;
    const work = parseFloat(workExpensesInput.value) || 0;
    const superSacrifice = parseFloat(salarySacrificeSuperInput.value) || 0;
    const spouse = parseFloat(spouseIncomeInput.value) || 0;
    const dependents = parseInt(dependentsInput.value) || 0;
    const hecs = hecsDebtSelect.value === 'yes';
    const privateCover = privateHealthInsuranceSelect.value === 'yes';
    const year = financialYearSelect.value;

    const taxBrackets = {
      '2025-26': [
        { min: 0, max: 18200, rate: 0, base: 0 },
        { min: 18201, max: 45000, rate: 0.16, base: 0 },
        { min: 45001, max: 135000, rate: 0.30, base: 4288 },
        { min: 135001, max: 190000, rate: 0.37, base: 31288 },
        { min: 190001, max: Infinity, rate: 0.45, base: 51638 },
      ]
    };

    const propertyNet = properties.reduce((sum, p) => sum + (p.net || 0), 0);
    totalNetPropertyIncomeLossSpan.textContent = formatCurrency(propertyNet);
    totalNetPropertyIncomeLossSpan.style.color = propertyNet < 0 ? '#dc3545' : '#28a745';

    let assessable = income + other;
    let deductions = work + superSacrifice;
    if (propertyNet < 0) deductions += Math.abs(propertyNet);
    else assessable += propertyNet;

    const taxable = Math.max(0, assessable - deductions);
    overallTaxableIncomeSpan.textContent = formatCurrency(taxable);
    totalAssessableIncomeSpan.textContent = formatCurrency(assessable);
    totalDeductionsSpan.textContent = formatCurrency(deductions);

    let tax = 0;
    for (const bracket of taxBrackets[year]) {
      if (taxable > bracket.min) {
        const upper = Math.min(taxable, bracket.max);
        tax = bracket.base + (upper - bracket.min) * bracket.rate;
      }
    }

    const lito = taxable <= 37500 ? 700 : Math.max(0, 700 - (taxable - 37500) * 0.05);
    const netTax = Math.max(0, tax - lito);
    const medicare = taxable > 27222 ? taxable * 0.02 : 0;
    const hecsRepay = hecs && taxable > 54332 ? taxable * 0.01 : 0;
    const superGuarantee = income * 0.12;
    const net = income + other - work - superSacrifice - netTax - medicare - hecsRepay;

    incomeTaxSpan.textContent = formatCurrency(tax);
    litoSpan.textContent = formatCurrency(lito);
    netTaxPayableSpan.textContent = formatCurrency(netTax);
    medicareLevySpan.textContent = formatCurrency(medicare);
    medicareLevySurchargeSpan.textContent = '$0.00';
    totalMedicareChargesSpan.textContent = formatCurrency(medicare);
    hecsRepaymentSpan.textContent = formatCurrency(hecsRepay);
    superannuationGuaranteeSpan.textContent = formatCurrency(superGuarantee);
    netIncomeSpan.textContent = formatCurrency(net);
  }

  openTab('personalIncomeTab');
  calculateTax();
});