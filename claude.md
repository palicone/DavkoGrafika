# Title
Slovenian income tax visualization app

# Description
A progressive web app to visualize the tax from income.
The app will allow users to input their income and see
how much tax they owe based on Slovenia's progressive tax brackets.
The tax is spilt into social security contributions and income tax.
Contributions are called "prispevki" and income tax is called "dohodnina" in Slovenian.
There is also a tax which the employer pays on behalf of the employee called "davek na dohodke iz delovnega razmerja".

# Tax calculation model
The income or gross income is what the employer pays the employee before any deductions.
The net income is what the employee takes home after all deductions.
Employee contributions (prispevki) are calculated based on gross income.
The relief (olajsava) is calculated based on gross income.
The taxed income is gross income minus employee contributions minus relief.
The income tax (dohodnina) is calculated based on the taxed income according to progressive brackets.
The employer tax is calculated based on gross income.
Complete taxes are contributions plus income tax paid by the employee plus employer tax paid by the employer.
Net income is gross income minus employee contributions minus income tax.
Calculation model and parameters are given yearly by the Slovenian tax authority.
Usually the calculation model is given for the calendar year. But there is also a monthly calculation model.

## User configurable parameters
- Yearly or monthly view
- Maximum gross yearly or monthly income based on the selected view
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

### Year 2025 parameters
- Social security contribution rates: 23.1% from gross yearly or monthly income + fixed amount of 37.17 EUR monthly

- Relief:
  - Yearly:
    - Up to 16,832.00 EUR gross income: 5,260.00 + (19,736.99  - 1.17259 x gross yearly income) EUR
    - Above 16,832.00 EUR gross income: 5,260.00 EUR
  - Monthly:
    - Up to 1,402.67 EUR gross income: 438.33 + (1,644.75 - 1.17259 x gross monthly income) EUR
    - Above 1,402.67 EUR gross income: 438.33 EUR

- Income tax brackets:
  - Yearly:
    - Up to 9,210.26 EUR: 16%
    - 9,210.26 EUR to 27,089.00 EUR: 26%
    - 27,089.00 EUR to 54,178.00 EUR: 33%
    - 54,178.00 EUR to 78,016.32 EUR: 39%
    - Above 78,016.32 EUR: 50%
  - Monthly:
    - Up to 767.52 EUR: 16%
    - 767.52 EUR to 2,257.42 EUR: 26%
    - 2,257.42 EUR to 4,514.83 EUR: 33%
    - 4,514.83 EUR to 6,501.36 EUR: 39%
    - Above 6,501.36 EUR: 50%

- Employer tax: 16.1% from gross yearly or monthly income

Let the 2025 be the only initial year implemented.

# Visualization model
Mockup image is in mockup/Mockup.png

Vertical stack of elements:
1. Header with title, share button and settings button
2. Total tax vs net income horizontal split bar
3. Up and down slidable gross income input grid
4. Footre with info and coptyright

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
  - Spans from the bottom to the current gross income level and higher if the employer tax is displayed
    - If employer tax is displayed, the foreground grid extends slightly above the current gross income level to accommodate the employer tax handle
    - There must be space reserved above the configured maximum gross income to accommodate the employer tax handle above the grid and below the total tax vs net income display
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
  - Ideja vizualizacije in implemntacija: Primoz Alic
