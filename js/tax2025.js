/**
 * Tax calculation module for Slovenia - Year 2025
 */
const Tax2025 = (function() {
    // Constants for 2025
    const YEAR = 2025;

    // Social security contribution rate (23.1%)
    const CONTRIBUTION_RATE = 0.231;

    // Fixed monthly contribution amount
    const FIXED_MONTHLY_CONTRIBUTION = 37.17;

    // Employer tax rate (16.1%)
    const EMPLOYER_TAX_RATE = 0.161;

    // Work days per year
    const WORK_DAYS = 251;

    // Relief thresholds and values (yearly)
    const RELIEF_YEARLY = {
        threshold: 16832.00,
        baseAmount: 5260.00,
        additionalBase: 19736.99,
        multiplier: 1.17259
    };

    // Relief thresholds and values (monthly)
    const RELIEF_MONTHLY = {
        threshold: 1402.67,
        baseAmount: 438.33,
        additionalBase: 1644.75,
        multiplier: 1.17259
    };

    // Tax brackets (yearly)
    const BRACKETS_YEARLY = [
        { min: 0, max: 9210.26, rate: 0.16 },
        { min: 9210.26, max: 27089.00, rate: 0.26 },
        { min: 27089.00, max: 54178.00, rate: 0.33 },
        { min: 54178.00, max: 78016.32, rate: 0.39 },
        { min: 78016.32, max: Infinity, rate: 0.50 }
    ];

    // Tax brackets (monthly)
    const BRACKETS_MONTHLY = [
        { min: 0, max: 767.52, rate: 0.16 },
        { min: 767.52, max: 2257.42, rate: 0.26 },
        { min: 2257.42, max: 4514.83, rate: 0.33 },
        { min: 4514.83, max: 6501.36, rate: 0.39 },
        { min: 6501.36, max: Infinity, rate: 0.50 }
    ];

    /**
     * Get the year this module is for
     */
    function getYear() {
        return YEAR;
    }

    /**
     * Calculate employee contributions (prispevki)
     * @param {number} grossIncome - Gross income
     * @param {boolean} isMonthly - Whether calculation is monthly
     * @returns {number} Contribution amount
     */
    function calculateContributions(grossIncome, isMonthly) {
        const percentageContribution = grossIncome * CONTRIBUTION_RATE;
        const fixedContribution = isMonthly ? FIXED_MONTHLY_CONTRIBUTION : (FIXED_MONTHLY_CONTRIBUTION * 12);
        return percentageContribution + fixedContribution;
    }

    /**
     * Calculate relief (olajsava)
     * Relief cannot exceed gross income minus contributions
     * @param {number} grossIncome - Gross income
     * @param {boolean} isMonthly - Whether calculation is monthly
     * @returns {number} Relief amount
     */
    function calculateRelief(grossIncome, isMonthly) {
        const relief = isMonthly ? RELIEF_MONTHLY : RELIEF_YEARLY;

        let reliefAmount;
        if (grossIncome <= relief.threshold) {
            const additionalRelief = relief.additionalBase - (relief.multiplier * grossIncome);
            reliefAmount = relief.baseAmount + Math.max(0, additionalRelief);
        } else {
            reliefAmount = relief.baseAmount;
        }

        // Relief cannot exceed gross income minus contributions
        const contributions = calculateContributions(grossIncome, isMonthly);
        const maxRelief = Math.max(0, grossIncome - contributions);
        return Math.min(reliefAmount, maxRelief);
    }

    /**
     * Get the number of tax brackets
     * @returns {number} Number of brackets
     */
    function getBracketCount() {
        return BRACKETS_YEARLY.length;
    }

    /**
     * Get bracket information
     * @param {number} index - Bracket index (0-based)
     * @param {boolean} isMonthly - Whether to get monthly brackets
     * @returns {object} Bracket info with min, max, rate
     */
    function getBracketInfo(index, isMonthly) {
        const brackets = isMonthly ? BRACKETS_MONTHLY : BRACKETS_YEARLY;
        if (index < 0 || index >= brackets.length) {
            return null;
        }
        return { ...brackets[index] };
    }

    /**
     * Get all brackets
     * @param {boolean} isMonthly - Whether to get monthly brackets
     * @returns {array} Array of bracket objects
     */
    function getAllBrackets(isMonthly) {
        const brackets = isMonthly ? BRACKETS_MONTHLY : BRACKETS_YEARLY;
        return brackets.map(b => ({ ...b }));
    }

    /**
     * Calculate income tax in a specific bracket
     * @param {number} taxedIncome - Income after contributions and relief
     * @param {number} bracketIndex - Bracket index
     * @param {boolean} isMonthly - Whether calculation is monthly
     * @returns {number} Tax in that bracket
     */
    function calculateBracketTax(taxedIncome, bracketIndex, isMonthly) {
        const brackets = isMonthly ? BRACKETS_MONTHLY : BRACKETS_YEARLY;

        if (bracketIndex < 0 || bracketIndex >= brackets.length) {
            return 0;
        }

        const bracket = brackets[bracketIndex];

        if (taxedIncome <= bracket.min) {
            return 0;
        }

        const incomeInBracket = Math.min(taxedIncome, bracket.max) - bracket.min;
        return Math.max(0, incomeInBracket) * bracket.rate;
    }

    /**
     * Calculate total income tax (dohodnina)
     * @param {number} grossIncome - Gross income
     * @param {boolean} isMonthly - Whether calculation is monthly
     * @returns {number} Total income tax
     */
    function calculateTotalIncomeTax(grossIncome, isMonthly) {
        const contributions = calculateContributions(grossIncome, isMonthly);
        const relief = calculateRelief(grossIncome, isMonthly);
        const taxedIncome = Math.max(0, grossIncome - contributions - relief);

        const brackets = isMonthly ? BRACKETS_MONTHLY : BRACKETS_YEARLY;
        let totalTax = 0;

        for (let i = 0; i < brackets.length; i++) {
            totalTax += calculateBracketTax(taxedIncome, i, isMonthly);
        }

        return totalTax;
    }

    /**
     * Calculate taxed income (gross - contributions - relief)
     * @param {number} grossIncome - Gross income
     * @param {boolean} isMonthly - Whether calculation is monthly
     * @returns {number} Taxed income
     */
    function calculateTaxedIncome(grossIncome, isMonthly) {
        const contributions = calculateContributions(grossIncome, isMonthly);
        const relief = calculateRelief(grossIncome, isMonthly);
        return Math.max(0, grossIncome - contributions - relief);
    }

    /**
     * Calculate employer tax (davek delodajalca)
     * @param {number} grossIncome - Gross income
     * @returns {number} Employer tax amount
     */
    function calculateEmployerTax(grossIncome) {
        return grossIncome * EMPLOYER_TAX_RATE;
    }

    /**
     * Calculate net income
     * @param {number} grossIncome - Gross income
     * @param {boolean} isMonthly - Whether calculation is monthly
     * @returns {number} Net income
     */
    function calculateNetIncome(grossIncome, isMonthly) {
        const contributions = calculateContributions(grossIncome, isMonthly);
        const incomeTax = calculateTotalIncomeTax(grossIncome, isMonthly);
        return grossIncome - contributions - incomeTax;
    }

    /**
     * Get complete tax breakdown
     * @param {number} grossIncome - Gross income
     * @param {boolean} isMonthly - Whether calculation is monthly
     * @param {boolean} includeEmployerTax - Whether to include employer tax
     * @returns {object} Complete breakdown
     */
    function getFullBreakdown(grossIncome, isMonthly, includeEmployerTax) {
        const contributions = calculateContributions(grossIncome, isMonthly);
        const relief = calculateRelief(grossIncome, isMonthly);
        const taxedIncome = Math.max(0, grossIncome - contributions - relief);
        const incomeTax = calculateTotalIncomeTax(grossIncome, isMonthly);
        const employerTax = includeEmployerTax ? calculateEmployerTax(grossIncome) : 0;
        const netIncome = grossIncome - contributions - incomeTax;

        const brackets = isMonthly ? BRACKETS_MONTHLY : BRACKETS_YEARLY;
        const bracketBreakdown = brackets.map((bracket, i) => ({
            min: bracket.min,
            max: bracket.max,
            rate: bracket.rate,
            tax: calculateBracketTax(taxedIncome, i, isMonthly)
        }));

        const totalEmployeeTax = contributions + incomeTax;
        const totalTax = totalEmployeeTax + employerTax;
        const totalCost = grossIncome + employerTax;

        return {
            grossIncome,
            contributions,
            relief,
            taxedIncome,
            incomeTax,
            employerTax,
            netIncome,
            totalEmployeeTax,
            totalTax,
            totalCost,
            bracketBreakdown,
            taxPercentage: totalCost > 0 ? (totalTax / totalCost) * 100 : 0,
            netPercentage: totalCost > 0 ? (netIncome / totalCost) * 100 : 0
        };
    }

    /**
     * Get complete tax breakdown including untaxed extras
     * @param {number} grossIncome - Gross income
     * @param {boolean} isMonthly - Whether calculation is monthly
     * @param {object} options - Extra options
     * @param {boolean} options.includeEmployerTax - Whether to include employer tax
     * @param {number} options.vacationAllowance - Yearly vacation allowance (regres)
     * @param {number} options.companyBonus - Yearly company bonus (božičnica)
     * @param {number} options.dailyFoodComp - Daily food compensation
     * @param {number} options.dailyCommuteComp - Daily commute compensation
     * @param {number} options.vacationDays - Number of vacation days
     * @returns {object} Complete breakdown with extras
     */
    function getFullBreakdownWithExtras(grossIncome, isMonthly, options) {
        const {
            includeEmployerTax = false,
            vacationAllowance = 0,
            companyBonus = 0,
            dailyFoodComp = 0,
            dailyCommuteComp = 0,
            vacationDays = 0
        } = options || {};

        // Base breakdown (contributions from gross only determine taxed income)
        const contributions = calculateContributions(grossIncome, isMonthly);
        const relief = calculateRelief(grossIncome, isMonthly);
        const taxedIncome = Math.max(0, grossIncome - contributions - relief);
        const incomeTax = calculateTotalIncomeTax(grossIncome, isMonthly);

        const brackets = isMonthly ? BRACKETS_MONTHLY : BRACKETS_YEARLY;
        const bracketBreakdown = brackets.map((bracket, i) => ({
            min: bracket.min,
            max: bracket.max,
            rate: bracket.rate,
            tax: calculateBracketTax(taxedIncome, i, isMonthly)
        }));

        // Yearly compensation amounts
        const workDaysUsed = Math.max(0, WORK_DAYS - vacationDays);
        const yearlyFoodComp = dailyFoodComp * workDaysUsed;
        const yearlyCommuteComp = dailyCommuteComp * workDaysUsed;

        // Apply monthly factor
        const monthlyFactor = isMonthly ? (1 / 12) : 1;
        const foodComp = yearlyFoodComp * monthlyFactor;
        const commuteComp = yearlyCommuteComp * monthlyFactor;
        const regres = vacationAllowance * monthlyFactor;
        const bonus = companyBonus * monthlyFactor;

        // Bonus contributions (same rate, no fixed component)
        const bonusContributions = bonus * CONTRIBUTION_RATE;
        const bonusEmployerTax = includeEmployerTax ? bonus * EMPLOYER_TAX_RATE : 0;

        // Totals
        const totalContributions = contributions + bonusContributions;
        const grossEmployerTax = includeEmployerTax ? calculateEmployerTax(grossIncome) : 0;
        const totalEmployerTax = grossEmployerTax + bonusEmployerTax;

        const netIncome = grossIncome + foodComp + commuteComp + regres + bonus - totalContributions - incomeTax;
        const totalAboveHandle = regres + bonus + foodComp + commuteComp;

        const totalEmployeeTax = totalContributions + incomeTax;
        const totalTax = totalEmployeeTax + totalEmployerTax;
        const totalCost = grossIncome + totalEmployerTax + foodComp + commuteComp + regres + bonus;

        return {
            grossIncome,
            contributions,
            relief,
            taxedIncome,
            incomeTax,
            bracketBreakdown,
            // Extras
            foodComp,
            commuteComp,
            regres,
            bonus,
            bonusContributions,
            bonusEmployerTax,
            totalContributions,
            totalEmployerTax,
            totalAboveHandle,
            // Totals
            netIncome,
            totalEmployeeTax,
            totalTax,
            totalCost,
            taxPercentage: totalCost > 0 ? (totalTax / totalCost) * 100 : 0,
            netPercentage: totalCost > 0 ? (netIncome / totalCost) * 100 : 0
        };
    }

    // Public API
    return {
        getYear,
        calculateContributions,
        calculateRelief,
        getBracketCount,
        getBracketInfo,
        getAllBrackets,
        calculateBracketTax,
        calculateTotalIncomeTax,
        calculateTaxedIncome,
        calculateEmployerTax,
        calculateNetIncome,
        getFullBreakdown,
        getFullBreakdownWithExtras,
        CONTRIBUTION_RATE,
        EMPLOYER_TAX_RATE,
        WORK_DAYS
    };
})();
