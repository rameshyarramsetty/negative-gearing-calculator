import React, { useState, useEffect, useCallback } from 'react';

// Main App component
const App = () => {
  // --- Personal Income & Expenses ---
  const [primaryIncome, setPrimaryIncome] = useState('200000'); // Annual Taxable Income (before investment property effects)
  const [dividendsIncome, setDividendsIncome] = useState('');
  const [otherIncome, setOtherIncome] = useState('');
  const [livingExpensesPercentage, setLivingExpensesPercentage] = useState(25); // Default 25% of primary income

  // --- Primary Residence Loan & Expenses ---
  const [primaryResidence, setPrimaryResidence] = useState({
    propertyValue: '2850000', // Default property value
    outstandingLoan: '228000', // Default loan amount
    offsetAccountBalance: '228000', // Default offset account balance
    interestRate: 5.25, // Default primary residence interest rate
    loanTerm: 30,
    // New primary residence expenses
    councilTax: '', // Will default to 0.2% of property value
    homeInsurance: '800', // Flat default
    repairsMaintenance: '', // Will default to 0.1% of property value
    utilities: '3000', // Flat default
  });

  // --- Investment Properties (Array of Objects) ---
  const [investmentProperties, setInvestmentProperties] = useState([]);
  const [nextInvestmentPropertyId, setNextInvestmentPropertyId] = useState(1); // For unique keys

  // --- Calculated States (Overall Financials) ---
  const [incomeTax, setIncomeTax] = useState(0);
  const [superannuation, setSuperannuation] = useState(0);
  const [monthlyTakeHomeIncome, setMonthlyTakeHomeIncome] = useState(0);
  const [totalEstimatedMonthlyLivingExpenses, setTotalEstimatedMonthlyLivingExpenses] = useState(0); // Now includes primary residence property expenses
  const [totalMonthlyLoanRepayments, setTotalMonthlyLoanRepayments] = useState(0); // Sum of all loan repayments
  const [affordabilityVerdict, setAffordabilityVerdict] = useState('');
  const [totalEquity, setTotalEquity] = useState(0); // New state for total equity

  // --- Calculated States (Aggregated Investment Financials) ---
  const [totalAnnualInvestmentRentalIncome, setTotalAnnualInvestmentRentalIncome] = useState(0);
  const [totalAnnualInvestmentExpensesAggregated, setTotalAnnualInvestmentExpensesAggregated] = useState(0);
  const [totalNetRentalIncomeLossAggregated, setTotalNetRentalIncomeLossAggregated] = useState(0);
  const [negativeGearingTaxBenefitAggregated, setNegativeGearingTaxBenefitAggregated] = useState(0);

  const [message, setMessage] = useState('');

  // Function to format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD' }).format(amount);
  };

  // --- Initial setup for default investment properties ---
  useEffect(() => {
    const defaultPrimaryRate = parseFloat(primaryResidence.interestRate) || 0;
    const defaultInvestmentRate = (defaultPrimaryRate + 0.25).toFixed(2);

    // Calculate default council tax and insurance based on new property values for initial load
    const ip1PropertyValue = 1100000;
    const ip2PropertyValue = 1400000;

    // Set initial default values for primary residence expenses
    const prValue = parseFloat(primaryResidence.propertyValue) || 0;
    setPrimaryResidence(prev => ({
      ...prev,
      councilTax: (prValue * 0.002).toFixed(2),
      repairsMaintenance: (prValue * 0.001).toFixed(2),
    }));


    setInvestmentProperties([
      {
        id: 1,
        propertyValue: ip1PropertyValue.toString(),
        outstandingLoan: '250000',
        offsetAccountBalance: '', // Default empty
        loanTerm: 30,
        interestRate: defaultInvestmentRate,
        weeklyRentalIncome: '650', // Stored as weekly
        agentFees: '', // Will use default 5.5%
        councilTax: (ip1PropertyValue * 0.002).toFixed(2), // Default 0.2% of property value
        landTax: '', // Will be calculated
        insurance: '400',
        repairsMaintenance: (ip1PropertyValue * 0.001).toFixed(2), // Default 0.1% of property value
        depreciation: '0', // Default 0
        bodyCorporateFees: '2000',
        loanType: 'principalAndInterest', // Default loan type
      },
      {
        id: 2,
        propertyValue: ip2PropertyValue.toString(),
        outstandingLoan: '882000',
        offsetAccountBalance: '', // Default empty
        loanTerm: 30,
        interestRate: defaultInvestmentRate,
        weeklyRentalIncome: '530', // Stored as weekly
        agentFees: '', // Will use default 5.5%
        councilTax: (ip2PropertyValue * 0.002).toFixed(2), // Default 0.2% of property value
        landTax: '', // Will be calculated
        insurance: '1600',
        repairsMaintenance: (ip2PropertyValue * 0.001).toFixed(2), // Default 0.1% of property value
        depreciation: '0', // Default 0
        bodyCorporateFees: '0',
        loanType: 'principalAndInterest', // Default loan type
      },
    ]);
    setNextInvestmentPropertyId(3); // Next ID will be 3
  }, []); // Run only once on component mount

  // --- Simplified VIC Land Tax Calculation (using property value as proxy for unimproved land value) ---
  const calculateVicLandTax = useCallback((propertyValue) => {
    const value = parseFloat(propertyValue);
    if (isNaN(value) || value <= 300000) { // First $300,000 is generally exempt for general land tax
      return 0;
    }

    let landTax = 0;
    // These are simplified tiers and rates for demonstration. Actual rates vary.
    if (value <= 600000) {
      landTax = 275 + (value - 300000) * 0.002;
    } else if (value <= 1000000) {
      landTax = 875 + (value - 600000) * 0.004;
    } else if (value <= 1800000) {
      landTax = 2475 + (value - 1000000) * 0.007;
    } else if (value <= 3000000) {
      landTax = 8075 + (value - 1800000) * 0.012;
    } else { // Over $3,000,000
      landTax = 22475 + (value - 3000000) * 0.024;
    }
    return landTax;
  }, []);


  // --- Income Tax Calculation (Simplified for 2024-2025 Australian tax year, excluding Medicare Levy) ---
  const calculateIncomeTax = useCallback((taxableIncome) => {
    let tax = 0;
    if (taxableIncome <= 0) return 0;
    if (taxableIncome <= 18200) {
      tax = 0;
    } else if (taxableIncome <= 45000) {
      tax = (taxableIncome - 18200) * 0.19;
    } else if (taxableIncome <= 135000) {
      tax = 5092 + (taxableIncome - 45000) * 0.30;
    } else if (taxableIncome <= 190000) {
      tax = 32092 + (taxableIncome - 135000) * 0.37;
    } else {
      tax = 52642 + (taxableIncome - 190000) * 0.45;
    }
    return tax;
  }, []);

  // --- Superannuation Calculation (Employer Contribution) ---
  const calculateSuperannuation = useCallback((income) => {
    const superGuaranteeRate = 0.115; // 11.5% for 2024-2025 financial year
    // Assuming primaryIncome is OTE for super calculation
    return income * superGuaranteeRate;
  }, []);

  // --- Mortgage Repayment Calculation (now considers offset and loan type) ---
  const calculateMortgageRepayments = useCallback((principal, annualRate, termYears, offsetBalance = 0, loanType = 'principalAndInterest') => {
    const effectivePrincipal = Math.max(0, principal - offsetBalance); // Interest only on net loan

    if (effectivePrincipal <= 0 || annualRate < 0 || termYears <= 0) {
      return { monthly: 0, totalInterest: 0, annualInterest: 0, monthlyPrincipal: 0, monthlyInterest: 0 };
    }

    const monthlyRate = (annualRate / 100) / 12;
    const numberOfPayments = termYears * 12;

    let monthlyPayment;
    let totalInterest;
    let annualInterest;
    let monthlyInterest;
    let monthlyPrincipal;

    if (monthlyRate === 0) { // Handle 0% interest rate
        monthlyPayment = effectivePrincipal / numberOfPayments;
        totalInterest = 0;
        annualInterest = 0;
        monthlyInterest = 0;
        monthlyPrincipal = monthlyPayment;
    } else if (loanType === 'interestOnly') {
        monthlyInterest = effectivePrincipal * monthlyRate;
        monthlyPayment = monthlyInterest;
        monthlyPrincipal = 0;
        annualInterest = monthlyInterest * 12;
        totalInterest = annualInterest * termYears; // Total interest over the term
    } else { // Principal and Interest
        monthlyPayment = effectivePrincipal * (monthlyRate * Math.pow((1 + monthlyRate), numberOfPayments)) / (Math.pow((1 + monthlyRate), numberOfPayments) - 1);
        totalInterest = (monthlyPayment * numberOfPayments) - effectivePrincipal;
        annualInterest = (totalInterest / termYears); // Simplified average annual interest

        // For monthly breakdown, calculate interest on the effective principal for the first month
        monthlyInterest = effectivePrincipal * monthlyRate;
        monthlyPrincipal = monthlyPayment - monthlyInterest;
    }

    return { monthly: monthlyPayment, totalInterest: totalInterest, annualInterest: annualInterest, monthlyPrincipal: monthlyPrincipal, monthlyInterest: monthlyInterest };
  }, []);

  // --- Estimated Annual Investment Property Expenses (Deductible) ---
  const calculateAnnualInvestmentExpenses = useCallback((propertyValue, annualInterest, annualRentalIncome, agentFeesInput, councilTaxInput, landTaxInput, insuranceInput, repairsMaintenanceInput, depreciationInput, bodyCorporateFeesInput) => {
    const expenses = {};
    let total = 0;

    // Only loan interest is deductible for tax purposes
    expenses.loanInterest = annualInterest;
    total += expenses.loanInterest;

    // Use provided agent fees, default if not provided or invalid (5.5% of rental income)
    expenses.agentFees = !isNaN(parseFloat(agentFeesInput)) && parseFloat(agentFeesInput) >= 0 ? parseFloat(agentFeesInput) : (annualRentalIncome * 0.055);
    total += expenses.agentFees;

    // Use provided council tax, default if not provided or invalid (0.2% of property value)
    expenses.councilTax = !isNaN(parseFloat(councilTaxInput)) && parseFloat(councilTaxInput) >= 0 ? parseFloat(councilTaxInput) : (propertyValue * 0.002);
    total += expenses.councilTax;

    // Use provided land tax, default if not provided or invalid (calculated via calculateVicLandTax)
    expenses.landTax = !isNaN(parseFloat(landTaxInput)) && parseFloat(landTaxInput) >= 0 ? parseFloat(landTaxInput) : calculateVicLandTax(propertyValue);
    total += expenses.landTax;

    // Use provided insurance, default if not provided or invalid (2% of property value)
    expenses.landlordInsurance = !isNaN(parseFloat(insuranceInput)) && parseFloat(insuranceInput) >= 0 ? parseFloat(insuranceInput) : (propertyValue * 0.02);
    total += expenses.landlordInsurance;

    // Use provided repairs & maintenance, default if not provided or invalid (0.1% of property value)
    expenses.repairsMaintenance = !isNaN(parseFloat(repairsMaintenanceInput)) && parseFloat(repairsMaintenanceInput) >= 0 ? parseFloat(repairsMaintenanceInput) : (propertyValue * 0.001);
    total += expenses.repairsMaintenance;

    // Use provided depreciation, default if not provided or invalid (0 for properties built before 1975)
    expenses.depreciation = !isNaN(parseFloat(depreciationInput)) && parseFloat(depreciationInput) >= 0 ? parseFloat(depreciationInput) : 0;
    total += expenses.depreciation;

    expenses.bodyCorporateFees = !isNaN(parseFloat(bodyCorporateFeesInput)) && parseFloat(bodyCorporateFeesInput) >= 0 ? parseFloat(bodyCorporateFeesInput) : 4000; // Default approximate
    total += expenses.bodyCorporateFees;

    return { expenses, total };
  }, [calculateVicLandTax]);

  // --- Estimated Annual Primary Residence Expenses (Non-Deductible, for cash flow) ---
  const calculateAnnualPrimaryResidenceExpenses = useCallback((propertyValue, councilTaxInput, homeInsuranceInput, repairsMaintenanceInput, utilitiesInput) => {
    const expenses = {};
    let total = 0;

    expenses.councilTax = !isNaN(parseFloat(councilTaxInput)) && parseFloat(councilTaxInput) >= 0 ? parseFloat(councilTaxInput) : (propertyValue * 0.002);
    total += expenses.councilTax;

    expenses.homeInsurance = !isNaN(parseFloat(homeInsuranceInput)) && parseFloat(homeInsuranceInput) >= 0 ? parseFloat(homeInsuranceInput) : 800; // Flat default
    total += expenses.homeInsurance;

    expenses.repairsMaintenance = !isNaN(parseFloat(repairsMaintenanceInput)) && parseFloat(repairsMaintenanceInput) >= 0 ? parseFloat(repairsMaintenanceInput) : (propertyValue * 0.001);
    total += expenses.repairsMaintenance;

    expenses.utilities = !isNaN(parseFloat(utilitiesInput)) && parseFloat(utilitiesInput) >= 0 ? parseFloat(utilitiesInput) : 3000; // Flat default
    total += expenses.utilities;

    return { expenses, total };
  }, []);


  // --- Estimated Monthly Living Expenses (Personal + Property) ---
  const calculateEstimatedMonthlyLivingExpenses = useCallback((primaryIncome, percentage, annualPrimaryResidenceExpenses) => {
    const annualPersonalLivingExpenses = primaryIncome * (percentage / 100);
    const totalAnnualLivingExpenses = annualPersonalLivingExpenses + annualPrimaryResidenceExpenses;
    const monthlyLivingExpenses = totalAnnualLivingExpenses / 12;

    // Breakdown for display (can be customized)
    const breakdown = {
      personalGroceries: annualPersonalLivingExpenses * 0.15 / 12,
      personalUtilities: annualPersonalLivingExpenses * 0.1 / 12,
      personalTransport: annualPersonalLivingExpenses * 0.1 / 12,
      personalHealthAndPersonalCare: annualPersonalLivingExpenses * 0.05 / 12,
      personalEntertainment: annualPersonalLivingExpenses * 0.1 / 12,
      personalMiscellaneous: annualPersonalLivingExpenses * 0.5 / 12, // Remaining portion
      propertyCouncilTax: annualPrimaryResidenceExpenses * (parseFloat(primaryResidence.councilTax) || 0) / (annualPrimaryResidenceExpenses || 1) / 12, // Proportionate
      propertyHomeInsurance: annualPrimaryResidenceExpenses * (parseFloat(primaryResidence.homeInsurance) || 0) / (annualPrimaryResidenceExpenses || 1) / 12,
      propertyRepairsMaintenance: annualPrimaryResidenceExpenses * (parseFloat(primaryResidence.repairsMaintenance) || 0) / (annualPrimaryResidenceExpenses || 1) / 12,
      propertyUtilities: annualPrimaryResidenceExpenses * (parseFloat(primaryResidence.utilities) || 0) / (annualPrimaryResidenceExpenses || 1) / 12,
    };

    // Recalculate miscellaneous based on actual sum
    const sumOfKnownPersonal = breakdown.personalGroceries + breakdown.personalUtilities + breakdown.personalTransport + breakdown.personalHealthAndPersonalCare + breakdown.personalEntertainment;
    breakdown.personalMiscellaneous = (annualPersonalLivingExpenses / 12) - sumOfKnownPersonal;
    if (breakdown.personalMiscellaneous < 0) breakdown.personalMiscellaneous = 0;

    // Adjust property expense breakdown if total is 0 to avoid NaN
    if (annualPrimaryResidenceExpenses === 0) {
      breakdown.propertyCouncilTax = 0;
      breakdown.propertyHomeInsurance = 0;
      breakdown.propertyRepairsMaintenance = 0;
      breakdown.propertyUtilities = 0;
    }


    return { expenses: breakdown, total: monthlyLivingExpenses };
  }, [primaryResidence]);


  // --- Calculate Offset for Neutral Gearing ---
  const calculateNeutralGearingOffset = useCallback((ip) => {
    const ipValue = parseFloat(ip.propertyValue) || 0;
    const ipLoan = parseFloat(ip.outstandingLoan) || 0;
    const ipRate = parseFloat(ip.interestRate) || 0;
    const ipWeeklyRentalIncome = parseFloat(ip.weeklyRentalIncome) || 0;
    const ipAnnualRentalIncome = ipWeeklyRentalIncome * 52;

    // Calculate all expenses *except* loan interest.
    // We pass 0 for annualInterest to get only the non-interest related expenses.
    const { total: totalNonInterestExpenses } = calculateAnnualInvestmentExpenses(
        ipValue, 0, ipAnnualRentalIncome, ip.agentFees, ip.councilTax, ip.landTax, ip.insurance, ip.repairsMaintenance, ip.depreciation, ip.bodyCorporateFees
    );

    // The annual interest amount needed for neutral gearing (rental income - non-interest expenses)
    const targetAnnualInterestForNeutral = ipAnnualRentalIncome - totalNonInterestExpenses;

    let requiredOffset = 0;
    let message = "";

    if (ipLoan <= 0 || ipRate <= 0) {
        // Case: No loan or no interest rate
        if (targetAnnualInterestForNeutral >= 0) {
            message = "Property is already neutrally or positively geared (no loan or 0% interest).";
            requiredOffset = ipLoan; // Full offset, though not strictly needed for neutral gearing impact
        } else {
            message = "Property is negatively geared even with zero interest. Full offset recommended to minimize loss.";
            requiredOffset = ipLoan;
        }
    } else {
        // Calculate the effective principal needed to generate exactly targetAnnualInterestForNeutral
        // Annual Interest = Effective Principal * Annual Rate / 100
        // Effective Principal = (Annual Interest * 100) / Annual Rate
        const effectivePrincipalNeeded = (targetAnnualInterestForNeutral * 100) / ipRate;

        if (targetAnnualInterestForNeutral < 0) {
            // Case: Non-interest expenses are already greater than rental income.
            // Property is negatively geared even if interest is zero.
            message = "Property is negatively geared even with zero interest. A full offset will minimize the loss.";
            requiredOffset = ipLoan; // Recommend full offset to minimize negative gearing
        } else if (effectivePrincipalNeeded > ipLoan) {
            // Case: The target interest amount for neutral gearing is higher than what the full loan can generate.
            // This means the property is already positively geared (or very close to it) even with the full loan.
            message = "Property is already positively geared (or very close to it) even with zero offset.";
            requiredOffset = 0; // No offset needed to achieve neutral gearing (it's already beyond it)
        } else {
            // Case: A specific offset amount can achieve neutral gearing.
            requiredOffset = ipLoan - effectivePrincipalNeeded;
            message = `Offset balance for neutral gearing: ${formatCurrency(requiredOffset)}.`;
        }
    }

    // Ensure offset doesn't exceed loan amount and is not negative
    requiredOffset = Math.max(0, Math.min(requiredOffset, ipLoan));

    return { requiredOffset, message };
  }, [calculateAnnualInvestmentExpenses]);


  // --- Main Calculation Function for all financial aspects ---
  const performAllCalculations = useCallback(() => {
    const currentPrimaryIncome = parseFloat(primaryIncome) || 0;
    const currentDividendsIncome = parseFloat(dividendsIncome) || 0;
    const currentOtherIncome = parseFloat(otherIncome) || 0;
    const currentLivingExpensesPercentage = parseFloat(livingExpensesPercentage) || 0;

    // --- Primary Residence Loan & Expense Calculations ---
    const prValue = parseFloat(primaryResidence.propertyValue) || 0;
    const prLoan = parseFloat(primaryResidence.outstandingLoan) || 0;
    const prOffset = parseFloat(primaryResidence.offsetAccountBalance) || 0; // Get offset
    const prTerm = parseFloat(primaryResidence.loanTerm) || 0;
    const prRate = parseFloat(primaryResidence.interestRate) || 0;

    let prMonthlyRepayment = 0;
    let prMonthlyPrincipal = 0;
    let prMonthlyInterest = 0;

    if (prLoan > 0 && prTerm > 0 && prRate >= 0) {
      // Primary residence is always P&I
      const { monthly, monthlyPrincipal: mp, monthlyInterest: mi } = calculateMortgageRepayments(prLoan, prRate, prTerm, prOffset, 'principalAndInterest');
      prMonthlyRepayment = monthly;
      prMonthlyPrincipal = mp;
      prMonthlyInterest = mi;
    }
    // Calculate primary residence equity
    const prEquity = Math.max(0, prValue - prLoan);

    // Calculate primary residence property expenses (for cash flow, not tax deductible)
    const { total: annualPrimaryResidencePropertyExpenses } = calculateAnnualPrimaryResidenceExpenses(
      prValue,
      primaryResidence.councilTax,
      primaryResidence.homeInsurance,
      primaryResidence.repairsMaintenance,
      primaryResidence.utilities
    );


    // Update primary residence state with calculated monthly principal and interest and equity
    setPrimaryResidence(prev => ({
      ...prev,
      monthlyRepayment: prMonthlyRepayment,
      monthlyPrincipal: prMonthlyPrincipal,
      monthlyInterest: prMonthlyInterest,
      equity: prEquity, // Store primary residence equity
      annualPropertyExpenses: annualPrimaryResidencePropertyExpenses, // Store for display/use in total living expenses
    }));


    // --- Investment Properties Calculations ---
    let aggregatedRentalIncome = 0;
    let aggregatedInvestmentExpenses = 0; // For tax purposes (deductible)
    let totalInvestmentMonthlyRepayments = 0;
    let totalInvestmentEquity = 0; // For summing investment property equity

    // Calculate base taxable income before any investment property effects
    const baseTaxableIncome = currentPrimaryIncome + currentDividendsIncome + currentOtherIncome;
    const baseTax = calculateIncomeTax(baseTaxableIncome);


    const updatedInvestmentProperties = investmentProperties.map(ip => {
        const ipValue = parseFloat(ip.propertyValue) || 0;
        const ipLoan = parseFloat(ip.outstandingLoan) || 0;
        const ipOffset = parseFloat(ip.offsetAccountBalance) || 0; // Get offset
        const ipTerm = parseFloat(ip.loanTerm) || 0;
        const ipRate = parseFloat(ip.interestRate) || 0;
        const ipWeeklyRentalIncome = parseFloat(ip.weeklyRentalIncome) || 0;
        const ipAnnualRentalIncome = ipWeeklyRentalIncome * 52; // Convert weekly to annual

        const ipAgentFees = ip.agentFees; // Pass original string to allow default calculation
        const ipCouncilTax = ip.councilTax;
        const ipLandTax = ip.landTax;
        const ipInsurance = ip.insurance;
        const ipRepairsMaintenance = ip.repairsMaintenance;
        const ipDepreciation = ip.depreciation;
        const ipBodyCorporateFees = ip.bodyCorporateFees;

        let ipAnnualInterest = 0;
        let ipMonthlyRepayment = 0;
        let ipMonthlyPrincipal = 0;
        let ipMonthlyInterest = 0;

        if (ipLoan > 0 && ipTerm > 0 && ipRate >= 0) {
            const { monthly, annualInterest, monthlyPrincipal: mp, monthlyInterest: mi } = calculateMortgageRepayments(ipLoan, ipRate, ipTerm, ipOffset, ip.loanType);
            ipMonthlyRepayment = monthly;
            ipAnnualInterest = annualInterest;
            ipMonthlyPrincipal = mp;
            ipMonthlyInterest = mi;
        }

        // Calculate expenses for tax purposes (only deductible expenses)
        const { expenses: investExpBreakdown, total: totalDeductibleInvestExp } = calculateAnnualInvestmentExpenses(
            ipValue, ipAnnualInterest, ipAnnualRentalIncome, ipAgentFees, ipCouncilTax, ipLandTax, ipInsurance, ipRepairsMaintenance, ipDepreciation, ipBodyCorporateFees
        );

        const ipNetRentalIncome = ipAnnualRentalIncome - totalDeductibleInvestExp;

        // Calculate individual property tax impact
        const taxableIncomeWithThisProperty = baseTaxableIncome + ipNetRentalIncome;
        const taxWithThisProperty = calculateIncomeTax(taxableIncomeWithThisProperty);
        const individualPropertyTaxImpact = baseTax - taxWithThisProperty; // Positive for benefit, negative for additional tax

        let individualTaxMessage = "";
        if (individualPropertyTaxImpact > 0) {
            individualTaxMessage = `Tax reduced by: ${formatCurrency(individualPropertyTaxImpact)}`;
        } else if (individualPropertyTaxImpact < 0) {
            individualTaxMessage = `Additional tax payable: ${formatCurrency(Math.abs(individualPropertyTaxImpact))}`;
        } else {
            individualTaxMessage = "No direct tax impact from this property (neutrally geared for tax purposes).";
        }

        // Calculate individual property equity
        const ipEquity = Math.max(0, ipValue - ipLoan);
        totalInvestmentEquity += ipEquity;


        aggregatedRentalIncome += ipAnnualRentalIncome; // Use annual here
        aggregatedInvestmentExpenses += totalDeductibleInvestExp; // Use deductible expenses for aggregated
        totalInvestmentMonthlyRepayments += ipMonthlyRepayment;

        // Calculate neutral gearing offset for this specific property
        const { requiredOffset: neutralOffset, message: neutralMessage } = calculateNeutralGearingOffset(ip);


        return {
            ...ip,
            annualRentalIncome: ipAnnualRentalIncome, // Store annual for display/internal use
            annualInterest: ipAnnualInterest,
            monthlyRepayment: ipMonthlyRepayment,
            monthlyPrincipal: ipMonthlyPrincipal, // Store monthly principal
            monthlyInterest: ipMonthlyInterest, // Store monthly interest
            annualExpensesBreakdown: investExpBreakdown,
            totalAnnualExpenses: totalDeductibleInvestExp, // This is total *deductible* expenses for tax impact
            netRentalIncome: ipNetRentalIncome,
            neutralGearingInfo: { requiredOffset: neutralOffset, message: neutralMessage }, // New info
            individualTaxImpact: individualPropertyTaxImpact, // Store individual tax impact
            individualTaxMessage: individualTaxMessage, // Store individual tax message
            equity: ipEquity, // Store individual property equity
        };
    });
    setInvestmentProperties(updatedInvestmentProperties); // Update state with calculated values

    setTotalAnnualInvestmentRentalIncome(aggregatedRentalIncome);
    setTotalAnnualInvestmentExpensesAggregated(aggregatedInvestmentExpenses);
    const currentAggregatedNetRentalIncomeLoss = aggregatedRentalIncome - aggregatedInvestmentExpenses;
    setTotalNetRentalIncomeLossAggregated(currentAggregatedNetRentalIncomeLoss);


    // --- Overall Income Tax Calculation ---
    // This calculation already considers the aggregated net rental income/loss
    const finalTaxableIncome = baseTaxableIncome + currentAggregatedNetRentalIncomeLoss;
    const finalAnnualTax = calculateIncomeTax(finalTaxableIncome);
    setIncomeTax(finalAnnualTax);

    const currentNegativeGearingTaxBenefit = baseTax - finalAnnualTax;
    setNegativeGearingTaxBenefitAggregated(currentNegativeGearingTaxBenefit);

    // --- Superannuation Calculation ---
    const annualSuper = calculateSuperannuation(currentPrimaryIncome); // Super is on OTE, not affected by other income/losses
    setSuperannuation(annualSuper);

    // --- Monthly Take-Home Income ---
    const monthlyTakeHome = (finalTaxableIncome - finalAnnualTax) / 12;
    setMonthlyTakeHomeIncome(monthlyTakeHome);

    // --- Living Expenses (Personal + Primary Residence Property Expenses) ---
    const { expenses: livingExpBreakdown, total: totalLivingExp } = calculateEstimatedMonthlyLivingExpenses(currentPrimaryIncome, currentLivingExpensesPercentage, annualPrimaryResidencePropertyExpenses);
    setTotalEstimatedMonthlyLivingExpenses(totalLivingExp);

    // --- Total Monthly Loan Repayments (Primary + All Investments) ---
    const totalAllMonthlyLoanRepayments = prMonthlyRepayment + totalInvestmentMonthlyRepayments;
    setTotalMonthlyLoanRepayments(totalAllMonthlyLoanRepayments);

    // --- Total Equity Calculation ---
    setTotalEquity(prEquity + totalInvestmentEquity);

    // --- Affordability Check ---
    if (monthlyTakeHome > 0 && totalAllMonthlyLoanRepayments >= 0 && totalLivingExp >= 0) { // Allow 0 for expenses/repayments
      const totalMonthlyOutgoings = totalAllMonthlyLoanRepayments + totalLivingExp;
      if (monthlyTakeHome >= totalMonthlyOutgoings) {
        setAffordabilityVerdict(`Based on these estimates, you should be able to meet your monthly loan repayments and living expenses. Remaining: ${formatCurrency(monthlyTakeHome - totalMonthlyOutgoings)}`);
      } else {
        setAffordabilityVerdict(`Based on these estimates, your monthly expenses (${formatCurrency(totalMonthlyOutgoings)}) exceed your estimated monthly take-home income (${formatCurrency(monthlyTakeHome)}). You may struggle to meet your loan repayments and living costs. Shortfall: ${formatCurrency(totalMonthlyOutgoings - monthlyTakeHome)}`);
      }
    } else {
      setAffordabilityVerdict('Enter all required financial details to assess affordability.');
    }

    setMessage(''); // Clear general message if calculations are running
  }, [primaryIncome, dividendsIncome, otherIncome, livingExpensesPercentage, primaryResidence, investmentProperties, calculateIncomeTax, calculateSuperannuation, calculateMortgageRepayments, calculateAnnualInvestmentExpenses, calculateEstimatedMonthlyLivingExpenses, calculateNeutralGearingOffset, calculateAnnualPrimaryResidenceExpenses]);

  // Recalculate on input change with debounce
  useEffect(() => {
    const handler = setTimeout(() => {
      performAllCalculations();
    }, 300); // Debounce input for 300ms
    return () => clearTimeout(handler);
  }, [primaryIncome, dividendsIncome, otherIncome, livingExpensesPercentage, primaryResidence, investmentProperties, performAllCalculations]);

  // Handler to add a new investment property
  const addInvestmentProperty = () => {
    const defaultPrimaryRate = parseFloat(primaryResidence.interestRate) || 0;
    const defaultInvestmentRate = (defaultPrimaryRate + 0.25).toFixed(2); // 0.25% higher

    setInvestmentProperties(prevProps => [
      ...prevProps,
      {
        id: nextInvestmentPropertyId,
        propertyValue: '',
        outstandingLoan: '',
        offsetAccountBalance: '', // New field
        loanTerm: 30,
        interestRate: defaultInvestmentRate,
        weeklyRentalIncome: '', // New IPs start with empty weekly rent
        agentFees: '',
        councilTax: '', // Will default to 0.2% of property value
        landTax: '',
        insurance: '', // Will default to 2% of property value
        repairsMaintenance: '', // Will default to 0.1% of property value
        depreciation: '0', // Default 0
        bodyCorporateFees: '',
        loanType: 'principalAndInterest', // Default loan type for new properties
      }
    ]);
    setNextInvestmentPropertyId(prevId => prevId + 1);
  };

  // Handler to remove an investment property
  const removeInvestmentProperty = (idToRemove) => {
    setInvestmentProperties(prevProps => prevProps.filter(prop => prop.id !== idToRemove));
  };

  // Handler for changes in individual investment property inputs
  const handleInvestmentPropertyChange = useCallback((id, field, value) => {
    setInvestmentProperties(prevProps => prevProps.map(prop => {
      if (prop.id === id) {
        let updatedProp = { ...prop, [field]: value };

        // Auto-default loan amount, council tax, insurance, land tax, repairs if propertyValue changes
        if (field === 'propertyValue') {
          const price = parseFloat(value);
          if (!isNaN(price) && price > 0) {
            updatedProp.outstandingLoan = (price * 0.8).toFixed(0); // Default loan for this specific IP to 80%
            // Apply new percentage-based defaults if not manually overridden
            if (prop.councilTax === '') updatedProp.councilTax = (price * 0.002).toFixed(2); // Corrected to 0.2%
            if (prop.insurance === '') updatedProp.insurance = (price * 0.02).toFixed(2);
            if (prop.landTax === '') updatedProp.landTax = calculateVicLandTax(price).toFixed(2);
            if (prop.repairsMaintenance === '') updatedProp.repairsMaintenance = (price * 0.001).toFixed(2); // Corrected to 0.1%
          } else {
            updatedProp.outstandingLoan = '';
            // Clear defaults if property value is invalid
            if (prop.councilTax === '') updatedProp.councilTax = '';
            if (prop.insurance === '') updatedProp.insurance = '';
            if (prop.landTax === '') updatedProp.landTax = '';
            if (prop.repairsMaintenance === '') updatedProp.repairsMaintenance = '';
          }
        }
        return updatedProp;
      }
      return prop;y
    }));
  }, [calculateVicLandTax]);

  // Handler for changes in primary residence inputs
  const handlePrimaryResidenceChange = useCallback((field, value) => {
    setPrimaryResidence(prev => {
      const updatedPr = { ...prev, [field]: value };
      // Auto-default property-based expenses if propertyValue changes and they are not manually set
      if (field === 'propertyValue') {
        const price = parseFloat(value);
        if (!isNaN(price) && price > 0) {
          if (prev.councilTax === '') updatedPr.councilTax = (price * 0.002).toFixed(2);
          if (prev.repairsMaintenance === '') updatedPr.repairsMaintenance = (price * 0.001).toFixed(2);
        } else {
          if (prev.councilTax === '') updatedPr.councilTax = '';
          if (prev.repairsMaintenance === '') updatedPr.repairsMaintenance = '';
        }
      }
      return updatedPr;
    });
  }, []);


  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 sm:p-6 lg:p-8 font-inter text-gray-800">
      <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-2xl overflow-hidden">
        <header className="bg-indigo-600 text-white p-6 sm:p-8 rounded-t-xl">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-center mb-2">
            Australian Financial Snapshot
          </h1>
          <p className="text-center text-indigo-100 text-sm sm:text-base">
            Manage Your Income, Loans & Investment Properties
          </p>
        </header>

        <main className="p-6 sm:p-8 space-y-8">
          {/* Your Income Section */}
          <section className="bg-gray-50 p-6 rounded-lg shadow-md">
            <h2 className="text-2xl font-bold text-indigo-700 mb-6 border-b pb-3 border-indigo-200">Your Income Details</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="primaryIncome" className="block text-lg font-semibold text-gray-700 mb-2">
                  Annual Primary Income (e.g., Salary/Wages) ($AUD)
                </label>
                <input
                  type="number"
                  id="primaryIncome"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition duration-200 ease-in-out text-lg"
                  placeholder="e.g., 200000"
                  value={primaryIncome}
                  onChange={(e) => setPrimaryIncome(e.target.value)}
                  min="0"
                />
              </div>
              <div>
                <label htmlFor="dividendsIncome" className="block text-lg font-semibold text-gray-700 mb-2">
                  Annual Dividends Income ($AUD)
                </label>
                <input
                  type="number"
                  id="dividendsIncome"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition duration-200 ease-in-out text-lg"
                  placeholder="e.g., 5000"
                  value={dividendsIncome}
                  onChange={(e) => setDividendsIncome(e.target.value)}
                  min="0"
                />
              </div>
              <div>
                <label htmlFor="otherIncome" className="block text-lg font-semibold text-gray-700 mb-2">
                  Other Annual Income ($AUD)
                </label>
                <input
                  type="number"
                  id="otherIncome"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition duration-200 ease-in-out text-lg"
                  placeholder="e.g., 2000"
                  value={otherIncome}
                  onChange={(e) => setOtherIncome(e.target.value)}
                  min="0"
                />
              </div>
              <div>
                <label htmlFor="livingExpensesPercentage" className="block text-lg font-semibold text-gray-700 mb-2">
                  Personal Living Expenses (% of Primary Income)
                </label>
                <input
                  type="number"
                  id="livingExpensesPercentage"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition duration-200 ease-in-out text-lg"
                  placeholder="e.g., 25"
                  value={livingExpensesPercentage}
                  onChange={(e) => setLivingExpensesPercentage(e.target.value)}
                  min="0"
                  max="100"
                />
              </div>
            </div>
          </section>

          {/* Primary Residence Loan & Expenses Section */}
          <section className="bg-gray-50 p-6 rounded-lg shadow-md">
            <h2 className="text-2xl font-bold text-indigo-700 mb-6 border-b pb-3 border-indigo-200">Your Primary Residence Details</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="prPropertyValue" className="block text-lg font-semibold text-gray-700 mb-2">
                  Property Value ($AUD)
                </label>
                <input
                  type="number"
                  id="prPropertyValue"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition duration-200 ease-in-out text-lg"
                  placeholder="e.g., 800000"
                  value={primaryResidence.propertyValue}
                  onChange={(e) => handlePrimaryResidenceChange('propertyValue', e.target.value)}
                  min="0"
                />
              </div>
              <div>
                <label htmlFor="prOutstandingLoan" className="block text-lg font-semibold text-gray-700 mb-2">
                  Outstanding Loan ($AUD)
                </label>
                <input
                  type="number"
                  id="prOutstandingLoan"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition duration-200 ease-in-out text-lg"
                  placeholder="e.g., 500000"
                  value={primaryResidence.outstandingLoan}
                  onChange={(e) => handlePrimaryResidenceChange('outstandingLoan', e.target.value)}
                  min="0"
                />
              </div>
              <div>
                <label htmlFor="prOffsetAccountBalance" className="block text-lg font-semibold text-gray-700 mb-2">
                  Offset Account Balance ($AUD)
                </label>
                <input
                  type="number"
                  id="prOffsetAccountBalance"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition duration-200 ease-in-out text-lg"
                  placeholder="e.g., 50000"
                  value={primaryResidence.offsetAccountBalance}
                  onChange={(e) => handlePrimaryResidenceChange('offsetAccountBalance', e.target.value)}
                  min="0"
                />
              </div>
              <div>
                <label htmlFor="prLoanTerm" className="block text-lg font-semibold text-gray-700 mb-2">
                  Remaining Loan Term (Years)
                </label>
                <input
                  type="number"
                  id="prLoanTerm"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition duration-200 ease-in-out text-lg"
                  placeholder="e.g., 25"
                  value={primaryResidence.loanTerm}
                  onChange={(e) => handlePrimaryResidenceChange('loanTerm', e.target.value)}
                  min="1"
                  max="50"
                />
              </div>
              <div>
                <label htmlFor="prInterestRate" className="block text-lg font-semibold text-gray-700 mb-2">
                  Interest Rate (% p.a.)
                </label>
                <input
                  type="number"
                  id="prInterestRate"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition duration-200 ease-in-out text-lg"
                  placeholder="e.g., 6.00"
                  value={primaryResidence.interestRate}
                  onChange={(e) => handlePrimaryResidenceChange('interestRate', e.target.value)}
                  step="0.01"
                  min="0"
                />
              </div>
              {primaryResidence.monthlyRepayment > 0 && (
                <>
                  <div>
                    <label className="block text-lg font-semibold text-gray-700 mb-2">
                      Monthly Principal Payment:
                    </label>
                    <span className="block p-3 bg-gray-100 rounded-lg text-lg font-medium">
                      {formatCurrency(primaryResidence.monthlyPrincipal)}
                    </span>
                  </div>
                  <div>
                    <label className="block text-lg font-semibold text-gray-700 mb-2">
                      Monthly Interest Payment:
                    </label>
                    <span className="block p-3 bg-gray-100 rounded-lg text-lg font-medium">
                      {formatCurrency(primaryResidence.monthlyInterest)}
                    </span>
                  </div>
                </>
              )}
              {primaryResidence.equity !== undefined && (
                <div>
                  <label className="block text-lg font-semibold text-gray-700 mb-2">
                    Estimated Equity:
                  </label>
                  <span className="block p-3 bg-gray-100 rounded-lg text-lg font-medium">
                    {formatCurrency(primaryResidence.equity)}
                  </span>
                </div>
              )}
            </div>
            {/* Primary Residence Annual Expenses */}
            <div className="mt-6 border-t pt-6 border-indigo-200">
                <h3 className="text-xl font-bold text-indigo-700 mb-4">Annual Primary Residence Expenses</h3>
                <p className="text-sm text-gray-600 mb-4">These expenses are for your primary home and are not tax-deductible.</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label htmlFor="prCouncilTax" className="block text-lg font-semibold text-gray-700 mb-2">
                            Annual Council Tax ($AUD)
                        </label>
                        <input
                            type="number"
                            id="prCouncilTax"
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition duration-200 ease-in-out text-lg"
                            placeholder="e.g., 2000 (0.2% of value)"
                            value={primaryResidence.councilTax}
                            onChange={(e) => handlePrimaryResidenceChange('councilTax', e.target.value)}
                            min="0"
                        />
                    </div>
                    <div>
                        <label htmlFor="prHomeInsurance" className="block text-lg font-semibold text-gray-700 mb-2">
                            Annual Home Insurance ($AUD)
                        </label>
                        <input
                            type="number"
                            id="prHomeInsurance"
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition duration-200 ease-in-out text-lg"
                            placeholder="e.g., 800"
                            value={primaryResidence.homeInsurance}
                            onChange={(e) => handlePrimaryResidenceChange('homeInsurance', e.target.value)}
                            min="0"
                        />
                    </div>
                    <div>
                        <label htmlFor="prRepairsMaintenance" className="block text-lg font-semibold text-gray-700 mb-2">
                            Annual Repairs & Maintenance ($AUD)
                        </label>
                        <input
                            type="number"
                            id="prRepairsMaintenance"
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition duration-200 ease-in-out text-lg"
                            placeholder="e.g., 1000 (0.1% of value)"
                            value={primaryResidence.repairsMaintenance}
                            onChange={(e) => handlePrimaryResidenceChange('repairsMaintenance', e.target.value)}
                            min="0"
                        />
                    </div>
                    <div>
                        <label htmlFor="prUtilities" className="block text-lg font-semibold text-gray-700 mb-2">
                            Annual Utilities ($AUD)
                        </label>
                        <input
                            type="number"
                            id="prUtilities"
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition duration-200 ease-in-out text-lg"
                            placeholder="e.g., 3000"
                            value={primaryResidence.utilities}
                            onChange={(e) => handlePrimaryResidenceChange('utilities', e.target.value)}
                            min="0"
                        />
                    </div>
                </div>
                {primaryResidence.annualPropertyExpenses !== undefined && (
                    <div className="mt-4 p-3 bg-gray-100 rounded-lg text-lg font-medium flex justify-between items-center">
                        <span>Total Annual Primary Residence Property Expenses:</span>
                        <span>{formatCurrency(primaryResidence.annualPropertyExpenses)}</span>
                    </div>
                )}
            </div>
          </section>

          {/* Investment Properties Section */}
          <section className="bg-gray-50 p-6 rounded-lg shadow-md">
            <h2 className="text-2xl font-bold text-indigo-700 mb-6 border-b pb-3 border-indigo-200">Your Investment Properties</h2>

            {investmentProperties.map((prop, index) => (
              <div key={prop.id} className="border border-gray-200 p-4 rounded-lg mb-4 bg-white shadow-sm">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xl font-semibold text-gray-800">Investment Property {index + 1}</h3>
                  <button
                    onClick={() => removeInvestmentProperty(prop.id)}
                    className="bg-red-500 text-white p-2 rounded-lg hover:bg-red-600 transition duration-200 ease-in-out text-sm"
                  >
                    Remove
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor={`ip-value-${prop.id}`} className="block text-sm font-medium text-gray-700 mb-1">Property Value ($AUD)</label>
                    <input
                      type="number"
                      id={`ip-value-${prop.id}`}
                      className="w-full p-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-indigo-500 text-base"
                      value={prop.propertyValue}
                      onChange={(e) => handleInvestmentPropertyChange(prop.id, 'propertyValue', e.target.value)}
                      min="0"
                    />
                  </div>
                  <div>
                    <label htmlFor={`ip-loan-${prop.id}`} className="block text-sm font-medium text-gray-700 mb-1">Outstanding Loan ($AUD)</label>
                    <input
                      type="number"
                      id={`ip-loan-${prop.id}`}
                      className="w-full p-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-indigo-500 text-base"
                      value={prop.outstandingLoan}
                      onChange={(e) => handleInvestmentPropertyChange(prop.id, 'outstandingLoan', e.target.value)}
                      min="0"
                    />
                  </div>
                  <div>
                    <label htmlFor={`ip-offset-${prop.id}`} className="block text-sm font-medium text-gray-700 mb-1">Offset Account Balance ($AUD)</label>
                    <input
                      type="number"
                      id={`ip-offset-${prop.id}`}
                      className="w-full p-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-indigo-500 text-base"
                      value={prop.offsetAccountBalance}
                      onChange={(e) => handleInvestmentPropertyChange(prop.id, 'offsetAccountBalance', e.target.value)}
                      min="0"
                    />
                  </div>
                  <div>
                    <label htmlFor={`ip-term-${prop.id}`} className="block text-sm font-medium text-gray-700 mb-1">Loan Term (Years)</label>
                    <input
                      type="number"
                      id={`ip-term-${prop.id}`}
                      className="w-full p-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-indigo-500 text-base"
                      value={prop.loanTerm}
                      onChange={(e) => handleInvestmentPropertyChange(prop.id, 'loanTerm', e.target.value)}
                      min="1"
                      max="50"
                    />
                  </div>
                  <div>
                    <label htmlFor={`ip-rate-${prop.id}`} className="block text-sm font-medium text-gray-700 mb-1">Interest Rate (% p.a.)</label>
                    <input
                      type="number"
                      id={`ip-rate-${prop.id}`}
                      className="w-full p-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-indigo-500 text-base"
                      value={prop.interestRate}
                      onChange={(e) => handleInvestmentPropertyChange(prop.id, 'interestRate', e.target.value)}
                      step="0.01"
                      min="0"
                    />
                  </div>
                  <div>
                    <label htmlFor={`ip-loan-type-${prop.id}`} className="block text-sm font-medium text-gray-700 mb-1">Loan Type</label>
                    <select
                      id={`ip-loan-type-${prop.id}`}
                      className="w-full p-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-indigo-500 text-base"
                      value={prop.loanType}
                      onChange={(e) => handleInvestmentPropertyChange(prop.id, 'loanType', e.target.value)}
                    >
                      <option value="principalAndInterest">Principal & Interest</option>
                      <option value="interestOnly">Interest Only</option>
                    </select>
                  </div>
                  <div className="md:col-span-2">
                    <label htmlFor={`ip-weekly-rental-${prop.id}`} className="block text-sm font-medium text-gray-700 mb-1">Estimated Weekly Rental Income ($AUD)</label>
                    <input
                      type="number"
                      id={`ip-weekly-rental-${prop.id}`}
                      className="w-full p-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-indigo-500 text-base"
                      placeholder="e.g., 500"
                      value={prop.weeklyRentalIncome}
                      onChange={(e) => handleInvestmentPropertyChange(prop.id, 'weeklyRentalIncome', e.target.value)}
                      min="0"
                    />
                  </div>
                  {/* Monthly Principal and Interest for Investment Property */}
                  {prop.monthlyRepayment > 0 && (
                      <>
                          <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Monthly Principal Payment:</label>
                              <span className="block p-2 bg-gray-100 rounded-lg text-base font-medium">
                                  {formatCurrency(prop.monthlyPrincipal)}
                              </span>
                          </div>
                          <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Monthly Interest Payment:</label>
                              <span className="block p-2 bg-gray-100 rounded-lg text-base font-medium">
                                  {formatCurrency(prop.monthlyInterest)}
                              </span>
                          </div>
                      </>
                  )}
                  {/* Investment Property Expenses */}
                  <div className="md:col-span-2 mt-4 border-t pt-4 border-gray-200">
                    <h4 className="text-base font-semibold text-gray-700 mb-2">Annual Expenses for this Property:</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label htmlFor={`ip-agent-fees-${prop.id}`} className="block text-sm font-medium text-gray-700 mb-1">Agent Fees ($AUD)</label>
                        <input type="number" id={`ip-agent-fees-${prop.id}`} className="w-full p-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-indigo-500 text-base" value={prop.agentFees} onChange={(e) => handleInvestmentPropertyChange(prop.id, 'agentFees', e.target.value)} placeholder="e.g., 5.5% of rent" min="0" />
                      </div>
                      <div>
                        <label htmlFor={`ip-council-tax-${prop.id}`} className="block text-sm font-medium text-gray-700 mb-1">Council Tax ($AUD)</label>
                        <input type="number" id={`ip-council-tax-${prop.id}`} className="w-full p-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-indigo-500 text-base" value={prop.councilTax} onChange={(e) => handleInvestmentPropertyChange(prop.id, 'councilTax', e.target.value)} placeholder="e.g., 0.2% of value" min="0" />
                      </div>
                      <div>
                        <label htmlFor={`ip-land-tax-${prop.id}`} className="block text-sm font-medium text-gray-700 mb-1">Land Tax ($AUD)</label>
                        <input type="number" id={`ip-land-tax-${prop.id}`} className="w-full p-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-indigo-500 text-base" value={prop.landTax} onChange={(e) => handleInvestmentPropertyChange(prop.id, 'landTax', e.target.value)} placeholder="Calculated or enter manually" min="0" />
                      </div>
                      <div>
                        <label htmlFor={`ip-insurance-${prop.id}`} className="block text-sm font-medium text-gray-700 mb-1">Insurance ($AUD)</label>
                        <input type="number" id={`ip-insurance-${prop.id}`} className="w-full p-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-indigo-500 text-base" value={prop.insurance} onChange={(e) => handleInvestmentPropertyChange(prop.id, 'insurance', e.target.value)} placeholder="e.g., 2% of value" min="0" />
                      </div>
                      <div>
                        <label htmlFor={`ip-repairs-${prop.id}`} className="block text-sm font-medium text-gray-700 mb-1">Repairs & Maintenance ($AUD)</label>
                        <input type="number" id={`ip-repairs-${prop.id}`} className="w-full p-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-indigo-500 text-base" value={prop.repairsMaintenance} onChange={(e) => handleInvestmentPropertyChange(prop.id, 'repairsMaintenance', e.target.value)} placeholder="e.g., 0.1% of value" min="0" />
                      </div>
                      <div>
                        <label htmlFor={`ip-depreciation-${prop.id}`} className="block text-sm font-medium text-gray-700 mb-1">Depreciation ($AUD)</label>
                        <input type="number" id={`ip-depreciation-${prop.id}`} className="w-full p-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-indigo-500 text-base" value={prop.depreciation} onChange={(e) => handleInvestmentPropertyChange(prop.id, 'depreciation', e.target.value)} placeholder="e.g., 0" min="0" />
                      </div>
                      <div>
                        <label htmlFor={`ip-body-corporate-${prop.id}`} className="block text-sm font-medium text-gray-700 mb-1">Body Corporate / Strata Fees ($AUD)</label>
                        <input type="number" id={`ip-body-corporate-${prop.id}`} className="w-full p-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-indigo-500 text-base" value={prop.bodyCorporateFees} onChange={(e) => handleInvestmentPropertyChange(prop.id, 'bodyCorporateFees', e.target.value)} placeholder="e.g., 4000 (annual)" min="0" />
                      </div>
                    </div>
                  </div>
                  {prop.totalAnnualExpenses > 0 && (
                      <div className="md:col-span-2 mt-4 p-3 bg-gray-100 rounded-md">
                          <h4 className="text-base font-semibold text-gray-700 mb-2">Annual Expenses Breakdown:</h4>
                          {Object.entries(prop.annualExpensesBreakdown).map(([key, value]) => (
                              <div key={key} className="flex justify-between items-center text-xs text-gray-600 ml-2">
                                  <span>{key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}:</span>
                                  <span>{formatCurrency(value)}</span>
                              </div>
                          ))}
                          <div className="flex justify-between items-center font-bold text-gray-800 pt-2 border-t border-gray-300 mt-2">
                              <span>Total Annual Deductible Expenses for Property {index + 1}:</span>
                              <span>{formatCurrency(prop.totalAnnualExpenses)}</span>
                          </div>
                      </div>
                  )}
                  {/* Per-Property Income/Expense Summary */}
                  <div className="md:col-span-2 mt-4 p-3 bg-green-50 rounded-md border border-green-200">
                      <h4 className="text-base font-semibold text-green-700 mb-2">Property {index + 1} Annual Summary:</h4>
                      <div className="flex justify-between items-center text-sm text-gray-700">
                          <span>Annual Rental Income:</span>
                          <span className="font-bold">{formatCurrency(prop.annualRentalIncome)}</span>
                      </div>
                      <div className="flex justify-between items-center text-sm text-gray-700">
                          <span>Total Annual Deductible Expenses:</span>
                          <span className="font-bold">{formatCurrency(prop.totalAnnualExpenses)}</span>
                      </div>
                      <div className="flex justify-between items-center mt-2 font-bold">
                          <span>Net Rental Income/Loss (for Tax):</span>
                          <span className={`text-lg ${prop.netRentalIncome < 0 ? 'text-red-600' : 'text-green-700'}`}>
                              {formatCurrency(prop.netRentalIncome)} ({prop.netRentalIncome < 0 ? 'Negative' : 'Positive'} Gearing)
                          </span>
                      </div>
                      {prop.equity !== undefined && (
                        <div className="flex justify-between items-center text-sm text-gray-700 mt-2">
                          <span>Estimated Equity:</span>
                          <span className="font-bold">{formatCurrency(prop.equity)}</span>
                        </div>
                      )}
                  </div>
                  {prop.neutralGearingInfo && (
                      <div className="md:col-span-2 mt-4 p-3 bg-blue-50 rounded-md border border-blue-200">
                          <h4 className="text-base font-semibold text-blue-700 mb-2">Neutral Gearing Offset Recommendation:</h4>
                          <p className="text-sm text-gray-700">
                              {prop.neutralGearingInfo.message}
                          </p>
                      </div>
                  )}
                  {prop.individualTaxMessage && (
                      <div className={`md:col-span-2 mt-4 p-3 rounded-md border
                          ${prop.individualTaxImpact > 0 ? 'bg-green-100 border-green-300' : 'bg-red-100 border-red-300'}`}>
                          <h4 className="text-base font-semibold text-gray-700 mb-2">Individual Property Tax Impact:</h4>
                          <p className={`text-sm font-bold ${prop.individualTaxImpact > 0 ? 'text-green-800' : 'text-red-800'}`}>
                              {prop.individualTaxMessage}
                          </p>
                      </div>
                  )}
                </div>
              </div>
            ))}
            <button
              onClick={addInvestmentProperty}
              className="w-full bg-indigo-600 text-white p-3 rounded-lg hover:bg-indigo-700 transition duration-200 ease-in-out text-lg font-semibold shadow-md"
            >
              + Add Investment Property
            </button>
          </section>

          {/* Results Section */}
          <section className="bg-indigo-50 p-6 sm:p-8 rounded-lg shadow-inner">
            <h2 className="text-2xl font-bold text-indigo-700 mb-4 text-center">Your Financial Summary</h2>

            {/* Overall Income & Tax */}
            <div className="space-y-4 mb-6">
              <h3 className="text-xl font-semibold text-indigo-600 border-b pb-2 border-indigo-200">Annual Income & Tax Overview</h3>
              <div className="flex justify-between items-center">
                <span className="text-lg font-medium text-gray-700">Estimated Annual Income Tax:</span>
                <span className="text-xl font-bold text-red-600">{formatCurrency(incomeTax)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-lg font-medium text-gray-700">Estimated Annual Superannuation (Employer Contribution):</span>
                <span className="text-xl font-bold text-green-600">{formatCurrency(superannuation)}</span>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                <span className="font-semibold">Note on Income Tax:</span> This is a simplified estimate based on Australian resident tax rates for the 2024-2025 financial year and does not include the 2% Medicare Levy or any tax offsets. Your actual tax payable may differ, especially with investment property income/losses.
              </p>
              <p className="text-xs text-gray-500">
                <span className="font-semibold">Note on Superannuation:</span> This is an estimate of the Superannuation Guarantee Contribution (11.5% for 2024-2025) your employer would typically pay on your Ordinary Time Earnings (OTE).
              </p>
            </div>

            {/* Aggregated Investment Property Financials */}
            {investmentProperties.length > 0 && (
                <div className="space-y-4 mb-6 bg-purple-50 p-6 rounded-lg shadow-inner">
                    <h3 className="text-xl font-semibold text-purple-700 mb-4 border-b pb-2 border-purple-200">Total Investment Property Financials (Annual)</h3>
                    <div className="flex justify-between items-center">
                        <span className="text-lg font-medium text-gray-700">Total Estimated Annual Rental Income:</span>
                        <span className="text-xl font-bold text-green-700">{formatCurrency(totalAnnualInvestmentRentalIncome)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-lg font-medium text-gray-700">Total Estimated Annual Deductible Investment Expenses:</span>
                        <span className="text-xl font-bold text-red-600">{formatCurrency(totalAnnualInvestmentExpensesAggregated)}</span>
                    </div>

                    <div className="flex justify-between items-center mt-4">
                        <span className="text-lg font-medium text-gray-700">Total Net Rental Income/Loss (Aggregated for Tax):</span>
                        <span className={`text-xl font-bold ${totalNetRentalIncomeLossAggregated < 0 ? 'text-red-600' : 'text-green-700'}`}>
                            {formatCurrency(totalNetRentalIncomeLossAggregated)}
                        </span>
                    </div>

                    {totalNetRentalIncomeLossAggregated < 0 && (
                        <div className="flex justify-between items-center mt-2 p-2 bg-purple-100 rounded-md border border-purple-300">
                            <span className="text-lg font-medium text-gray-700">Estimated Total Tax Benefit from Negative Gearing:</span>
                            <span className="text-xl font-bold text-green-600">{formatCurrency(negativeGearingTaxBenefitAggregated)}</span>
                        </div>
                    )}
                    <p className="text-xs text-gray-500 mt-2">
                        <span className="font-semibold">Note on Investment Expenses:</span> These are simplified estimates. Actual costs vary. Land tax (if applicable) is highly variable and not included here unless manually entered per property.
                    </p>
                    <p className="text-xs text-gray-500">
                        <span className="font-semibold">Note on Depreciation:</span> Depreciation is a non-cash deduction. For accurate figures, a Quantity Surveyor's report is required. The value here is a placeholder.
                    </p>
                    <p className="text-xs text-gray-500">
                        <span className="font-semibold">Note on Negative Gearing:</span> A tax benefit from negative gearing occurs when your total deductible investment expenses (including loan interest) from all investment properties exceed your total rental income, creating a net loss that can reduce your taxable income from other sources.
                    </p>
                </div>
            )}

            {/* Monthly Financial Snapshot */}
            <div className="space-y-4 mb-6">
              <h3 className="text-xl font-semibold text-indigo-600 border-b pb-2 border-indigo-200">Monthly Financial Snapshot</h3>
              <div className="flex justify-between items-center">
                <span className="text-lg font-medium text-gray-700">Estimated Monthly Personal Income:</span>
                <span className="text-xl font-bold text-green-700">{formatCurrency(((parseFloat(primaryIncome) || 0) + (parseFloat(dividendsIncome) || 0) + (parseFloat(otherIncome) || 0)) / 12)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-lg font-medium text-gray-700">Estimated Monthly Rental Income (Aggregated):</span>
                <span className="text-xl font-bold text-green-700">{formatCurrency(totalAnnualInvestmentRentalIncome / 12)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-lg font-medium text-gray-700">Estimated Monthly Take-Home Income (After Tax & Investment Effects):</span>
                <span className="text-xl font-bold text-green-700">{formatCurrency(monthlyTakeHomeIncome)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-lg font-medium text-gray-700">Total Estimated Monthly Loan Repayments:</span>
                <span className="text-xl font-bold text-red-600">{formatCurrency(totalMonthlyLoanRepayments)}</span>
              </div>

              <h4 className="text-base font-semibold text-gray-700 mt-4">Estimated Monthly Living Expenses:</h4>
              {Object.keys(totalEstimatedMonthlyLivingExpenses).length > 0 ? (
                <>
                  {Object.entries(totalEstimatedMonthlyLivingExpenses).map(([key, value]) => (
                    <div key={key} className="flex justify-between items-center text-sm text-gray-600 ml-4">
                      <span>{key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}:</span>
                      <span>{formatCurrency(value)}</span>
                    </div>
                  ))}
                  <div className="flex justify-between items-center font-bold text-gray-800 pt-2 border-t border-indigo-200">
                    <span>Total Estimated Monthly Living Expenses:</span>
                    <span>{formatCurrency(totalEstimatedMonthlyLivingExpenses)}</span>
                  </div>
                </>
              ) : (
                <p className="text-sm text-gray-600 ml-4">Enter income to estimate living expenses.</p>
              )}

              <div className={`mt-4 p-3 rounded-lg text-center font-semibold
                ${affordabilityVerdict.includes('able to meet') ? 'bg-green-100 text-green-800 border border-green-300' :
                  affordabilityVerdict.includes('struggle to meet') ? 'bg-red-100 text-red-800 border border-red-300' :
                  'bg-gray-100 text-gray-700 border border-gray-300'}`
              }>
                <span className="text-lg">{affordabilityVerdict}</span>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                <span className="font-semibold">Note on Living Expenses:</span> These are highly generalized estimates for a single person in Australia. Your actual expenses may vary significantly based on your lifestyle, location, and spending habits. This does not include property-specific ongoing costs like council rates, water rates, strata/body corporate fees, or home insurance, which are additional.
              </p>
            </div>

            {/* Monthly Cash Flow Summary */}
            <div className="space-y-4 mb-6 p-6 bg-blue-50 rounded-lg shadow-inner border border-blue-200">
                <h3 className="text-xl font-bold text-blue-700 mb-4 border-b pb-2 border-blue-300">Monthly Cash Flow Summary</h3>
                <div className="flex justify-between items-center">
                    <span className="text-lg font-medium text-gray-700">Total Monthly Income:</span>
                    <span className="text-xl font-bold text-green-700">{formatCurrency(monthlyTakeHomeIncome)}</span>
                </div>
                <div className="flex justify-between items-center">
                    <span className="text-lg font-medium text-gray-700">Total Monthly Outgoings (Loans + Living Expenses):</span>
                    <span className="text-xl font-bold text-red-600">{formatCurrency(totalMonthlyLoanRepayments + totalEstimatedMonthlyLivingExpenses)}</span>
                </div>
                <div className="flex justify-between items-center mt-4 pt-2 border-t border-blue-300">
                    <span className="text-lg font-medium text-gray-800">Monthly Surplus / Deficit:</span>
                    <span className={`text-2xl font-extrabold ${((monthlyTakeHomeIncome - (totalMonthlyLoanRepayments + totalEstimatedMonthlyLivingExpenses))) < 0 ? 'text-red-700' : 'text-green-700'}`}>
                        {formatCurrency(monthlyTakeHomeIncome - (totalMonthlyLoanRepayments + totalEstimatedMonthlyLivingExpenses))}
                    </span>
                </div>
            </div>

            {/* Total Equity Section */}
            <div className="space-y-4 p-6 bg-yellow-50 rounded-lg shadow-inner border border-yellow-200">
                <h3 className="text-xl font-bold text-yellow-700 mb-4 border-b pb-2 border-yellow-300">Total Equity Across All Properties</h3>
                <div className="flex justify-between items-center">
                    <span className="text-lg font-medium text-gray-700">Total Estimated Equity:</span>
                    <span className="text-2xl font-extrabold text-green-700">{formatCurrency(totalEquity)}</span>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                    <span className="font-semibold">Note on Equity:</span> This is an estimate based on the current property values and outstanding loan amounts. Market values can fluctuate, and this figure does not account for selling costs (e.g., agent commissions, capital gains tax).
                </p>
            </div>


            {message && (
              <p className="mt-6 text-sm text-center text-indigo-700 bg-indigo-100 p-3 rounded-md border border-indigo-300">
                <span className="font-semibold">Note:</span> {message}
              </p>
            )}

            <p className="mt-6 text-xs text-center text-gray-500">
              Disclaimer: This calculator provides estimates based on simplified rules and general rates.
              Actual figures can vary significantly based on specific property details, purchaser circumstances,
              lender policies, and current government policies. Always verify figures with official
              government resources or a qualified financial advisor/conveyancer.
            </p>
          </section>
        </main>
      </div>
    </div>
  );
};

export default App;
