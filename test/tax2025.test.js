/**
 * Unit tests for Tax2025 module
 * Run with: node --test test/tax2025.test.js
 */
const { test, describe } = require('node:test');
const assert = require('node:assert');
const Tax2025 = require('../js/tax2025.node.js');

// Helper to round to 2 decimal places (for floating point comparisons)
const round2 = (n) => Math.round(n * 100) / 100;

// ============================================================================
// Constants Tests
// ============================================================================

describe('Tax2025 Constants', () => {
    test('returns correct year', () => {
        assert.strictEqual(Tax2025.getYear(), 2025);
    });

    test('has correct contribution rate', () => {
        assert.strictEqual(Tax2025.CONTRIBUTION_RATE, 0.231);
    });

    test('has correct employer tax rate', () => {
        assert.strictEqual(Tax2025.EMPLOYER_TAX_RATE, 0.161);
    });

    test('has 5 tax brackets', () => {
        assert.strictEqual(Tax2025.getBracketCount(), 5);
    });
});

// ============================================================================
// Contribution Tests
// ============================================================================

describe('Tax2025 Contributions (calculateContributions)', () => {
    // Yearly: 23.1% + 446.04 EUR fixed (37.17 * 12)
    const YEARLY_FIXED = 37.17 * 12; // 446.04

    test('yearly contributions at 0 EUR', () => {
        const result = Tax2025.calculateContributions(0, false);
        assert.strictEqual(round2(result), round2(YEARLY_FIXED));
    });

    test('yearly contributions at 10000 EUR', () => {
        const result = Tax2025.calculateContributions(10000, false);
        const expected = 10000 * 0.231 + YEARLY_FIXED;
        assert.strictEqual(round2(result), round2(expected));
    });

    test('yearly contributions at 48000 EUR', () => {
        const result = Tax2025.calculateContributions(48000, false);
        const expected = 48000 * 0.231 + YEARLY_FIXED; // 11534.04
        assert.strictEqual(round2(result), round2(expected));
    });

    test('yearly contributions at 100000 EUR', () => {
        const result = Tax2025.calculateContributions(100000, false);
        const expected = 100000 * 0.231 + YEARLY_FIXED; // 23546.04
        assert.strictEqual(round2(result), round2(expected));
    });

    // Monthly: 23.1% + 37.17 EUR fixed
    const MONTHLY_FIXED = 37.17;

    test('monthly contributions at 0 EUR', () => {
        const result = Tax2025.calculateContributions(0, true);
        assert.strictEqual(round2(result), round2(MONTHLY_FIXED));
    });

    test('monthly contributions at 4000 EUR', () => {
        const result = Tax2025.calculateContributions(4000, true);
        const expected = 4000 * 0.231 + MONTHLY_FIXED; // 961.17
        assert.strictEqual(round2(result), round2(expected));
    });
});

// ============================================================================
// Relief Tests
// ============================================================================

describe('Tax2025 Relief (calculateRelief)', () => {
    // Yearly thresholds
    const YEARLY_THRESHOLD = 16832.00;
    const YEARLY_BASE = 5260.00;
    const YEARLY_ADDITIONAL_BASE = 19736.99;
    const MULTIPLIER = 1.17259;

    test('yearly relief at 0 EUR (below threshold)', () => {
        const result = Tax2025.calculateRelief(0, false);
        const expected = YEARLY_BASE + YEARLY_ADDITIONAL_BASE; // 24996.99
        assert.strictEqual(round2(result), round2(expected));
    });

    test('yearly relief at 10000 EUR (below threshold)', () => {
        const result = Tax2025.calculateRelief(10000, false);
        const additional = YEARLY_ADDITIONAL_BASE - MULTIPLIER * 10000;
        const expected = YEARLY_BASE + additional; // 5260 + (19736.99 - 11725.9) = 13271.09
        assert.strictEqual(round2(result), round2(expected));
    });

    test('yearly relief at threshold (16832 EUR)', () => {
        const result = Tax2025.calculateRelief(YEARLY_THRESHOLD, false);
        // At threshold, additional relief should be ~0
        const expected = YEARLY_BASE;
        assert.strictEqual(round2(result), round2(expected));
    });

    test('yearly relief above threshold (48000 EUR)', () => {
        const result = Tax2025.calculateRelief(48000, false);
        assert.strictEqual(round2(result), round2(YEARLY_BASE)); // 5260.00
    });

    test('yearly relief at 100000 EUR', () => {
        const result = Tax2025.calculateRelief(100000, false);
        assert.strictEqual(round2(result), round2(YEARLY_BASE)); // 5260.00
    });

    // Monthly thresholds
    const MONTHLY_THRESHOLD = 1402.67;
    const MONTHLY_BASE = 438.33;
    const MONTHLY_ADDITIONAL_BASE = 1644.75;

    test('monthly relief at 0 EUR', () => {
        const result = Tax2025.calculateRelief(0, true);
        const expected = MONTHLY_BASE + MONTHLY_ADDITIONAL_BASE;
        assert.strictEqual(round2(result), round2(expected));
    });

    test('monthly relief above threshold (4000 EUR)', () => {
        const result = Tax2025.calculateRelief(4000, true);
        assert.strictEqual(round2(result), round2(MONTHLY_BASE));
    });
});

// ============================================================================
// Bracket Info Tests
// ============================================================================

describe('Tax2025 Brackets (getBracketInfo, getAllBrackets)', () => {
    test('yearly bracket 0 has correct values', () => {
        const bracket = Tax2025.getBracketInfo(0, false);
        assert.strictEqual(bracket.min, 0);
        assert.strictEqual(bracket.max, 9210.26);
        assert.strictEqual(bracket.rate, 0.16);
    });

    test('yearly bracket 1 has correct values', () => {
        const bracket = Tax2025.getBracketInfo(1, false);
        assert.strictEqual(bracket.min, 9210.26);
        assert.strictEqual(bracket.max, 27089.00);
        assert.strictEqual(bracket.rate, 0.26);
    });

    test('yearly bracket 4 (highest) has correct values', () => {
        const bracket = Tax2025.getBracketInfo(4, false);
        assert.strictEqual(bracket.min, 78016.32);
        assert.strictEqual(bracket.max, Infinity);
        assert.strictEqual(bracket.rate, 0.50);
    });

    test('monthly bracket 0 has correct values', () => {
        const bracket = Tax2025.getBracketInfo(0, true);
        assert.strictEqual(bracket.min, 0);
        assert.strictEqual(bracket.max, 767.52);
        assert.strictEqual(bracket.rate, 0.16);
    });

    test('getAllBrackets returns 5 brackets', () => {
        const yearlyBrackets = Tax2025.getAllBrackets(false);
        const monthlyBrackets = Tax2025.getAllBrackets(true);
        assert.strictEqual(yearlyBrackets.length, 5);
        assert.strictEqual(monthlyBrackets.length, 5);
    });

    test('invalid bracket index returns null', () => {
        assert.strictEqual(Tax2025.getBracketInfo(-1, false), null);
        assert.strictEqual(Tax2025.getBracketInfo(5, false), null);
    });
});

// ============================================================================
// Bracket Tax Tests
// ============================================================================

describe('Tax2025 Bracket Tax (calculateBracketTax)', () => {
    test('tax in bracket 0 with income fully in bracket', () => {
        const taxedIncome = 5000;
        const result = Tax2025.calculateBracketTax(taxedIncome, 0, false);
        assert.strictEqual(round2(result), round2(5000 * 0.16)); // 800
    });

    test('tax in bracket 0 with income exceeding bracket', () => {
        const taxedIncome = 15000; // Exceeds bracket 0 max (9210.26)
        const result = Tax2025.calculateBracketTax(taxedIncome, 0, false);
        assert.strictEqual(round2(result), round2(9210.26 * 0.16)); // 1473.64
    });

    test('tax in bracket 1 with income spanning brackets', () => {
        const taxedIncome = 15000;
        const result = Tax2025.calculateBracketTax(taxedIncome, 1, false);
        const incomeInBracket = 15000 - 9210.26; // 5789.74
        assert.strictEqual(round2(result), round2(incomeInBracket * 0.26)); // 1505.33
    });

    test('no tax in higher bracket when income is below', () => {
        const taxedIncome = 5000; // Only in bracket 0
        const result = Tax2025.calculateBracketTax(taxedIncome, 1, false);
        assert.strictEqual(result, 0);
    });

    test('bracket tax at exact boundary', () => {
        const taxedIncome = 9210.26; // Exactly at bracket 0 max
        const bracket0Tax = Tax2025.calculateBracketTax(taxedIncome, 0, false);
        const bracket1Tax = Tax2025.calculateBracketTax(taxedIncome, 1, false);
        assert.strictEqual(round2(bracket0Tax), round2(9210.26 * 0.16));
        assert.strictEqual(bracket1Tax, 0);
    });
});

// ============================================================================
// Taxed Income Tests
// ============================================================================

describe('Tax2025 Taxed Income (calculateTaxedIncome)', () => {
    test('taxed income is gross minus contributions minus relief', () => {
        const gross = 48000;
        const contributions = Tax2025.calculateContributions(gross, false);
        const relief = Tax2025.calculateRelief(gross, false);
        const expected = Math.max(0, gross - contributions - relief);
        const result = Tax2025.calculateTaxedIncome(gross, false);
        assert.strictEqual(round2(result), round2(expected));
    });

    test('taxed income is never negative', () => {
        const result = Tax2025.calculateTaxedIncome(0, false);
        assert.ok(result >= 0);
    });

    test('taxed income at low income (may be zero due to high relief)', () => {
        const result = Tax2025.calculateTaxedIncome(1000, false);
        assert.ok(result >= 0);
    });
});

// ============================================================================
// Total Income Tax Tests
// ============================================================================

describe('Tax2025 Total Income Tax (calculateTotalIncomeTax)', () => {
    test('total tax is sum of all bracket taxes', () => {
        const gross = 48000;
        const taxedIncome = Tax2025.calculateTaxedIncome(gross, false);

        let expectedTotal = 0;
        for (let i = 0; i < 5; i++) {
            expectedTotal += Tax2025.calculateBracketTax(taxedIncome, i, false);
        }

        const result = Tax2025.calculateTotalIncomeTax(gross, false);
        assert.strictEqual(round2(result), round2(expectedTotal));
    });

    test('zero gross income results in zero tax', () => {
        const result = Tax2025.calculateTotalIncomeTax(0, false);
        assert.strictEqual(result, 0);
    });

    test('tax is always non-negative', () => {
        const result = Tax2025.calculateTotalIncomeTax(5000, false);
        assert.ok(result >= 0);
    });
});

// ============================================================================
// Employer Tax Tests
// ============================================================================

describe('Tax2025 Employer Tax (calculateEmployerTax)', () => {
    test('employer tax at 0 EUR', () => {
        const result = Tax2025.calculateEmployerTax(0);
        assert.strictEqual(result, 0);
    });

    test('employer tax at 48000 EUR', () => {
        const result = Tax2025.calculateEmployerTax(48000);
        assert.strictEqual(round2(result), round2(48000 * 0.161)); // 7728
    });

    test('employer tax at 100000 EUR', () => {
        const result = Tax2025.calculateEmployerTax(100000);
        assert.strictEqual(round2(result), round2(100000 * 0.161)); // 16100
    });
});

// ============================================================================
// Net Income Tests
// ============================================================================

describe('Tax2025 Net Income (calculateNetIncome)', () => {
    test('net income formula: gross - contributions - tax', () => {
        const gross = 48000;
        const contributions = Tax2025.calculateContributions(gross, false);
        const tax = Tax2025.calculateTotalIncomeTax(gross, false);
        const expected = gross - contributions - tax;

        const result = Tax2025.calculateNetIncome(gross, false);
        assert.strictEqual(round2(result), round2(expected));
    });

    test('net income at 0 EUR gross', () => {
        const result = Tax2025.calculateNetIncome(0, false);
        // Net should be negative due to fixed contributions
        const contributions = Tax2025.calculateContributions(0, false);
        assert.strictEqual(round2(result), round2(-contributions));
    });

    test('net income is less than gross (positive gross)', () => {
        const gross = 48000;
        const result = Tax2025.calculateNetIncome(gross, false);
        assert.ok(result < gross);
        assert.ok(result > 0);
    });
});

// ============================================================================
// Full Breakdown Tests
// ============================================================================

describe('Tax2025 Full Breakdown (getFullBreakdown)', () => {
    test('breakdown fields are consistent', () => {
        const gross = 48000;
        const breakdown = Tax2025.getFullBreakdown(gross, false, true);

        // Verify grossIncome matches input
        assert.strictEqual(breakdown.grossIncome, gross);

        // Verify taxedIncome calculation
        const expectedTaxedIncome = Math.max(0, gross - breakdown.contributions - breakdown.relief);
        assert.strictEqual(round2(breakdown.taxedIncome), round2(expectedTaxedIncome));

        // Verify netIncome calculation
        const expectedNetIncome = gross - breakdown.contributions - breakdown.incomeTax;
        assert.strictEqual(round2(breakdown.netIncome), round2(expectedNetIncome));

        // Verify totalTax calculation
        const expectedTotalTax = breakdown.contributions + breakdown.incomeTax + breakdown.employerTax;
        assert.strictEqual(round2(breakdown.totalTax), round2(expectedTotalTax));

        // Verify totalCost calculation
        const expectedTotalCost = gross + breakdown.employerTax;
        assert.strictEqual(round2(breakdown.totalCost), round2(expectedTotalCost));
    });

    test('breakdown without employer tax', () => {
        const breakdown = Tax2025.getFullBreakdown(48000, false, false);
        assert.strictEqual(breakdown.employerTax, 0);
        assert.strictEqual(breakdown.totalTax, breakdown.contributions + breakdown.incomeTax);
    });

    test('breakdown with employer tax', () => {
        const breakdown = Tax2025.getFullBreakdown(48000, false, true);
        assert.ok(breakdown.employerTax > 0);
    });

    test('bracket breakdown has 5 entries', () => {
        const breakdown = Tax2025.getFullBreakdown(48000, false, true);
        assert.strictEqual(breakdown.bracketBreakdown.length, 5);
    });

    test('percentages are within valid range', () => {
        const breakdown = Tax2025.getFullBreakdown(48000, false, true);
        assert.ok(breakdown.taxPercentage >= 0 && breakdown.taxPercentage <= 100);
        assert.ok(breakdown.netPercentage >= 0 && breakdown.netPercentage <= 100);
    });

    test('tax and net percentages approximately sum to 100', () => {
        const breakdown = Tax2025.getFullBreakdown(48000, false, true);
        const sum = breakdown.taxPercentage + breakdown.netPercentage;
        // Allow small floating point tolerance
        assert.ok(Math.abs(sum - 100) < 0.01, `Sum was ${sum}, expected ~100`);
    });

    test('breakdown at zero income', () => {
        const breakdown = Tax2025.getFullBreakdown(0, false, true);
        assert.strictEqual(breakdown.grossIncome, 0);
        assert.strictEqual(breakdown.incomeTax, 0);
        assert.strictEqual(breakdown.employerTax, 0);
    });
});

// ============================================================================
// Monthly vs Yearly Consistency Tests
// ============================================================================

describe('Tax2025 Monthly vs Yearly Consistency', () => {
    test('monthly relief base is yearly divided by 12 (approximately)', () => {
        const yearlyRelief = Tax2025.calculateRelief(100000, false); // Above threshold
        const monthlyRelief = Tax2025.calculateRelief(100000 / 12, true); // Above threshold
        // Both should be base relief
        assert.ok(Math.abs(yearlyRelief / 12 - monthlyRelief) < 1);
    });

    test('brackets have consistent rates between monthly and yearly', () => {
        for (let i = 0; i < 5; i++) {
            const yearlyBracket = Tax2025.getBracketInfo(i, false);
            const monthlyBracket = Tax2025.getBracketInfo(i, true);
            assert.strictEqual(yearlyBracket.rate, monthlyBracket.rate);
        }
    });
});
