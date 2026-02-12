/**
 * Davkografika - Main Application
 * Slovenian Income Tax Visualization
 */
(function() {
    'use strict';

    const STORAGE_KEY = 'davkografika-state';

    // App state
    const state = {
        isMonthly: false,
        maxIncome: 100000,
        showEmployerTax: true,
        grossIncome: 48000,
        taxModule: Tax2026,
        dailyFoodComp: 7.96,
        dailyCommuteComp: 5,
        vacationDays: 20,
        vacationAllowance: 1854,
        companyBonus: 1854,
        showUntaxed: false,
        childrenCount: 2,
        specialNeedsCount: 0,
        childrenMonths: 12,
        isStudent: false,
        isYoungAdult: false
    };

    // DOM elements
    const elements = {
        warningModal: null,
        settingsModal: null,
        warningAcceptBtn: null,
        settingsBtn: null,
        settingsOkBtn: null,
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
        gridContainer: null,
        shareBtn: null,
        toast: null,
        foodCompInput: null,
        commuteCompInput: null,
        vacationDaysInput: null,
        vacationAllowanceInput: null,
        companyBonusInput: null,
        showUntaxedCheckbox: null,
        untaxedSettings: null,
        untaxedGrid: null,
        yearSelect: null,
        childrenCountInput: null,
        specialNeedsInput: null,
        childrenMonthsInput: null,
        studentCheckbox: null,
        youngAdultCheckbox: null
    };

    /**
     * Save state to localStorage
     */
    function saveState() {
        try {
            const data = {
                taxYear: elements.yearSelect.value,
                isMonthly: state.isMonthly,
                maxIncomeInput: parseFloat(elements.maxIncomeInput.value) || 100000,
                showEmployerTax: state.showEmployerTax,
                grossIncome: state.grossIncome,
                dailyFoodComp: state.dailyFoodComp,
                dailyCommuteComp: state.dailyCommuteComp,
                vacationDays: state.vacationDays,
                vacationAllowance: state.vacationAllowance,
                companyBonus: state.companyBonus,
                showUntaxed: state.showUntaxed,
                childrenCount: state.childrenCount,
                specialNeedsCount: state.specialNeedsCount,
                childrenMonths: state.childrenMonths,
                isStudent: state.isStudent,
                isYoungAdult: state.isYoungAdult
            };
            localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
        } catch (e) {
            // localStorage unavailable or full - ignore
        }
    }

    /**
     * Load state from localStorage and apply to state + form inputs
     * @returns {boolean} true if state was restored
     */
    function loadState() {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (!raw) return false;
            const data = JSON.parse(raw);

            // Restore year selection
            if (data.taxYear != null) {
                elements.yearSelect.value = data.taxYear;
                const taxModules = { '2025': Tax2025, '2026': Tax2026 };
                state.taxModule = taxModules[data.taxYear] || Tax2026;
            }

            // Restore form inputs
            if (data.maxIncomeInput != null) elements.maxIncomeInput.value = data.maxIncomeInput;
            if (data.showEmployerTax != null) elements.employerTaxCheckbox.checked = data.showEmployerTax;
            if (data.showUntaxed != null) elements.showUntaxedCheckbox.checked = data.showUntaxed;
            if (data.dailyFoodComp != null) elements.foodCompInput.value = data.dailyFoodComp;
            if (data.dailyCommuteComp != null) elements.commuteCompInput.value = data.dailyCommuteComp;
            if (data.vacationDays != null) elements.vacationDaysInput.value = data.vacationDays;
            if (data.vacationAllowance != null) elements.vacationAllowanceInput.value = data.vacationAllowance;
            if (data.companyBonus != null) elements.companyBonusInput.value = data.companyBonus;
            if (data.childrenCount != null) elements.childrenCountInput.value = data.childrenCount;
            if (data.specialNeedsCount != null) elements.specialNeedsInput.value = data.specialNeedsCount;
            if (data.childrenMonths != null) elements.childrenMonthsInput.value = data.childrenMonths;
            if (data.isStudent != null) elements.studentCheckbox.checked = data.isStudent;
            if (data.isYoungAdult != null) elements.youngAdultCheckbox.checked = data.isYoungAdult;

            // Restore toggle state
            if (data.isMonthly) {
                elements.yearlyBtn.classList.remove('active');
                elements.monthlyBtn.classList.add('active');
            }

            // Restore state values
            state.isMonthly = !!data.isMonthly;
            state.showEmployerTax = !!data.showEmployerTax;
            state.showUntaxed = !!data.showUntaxed;
            state.dailyFoodComp = data.dailyFoodComp ?? 7.96;
            state.dailyCommuteComp = data.dailyCommuteComp ?? 5;
            state.vacationDays = data.vacationDays ?? 20;
            state.vacationAllowance = data.vacationAllowance ?? 1854;
            state.companyBonus = data.companyBonus ?? 1854;
            state.childrenCount = data.childrenCount ?? 2;
            state.specialNeedsCount = Math.min(data.specialNeedsCount ?? 0, state.childrenCount);
            state.childrenMonths = data.childrenMonths ?? 12;
            state.isStudent = !!data.isStudent;
            state.isYoungAdult = !!data.isYoungAdult;

            const maxInput = data.maxIncomeInput || 100000;
            state.maxIncome = state.isMonthly ? Math.round(maxInput / 12) : maxInput;
            state.grossIncome = Math.max(0, Math.min(data.grossIncome ?? 48000, state.maxIncome));

            return true;
        } catch (e) {
            return false;
        }
    }

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
        elements.settingsOkBtn = document.getElementById('settingsOkBtn');
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
        elements.shareBtn = document.getElementById('shareBtn');
        elements.toast = document.getElementById('toast');
        elements.foodCompInput = document.getElementById('foodCompInput');
        elements.commuteCompInput = document.getElementById('commuteCompInput');
        elements.vacationDaysInput = document.getElementById('vacationDaysInput');
        elements.vacationAllowanceInput = document.getElementById('vacationAllowanceInput');
        elements.companyBonusInput = document.getElementById('companyBonusInput');
        elements.showUntaxedCheckbox = document.getElementById('showUntaxedCheckbox');
        elements.untaxedSettings = document.getElementById('untaxedSettings');
        elements.untaxedGrid = document.getElementById('untaxedGrid');
        elements.yearSelect = document.getElementById('yearSelect');
        elements.childrenCountInput = document.getElementById('childrenCountInput');
        elements.specialNeedsInput = document.getElementById('specialNeedsInput');
        elements.childrenMonthsInput = document.getElementById('childrenMonthsInput');
        elements.studentCheckbox = document.getElementById('studentCheckbox');
        elements.youngAdultCheckbox = document.getElementById('youngAdultCheckbox');
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

        elements.settingsOkBtn.addEventListener('click', () => {
            elements.settingsModal.classList.add('hidden');
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

        // Year select
        elements.yearSelect.addEventListener('change', () => {
            const year = elements.yearSelect.value;
            const taxModules = { '2025': Tax2025, '2026': Tax2026 };
            state.taxModule = taxModules[year] || Tax2026;
            updateVisualization();
        });

        // Employer tax checkbox
        elements.employerTaxCheckbox.addEventListener('change', () => {
            state.showEmployerTax = elements.employerTaxCheckbox.checked;
            updateVisualization();
        });

        // Show untaxed checkbox
        elements.showUntaxedCheckbox.addEventListener('change', () => {
            state.showUntaxed = elements.showUntaxedCheckbox.checked;
            elements.untaxedSettings.classList.toggle('disabled', !state.showUntaxed);
            updateVisualization();
        });

        // Compensation and allowance inputs
        elements.foodCompInput.addEventListener('change', () => {
            state.dailyFoodComp = Math.max(0, parseFloat(elements.foodCompInput.value) || 0);
            updateVisualization();
        });

        elements.commuteCompInput.addEventListener('change', () => {
            state.dailyCommuteComp = Math.max(0, parseFloat(elements.commuteCompInput.value) || 0);
            updateVisualization();
        });

        elements.vacationDaysInput.addEventListener('change', () => {
            state.vacationDays = Math.max(0, Math.min(365, parseInt(elements.vacationDaysInput.value) || 0));
            updateVisualization();
        });

        elements.vacationAllowanceInput.addEventListener('change', () => {
            state.vacationAllowance = Math.max(0, parseFloat(elements.vacationAllowanceInput.value) || 0);
            updateVisualization();
        });

        elements.companyBonusInput.addEventListener('change', () => {
            state.companyBonus = Math.max(0, parseFloat(elements.companyBonusInput.value) || 0);
            updateVisualization();
        });

        // Children count
        elements.childrenCountInput.addEventListener('change', () => {
            state.childrenCount = Math.max(0, parseInt(elements.childrenCountInput.value) || 0);
            // Clamp special needs to children count
            elements.specialNeedsInput.max = state.childrenCount;
            if (state.specialNeedsCount > state.childrenCount) {
                state.specialNeedsCount = state.childrenCount;
                elements.specialNeedsInput.value = state.specialNeedsCount;
            }
            updateVisualization();
        });

        // Special needs count
        elements.specialNeedsInput.addEventListener('change', () => {
            state.specialNeedsCount = Math.max(0, Math.min(state.childrenCount, parseInt(elements.specialNeedsInput.value) || 0));
            elements.specialNeedsInput.value = state.specialNeedsCount;
            updateVisualization();
        });

        // Children months
        elements.childrenMonthsInput.addEventListener('change', () => {
            state.childrenMonths = Math.max(0, Math.min(12, parseInt(elements.childrenMonthsInput.value) || 0));
            elements.childrenMonthsInput.value = state.childrenMonths;
            updateVisualization();
        });

        // Student checkbox
        elements.studentCheckbox.addEventListener('change', () => {
            state.isStudent = elements.studentCheckbox.checked;
            if (state.isStudent) {
                state.isYoungAdult = false;
                elements.youngAdultCheckbox.checked = false;
                elements.youngAdultCheckbox.disabled = true;
            } else {
                elements.youngAdultCheckbox.disabled = false;
            }
            updateVisualization();
        });

        // Young adult checkbox
        elements.youngAdultCheckbox.addEventListener('change', () => {
            state.isYoungAdult = elements.youngAdultCheckbox.checked;
            updateVisualization();
        });

        // Share button
        elements.shareBtn.addEventListener('click', () => {
            const shareData = {
                title: 'Davkografika',
                url: 'https://davkografika.palic.si'
            };
            if (navigator.share) {
                navigator.share(shareData).catch(() => {});
            } else {
                navigator.clipboard.writeText(shareData.url).then(() => {
                    showToast('Povezava kopirana');
                });
            }
        });

        // Handle dragging
        initHandleDrag();
    }

    /**
     * Show a toast notification
     */
    function showToast(message) {
        elements.toast.textContent = message;
        elements.toast.classList.remove('hidden');
        // Trigger reflow to restart transition
        elements.toast.offsetHeight;
        elements.toast.classList.add('show');
        setTimeout(() => {
            elements.toast.classList.remove('show');
            setTimeout(() => {
                elements.toast.classList.add('hidden');
            }, 300);
        }, 2000);
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
     * Build options object for getFullBreakdownWithExtras
     */
    function getExtrasOptions() {
        return {
            includeEmployerTax: state.showEmployerTax,
            vacationAllowance: state.showUntaxed ? state.vacationAllowance : 0,
            companyBonus: state.showUntaxed ? state.companyBonus : 0,
            dailyFoodComp: state.showUntaxed ? state.dailyFoodComp : 0,
            dailyCommuteComp: state.showUntaxed ? state.dailyCommuteComp : 0,
            vacationDays: state.showUntaxed ? state.vacationDays : 0,
            childrenCount: state.childrenCount,
            specialNeedsCount: state.specialNeedsCount,
            childrenMonths: state.childrenMonths,
            isStudent: state.isStudent,
            isYoungAdult: state.isYoungAdult
        };
    }

    /**
     * Calculate the scale factor for grid heights.
     * Reserves space at the top for untaxed extras and employer tax.
     * @returns {number} Scale factor (0-1), where 1 means no reservation
     */
    function getGridScaleFactor() {
        // Calculate what appears above the handle at maxIncome
        const breakdown = state.taxModule.getFullBreakdownWithExtras(
            state.maxIncome, state.isMonthly, getExtrasOptions()
        );
        const totalAbove = breakdown.totalAboveHandle + breakdown.totalEmployerTax;
        if (totalAbove <= 0) return 1;
        return state.maxIncome / (state.maxIncome + totalAbove);
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
     * 4. Untaxed extras (above handle) - rendered separately
     * 5. Employer tax (above untaxed) - rendered separately
     */
    function renderForegroundGrid() {
        const breakdown = state.taxModule.getFullBreakdownWithExtras(
            state.grossIncome,
            state.isMonthly,
            getExtrasOptions()
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

        // 2. Taxed income line (between brackets and relief)
        if (breakdown.taxedIncome > 0) {
            sections.push({
                type: 'taxedIncomeLine',
                height: 0,
                amount: breakdown.taxedIncome
            });
        }

        // 3. Relief (sits above taxed income)
        if (breakdown.relief > 0) {
            sections.push({
                type: 'relief',
                height: breakdown.relief,
                amount: breakdown.relief
            });
        }

        // 4. Contributions (height = gross contributions only, text = total contributions)
        if (breakdown.contributions > 0) {
            sections.push({
                type: 'contributions',
                height: breakdown.contributions,
                amount: breakdown.totalContributions,
                percent: breakdown.grossIncome > 0 ? (breakdown.totalContributions / breakdown.grossIncome) * 100 : 0
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
            } else if (section.type === 'taxedIncomeLine') {
                html += `
                    <div class="fg-taxed-income-line">
                        <div class="fg-taxed-income-label">OSNOVA ZA DOHODNINO: ${formatEuro(section.amount)}</div>
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

        // Render untaxed extras above handle
        renderUntaxedGrid(breakdown, maxIncome, gridHeight);

        // Render employer tax above untaxed extras
        renderEmployerTaxGrid(breakdown, maxIncome, gridHeight);
    }

    /**
     * Render untaxed extras grid (above handle, below employer tax)
     * Layout (bottom to top): bonus contributions (gray) → combined untaxed (green)
     */
    function renderUntaxedGrid(breakdown, maxIncome, gridHeight) {
        const totalAbove = breakdown.totalAboveHandle;
        if (totalAbove <= 0) {
            elements.untaxedGrid.innerHTML = '';
            elements.untaxedGrid.style.bottom = '';
            elements.untaxedGrid.style.height = '';
            return;
        }

        const scaleFactor = getGridScaleFactor();
        const handlePosition = (state.grossIncome / maxIncome) * scaleFactor * 100;
        const untaxedHeight = (totalAbove / maxIncome) * scaleFactor * 100;

        elements.untaxedGrid.style.bottom = `${handlePosition}%`;
        elements.untaxedGrid.style.height = `${untaxedHeight}%`;

        const bonusContrib = breakdown.bonusContributions;
        const untaxedNet = totalAbove - bonusContrib;

        let html = '';

        // Bottom block: bonus contributions (gray, full width) - just above handle
        if (bonusContrib > 0) {
            const contribPercent = (bonusContrib / totalAbove) * 100;
            const contribPx = (untaxedHeight / 100) * gridHeight * (contribPercent / 100);
            const contribSize = contribPx < 30 ? 'tiny' : contribPx < 60 ? 'small' : 'normal';
            html += `
                <div class="fg-section" style="height: ${contribPercent}%;" data-height="${contribSize}">
                    <div class="fg-section-full fg-contributions">
                        <span class="fg-section-center">PRISPEVKI BOŽIČNICA ${formatEuro(bonusContrib)}</span>
                    </div>
                </div>
            `;
        }

        // Upper block: combined untaxed (green, full width)
        if (untaxedNet > 0) {
            const netPercent = (untaxedNet / totalAbove) * 100;
            const netPx = (untaxedHeight / 100) * gridHeight * (netPercent / 100);
            const netSize = netPx < 30 ? 'tiny' : netPx < 60 ? 'small' : 'normal';
            html += `
                <div class="fg-section" style="height: ${netPercent}%;" data-height="${netSize}">
                    <div class="fg-section-full fg-relief">
                        <span class="fg-section-center">MALICA, PREVOZ, REGRES, POSL. USP. ${formatEuro(untaxedNet)}</span>
                    </div>
                </div>
            `;
        }

        elements.untaxedGrid.innerHTML = html;
    }

    /**
     * Render employer tax grid (above untaxed extras)
     */
    function renderEmployerTaxGrid(breakdown, maxIncome, gridHeight) {
        if (!state.showEmployerTax || breakdown.totalEmployerTax <= 0) {
            elements.employerTaxGrid.innerHTML = '';
            elements.employerTaxGrid.style.bottom = '';
            elements.employerTaxGrid.style.height = '';
            return;
        }

        const scaleFactor = getGridScaleFactor();
        const handlePosition = (state.grossIncome / maxIncome) * scaleFactor * 100;
        const untaxedHeight = (breakdown.totalAboveHandle / maxIncome) * scaleFactor * 100;
        const employerTaxHeight = (breakdown.totalEmployerTax / maxIncome) * scaleFactor * 100;
        const heightPx = (employerTaxHeight / 100) * gridHeight;
        const sizeClass = heightPx < 30 ? 'tiny' : heightPx < 60 ? 'small' : 'normal';

        // Position employer tax grid above handle + untaxed extras
        elements.employerTaxGrid.style.bottom = `${handlePosition + untaxedHeight}%`;
        elements.employerTaxGrid.style.height = `${employerTaxHeight}%`;

        elements.employerTaxGrid.innerHTML = `
            <div class="fg-section" style="height: 100%;" data-height="${sizeClass}">
                <div class="fg-section-full fg-contributions fg-employer-tax">
                    <span class="fg-section-center">PRISPEVKI DELODAJALCA ${formatEuro(breakdown.totalEmployerTax)}</span>
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
        const breakdown = state.taxModule.getFullBreakdownWithExtras(
            state.grossIncome,
            state.isMonthly,
            getExtrasOptions()
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
        saveState();
    }

    /**
     * Initialize the application
     */
    function init() {
        initElements();
        initEventListeners();

        // Restore saved state, or fall back to defaults from HTML inputs
        if (!loadState()) {
            state.maxIncome = parseFloat(elements.maxIncomeInput.value) || 100000;
            state.showEmployerTax = elements.employerTaxCheckbox.checked;
            state.dailyFoodComp = parseFloat(elements.foodCompInput.value) || 7.96;
            state.dailyCommuteComp = parseFloat(elements.commuteCompInput.value) || 5;
            state.vacationDays = parseInt(elements.vacationDaysInput.value) || 20;
            state.vacationAllowance = parseFloat(elements.vacationAllowanceInput.value) || 1854;
            state.companyBonus = parseFloat(elements.companyBonusInput.value) || 1854;
            state.showUntaxed = elements.showUntaxedCheckbox.checked;
            state.childrenCount = parseInt(elements.childrenCountInput.value) || 2;
            state.specialNeedsCount = parseInt(elements.specialNeedsInput.value) || 0;
            state.childrenMonths = parseInt(elements.childrenMonthsInput.value) || 12;
            state.isStudent = elements.studentCheckbox.checked;
            state.isYoungAdult = elements.youngAdultCheckbox.checked;
            state.grossIncome = Math.min(state.grossIncome, state.maxIncome);
        }
        elements.untaxedSettings.classList.toggle('disabled', !state.showUntaxed);
        elements.specialNeedsInput.max = state.childrenCount;
        if (state.isStudent) {
            elements.youngAdultCheckbox.disabled = true;
        }

        // Initial render
        updateVisualization();
    }

    // Start app when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    // Register service worker with update detection
    if ('serviceWorker' in navigator) {
        let refreshing = false;
        navigator.serviceWorker.addEventListener('controllerchange', () => {
            if (refreshing) return;
            refreshing = true;
            window.location.reload();
        });

        navigator.serviceWorker.addEventListener('message', (event) => {
            if (event.data && event.data.type === 'VERSION') {
                const versionEl = document.getElementById('appVersion');
                if (versionEl) versionEl.textContent = event.data.version;
            }
        });

        window.addEventListener('load', () => {
            navigator.serviceWorker.register('sw.js')
                .then(reg => {
                    console.log('Service Worker registered');
                    reg.update();
                    if (navigator.serviceWorker.controller) {
                        navigator.serviceWorker.controller.postMessage('GET_VERSION');
                    }
                    // Also request version from active/waiting worker
                    const sw = reg.active || reg.installing || reg.waiting;
                    if (sw) {
                        sw.postMessage('GET_VERSION');
                    }
                })
                .catch(err => console.log('Service Worker registration failed:', err));
        });
    }
})();
