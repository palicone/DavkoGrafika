/**
 * Unit tests for Tax2026 module
 * Run with: node --test test/tax2026.test.js
 */
const { test, describe } = require('node:test');
const assert = require('node:assert');
const Tax2026 = require('../js/tax2026.node.js');

// Helper to round to 2 decimal places (for floating point comparisons)
const round2 = (n) => Math.round(n * 100) / 100;

// ============================================================================
// Constants Tests
// ============================================================================

describe('Tax2026 Constants', () => {
    test('returns correct year', () => {
        assert.strictEqual(Tax2026.getYear(), 2026);
    });

    test('has correct contribution rate', () => {
        assert.strictEqual(Tax2026.CONTRIBUTION_RATE, 0.231);
    });

    test('has correct employer tax rate', () => {
        assert.strictEqual(Tax2026.EMPLOYER_TAX_RATE, 0.161);
    });

    test('has correct work days', () => {
        assert.strictEqual(Tax2026.WORK_DAYS, 254);
    });

    test('has 5 tax brackets', () => {
        assert.strictEqual(Tax2026.getBracketCount(), 5);
    });
});

// ============================================================================
// Contribution Tests
// ============================================================================

describe('Tax2026 Contributions (calculateContributions)', () => {
    // Yearly: 23.1% + 446.04 EUR fixed (37.17 * 12)
    const YEARLY_FIXED = 37.17 * 12; // 446.04

    test('yearly contributions at 0 EUR', () => {
        const result = Tax2026.calculateContributions(0, false);
        assert.strictEqual(round2(result), round2(YEARLY_FIXED));
    });

    test('yearly contributions at 10000 EUR', () => {
        const result = Tax2026.calculateContributions(10000, false);
        const expected = 10000 * 0.231 + YEARLY_FIXED;
        assert.strictEqual(round2(result), round2(expected));
    });

    test('yearly contributions at 48000 EUR', () => {
        const result = Tax2026.calculateContributions(48000, false);
        const expected = 48000 * 0.231 + YEARLY_FIXED;
        assert.strictEqual(round2(result), round2(expected));
    });

    test('yearly contributions at 100000 EUR', () => {
        const result = Tax2026.calculateContributions(100000, false);
        const expected = 100000 * 0.231 + YEARLY_FIXED;
        assert.strictEqual(round2(result), round2(expected));
    });

    // Monthly: 23.1% + 37.17 EUR fixed
    const MONTHLY_FIXED = 37.17;

    test('monthly contributions at 0 EUR', () => {
        const result = Tax2026.calculateContributions(0, true);
        assert.strictEqual(round2(result), round2(MONTHLY_FIXED));
    });

    test('monthly contributions at 4000 EUR', () => {
        const result = Tax2026.calculateContributions(4000, true);
        const expected = 4000 * 0.231 + MONTHLY_FIXED;
        assert.strictEqual(round2(result), round2(expected));
    });
});

// ============================================================================
// Relief Tests
// ============================================================================

describe('Tax2026 Relief (calculateRelief)', () => {
    // Yearly thresholds
    const YEARLY_THRESHOLD = 17766.18;
    const YEARLY_BASE = 5551.93;
    const CONTRIBUTION_RATE = 0.231;
    const FIXED_YEARLY_CONTRIBUTION = 37.17 * 12; // 446.04

    test('yearly relief at 0 EUR is capped at 0 (gross - contributions is negative)', () => {
        const result = Tax2026.calculateRelief(0, false);
        assert.strictEqual(round2(result), 0);
    });

    test('yearly relief at 1000 EUR is capped at gross - contributions', () => {
        const result = Tax2026.calculateRelief(1000, false);
        const contributions = 1000 * CONTRIBUTION_RATE + FIXED_YEARLY_CONTRIBUTION;
        const maxRelief = 1000 - contributions;
        assert.strictEqual(round2(result), round2(maxRelief));
    });

    test('yearly relief at threshold (17766.18 EUR)', () => {
        const result = Tax2026.calculateRelief(YEARLY_THRESHOLD, false);
        assert.strictEqual(round2(result), round2(YEARLY_BASE));
    });

    test('yearly relief above threshold (48000 EUR)', () => {
        const result = Tax2026.calculateRelief(48000, false);
        assert.strictEqual(round2(result), round2(YEARLY_BASE));
    });

    test('yearly relief at 100000 EUR', () => {
        const result = Tax2026.calculateRelief(100000, false);
        assert.strictEqual(round2(result), round2(YEARLY_BASE));
    });

    // Monthly thresholds
    const MONTHLY_BASE = 462.66;

    test('monthly relief at 0 EUR is capped at 0', () => {
        const result = Tax2026.calculateRelief(0, true);
        assert.strictEqual(round2(result), 0);
    });

    test('monthly relief above threshold (4000 EUR)', () => {
        const result = Tax2026.calculateRelief(4000, true);
        assert.strictEqual(round2(result), round2(MONTHLY_BASE));
    });
});

// ============================================================================
// Bracket Info Tests
// ============================================================================

describe('Tax2026 Brackets (getBracketInfo, getAllBrackets)', () => {
    test('yearly bracket 0 has correct values', () => {
        const bracket = Tax2026.getBracketInfo(0, false);
        assert.strictEqual(bracket.min, 0);
        assert.strictEqual(bracket.max, 9721.43);
        assert.strictEqual(bracket.rate, 0.16);
    });

    test('yearly bracket 1 has correct values', () => {
        const bracket = Tax2026.getBracketInfo(1, false);
        assert.strictEqual(bracket.min, 9721.43);
        assert.strictEqual(bracket.max, 28592.44);
        assert.strictEqual(bracket.rate, 0.26);
    });

    test('yearly bracket 4 (highest) has correct values', () => {
        const bracket = Tax2026.getBracketInfo(4, false);
        assert.strictEqual(bracket.min, 82346.23);
        assert.strictEqual(bracket.max, Infinity);
        assert.strictEqual(bracket.rate, 0.50);
    });

    test('monthly bracket 0 has correct values', () => {
        const bracket = Tax2026.getBracketInfo(0, true);
        assert.strictEqual(bracket.min, 0);
        assert.strictEqual(bracket.max, 810.12);
        assert.strictEqual(bracket.rate, 0.16);
    });

    test('getAllBrackets returns 5 brackets', () => {
        const yearlyBrackets = Tax2026.getAllBrackets(false);
        const monthlyBrackets = Tax2026.getAllBrackets(true);
        assert.strictEqual(yearlyBrackets.length, 5);
        assert.strictEqual(monthlyBrackets.length, 5);
    });

    test('invalid bracket index returns null', () => {
        assert.strictEqual(Tax2026.getBracketInfo(-1, false), null);
        assert.strictEqual(Tax2026.getBracketInfo(5, false), null);
    });
});

// ============================================================================
// Bracket Tax Tests
// ============================================================================

describe('Tax2026 Bracket Tax (calculateBracketTax)', () => {
    test('tax in bracket 0 with income fully in bracket', () => {
        const taxedIncome = 5000;
        const result = Tax2026.calculateBracketTax(taxedIncome, 0, false);
        assert.strictEqual(round2(result), round2(5000 * 0.16));
    });

    test('tax in bracket 0 with income exceeding bracket', () => {
        const taxedIncome = 15000;
        const result = Tax2026.calculateBracketTax(taxedIncome, 0, false);
        assert.strictEqual(round2(result), round2(9721.43 * 0.16));
    });

    test('tax in bracket 1 with income spanning brackets', () => {
        const taxedIncome = 15000;
        const result = Tax2026.calculateBracketTax(taxedIncome, 1, false);
        const incomeInBracket = 15000 - 9721.43;
        assert.strictEqual(round2(result), round2(incomeInBracket * 0.26));
    });

    test('no tax in higher bracket when income is below', () => {
        const taxedIncome = 5000;
        const result = Tax2026.calculateBracketTax(taxedIncome, 1, false);
        assert.strictEqual(result, 0);
    });

    test('bracket tax at exact boundary', () => {
        const taxedIncome = 9721.43;
        const bracket0Tax = Tax2026.calculateBracketTax(taxedIncome, 0, false);
        const bracket1Tax = Tax2026.calculateBracketTax(taxedIncome, 1, false);
        assert.strictEqual(round2(bracket0Tax), round2(9721.43 * 0.16));
        assert.strictEqual(bracket1Tax, 0);
    });
});

// ============================================================================
// Taxed Income Tests
// ============================================================================

describe('Tax2026 Taxed Income (calculateTaxedIncome)', () => {
    test('taxed income is gross minus contributions minus relief', () => {
        const gross = 48000;
        const contributions = Tax2026.calculateContributions(gross, false);
        const relief = Tax2026.calculateRelief(gross, false);
        const expected = Math.max(0, gross - contributions - relief);
        const result = Tax2026.calculateTaxedIncome(gross, false);
        assert.strictEqual(round2(result), round2(expected));
    });

    test('taxed income is never negative', () => {
        const result = Tax2026.calculateTaxedIncome(0, false);
        assert.ok(result >= 0);
    });

    test('taxed income at low income (may be zero due to high relief)', () => {
        const result = Tax2026.calculateTaxedIncome(1000, false);
        assert.ok(result >= 0);
    });
});

// ============================================================================
// Total Income Tax Tests
// ============================================================================

describe('Tax2026 Total Income Tax (calculateTotalIncomeTax)', () => {
    test('total tax is sum of all bracket taxes', () => {
        const gross = 48000;
        const taxedIncome = Tax2026.calculateTaxedIncome(gross, false);

        let expectedTotal = 0;
        for (let i = 0; i < 5; i++) {
            expectedTotal += Tax2026.calculateBracketTax(taxedIncome, i, false);
        }

        const result = Tax2026.calculateTotalIncomeTax(gross, false);
        assert.strictEqual(round2(result), round2(expectedTotal));
    });

    test('zero gross income results in zero tax', () => {
        const result = Tax2026.calculateTotalIncomeTax(0, false);
        assert.strictEqual(result, 0);
    });

    test('tax is always non-negative', () => {
        const result = Tax2026.calculateTotalIncomeTax(5000, false);
        assert.ok(result >= 0);
    });
});

// ============================================================================
// Employer Tax Tests
// ============================================================================

describe('Tax2026 Employer Tax (calculateEmployerTax)', () => {
    test('employer tax at 0 EUR', () => {
        const result = Tax2026.calculateEmployerTax(0);
        assert.strictEqual(result, 0);
    });

    test('employer tax at 48000 EUR', () => {
        const result = Tax2026.calculateEmployerTax(48000);
        assert.strictEqual(round2(result), round2(48000 * 0.161));
    });

    test('employer tax at 100000 EUR', () => {
        const result = Tax2026.calculateEmployerTax(100000);
        assert.strictEqual(round2(result), round2(100000 * 0.161));
    });
});

// ============================================================================
// Net Income Tests
// ============================================================================

describe('Tax2026 Net Income (calculateNetIncome)', () => {
    test('net income formula: gross - contributions - tax', () => {
        const gross = 48000;
        const contributions = Tax2026.calculateContributions(gross, false);
        const tax = Tax2026.calculateTotalIncomeTax(gross, false);
        const expected = gross - contributions - tax;

        const result = Tax2026.calculateNetIncome(gross, false);
        assert.strictEqual(round2(result), round2(expected));
    });

    test('net income at 0 EUR gross', () => {
        const result = Tax2026.calculateNetIncome(0, false);
        const contributions = Tax2026.calculateContributions(0, false);
        assert.strictEqual(round2(result), round2(-contributions));
    });

    test('net income is less than gross (positive gross)', () => {
        const gross = 48000;
        const result = Tax2026.calculateNetIncome(gross, false);
        assert.ok(result < gross);
        assert.ok(result > 0);
    });
});

// ============================================================================
// Full Breakdown Tests
// ============================================================================

describe('Tax2026 Full Breakdown (getFullBreakdown)', () => {
    test('breakdown fields are consistent', () => {
        const gross = 48000;
        const breakdown = Tax2026.getFullBreakdown(gross, false, true);

        assert.strictEqual(breakdown.grossIncome, gross);

        const expectedTaxedIncome = Math.max(0, gross - breakdown.contributions - breakdown.relief);
        assert.strictEqual(round2(breakdown.taxedIncome), round2(expectedTaxedIncome));

        const expectedNetIncome = gross - breakdown.contributions - breakdown.incomeTax;
        assert.strictEqual(round2(breakdown.netIncome), round2(expectedNetIncome));

        const expectedTotalTax = breakdown.contributions + breakdown.incomeTax + breakdown.employerTax;
        assert.strictEqual(round2(breakdown.totalTax), round2(expectedTotalTax));

        const expectedTotalCost = gross + breakdown.employerTax;
        assert.strictEqual(round2(breakdown.totalCost), round2(expectedTotalCost));
    });

    test('breakdown without employer tax', () => {
        const breakdown = Tax2026.getFullBreakdown(48000, false, false);
        assert.strictEqual(breakdown.employerTax, 0);
        assert.strictEqual(breakdown.totalTax, breakdown.contributions + breakdown.incomeTax);
    });

    test('breakdown with employer tax', () => {
        const breakdown = Tax2026.getFullBreakdown(48000, false, true);
        assert.ok(breakdown.employerTax > 0);
    });

    test('bracket breakdown has 5 entries', () => {
        const breakdown = Tax2026.getFullBreakdown(48000, false, true);
        assert.strictEqual(breakdown.bracketBreakdown.length, 5);
    });

    test('percentages are within valid range', () => {
        const breakdown = Tax2026.getFullBreakdown(48000, false, true);
        assert.ok(breakdown.taxPercentage >= 0 && breakdown.taxPercentage <= 100);
        assert.ok(breakdown.netPercentage >= 0 && breakdown.netPercentage <= 100);
    });

    test('tax and net percentages approximately sum to 100', () => {
        const breakdown = Tax2026.getFullBreakdown(48000, false, true);
        const sum = breakdown.taxPercentage + breakdown.netPercentage;
        assert.ok(Math.abs(sum - 100) < 0.01, `Sum was ${sum}, expected ~100`);
    });

    test('breakdown at zero income', () => {
        const breakdown = Tax2026.getFullBreakdown(0, false, true);
        assert.strictEqual(breakdown.grossIncome, 0);
        assert.strictEqual(breakdown.incomeTax, 0);
        assert.strictEqual(breakdown.employerTax, 0);
    });
});

// ============================================================================
// Monthly vs Yearly Consistency Tests
// ============================================================================

describe('Tax2026 Monthly vs Yearly Consistency', () => {
    test('monthly relief base is yearly divided by 12 (approximately)', () => {
        const yearlyRelief = Tax2026.calculateRelief(100000, false);
        const monthlyRelief = Tax2026.calculateRelief(100000 / 12, true);
        assert.ok(Math.abs(yearlyRelief / 12 - monthlyRelief) < 1);
    });

    test('brackets have consistent rates between monthly and yearly', () => {
        for (let i = 0; i < 5; i++) {
            const yearlyBracket = Tax2026.getBracketInfo(i, false);
            const monthlyBracket = Tax2026.getBracketInfo(i, true);
            assert.strictEqual(yearlyBracket.rate, monthlyBracket.rate);
        }
    });
});
