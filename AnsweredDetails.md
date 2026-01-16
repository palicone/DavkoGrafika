# Answered Details

## Technology & Architecture
- **Tech Stack**: Vanilla HTML/CSS/JS (no frameworks)
- **App Type**: Progressive Web App (PWA)

## UI/UX Decisions
- **Settings Location**: Settings modal (accessed via gear icon)
- **Startup Warnings**: Modal shown every session
- **Language**: Slovenian only

## Default Values
- **Default Max Gross Income (Yearly)**: 100,000 EUR
- **Default Max Gross Income (Monthly)**: ~8,333 EUR (100,000 / 12)
- **Employer Tax Default**: Shown by default

## Interaction Behavior
- **Snapping**: Snap to bracket boundaries when close (within 5%)
- **Income Rounding**:
  - Yearly view: 100 EUR increments
  - Monthly view: 10 EUR increments

## Display Format
- **Number Format**: European format (1.234,56 EUR)
  - Dot as thousand separator
  - Comma for decimal separator
