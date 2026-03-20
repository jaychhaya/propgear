// Calculate gross rental yield
export function grossYield(weeklyRent, currentValue) {
  if (!weeklyRent || !currentValue) return 0
  return ((weeklyRent * 52) / currentValue) * 100
}

// Calculate net rental yield
export function netYield(weeklyRent, annualExpenses, currentValue) {
  if (!weeklyRent || !currentValue) return 0
  const netIncome = weeklyRent * 52 - (annualExpenses || 0)
  return (netIncome / currentValue) * 100
}

// Calculate LVR (Loan to Value Ratio)
export function lvr(loanAmount, currentValue) {
  if (!loanAmount || !currentValue) return 0
  return (loanAmount / currentValue) * 100
}

// Calculate equity
export function equity(currentValue, loanAmount) {
  return (currentValue || 0) - (loanAmount || 0)
}

// Calculate capital growth %
export function capitalGrowth(purchasePrice, currentValue) {
  if (!purchasePrice || !currentValue) return 0
  return ((currentValue - purchasePrice) / purchasePrice) * 100
}

// Project value YoY
export function projectValues(currentValue, loanAmount, years = 10, growthRate = 0.07, extraRepayments = 0) {
  const points = []
  let value = currentValue || 0
  let loan = loanAmount || 0

  for (let y = 0; y <= years; y++) {
    points.push({
      year: new Date().getFullYear() + y,
      value: Math.round(value),
      loan: Math.round(Math.max(loan, 0)),
      equity: Math.round(Math.max(value - loan, 0))
    })
    value = value * (1 + growthRate)
    loan = Math.max(loan * 0.97 - extraRepayments, 0) // ~3% principal reduction approx
  }
  return points
}

// Format currency AUD
export function formatCurrency(val) {
  if (val == null || isNaN(val)) return '—'
  return new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency: 'AUD',
    maximumFractionDigits: 0
  }).format(val)
}

// Format percentage
export function formatPct(val, decimals = 1) {
  if (val == null || isNaN(val)) return '—'
  return `${val.toFixed(decimals)}%`
}

// Monthly repayment calculator (P&I)
export function monthlyRepayment(principal, annualRate, termYears) {
  if (!principal || !annualRate || !termYears) return 0
  const r = annualRate / 100 / 12
  const n = termYears * 12
  if (r === 0) return principal / n
  return principal * (r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1)
}

// Portfolio totals
export function portfolioTotals(properties) {
  return properties.reduce((acc, p) => {
    acc.totalValue += p.current_valuation || p.purchase_price || 0
    acc.totalPurchase += p.purchase_price || 0
    acc.totalLoan += p.loan_amount || 0
    acc.totalWeeklyRent += p.weekly_rent || 0
    acc.count += 1
    return acc
  }, { totalValue: 0, totalPurchase: 0, totalLoan: 0, totalWeeklyRent: 0, count: 0 })
}
