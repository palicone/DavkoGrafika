/**
 * Davko Grafika - Main Application
 * Slovenian Income Tax Visualization
 */
(function() {
    'use strict';

    // App state
    const state = {
        isMonthly: false,
        maxIncome: 100000,
        showEmployerTax: true,
        grossIncome: 48000,
        taxModule: Tax2025
    };

    // DOM elements
    const elements = {
        warningModal: null,
        settingsModal: null,
        warningAcceptBtn: null,
        settingsBtn: null,
        settingsCloseBtn: null,
        yearlyBtn: null,
        monthlyBtn: null,
        maxIncomeInput: null,
        employerTaxCheckbox: null,
        summaryBar: null,
        taxPortion: null,
        netPortion: null,
        backgroundGrid: null,
        foregroundGrid: null,
        employerTaxGrid: null,
        incomeHandle: null,
        handleAmount: null,
        gridContainer: null
    };

    /**
     * Format number in European format (1.234,56)
     */
    function formatEuro(amount) {
        const rounded = Math.round(amount * 100) / 100;
        const parts = rounded.toFixed(2).split('.');
        const intPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, '.');
        return intPart + ',' + parts[1] + ' EUR';
    }

    /**
     * Format percentage
     */
    function formatPercent(value) {
        return Math.round(value * 10) / 10 + '%';
    }

    /**
     * Round income to appropriate increment
     */
    function roundIncome(income) {
        const increment = state.isMonthly ? 10 : 100;
        return Math.round(income / increment) * increment;
    }

    /**
     * Round income to appropriate increment (no bracket snapping)
     */
    function processIncome(income) {
        return roundIncome(income);
    }

    /**
     * Initialize DOM element references
     */
    function initElements() {
        elements.warningModal = document.getElementById('warningModal');
        elements.settingsModal = document.getElementById('settingsModal');
        elements.warningAcceptBtn = document.getElementById('warningAcceptBtn');
        elements.settingsBtn = document.getElementById('settingsBtn');
        elements.settingsCloseBtn = document.getElementById('settingsCloseBtn');
        elements.yearlyBtn = document.getElementById('yearlyBtn');
        elements.monthlyBtn = document.getElementById('monthlyBtn');
        elements.maxIncomeInput = document.getElementById('maxIncomeInput');
        elements.employerTaxCheckbox = document.getElementById('employerTaxCheckbox');
        elements.summaryBar = document.getElementById('summaryBar');
        elements.taxPortion = document.getElementById('taxPortion');
        elements.netPortion = document.getElementById('netPortion');
        elements.backgroundGrid = document.getElementById('backgroundGrid');
        elements.foregroundGrid = document.getElementById('foregroundGrid');
        elements.employerTaxGrid = document.getElementById('employerTaxGrid');
        elements.incomeHandle = document.getElementById('incomeHandle');
        elements.handleAmount = document.getElementById('handleAmount');
        elements.gridContainer = document.getElementById('gridContainer');
    }

    /**
     * Initialize event listeners
     */
    function initEventListeners() {
        // Warning modal
        elements.warningAcceptBtn.addEventListener('click', () => {
            elements.warningModal.classList.add('hidden');
        });

        // Settings modal
        elements.settingsBtn.addEventListener('click', () => {
            elements.settingsModal.classList.remove('hidden');
        });

        elements.settingsCloseBtn.addEventListener('click', () => {
            elements.settingsModal.classList.add('hidden');
        });

        elements.settingsModal.addEventListener('click', (e) => {
            if (e.target === elements.settingsModal) {
                elements.settingsModal.classList.add('hidden');
            }
        });

        // Yearly/Monthly toggle
        elements.yearlyBtn.addEventListener('click', () => {
            if (state.isMonthly) {
                state.isMonthly = false;
                state.maxIncome = parseFloat(elements.maxIncomeInput.value) || 100000;
                state.grossIncome = Math.min(state.grossIncome * 12, state.maxIncome);
                elements.yearlyBtn.classList.add('active');
                elements.monthlyBtn.classList.remove('active');
                updateVisualization();
            }
        });

        elements.monthlyBtn.addEventListener('click', () => {
            if (!state.isMonthly) {
                state.isMonthly = true;
                state.maxIncome = Math.round((parseFloat(elements.maxIncomeInput.value) || 100000) / 12);
                state.grossIncome = Math.min(state.grossIncome / 12, state.maxIncome);
                elements.yearlyBtn.classList.remove('active');
                elements.monthlyBtn.classList.add('active');
                updateVisualization();
            }
        });

        // Max income input
        elements.maxIncomeInput.addEventListener('change', () => {
            let value = parseFloat(elements.maxIncomeInput.value) || 100000;
            value = Math.max(10000, value);
            elements.maxIncomeInput.value = value;
            state.maxIncome = state.isMonthly ? Math.round(value / 12) : value;
            state.grossIncome = Math.min(state.grossIncome, state.maxIncome);
            updateVisualization();
        });

        // Employer tax checkbox
        elements.employerTaxCheckbox.addEventListener('change', () => {
            state.showEmployerTax = elements.employerTaxCheckbox.checked;
            updateVisualization();
        });

        // Handle dragging
        initHandleDrag();
    }

    /**
     * Initialize handle drag functionality
     */
    function initHandleDrag() {
        let isDragging = false;

        const getIncomeFromY = (clientY) => {
            const rect = elements.gridContainer.getBoundingClientRect();
            const gridHeight = rect.height;
            const relativeY = rect.bottom - clientY;
            const scaleFactor = getGridScaleFactor();
            // The visible area for gross income is scaled, so we need to reverse the scaling
            const percentage = Math.max(0, Math.min(1, relativeY / (gridHeight * scaleFactor)));
            return percentage * state.maxIncome;
        };

        const handleStart = (e) => {
            isDragging = true;
            const clientY = e.type.includes('touch') ? e.touches[0].clientY : e.clientY;
            startY = clientY;
            startIncome = state.grossIncome;
            elements.incomeHandle.style.cursor = 'grabbing';
        };

        const handleMove = (e) => {
            if (!isDragging) return;
            e.preventDefault();

            const clientY = e.type.includes('touch') ? e.touches[0].clientY : e.clientY;
            const newIncome = getIncomeFromY(clientY);
            const snappedIncome = processIncome(newIncome);

            state.grossIncome = Math.max(0, Math.min(state.maxIncome, snappedIncome));
            updateVisualization();
        };

        const handleEnd = () => {
            isDragging = false;
            elements.incomeHandle.style.cursor = 'grab';
        };

        // Mouse events
        elements.incomeHandle.addEventListener('mousedown', handleStart);
        document.addEventListener('mousemove', handleMove);
        document.addEventListener('mouseup', handleEnd);

        // Touch events
        elements.incomeHandle.addEventListener('touchstart', handleStart, { passive: false });
        document.addEventListener('touchmove', handleMove, { passive: false });
        document.addEventListener('touchend', handleEnd);

        // Click on grid to set income
        elements.gridContainer.addEventListener('click', (e) => {
            if (e.target === elements.incomeHandle || elements.incomeHandle.contains(e.target)) return;

            const newIncome = getIncomeFromY(e.clientY);
            const snappedIncome = processIncome(newIncome);
            state.grossIncome = Math.max(0, Math.min(state.maxIncome, snappedIncome));
            updateVisualization();
        });
    }

    /**
     * Calculate the scale factor for grid heights when employer tax is enabled.
     * This reserves space at the top for the employer tax portion.
     * @returns {number} Scale factor (0-1), where 1 means no reservation
     */
    function getGridScaleFactor() {
        if (!state.showEmployerTax) {
            return 1;
        }
        // Reserve space for employer tax on maxIncome
        // Total visual height = maxIncome + (maxIncome * employerTaxRate)
        // Scale factor = maxIncome / totalHeight
        const employerTaxRate = state.taxModule.EMPLOYER_TAX_RATE;
        return 1 / (1 + employerTaxRate);
    }

    /**
     * Render background grid (tax brackets)
     */
    function renderBackgroundGrid() {
        const brackets = state.taxModule.getAllBrackets(state.isMonthly);
        const maxIncome = state.maxIncome;
        const scaleFactor = getGridScaleFactor();

        // Set the background grid height to leave room for employer tax
        const gridHeightPercent = scaleFactor * 100;
        elements.backgroundGrid.style.height = `${gridHeightPercent}%`;
        elements.backgroundGrid.style.top = 'auto'; // Remove top positioning

        let html = '';

        for (let i = 0; i < brackets.length; i++) {
            const bracket = brackets[i];
            const bracketMin = bracket.min;
            const bracketMax = bracket.max === Infinity ? maxIncome * 1.5 : bracket.max;

            // Only show brackets that are within the visible range
            if (bracketMin >= maxIncome) continue;

            const visibleMax = Math.min(bracketMax, maxIncome);
            const bracketRange = visibleMax - bracketMin;
            const heightPercent = (bracketRange / maxIncome) * 100;

            // Tax portion width based on rate
            const taxWidth = bracket.rate * 100;
            const netWidth = 100 - taxWidth;

            // Show maxIncome as limit if bracket extends beyond visible range
            const limitText = bracket.max > maxIncome ? formatEuro(maxIncome) : formatEuro(bracket.max);
            const rateText = Math.round(bracket.rate * 100) + '%';

            html += `
                <div class="bg-bracket" style="height: ${heightPercent}%;">
                    <div class="bg-bracket-tax" style="width: ${taxWidth}%;">
                        <span class="bg-bracket-rate">${rateText}</span>
                    </div>
                    <div class="bg-bracket-net" style="width: ${netWidth}%;">
                        <span class="bg-bracket-limit">${limitText}</span>
                    </div>
                </div>
            `;
        }

        elements.backgroundGrid.innerHTML = html;
    }

    /**
     * Render foreground grid (current income breakdown)
     *
     * Structure from bottom to top:
     * 1. Tax brackets (taxed income split into tax/net)
     * 2. Relief (green - untaxed)
     * 3. Contributions (dark gray - deducted from gross)
     * -- Handle sits here at gross income level --
     * 4. Employer tax (above handle, if enabled) - rendered separately
     */
    function renderForegroundGrid() {
        const breakdown = state.taxModule.getFullBreakdown(
            state.grossIncome,
            state.isMonthly,
            state.showEmployerTax
        );

        const maxIncome = state.maxIncome;
        const gridHeight = elements.gridContainer.offsetHeight;

        // Build sections array from bottom to top (below handle)
        const sections = [];

        // 1. Tax brackets (from lowest to highest)
        const brackets = state.taxModule.getAllBrackets(state.isMonthly);

        for (let i = 0; i < brackets.length; i++) {
            const bracket = brackets[i];
            const bracketTax = breakdown.bracketBreakdown[i].tax;

            // Skip if no income in this bracket
            if (breakdown.taxedIncome <= bracket.min) continue;

            const incomeInBracket = Math.min(breakdown.taxedIncome, bracket.max) - bracket.min;
            const netInBracket = incomeInBracket - bracketTax;

            sections.push({
                type: 'bracket',
                height: incomeInBracket,
                tax: bracketTax,
                net: netInBracket,
                rate: bracket.rate
            });
        }

        // 2. Relief (sits above taxed income)
        if (breakdown.relief > 0) {
            sections.push({
                type: 'relief',
                height: breakdown.relief,
                amount: breakdown.relief
            });
        }

        // 3. Contributions (sits below gross income / at handle level)
        if (breakdown.contributions > 0) {
            sections.push({
                type: 'contributions',
                height: breakdown.contributions,
                amount: breakdown.contributions,
                percent: breakdown.grossIncome > 0 ? (breakdown.contributions / breakdown.grossIncome) * 100 : 0
            });
        }

        // Calculate total height of foreground (should equal grossIncome)
        const scaleFactor = getGridScaleFactor();
        const foregroundHeightPercent = (state.grossIncome / maxIncome) * scaleFactor * 100;

        // Set the foreground grid height so child percentage heights work
        elements.foregroundGrid.style.height = `${foregroundHeightPercent}%`;

        // Render sections below handle
        let html = '';

        for (const section of sections) {
            // Height relative to grossIncome (the foreground container height)
            const heightPercent = (section.height / state.grossIncome) * 100;
            const heightPx = (foregroundHeightPercent / 100) * gridHeight * (heightPercent / 100);
            const sizeClass = heightPx < 30 ? 'tiny' : heightPx < 60 ? 'small' : 'normal';

            if (section.type === 'bracket') {
                const taxWidth = section.rate * 100;
                const netWidth = 100 - taxWidth;

                html += `
                    <div class="fg-bracket" style="height: ${heightPercent}%;" data-height="${sizeClass}">
                        <div class="fg-bracket-tax" style="width: ${taxWidth}%;">
                            <span class="fg-section-center">${formatEuro(section.tax)}</span>
                            <span class="fg-section-corner">${Math.round(section.rate * 100)}%</span>
                        </div>
                        <div class="fg-bracket-net" style="width: ${netWidth}%;">
                            <span class="fg-section-center">${formatEuro(section.net)}</span>
                        </div>
                    </div>
                `;
            } else if (section.type === 'relief') {
                html += `
                    <div class="fg-section" style="height: ${heightPercent}%;" data-height="${sizeClass}">
                        <div class="fg-section-full fg-relief">
                            <span class="fg-section-center">OLAJSAVE ${formatEuro(section.amount)}</span>
                        </div>
                    </div>
                `;
            } else if (section.type === 'contributions') {
                html += `
                    <div class="fg-section" style="height: ${heightPercent}%;" data-height="${sizeClass}">
                        <div class="fg-section-full fg-contributions">
                            <span class="fg-section-center">PRISPEVKI DELAVCA ${formatEuro(section.amount)}</span>
                            <span class="fg-section-corner">${formatPercent(section.percent)}</span>
                        </div>
                    </div>
                `;
            }
        }

        elements.foregroundGrid.innerHTML = html;

        // Render employer tax above handle (separate grid)
        renderEmployerTaxGrid(breakdown, maxIncome, gridHeight);
    }

    /**
     * Render employer tax grid (above handle)
     */
    function renderEmployerTaxGrid(breakdown, maxIncome, gridHeight) {
        if (!state.showEmployerTax || breakdown.employerTax <= 0) {
            elements.employerTaxGrid.innerHTML = '';
            elements.employerTaxGrid.style.bottom = '';
            elements.employerTaxGrid.style.height = '';
            return;
        }

        const scaleFactor = getGridScaleFactor();
        const handlePosition = (state.grossIncome / maxIncome) * scaleFactor * 100;
        const employerTaxHeight = (breakdown.employerTax / maxIncome) * scaleFactor * 100;
        const heightPx = (employerTaxHeight / 100) * gridHeight;
        const sizeClass = heightPx < 30 ? 'tiny' : heightPx < 60 ? 'small' : 'normal';

        // Position employer tax grid to start at handle level
        elements.employerTaxGrid.style.bottom = `${handlePosition}%`;
        elements.employerTaxGrid.style.height = `${employerTaxHeight}%`;

        elements.employerTaxGrid.innerHTML = `
            <div class="fg-section" style="height: 100%;" data-height="${sizeClass}">
                <div class="fg-section-full fg-contributions fg-employer-tax">
                    <span class="fg-section-center">PRISPEVKI DELODAJALCA ${formatEuro(breakdown.employerTax)}</span>
                    <span class="fg-section-corner">${formatPercent(state.taxModule.EMPLOYER_TAX_RATE * 100)}</span>
                </div>
            </div>
        `;
    }

    /**
     * Update the income handle position
     */
    function updateHandle() {
        const maxIncome = state.maxIncome;
        const scaleFactor = getGridScaleFactor();
        const handlePosition = (state.grossIncome / maxIncome) * scaleFactor * 100;

        // Position from bottom
        elements.incomeHandle.style.bottom = `${handlePosition}%`;
        elements.handleAmount.textContent = formatEuro(state.grossIncome);
    }

    /**
     * Update the summary bar
     */
    function updateSummaryBar() {
        const breakdown = state.taxModule.getFullBreakdown(
            state.grossIncome,
            state.isMonthly,
            state.showEmployerTax
        );

        // Update widths
        elements.taxPortion.style.width = `${breakdown.taxPercentage}%`;
        elements.netPortion.style.width = `${breakdown.netPercentage}%`;

        // Update tax portion text
        elements.taxPortion.querySelector('.amount').textContent = formatEuro(breakdown.totalTax);
        elements.taxPortion.querySelector('.percentage').textContent = formatPercent(breakdown.taxPercentage);

        // Update net portion text
        elements.netPortion.querySelector('.amount').textContent = formatEuro(breakdown.netIncome);
        elements.netPortion.querySelector('.percentage').textContent = formatPercent(breakdown.netPercentage);
    }

    /**
     * Update all visualization elements
     */
    function updateVisualization() {
        renderBackgroundGrid();
        renderForegroundGrid();
        updateHandle();
        updateSummaryBar();
    }

    /**
     * Initialize the application
     */
    function init() {
        initElements();
        initEventListeners();

        // Set initial values from inputs
        state.maxIncome = parseFloat(elements.maxIncomeInput.value) || 100000;
        state.showEmployerTax = elements.employerTaxCheckbox.checked;
        state.grossIncome = Math.min(state.grossIncome, state.maxIncome);

        // Initial render
        updateVisualization();
    }

    // Start app when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    // Register service worker
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('sw.js')
                .then(reg => console.log('Service Worker registered'))
                .catch(err => console.log('Service Worker registration failed:', err));
        });
    }
})();
