/**
 * Tax calculation module for Slovenia - Year 2026
 */
const Tax2026 = (function() {
    // Constants for 2026
    const YEAR = 2026;

    // Social security contribution rate (23.1%)
    const CONTRIBUTION_RATE = 0.231;

    // Fixed monthly contribution amount
    const FIXED_MONTHLY_CONTRIBUTION = 37.17;

    // Employer tax rate (17.1%)
    const EMPLOYER_TAX_RATE = 0.171;

    // Work days per year
    const WORK_DAYS = 254;

    // Relief thresholds and values (yearly)
    const RELIEF_YEARLY = {
        threshold: 17766.18,
        baseAmount: 5551.93,
        additionalBase: 20832.39,
        multiplier: 1.17259
    };

    // Relief thresholds and values (monthly)
    const RELIEF_MONTHLY = {
        threshold: 1480.51,
        baseAmount: 462.66,
        additionalBase: 1736.03,
        multiplier: 1.17259
    };

    // Tax brackets (yearly)
    const BRACKETS_YEARLY = [
        { min: 0, max: 9721.43, rate: 0.16 },
        { min: 9721.43, max: 28592.44, rate: 0.26 },
        { min: 28592.44, max: 57184.88, rate: 0.33 },
        { min: 57184.88, max: 82346.23, rate: 0.39 },
        { min: 82346.23, max: Infinity, rate: 0.50 }
    ];

    // Tax brackets (monthly)
    const BRACKETS_MONTHLY = [
        { min: 0, max: 810.12, rate: 0.16 },
        { min: 810.12, max: 2382.70, rate: 0.26 },
        { min: 2382.70, max: 4765.41, rate: 0.33 },
        { min: 4765.41, max: 6862.19, rate: 0.39 },
        { min: 6862.19, max: Infinity, rate: 0.50 }
    ];

    // Extra relief: children (yearly amounts for 1st through 5th child)
    const CHILDREN_RELIEF_YEARLY = [2995.83, 3256.77, 5432.02, 7607.27, 9782.51];
    const CHILDREN_RELIEF_INCREMENT_YEARLY = 2175.25;
    const SPECIAL_NEEDS_YEARLY = 7860.41;

    // Extra relief: children (monthly amounts for 1st through 5th child)
    const CHILDREN_RELIEF_MONTHLY = [249.65, 271.40, 452.67, 633.94, 815.21];
    const CHILDREN_RELIEF_INCREMENT_MONTHLY = 181.27;
    const SPECIAL_NEEDS_MONTHLY = 655.03;

    // Extra relief: other supported family members
    const OTHER_FAMILY_YEARLY = 2995.83;
    const OTHER_FAMILY_MONTHLY = 249.65;

    // Extra relief: young adult and student (yearly)
    const YOUNG_ADULT_YEARLY = 1443.50;
    const STUDENT_YEARLY = 3886.35;

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
     * Calculate extra relief for children, students, young adults, and other family members
     * @param {object} options - Extra relief options
     * @param {number} options.childrenCount - Number of children
     * @param {number} options.specialNeedsCount - Number of children with special needs
     * @param {number} options.childrenMonths - Months of children relief (0-12)
     * @param {boolean} options.isStudent - Whether the person is a student
     * @param {boolean} options.isYoungAdult - Whether the person is a young adult (up to 29)
     * @param {number} options.otherFamilyCount - Number of other supported family members
     * @param {boolean} isMonthly - Whether calculation is monthly
     * @returns {number} Extra relief amount
     */
    function calculateExtraRelief(options, isMonthly) {
        if (!options) return 0;

        const {
            childrenCount = 0,
            specialNeedsCount = 0,
            childrenMonths = 12,
            isStudent = false,
            isYoungAdult = false,
            otherFamilyCount = 0
        } = options;

        const childrenAmounts = isMonthly ? CHILDREN_RELIEF_MONTHLY : CHILDREN_RELIEF_YEARLY;
        const childrenIncrement = isMonthly ? CHILDREN_RELIEF_INCREMENT_MONTHLY : CHILDREN_RELIEF_INCREMENT_YEARLY;
        const specialNeedsAmount = isMonthly ? SPECIAL_NEEDS_MONTHLY : SPECIAL_NEEDS_YEARLY;
        const youngAdultAmount = isMonthly ? (YOUNG_ADULT_YEARLY / 12) : YOUNG_ADULT_YEARLY;
        const studentAmount = isMonthly ? (STUDENT_YEARLY / 12) : STUDENT_YEARLY;
        const otherFamilyAmount = isMonthly ? OTHER_FAMILY_MONTHLY : OTHER_FAMILY_YEARLY;

        let extra = 0;

        // Children relief
        if (childrenCount > 0) {
            let childrenRelief = 0;
            for (let i = 0; i < childrenCount; i++) {
                if (i < childrenAmounts.length) {
                    childrenRelief += childrenAmounts[i];
                } else {
                    // Beyond 5th child: last defined + increment for each additional
                    const beyondIndex = i - childrenAmounts.length + 1;
                    childrenRelief += childrenAmounts[childrenAmounts.length - 1] + beyondIndex * childrenIncrement;
                }
            }

            // Special needs additional (clamped to childrenCount)
            const clampedSpecialNeeds = Math.min(specialNeedsCount, childrenCount);
            childrenRelief += clampedSpecialNeeds * specialNeedsAmount;

            // Proportional months
            const monthsFactor = Math.max(0, Math.min(12, childrenMonths)) / 12;
            childrenRelief *= monthsFactor;

            extra += childrenRelief;
        }

        // Other supported family members
        if (otherFamilyCount > 0) {
            extra += otherFamilyCount * otherFamilyAmount;
        }

        // Student relief (takes priority over young adult)
        if (isStudent) {
            extra += studentAmount;
        } else if (isYoungAdult) {
            extra += youngAdultAmount;
        }

        return extra;
    }

    /**
     * Calculate relief (olajsava) including optional extra reliefs
     * Relief cannot exceed gross income minus contributions
     * @param {number} grossIncome - Gross income
     * @param {boolean} isMonthly - Whether calculation is monthly
     * @param {object} [extraReliefOptions] - Optional extra relief options
     * @returns {number} Relief amount
     */
    function calculateRelief(grossIncome, isMonthly, extraReliefOptions) {
        const relief = isMonthly ? RELIEF_MONTHLY : RELIEF_YEARLY;

        let reliefAmount;
        if (grossIncome <= relief.threshold) {
            const additionalRelief = relief.additionalBase - (relief.multiplier * grossIncome);
            reliefAmount = relief.baseAmount + Math.max(0, additionalRelief);
        } else {
            reliefAmount = relief.baseAmount;
        }

        // Add extra reliefs
        reliefAmount += calculateExtraRelief(extraReliefOptions, isMonthly);

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
     * @param {object} [extraReliefOptions] - Optional extra relief options
     * @returns {number} Total income tax
     */
    function calculateTotalIncomeTax(grossIncome, isMonthly, extraReliefOptions) {
        const contributions = calculateContributions(grossIncome, isMonthly);
        const relief = calculateRelief(grossIncome, isMonthly, extraReliefOptions);
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
     * @param {object} [extraReliefOptions] - Optional extra relief options
     * @returns {number} Taxed income
     */
    function calculateTaxedIncome(grossIncome, isMonthly, extraReliefOptions) {
        const contributions = calculateContributions(grossIncome, isMonthly);
        const relief = calculateRelief(grossIncome, isMonthly, extraReliefOptions);
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
     * @param {object} [extraReliefOptions] - Optional extra relief options
     * @returns {number} Net income
     */
    function calculateNetIncome(grossIncome, isMonthly, extraReliefOptions) {
        const contributions = calculateContributions(grossIncome, isMonthly);
        const incomeTax = calculateTotalIncomeTax(grossIncome, isMonthly, extraReliefOptions);
        return grossIncome - contributions - incomeTax;
    }

    /**
     * Get complete tax breakdown
     * @param {number} grossIncome - Gross income
     * @param {boolean} isMonthly - Whether calculation is monthly
     * @param {boolean} includeEmployerTax - Whether to include employer tax
     * @returns {object} Complete breakdown
     */
    function getFullBreakdown(grossIncome, isMonthly, includeEmployerTax, extraReliefOptions) {
        const contributions = calculateContributions(grossIncome, isMonthly);
        const relief = calculateRelief(grossIncome, isMonthly, extraReliefOptions);
        const taxedIncome = Math.max(0, grossIncome - contributions - relief);
        const incomeTax = calculateTotalIncomeTax(grossIncome, isMonthly, extraReliefOptions);
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
            vacationDays = 0,
            childrenCount = 0,
            specialNeedsCount = 0,
            childrenMonths = 12,
            isStudent = false,
            isYoungAdult = false,
            otherFamilyCount = 0
        } = options || {};

        const extraReliefOptions = { childrenCount, specialNeedsCount, childrenMonths, isStudent, isYoungAdult, otherFamilyCount };

        // Base breakdown (contributions from gross only determine taxed income)
        const contributions = calculateContributions(grossIncome, isMonthly);
        const relief = calculateRelief(grossIncome, isMonthly, extraReliefOptions);
        const taxedIncome = Math.max(0, grossIncome - contributions - relief);
        const incomeTax = calculateTotalIncomeTax(grossIncome, isMonthly, extraReliefOptions);

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
        calculateExtraRelief,
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
