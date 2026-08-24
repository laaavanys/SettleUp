/**
 * Debt Simplification Algorithm
 * ------------------------------
 * Given a group of people who owe each other various amounts (from many
 * separate expenses), this reduces the number of actual transactions needed
 * to settle up.
 *
 * Example without simplification:
 *   A owes B ₹500
 *   B owes C ₹500
 *   -> 2 transactions
 *
 * With simplification:
 *   A owes C ₹500 directly (B is skipped entirely, since B's net balance is 0)
 *   -> 1 transaction
 *
 * Approach:
 *  1. Compute each person's NET balance (total paid - total owed).
 *     Positive balance = they are owed money overall.
 *     Negative balance = they owe money overall.
 *  2. Split people into creditors (net > 0) and debtors (net < 0).
 *  3. Greedily match the largest debtor against the largest creditor,
 *     settle as much as possible, repeat until all balances are ~0.
 *
 * This is a greedy min-cash-flow approach. It does not guarantee the
 * mathematically minimum number of transactions in every case (that's an
 * NP-hard problem in general), but it performs very well in practice and
 * runs in O(n log n), which is standard for group financial engines.
 *
 * @param {Object} netBalances - map of userId -> net balance (number)
 * @returns {Array<{from: number, to: number, amount: number}>}
 */
function simplifyDebts(netBalances) {
  const EPSILON = 0.01; // ignore rounding dust below 1 paisa/cent

  const creditors = [];
  const debtors = [];

  for (const [userId, balanceRaw] of Object.entries(netBalances)) {
    const balance = Math.round(balanceRaw * 100) / 100;
    if (balance > EPSILON) {
      creditors.push({ userId: Number(userId), amount: balance });
    } else if (balance < -EPSILON) {
      debtors.push({ userId: Number(userId), amount: -balance });
    }
  }

  // Largest amounts first -> fewer total transactions in practice
  creditors.sort((a, b) => b.amount - a.amount);
  debtors.sort((a, b) => b.amount - a.amount);

  const transactions = [];
  let i = 0; // pointer into debtors
  let j = 0; // pointer into creditors

  while (i < debtors.length && j < creditors.length) {
    const debtor = debtors[i];
    const creditor = creditors[j];

    const settledAmount = Math.min(debtor.amount, creditor.amount);

    if (settledAmount > EPSILON) {
      transactions.push({
        from: debtor.userId,
        to: creditor.userId,
        amount: Math.round(settledAmount * 100) / 100,
      });
    }

    debtor.amount -= settledAmount;
    creditor.amount -= settledAmount;

    if (debtor.amount <= EPSILON) i++;
    if (creditor.amount <= EPSILON) j++;
  }

  return transactions;
}

module.exports = { simplifyDebts };
