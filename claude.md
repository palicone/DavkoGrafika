# Title
Slovenian income tax visualization app

# Description
A progressive web app to visualize the tax from income.
The app will allow users to input their income and see
how much tax they owe based on Slovenia's progressive tax brackets.
The tax is spilt into social security contributions and income tax.
Contributions are called "prispevki" and income tax is called "dohodnina" in Slovenian.
There is also a tax which the employer pays on behalf of the employee called "davek na dohodke iz delovnega razmerja".
There are vacation allowence ("regres") and company bonus ("bozicnica") which both have untaxed part.
There are no security contributions from vacation allownce but there are from company bonus.
Company also pays food and commute to work and home compensation which are both untaxed and without security contributions to certain ammounts.

# Tax calculation model
The income or gross income is what the employer pays the employee before any deductions.
The net income is what the employee takes home after all deductions plus vacation allowence plus company bonus plus food and commute compensation.
Employee contributions for taxed income determination (prispevki) are calculated based on gross income.
The relief (olajsava) is calculated based on gross income.
The taxed income is gross income minus employee contributions (without the part from the company bonus) minus relief.
The income tax (dohodnina) is calculated based on the taxed income according to progressive brackets.
The employer tax is calculated based on gross income plus employer contributions from company bonus.
Complete taxes are contributions (from gross and company bonus) plus income tax paid by the employee plus employer tax paid by the employer.
Net income is gross income plus compensations plus allowence plus bonus minus employee contributions (from gross and company bonus) minus income tax.
Calculation model and parameters are given yearly by the Slovenian tax authority.
Usually the calculation model is given for the calendar year. But there is also a monthly calculation model.

## User configurable parameters
- Yearly or monthly view
- Maximum gross yearly income for yearly view
- Maximum gross monthly income for monthly view
- Daily untaxed food compensastion
  - defualt 7.96EUR
  - info: only for days at work; may vary based on hours and field
- Daily untaxed commute compensation
  - default 5EUR
  - info: only days at work; varies based on distance, public transport availability, public or private sector
- Vacation days
  - used to reduce food and transportation compensation
- Untaxed yearly vacation allowence
  - Also no social security contribution
- Untaxed yearly company bonus
  - Has social security contribution  
- Tax year
- Display employer tax


## User input
- Gross income

## Programming model
Have a per year standalone model instance which contains all the parameters for that year and calculation functions.
Parameters are:
- Social security contribution rates
- Relief amounts
- Relief calculation rules
- Income tax brackets and rates
- Employer tax rates
- Work days

Provided functions are:
- Calculate employee contributions
- Calculate relief
- Return the number of tax brackets
- Return tax bracket range and rate
- Calculate the (taxed) ammount in a given bracket
- Calculate income tax in a given bracket
- Calculate net income in a given bracket
- Calculate total income tax
- Calculate employer tax
- Yearly food and commute compensation
  - monthly food and commute comepnsation 1/12 of the daily for year work days minus vacation days

### Year 2025 parameters
In the 2025.md file
### Year 2026 parameters
In the 2026.md file

# Visualization model
Mockup image is in mockup/Mockup.png

Vertical stack of elements:
1. Header with title, share button and settings button
2. Total tax vs net income horizontal split bar
3. Up and down slidable gross income input grid
4. Footer with info and coptyright

Stack is taking the width of the window between tootal.

Bars representing foreground tax paid tax are colored dark gray.
Bars representing foreground net income are colored green.

## Total tax vs net income horizontal split bar
- Without user interaction
- Left part is total tax (employee contributions + income tax + optional employer tax)
  - Displays the amount of total tax paid as text
  - Displays the total tax paid in percentage of total paid by the employer as text
  - Spans the percentage width according to the percentage of total tax
- Right part is net income
  - Displays the amount of net income as text
  - Displays the net income in percentage of total paid by the employer as text
  - Spans the percentage width according to the percentage of net income

## Up and down slidable gross income input grid
- User can slide the gross income input up and down to change the gross income
- Background grid displays vertical bars representing tax brackets from 0 at the bottom to maximum gross income at the top
  - Each tax bracket is represented by a vertical bar spanning the width of the grid
  - Left part of each bar is colored gray representing the total tax paid in that bracket
  - Right part of each bar is colored light gray representing the net income in that bracket
  - Left part spans the percentage width according to the percentage of total tax in that bracket
  - Right part spans the percentage width according to the percentage of net income in that bracket
  - Left part displays the bracket tax percentage as text in the lower left corner
  - Right part displays the bracket top limit amount as text in the upper right corner
    - Top limit amount is "max" for the last bracket
  - Not all bracket might be visible at once depending on the maximum gross income
  - Each bar height is proportional to the bracket range
- Foreground grid is displayed over the background grid
  - Vertically spans from the bottom to the current gross income level and higher for the ammount of sum of all untaxed parts (vacation allowence, company bonus, food and commute compensations) and even higher if the employer tax is displayed
    - The foreground grid extends above the current gross income level to accommodate untaxed and the employer tax if selected for display
    - There must be space reserved above the configured maximum gross income to accommodate untaxed and the employer tax above the grid and below the total tax vs net income display
  - Displays the untaxed part above the slider in the foreground tax color
  - Displays the social security contribution part below the slider in the foreground tax color
    - Spans the full width of the grid
    - Displays the text "PRISPEVKI DELAVCA" and social security contribution amount as text in the center in a single line
    - Displays the social security contribution percentage as text in the lower left corner
  - Displays the relief part below the security contribution in the foreground net income color
    - Spans the full width of the grid
    - Displays the text "OLAJSAVE" and relief amount as text in the center in a single line
  - Displays the tax brackets parts below the relief
    - Each tax bracket part spans the full width of the grid
    - Each tax bracket part height is proportional to the bracket range
    - Each bracket is split into two parts:
      - Left part is colored in the foreground tax color representing the income tax paid in that bracket
        - Spans the percentage width according to the percentage of income tax in that bracket
        - Displays the bracket income tax amount as text in the center
        - Displays the bracket tax percentage as text in the lower left corner
      - Right part is colored in the foreground net income color representing the net income in that bracket
        - Spans the percentage width according to the percentage of net income in that bracket
        - Displays the bracket net income tax amount as text in the center
  - Relief part and brackets part are split by a single Yellow (NCS) line and a label with the Yellow (NCS) backround with the text "OSNOVA ZA DOHODNINO: " and the ammount of the taxed income
  - Background backets and foreground brackets align perfectly
- User slides up and down the gross income handle to change the gross income
  - Gross income handle is displayed as a horizontal line spanning the full width of the grid at the current gross income level
  - Gross income handle displays the current gross income amount as text in the center
  - Gross income is rounded to 100 EUR increments for yearly view and to 10 EUR increments for monthly view
  - Foreground grid updates dynamically as the user slides the gross income handle
  - Topmost total tax vs net income display updates dynamically as the user slides the gross income handle

# Implementation details
- Icon is in img/icon.png

## Startup warnings
- Warn that calculations might not be accurate due to simplifications.
- Warn that the calculations are for informational purposes only and not legal or financial advice.

# Planning stage details
Store answers to asked details in the AnsweredDetails.md

# Update v2 (8-Feb-2026)

## Minor changes
- Share button on the top right before the settings button
  - Share link: davkografika.palic.si
- Copyright banner at the bottom
  - Ideja vizualizacije: Primoz Alic (c)

# Update v3 (8-Feb-2026)
- Yellow (NCS) line with the The taxed income ammount

# Update v4 (9-Feb-2026)
- Untaxed: [vacation allowence, company bonus, food and commute compensations]

# Update v5 (9-Feb-2026)
- Store configuration and slider position locally in the browser

# Update v6 (9-Feb-2026)
- Versioning and client cache invalidation

# Update v6.1 (9-Feb-2026)
- Config info
- Config OK button

# Update v7 (10-Feb-2026)
- 2026