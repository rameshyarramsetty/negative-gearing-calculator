document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Elements for Personal Income Calculator ---
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

    // --- DOM Elements for Tab Management ---
    const tabButtonsContainer = document.querySelector('.tab-nav');
    const personalIncomeTabButton = document.querySelector('[data-tab="personalIncomeTab"]');
    const propertyTabsContainer = document.getElementById('propertyTabsContainer');
    const addPropertyBtn = document.getElementById('addPropertyBtn');
    const tabContentContainer = document.querySelector('.tab-content');
    const propertyTabTemplate = document.getElementById('propertyTabTemplate');

    // --- Global State for Properties ---
    let properties = []; // Stores objects for each property
    let nextPropertyId = 0; // To assign unique IDs to new properties

    // --- Tax Data by Financial Year ---
    // Note: Medicare and HECS tiers are illustrative. Always verify with official ATO sources.
    const taxData = {
        '2023-24': { // Current (prior to Stage 3)
            taxRates: [
                { min: 0, max: 18200, rate: 0, base: 0 },
                { min: 18201, max: 45000, rate: 0.19, base: 0 },
                { min: 45001, max: 120000, rate: 0.325, base: 5092 },
                { min: 120001, max: 180000, rate: 0.37, base: 29467.5 },
                { min: 180001, max: Infinity, rate: 0.45, base: 51667.5 }
            ],
            medicareThresholdSingle: 24276,
            medicareThresholdFamilyBase: 40938,
            medicareThresholdPerDependent: 3760,
            mlsThresholdSingleBase: 93000,
            mlsThresholdSingleTier1: 108000,
            mlsThresholdSingleTier2: 144000,
            mlsThresholdFamilyBase: 186000,
            mlsThresholdFamilyTier1: 216000,
            mlsThresholdFamilyTier2: 288000,
            sgRate: 0.11,
            litoMax: 700,
            litoPhaseOutStart: 37500,
            litoPhaseOutRate: 0.05,
            hecsRepaymentTiers: [
                { min: 51550, rate: 0.01 }, // 1%
                { min: 54332, rate: 0.02 }, // 2%
                { min: 57270, rate: 0.03 }, // 3%
                { min: 60377, rate: 0.04 }, // 4%
                { min: 63660, rate: 0.05 }, // 5%
                { min: 67128, rate: 0.06 }, // 6%
                { min: 70792, rate: 0.07 }, // 7%
                { min: 74661, rate: 0.08 }, // 8%
                { min: 78747, rate: 0.09 }, // 9%
                { min: 83060, rate: 0.095 }, // 9.5%
                { min: 87612, rate: 0.10 }, // 10%
                { min: 92415, rate: 0.105 }, // 10.5%
                { min: 97480, rate: 0.11 }, // 11%
                { min: 102820, rate: 0.115 }, // 11.5%
                { min: 108449, rate: 0.12 }, // 12%
                { min: 114380, rate: 0.125 }, // 12.5%
                { min: 120627, rate: 0.13 }, // 13%
                { min: 127204, rate: 0.135 }, // 13.5%
                { min: 134126, rate: 0.14 }, // 14%
                { min: 141409, rate: 0.145 }, // 14.5%
                { min: 149071, rate: 0.15 }, // 15% (highest tier)
                { min: Infinity, rate: 0.15 } // Fallback for very high incomes
            ]
        },
        '2024-25': { // Current financial year
            taxRates: [
                { min: 0, max: 18200, rate: 0, base: 0 },
                { min: 18201, max: 45000, rate: 0.16, base: 0 }, // Stage 3 Rate Change
                { min: 45001, max: 135000, rate: 0.30, base: 4288 }, // Stage 3 Rate Change
                { min: 135001, max: 190000, rate: 0.37, base: 31288 },
                { min: 190001, max: Infinity, rate: 0.45, base: 51638 }
            ],
            medicareThresholdSingle: 26000, // ATO confirmed 2024-25
            medicareThresholdFamilyBase: 43845, // ATO confirmed 2024-25
            medicareThresholdPerDependent: 4050, // ATO confirmed 2024-25
            mlsThresholdSingleBase: 97000,
            mlsThresholdSingleTier1: 113000,
            mlsThresholdSingleTier2: 151000,
            mlsThresholdFamilyBase: 194000,
            mlsThresholdFamilyTier1: 226000,
            mlsThresholdFamilyTier2: 302000,
            sgRate: 0.115, // SG rate for 2024-25
            litoMax: 700,
            litoPhaseOutStart: 37500,
            litoPhaseOutRate: 0.05,
            hecsRepaymentTiers: [ // HECS thresholds for 2024-25
                { min: 54332, rate: 0.01 }, // 1%
                { min: 57270, rate: 0.02 }, // 2%
                { min: 60377, rate: 0.03 }, // 3%
                { min: 63660, rate: 0.04 }, // 4%
                { min: 67128, rate: 0.05 }, // 5%
                { min: 70792, rate: 0.06 }, // 6%
                { min: 74661, rate: 0.07 }, // 7%
                { min: 78747, rate: 0.08 }, // 8%
                { min: 83060, rate: 0.09 }, // 9%
                { min: 87612, rate: 0.095 }, // 9.5%
                { min: 92415, rate: 0.10 }, // 10%
                { min: 97480, rate: 0.105 }, // 10.5%
                { min: 102820, rate: 0.11 }, // 11%
                { min: 108449, rate: 0.115 }, // 11.5%
                { min: 114380, rate: 0.12 }, // 12%
                { min: 120627, rate: 0.125 }, // 12.5%
                { min: 127204, rate: 0.13 }, // 13%
                { min: 134126, rate: 0.135 }, // 13.5%
                { min: 141409, rate: 0.14 }, // 14%
                { min: 149071, rate: 0.145 }, // 14.5%
                { min: 157125, rate: 0.15 }, // 15% (highest tier)
                { min: Infinity, rate: 0.15 } // Fallback for very high incomes
            ]
        },
        '2025-26': { // Future financial year (Stage 3 fully in effect)
            taxRates: [
                { min: 0, max: 18200, rate: 0, base: 0 },
                { min: 18201, max: 45000, rate: 0.16, base: 0 },
                { min: 45001, max: 135000, rate: 0.30, base: 4288 },
                { min: 135001, max: 190000, rate: 0.37, base: 31288 },
                { min: 190001, max: Infinity, rate: 0.45, base: 51638 }
            ],
            medicareThresholdSingle: 27222, // Estimated for 2025-26 based on previous increases
            medicareThresholdFamilyBase: 45907, // Estimated for 2025-26
            medicareThresholdPerDependent: 4207, // Estimated for 2025-26
            mlsThresholdSingleBase: 97000,
            mlsThresholdSingleTier1: 113000,
            mlsThresholdSingleTier2: 151000,
            mlsThresholdFamilyBase: 194000,
            mlsThresholdFamilyTier1: 226000,
            mlsThresholdFamilyTier2: 302000,
            sgRate: 0.12, // SG rate for 2025-26
            litoMax: 700,
            litoPhaseOutStart: 37500,
            litoPhaseOutRate: 0.05,
            hecsRepaymentTiers: [ // HECS thresholds for 2025-26 (Placeholder: assuming 2024-25 for now, check ATO for updates)
                { min: 54332, rate: 0.01 }, // 1%
                { min: 57270, rate: 0.02 }, // 2%
                { min: 60377, rate: 0.03 }, // 3%
                { min: 63660, rate: 0.04 }, // 4%
                { min: 67128, rate: 0.05 }, // 5%
                { min: 70792, rate: 0.06 }, // 6%
                { min: 74661, rate: 0.07 }, // 7%
                { min: 78747, rate: 0.08 }, // 8%
                { min: 83060, rate: 0.09 }, // 9%
                { min: 87612, rate: 0.095 }, // 9.5%
                { min: 92415, rate: 0.10 }, // 10%
                { min: 97480, rate: 0.105 }, // 10.5%
                { min: 102820, rate: 0.11 }, // 11%
                { min: 108449, rate: 0.115 }, // 11.5%
                { min: 114380, rate: 0.12 }, // 12%
                { min: 120627, rate: 0.125 }, // 12.5%
                { min: 127204, rate: 0.13 }, // 13%
                { min: 134126, rate: 0.135 }, // 13.5%
                { min: 141409, rate: 0.14 }, // 14%
                { min: 149071, rate: 0.145 }, // 14.5%
                { min: 157125, rate: 0.15 }, // 15% (highest tier)
                { min: Infinity, rate: 0.15 } // Fallback for very high incomes
            ]
        }
        // Add more financial years as needed
    };


    // --- Tab Management Functions ---
    function openTab(tabId) {
        // Remove 'active' class from all tab buttons and content items
        document.querySelectorAll('.tab-button').forEach(btn => btn.classList.remove('active'));
        document.querySelectorAll('.tab-content-item').forEach(content => content.classList.remove('active'));

        // Add 'active' class to the clicked tab button and its corresponding content
        const targetTabButton = document.querySelector(`[data-tab="${tabId}"]`);
        const targetTabContent = document.getElementById(tabId);

        if (targetTabButton) targetTabButton.classList.add('active');
        if (targetTabContent) targetTabContent.classList.add('active');

        // Always recalculate when switching tabs (or inputs change)
        calculateTax();
    }

    function addPropertyTab(propertyData = null) {
        const newPropertyId = propertyData ? propertyData.id : `property-${nextPropertyId++}`;

        // Create the tab button
        const newTabButton = document.createElement('button');
        newTabButton.classList.add('tab-button');
        newTabButton.setAttribute('data-tab', newPropertyId);
        newTabButton.textContent = propertyData && propertyData.name ? propertyData.name : `Property ${properties.length + 1}`; // Default name
        newTabButton.addEventListener('click', () => openTab(newPropertyId));
        propertyTabsContainer.appendChild(newTabButton);

        // Create the tab content
        const newTabContent = propertyTabTemplate.content.cloneNode(true);
        const propertyContentItem = newTabContent.querySelector('.property-content-item');
        propertyContentItem.id = newPropertyId;
        propertyContentItem.setAttribute('data-property-id', newPropertyId);

        // Get elements within the new property tab
        const propertyNumberSpan = propertyContentItem.querySelector('.property-number');
        const propertyNameInput = propertyContentItem.querySelector('.property-name-input');
        const rentalIncomeInput = propertyContentItem.querySelector('.property-rental-income');
        const interestExpenseInput = propertyContentItem.querySelector('.property-interest-expense');
        const advertisingInput = propertyContentItem.querySelector('.property-advertising');
        const bankChargesInput = propertyContentItem.querySelector('.property-bank-charges');
        const borrowingCostsInput = propertyContentItem.querySelector('.property-borrowing-costs');
        const cleaningInput = propertyContentItem.querySelector('.property-cleaning');
        const councilRatesInput = propertyContentItem.querySelector('.property-council-rates');
        const gardeningInput = propertyContentItem.querySelector('.property-gardening');
        const landTaxInput = propertyContentItem.querySelector('.property-land-tax');
        const insuranceInput = propertyContentItem.querySelector('.property-insurance');
        const legalExpensesInput = propertyContentItem.querySelector('.property-legal-expenses');
        const lossOfRentInsuranceInput = propertyContentItem.querySelector('.property-loss-of-rent-insurance');
        const pestControlInput = propertyContentItem.querySelector('.property-pest-control');
        const managementFeesInput = propertyContentItem.querySelector('.property-management-fees');
        const quantitySurveyorFeesInput = propertyContentItem.querySelector('.property-quantity-surveyor-fees');
        const repairsMaintenanceInput = propertyContentItem.querySelector('.property-repairs-maintenance');
        const strataFeesInput = propertyContentItem.querySelector('.property-strata-fees');
        const travelExpensesInput = propertyContentItem.querySelector('.property-travel-expenses');
        const waterRatesInput = propertyContentItem.querySelector('.property-water-rates');
        const depreciationInput = propertyContentItem.querySelector('.property-depreciation');
        const otherExpensesInput = propertyContentItem.querySelector('.property-other-expenses');


        // Spans to display property-specific summaries
        const totalRentalIncomeSpan = propertyContentItem.querySelector('.total-property-rental-income');
        const totalExpensesSpan = propertyContentItem.querySelector('.total-property-expenses');
        const netIncomeLossSpan = propertyContentItem.querySelector('.net-property-income-loss');

        const deleteButton = propertyContentItem.querySelector('.delete-property-btn');

        // Initialize values or load from propertyData
        if (propertyData) {
            propertyNumberSpan.textContent = properties.length + 1; // Re-number based on array order
            propertyNameInput.value = propertyData.name || '';
            rentalIncomeInput.value = propertyData.rentalIncome || 0;
            interestExpenseInput.value = propertyData.interestExpense || 0;
            advertisingInput.value = propertyData.advertising || 0;
            bankChargesInput.value = propertyData.bankCharges || 0;
            borrowingCostsInput.value = propertyData.borrowingCosts || 0;
            cleaningInput.value = propertyData.cleaning || 0;
            councilRatesInput.value = propertyData.councilRates || 0;
            gardeningInput.value = propertyData.gardening || 0;
            landTaxInput.value = propertyData.landTax || 0;
            insuranceInput.value = propertyData.insurance || 0;
            legalExpensesInput.value = propertyData.legalExpenses || 0;
            lossOfRentInsuranceInput.value = propertyData.lossOfRentInsurance || 0;
            pestControlInput.value = propertyData.pestControl || 0;
            managementFeesInput.value = propertyData.managementFees || 0;
            quantitySurveyorFeesInput.value = propertyData.quantitySurveyorFees || 0;
            repairsMaintenanceInput.value = propertyData.repairsMaintenance || 0;
            strataFeesInput.value = propertyData.strataFees || 0;
            travelExpensesInput.value = propertyData.travelExpenses || 0;
            waterRatesInput.value = propertyData.waterRates || 0;
            depreciationInput.value = propertyData.depreciation || 0;
            otherExpensesInput.value = propertyData.otherExpenses || 0;
        } else {
            // For new properties, add to array and assign an index
            properties.push({
                id: newPropertyId,
                name: `Property ${properties.length + 1}`,
                rentalIncome: 0,
                interestExpense: 0,
                advertising: 0,
                bankCharges: 0,
                borrowingCosts: 0,
                cleaning: 0,
                councilRates: 0,
                gardening: 0,
                landTax: 0,
                insurance: 0,
                legalExpenses: 0,
                lossOfRentInsurance: 0,
                pestControl: 0,
                managementFees: 0,
                quantitySurveyorFees: 0,
                repairsMaintenance: 0,
                strataFees: 0,
                travelExpenses: 0,
                waterRates: 0,
                depreciation: 0,
                otherExpenses: 0,
                netIncomeLoss: 0 // Initialize net income/loss for new property
            });
            propertyNumberSpan.textContent = properties.length; // Correct for new properties (1-based index)
        }


        // Event listeners for property inputs
        const inputs = [
            propertyNameInput, rentalIncomeInput, interestExpenseInput,
            advertisingInput, bankChargesInput, borrowingCostsInput, cleaningInput,
            councilRatesInput, gardeningInput, landTaxInput, insuranceInput,
            legalExpensesInput, lossOfRentInsuranceInput, pestControlInput,
            managementFeesInput, quantitySurveyorFeesInput, repairsMaintenanceInput,
            strataFeesInput, travelExpensesInput, waterRatesInput,
            depreciationInput, otherExpensesInput
        ];

        inputs.forEach(input => {
            input.addEventListener('input', () => {
                // Find the property in the global array by ID
                const propertyIndex = properties.findIndex(p => p.id === newPropertyId);
                if (propertyIndex !== -1) {
                    // Update the property object based on input type
                    if (input.classList.contains('property-name-input')) {
                        properties[propertyIndex].name = input.value;
                        newTabButton.textContent = input.value || `Property ${propertyIndex + 1}`; // Update tab button text
                    } else {
                        // All other inputs are numbers
                        properties[propertyIndex][input.classList[0].replace('property-', '')] = parseFloat(input.value) || 0;
                    }
                    calculatePropertySummary(propertyIndex); // Recalculate this property's summary
                    calculateTax(); // Recalculate main tax
                    saveState(); // Save state after property input change
                }
            });
        });

        // Delete button listener
        deleteButton.addEventListener('click', () => {
            deletePropertyTab(newPropertyId);
        });

        tabContentContainer.appendChild(propertyContentItem);

        // Initial calculation for this new property
        const propertyIndex = properties.findIndex(p => p.id === newPropertyId);
        if(propertyIndex !== -1) {
            calculatePropertySummary(propertyIndex);
        }

        // Open the newly created tab if it's the first property or explicitly requested
        if (!propertyData) { // Only open if it's a newly created property, not loaded
             openTab(newPropertyId);
        }
        calculateTax(); // Recalculate overall tax
        saveState(); // Save state
    }

    function deletePropertyTab(propertyIdToDelete) {
        if (!confirm('Are you sure you want to delete this property? This cannot be undone.')) {
            return;
        }

        // Remove from properties array
        properties = properties.filter(p => p.id !== propertyIdToDelete);

        // Remove tab button and content from DOM
        const tabButtonToRemove = document.querySelector(`[data-tab="${propertyIdToDelete}"]`);
        const tabContentToRemove = document.getElementById(propertyIdToDelete);

        if (tabButtonToRemove) tabButtonToRemove.remove();
        if (tabContentToRemove) tabContentToRemove.remove();

        // Renumber remaining property tabs and their button texts
        properties.forEach((prop, index) => {
            const btn = document.querySelector(`[data-tab="${prop.id}"]`);
            const content = document.getElementById(prop.id);
            if (btn) btn.textContent = prop.name || `Property ${index + 1}`;
            if (content) content.querySelector('.property-number').textContent = index + 1;
        });

        // Determine which tab to open next
        let nextTabToOpen = 'personalIncomeTab'; // Default to personal tab
        const remainingTabs = document.querySelectorAll('.tab-button:not(.tab-add-property)');
        if (remainingTabs.length > 0) {
            // If the deleted tab was active, or if personal income tab isn't active, try to open the first remaining property tab
            if (tabContentToRemove.classList.contains('active') || !personalIncomeTabButton.classList.contains('active')) {
                nextTabToOpen = remainingTabs[0].dataset.tab;
            }
        }
        openTab(nextTabToOpen); // Open the selected tab

        calculateTax(); // Recalculate overall tax
        saveState(); // Save state
    }

    function calculatePropertySummary(propertyIndex) {
        const prop = properties[propertyIndex];
        if (!prop) return;

        const totalRentalIncome = prop.rentalIncome;
        const totalExpenses = prop.interestExpense + prop.advertising + prop.bankCharges + prop.borrowingCosts +
                              prop.cleaning + prop.councilRates + prop.gardening + prop.landTax +
                              prop.insurance + prop.legalExpenses + prop.lossOfRentInsurance +
                              prop.pestControl + prop.managementFees + prop.quantitySurveyorFees +
                              prop.repairsMaintenance + prop.strataFees + prop.travelExpenses +
                              prop.waterRates + prop.depreciation + prop.otherExpenses;

        const netIncomeLoss = totalRentalIncome - totalExpenses;

        // Update the display in the specific property tab
        const propertyContentElement = document.getElementById(prop.id);
        if (propertyContentElement) {
            propertyContentElement.querySelector('.total-property-rental-income').textContent = formatCurrency(totalRentalIncome);
            propertyContentElement.querySelector('.total-property-expenses').textContent = formatCurrency(totalExpenses);
            propertyContentElement.querySelector('.net-property-income-loss').textContent = formatCurrency(netIncomeLoss);
            propertyContentElement.querySelector('.net-property-income-loss').style.color = netIncomeLoss < 0 ? '#dc3545' : '#28a745';
        }

        // Update the property object in the array with calculated net income/loss
        prop.netIncomeLoss = netIncomeLoss;
    }


    function getAggregatePropertyNet() {
        let totalPropertyNet = 0;
        properties.forEach(prop => {
            totalPropertyNet += prop.netIncomeLoss || 0; // Add pre-calculated net income/loss
        });
        return totalPropertyNet;
    }

    // --- Main Tax Calculation Function (updated) ---
    function calculateTax() {
        const currentYearData = taxData[financialYearSelect.value];
        if (!currentYearData) {
            console.error("No tax data found for the selected financial year.");
            return;
        }

        let personalGrossIncome = parseFloat(grossIncomeInput.value) || 0;
        let otherIncome = parseFloat(otherIncomeInput.value) || 0;
        let workExpenses = parseFloat(workExpensesInput.value) || 0;
        let salarySacrificeSuper = parseFloat(salarySacrificeSuperInput.value) || 0;
        const hasPrivateHealthInsurance = privateHealthInsuranceSelect.value === 'yes';
        const dependents = parseInt(dependentsInput.value) || 0;
        const relationshipStatus = relationshipStatusSelect.value;
        let spouseIncome = parseFloat(spouseIncomeInput.value) || 0;
        const hasHecsDebt = hecsDebtSelect.value === 'yes';

        // Aggregate net income/loss from all properties
        const aggregatePropertyNet = getAggregatePropertyNet();

        // Determine total assessable income and total deductions
        let totalAssessableIncome = personalGrossIncome + otherIncome;
        let totalDeductions = workExpenses + salarySacrificeSuper; // Salary sacrifice reduces assessable income here

        if (aggregatePropertyNet > 0) {
            totalAssessableIncome += aggregatePropertyNet; // Property profit adds to assessable income
        } else {
            totalDeductions += Math.abs(aggregatePropertyNet); // Property loss adds to deductions
        }

        const overallTaxableIncome = Math.max(0, totalAssessableIncome - totalDeductions);

        // 1. Calculate Income Tax
        let incomeTax = 0;
        for (const bracket of currentYearData.taxRates) {
            if (overallTaxableIncome > bracket.min) {
                if (overallTaxableIncome <= bracket.max) {
                    incomeTax = bracket.base + (overallTaxableIncome - bracket.min) * bracket.rate;
                    break;
                } else {
                    incomeTax = bracket.base + (bracket.max - bracket.min) * bracket.rate;
                }
            }
        }

        // 2. Low Income Tax Offset (LITO)
        let lito = 0;
        if (overallTaxableIncome <= currentYearData.litoPhaseOutStart) {
            lito = currentYearData.litoMax;
        } else if (overallTaxableIncome > currentYearData.litoPhaseOutStart && incomeTax > 0) {
            lito = Math.max(0, currentYearData.litoMax - (overallTaxableIncome - currentYearData.litoPhaseOutStart) * currentYearData.litoPhaseOutRate);
        }
        lito = Math.min(lito, incomeTax); // LITO cannot reduce tax below $0

        const netTaxPayable = Math.max(0, incomeTax - lito);

        // 3. Calculate Medicare Levy (2%)
        const medicareLevyRate = 0.02;
        let medicareLevy = 0;

        const medicareThresholdSingle = currentYearData.medicareThresholdSingle;
        const medicareThresholdFamily = currentYearData.medicareThresholdFamilyBase + (dependents * currentYearData.medicareThresholdPerDependent);

        let incomeForMedicareLevy = overallTaxableIncome;

        if (relationshipStatus === 'single') {
            if (incomeForMedicareLevy > medicareThresholdSingle) {
                medicareLevy = incomeForMedicareLevy * medicareLevyRate;
                // Shading-in rule: if taxable income is between threshold and (threshold / 0.975)
                // The levy is capped at 10% of the amount above the threshold
                if (incomeForMedicareLevy <= (medicareThresholdSingle / (1 - medicareLevyRate))) { // Simplified shading-in upper bound for 2% rate
                   medicareLevy = Math.min(medicareLevy, (incomeForMedicareLevy - medicareThresholdSingle) * 0.10);
                }
            }
        } else { // Couple/Family
            const combinedTaxableIncome = overallTaxableIncome + spouseIncome;
             if (combinedTaxableIncome > medicareThresholdFamily) {
                 medicareLevy = overallTaxableIncome * medicareLevyRate;
             }
        }
        medicareLevy = Math.max(0, medicareLevy);

        // 4. Calculate Medicare Levy Surcharge (MLS)
        let medicareLevySurcharge = 0;
        if (!hasPrivateHealthInsurance) {
            const mlsThresholds = relationshipStatus === 'single' ? currentYearData.mlsThresholdSingle : currentYearData.mlsThresholdFamily;
            let incomeForMLS = overallTaxableIncome;
            if (relationshipStatus === 'couple') {
                incomeForMLS = overallTaxableIncome + spouseIncome;
            }

            if (incomeForMLS > mlsThresholds.base && incomeForMLS <= mlsThresholds.tier1) {
                medicareLevySurcharge = overallTaxableIncome * 0.01;
            } else if (incomeForMLS > mlsThresholds.tier1 && incomeForMLS <= mlsThresholds.tier2) {
                medicareLevySurcharge = overallTaxableIncome * 0.0125;
            } else if (incomeForMLS > mlsThresholds.tier2) {
                medicareLevySurcharge = overallTaxableIncome * 0.015;
            }
        }
        medicareLevySurcharge = Math.max(0, medicareLevySurcharge);

        const totalMedicareCharges = medicareLevy + medicareLevySurcharge;

        // 5. Compulsory HECS/HELP Repayment
        let hecsRepayment = 0;
        if (hasHecsDebt) {
            const repaymentIncome = overallTaxableIncome; // HECS uses 'repayment income', which is similar to taxable income but includes other things not in this calculator. For simplicity, we use overallTaxableIncome.
            for (const tier of currentYearData.hecsRepaymentTiers) {
                if (repaymentIncome >= tier.min) {
                    hecsRepayment = repaymentIncome * tier.rate;
                } else {
                    break; // Once below a tier, no more repayment
                }
            }
        }
        hecsRepayment = Math.round(hecsRepayment); // HECS often rounded to nearest dollar

        // 6. Calculate Superannuation Guarantee (SG)
        // SG is on 'Ordinary Time Earnings' (OTE). Gross income is used as a proxy.
        // It does not include salary sacrifice contributions or property income/loss.
        const superannuationGuarantee = personalGrossIncome * currentYearData.sgRate;


        // 7. Calculate Net Income (after Tax, Medicare, HECS/HELP)
        // This is your take-home pay from your personal income sources after deductions.
        const netIncome = personalGrossIncome + otherIncome - workExpenses - salarySacrificeSuper - netTaxPayable - totalMedicareCharges - hecsRepayment;


        // Display results
        totalAssessableIncomeSpan.textContent = formatCurrency(totalAssessableIncome);
        totalDeductionsSpan.textContent = formatCurrency(totalDeductions);
        overallTaxableIncomeSpan.textContent = formatCurrency(overallTaxableIncome);
        incomeTaxSpan.textContent = formatCurrency(incomeTax);
        litoSpan.textContent = formatCurrency(lito);
        netTaxPayableSpan.textContent = formatCurrency(netTaxPayable);
        medicareLevySpan.textContent = formatCurrency(medicareLevy);
        medicareLevySurchargeSpan.textContent = formatCurrency(medicareLevySurcharge);
        totalMedicareChargesSpan.textContent = formatCurrency(totalMedicareCharges);
        hecsRepaymentSpan.textContent = formatCurrency(hecsRepayment);
        superannuationGuaranteeSpan.textContent = formatCurrency(superannuationGuarantee);
        netIncomeSpan.textContent = formatCurrency(netIncome);
    }

    function formatCurrency(amount) {
        return `$${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }

    // --- Local Storage Functions ---
    function saveState() {
        localStorage.setItem('calculatorState', JSON.stringify({
            financialYear: financialYearSelect.value,
            grossIncome: grossIncomeInput.value,
            otherIncome: otherIncomeInput.value,
            workExpenses: workExpensesInput.value,
            salarySacrificeSuper: salarySacrificeSuperInput.value,
            privateHealthInsurance: privateHealthInsuranceSelect.value,
            dependents: dependentsInput.value,
            relationshipStatus: relationshipStatusSelect.value,
            spouseIncome: spouseIncomeInput.value,
            hecsDebt: hecsDebtSelect.value,
            properties: properties,
            nextPropertyId: nextPropertyId
        }));
    }

    function loadState() {
        const savedState = localStorage.getItem('calculatorState');
        if (savedState) {
            const state = JSON.parse(savedState);
            financialYearSelect.value = state.financialYear || '2025-26';
            grossIncomeInput.value = state.grossIncome || 80000;
            otherIncomeInput.value = state.otherIncome || 0;
            workExpensesInput.value = state.workExpenses || 1000;
            salarySacrificeSuperInput.value = state.salarySacrificeSuper || 0;
            privateHealthInsuranceSelect.value = state.privateHealthInsurance || 'yes';
            dependentsInput.value = state.dependents || 0;
            relationshipStatusSelect.value = state.relationshipStatus || 'single';
            spouseIncomeInput.value = state.spouseIncome || 0;
            hecsDebtSelect.value = state.hecsDebt || 'no';

            properties = state.properties || [];
            nextPropertyId = state.nextPropertyId || 0;

            // Re-render all loaded properties
            properties.forEach(prop => addPropertyTab(prop));

            // Restore spouse income group display
            if (relationshipStatusSelect.value === 'couple') {
                coupleIncomeGroup.style.display = 'block';
            } else {
                coupleIncomeGroup.style.display = 'none';
            }
        } else {
            // Set initial defaults if no state is saved
            financialYearSelect.value = '2025-26'; // Default to the latest
            grossIncomeInput.value = 80000;
            workExpensesInput.value = 1000;
            otherIncomeInput.value = 0;
            salarySacrificeSuperInput.value = 0;
            privateHealthInsuranceSelect.value = 'yes';
            relationshipStatusSelect.value = 'single';
            spouseIncomeInput.value = 0;
            dependentsInput.value = 0;
            hecsDebtSelect.value = 'no';
        }
    }


    // --- Event Listeners & Initial Setup ---
    financialYearSelect.addEventListener('change', () => {
        saveState(); // Save state
        calculateTax(); // Recalculate when financial year changes
    });
    personalIncomeTabButton.addEventListener('click', () => openTab('personalIncomeTab'));
    addPropertyBtn.addEventListener('click', () => addPropertyTab());

    // Listen for changes in main calculator inputs to trigger recalculation
    const mainCalculatorInputs = [
        grossIncomeInput, otherIncomeInput, workExpensesInput, salarySacrificeSuperInput,
        privateHealthInsuranceSelect, dependentsInput, relationshipStatusSelect,
        spouseIncomeInput, hecsDebtSelect
    ];
    mainCalculatorInputs.forEach(input => input.addEventListener('input', () => {
        saveState(); // Save state on any input change
        calculateTax();
    }));

    // Special handling for relationship status to show/hide spouse income
    relationshipStatusSelect.addEventListener('change', () => {
        if (relationshipStatusSelect.value === 'couple') {
            coupleIncomeGroup.style.display = 'block';
        } else {
            coupleIncomeGroup.style.display = 'none';
            spouseIncomeInput.value = 0; // Reset spouse income if going back to single
        }
        saveState(); // Save state
        calculateTax(); // Recalculate on status change
    });


    // Initial load and calculation when the page is ready
    loadState(); // Load any existing state from local storage
    openTab('personalIncomeTab'); // Open the personal income tab by default
    calculateTax(); // Perform initial calculation on page load
});
