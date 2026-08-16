# Payment report and invoice production verification

Commit `ec6c2dc` was promoted to production. The cache-busted live Admin Enrollments route confirmed the payment report controls: Export payment CSV, payment-status filter, course filter, From/To date filters, Clear filters, and per-row Print invoice action.

The live invoice preview rendered a compact YHA COMPUTER receipt with invoice number, date, student name/ID/email, course, payment status, Due, Paid, Balance, thank-you text, Close, and Print receipt controls. The print CSS is configured for a 76mm thermal-style receipt and browser/A4 fallback.

The first browser snapshot was stale and did not show the new controls; a fresh cache-busted URL loaded the current bundle and verified them.
