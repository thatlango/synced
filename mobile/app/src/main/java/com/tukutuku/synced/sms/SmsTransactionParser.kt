package com.tukutuku.synced.sms

import com.tukutuku.synced.data.model.StructuredSmsCandidate
import java.security.MessageDigest

object SmsTransactionParser {
    private val amountPatterns = listOf(
        Regex("""(?i)(?:UGX|UShs?|Shs?)\s*([0-9][0-9,]*(?:\.[0-9]{1,2})?)"""),
        Regex("""(?i)([0-9][0-9,]*(?:\.[0-9]{1,2})?)\s*(?:UGX|UShs?|Shs?)"""),
    )

    private val creditWords = Regex(
        """(?i)\b(received|credited|deposit(?:ed)?|cash[ -]?in|refund(?:ed)?|reversal|reversed|salary|payroll|wage|disburse(?:d|ment))\b""",
    )
    private val debitWords = Regex(
        """(?i)\b(sent|paid|payment|purchase|bought|withdrawn|withdrew|debited|airtime|bundle|cash[ -]?out|charged|deducted|repayment|settled)\b""",
    )
    private val ignoreWords = Regex(
        """(?i)\b(otp|one[ -]?time password|verification code|promo(?:tion)?|loan offer|pre.?approved|failed|declined|insufficient funds)\b""",
    )
    private val partyPattern = Regex(
        """(?i)\b(?:to|from|at)\s+([A-Za-z0-9 .&'_-]{2,60}?)(?=\.|,|\s+(?:on|your|available|balance|ref|reference|txn|transaction|principal|interest|fee|outstanding)\b|$)""",
    )

    private val salaryWords = Regex("""(?i)\b(salary|payroll|wage|net pay|monthly pay|employer payment)\b""")
    private val refundWords = Regex("""(?i)\b(refund(?:ed)?|reversal|reversed|cashback|chargeback)\b""")
    private val interestWords = Regex("""(?i)\b(interest|dividend|investment return|investment income)\b""")
    private val freelanceWords = Regex("""(?i)\b(consulting fee|professional fee|freelance|gig payment|consultancy payment)\b""")
    private val businessIncomeWords = Regex("""(?i)\b(client payment|customer payment|sales revenue|sales proceeds|business income|invoice payment|merchant settlement)\b""")
    private val giftWords = Regex("""(?i)\b(gift|grant|donation|allowance)\b""")

    private val loanWords = Regex(
        """(?i)\b(loan|credit facility|microfinance|salary advance|cash advance|overdraft|sacco loan|borrowed funds?)\b""",
    )
    private val debtWords = Regex(
        """(?i)\b(debt|arrears|credit card|card balance|buy now pay later|bnpl|amount owed|outstanding obligation)\b""",
    )
    private val loanInWords = Regex(
        """(?i)\b(loan disbursement|loan proceeds|loan credited|loan amount credited|loan disbursed|credit facility disbursed|advance disbursed|advance credited)\b""",
    )
    private val loanRepaymentWords = Regex(
        """(?i)\b(loan repayment|loan payment|loan instalment|loan installment|repayment of (?:the )?loan|credit repayment|credit facility repayment|microfinance repayment|sacco loan repayment|salary advance repayment|cash advance repayment|overdraft repayment)\b""",
    )
    private val debtRepaymentWords = Regex(
        """(?i)\b(debt repayment|debt payment|debt settlement|settled debt|arrears payment|arrears repayment|credit card payment|card repayment|bnpl repayment|buy now pay later repayment)\b""",
    )
    private val repaymentReceivedWords = Regex(
        """(?i)\b((?:loan|debt) repayment received|repayment received|debt payment received|loan payment received)\b""",
    )
    private val loanInterestWords = Regex(
        """(?i)\b(loan interest|interest charged|interest payment|interest repayment|finance charge)\b""",
    )
    private val loanFeeWords = Regex(
        """(?i)\b(loan fee|processing fee|facility fee|loan service fee|credit fee|origination fee)\b""",
    )
    private val loanPenaltyWords = Regex(
        """(?i)\b(late fee|late payment fee|penalty|default fee|arrears fee|default charge)\b""",
    )
    private val obligationReminderWords = Regex(
        """(?i)\b(due(?: on| date| today| tomorrow)?|amount due|repayment due|payment due|minimum payment|reminder|overdue|past due|please pay|upcoming repayment|scheduled repayment)\b""",
    )
    private val completedMovementWords = Regex(
        """(?i)\b(paid|payment successful|payment completed|debited|deducted|charged|received|credited|disbursed|sent|settled|processed successfully)\b""",
    )

    private val waterWords = Regex("""(?i)\b(nwsc|water bill|water payment|water utility)\b""")
    private val electricityWords = Regex("""(?i)\b(uedcl|umeme|yaka|electricity|power bill|power token)\b""")
    private val internetWords = Regex("""(?i)\b(internet bill|fibre|fiber|starlink|liquid telecom|utande|wifi bill)\b""")
    private val airtimeWords = Regex("""(?i)\b(airtime|voice top[ -]?up|recharge)\b""")
    private val dataWords = Regex("""(?i)\b(data bundle|internet bundle|mobile data|bundle purchase)\b""")
    private val subscriptionWords = Regex("""(?i)\b(subscription|renewal|netflix|spotify|youtube premium|dstv|showmax|canal\+?)\b""")
    private val rentWords = Regex("""(?i)\b(rent|rental|landlord|housing payment|apartment payment)\b""")
    private val schoolWords = Regex("""(?i)\b(school fees?|tuition|term fees?|university fees?|college fees?|exam fees?)\b""")
    private val insuranceWords = Regex("""(?i)\b(insurance|premium payment|policy premium)\b""")
    private val taxWords = Regex("""(?i)\b(ura|tax payment|taxes|government fee|licen[cs]e fee|statutory fee)\b""")
    private val healthWords = Regex("""(?i)\b(hospital|clinic|pharmacy|medical|doctor|laboratory|dental)\b""")
    private val fuelWords = Regex("""(?i)\b(fuel|petrol|diesel|shell|totalenergies|total petrol|vivo energy|puma energy)\b""")
    private val foodWords = Regex("""(?i)\b(restaurant|cafe|java house|cafe javas|kfc|supermarket|grocery|lunch|dinner|breakfast)\b""")
    private val transportWords = Regex("""(?i)\b(uber|bolt|safeboda|yango|boda|taxi|bus fare|transport fare|flight ticket)\b""")
    private val shoppingWords = Regex("""(?i)\b(jumia|kilimall|shopping|clothes|fashion|electronics|phone purchase|laptop)\b""")

    private data class FinancialDetails(
        val kind: String? = null,
        val subtype: String? = null,
        val counterparty: String? = null,
        val principalAmount: Double? = null,
        val interestAmount: Double? = null,
        val feeAmount: Double? = null,
        val penaltyAmount: Double? = null,
        val outstandingBalance: Double? = null,
        val dueAmount: Double? = null,
        val dueDate: String? = null,
    )

    fun likelyFinancial(sender: String?, body: String): Boolean {
        if (ignoreWords.containsMatchIn(body)) return false

        val hasLoanOrDebtLanguage = loanWords.containsMatchIn(body) || debtWords.containsMatchIn(body)
        if (hasLoanOrDebtLanguage && obligationReminderWords.containsMatchIn(body) && !completedMovementWords.containsMatchIn(body)) {
            // A due/overdue reminder is an obligation, not a completed ledger movement.
            return false
        }

        val haystack = "${sender.orEmpty()} $body"
        val knownProvider = listOf(
            "MTN", "AIRTEL", "MOMO", "MOBILE MONEY", "STANBIC", "DFCU", "EQUITY",
            "CENTENARY", "POSTBANK", "ABSA", "STANDARD CHARTERED", "BANK OF AFRICA",
            "KCB", "NCBA", "HOUSING FINANCE", "PRIDE MICROFINANCE",
        ).any { haystack.contains(it, ignoreCase = true) }

        val bankLikeMessage = body.contains("account", ignoreCase = true) &&
            (creditWords.containsMatchIn(body) || debitWords.containsMatchIn(body))
        val loanOrDebtMovement = hasLoanOrDebtLanguage && completedMovementWords.containsMatchIn(body)

        return (knownProvider || bankLikeMessage || loanOrDebtMovement) &&
            amountPatterns.any { it.containsMatchIn(body) } &&
            (creditWords.containsMatchIn(body) || debitWords.containsMatchIn(body))
    }

    fun parse(sender: String?, body: String, timestamp: Long): StructuredSmsCandidate? {
        if (!likelyFinancial(sender, body)) return null

        val isCredit = creditWords.containsMatchIn(body)
        val isDebit = debitWords.containsMatchIn(body)
        if (!isCredit && !isDebit) return null

        val type = when {
            repaymentReceivedWords.containsMatchIn(body) -> "credit"
            loanInWords.containsMatchIn(body) -> "credit"
            refundWords.containsMatchIn(body) -> "credit"
            salaryWords.containsMatchIn(body) -> "credit"
            isCredit && !isDebit -> "credit"
            else -> "debit"
        }

        val providerText = (sender.orEmpty() + " " + body).lowercase()
        val source = when {
            "airtel" in providerText -> "airtel"
            "mtn" in providerText || "momo" in providerText -> "mtn"
            else -> "sms"
        }

        val merchant = partyPattern.find(body)
            ?.groupValues
            ?.getOrNull(1)
            ?.trim()
            ?.trimEnd('.', ',')
            ?.take(60)

        val details = financialDetails(type, body, sender, merchant)
        val amount = transactionAmount(body, details.subtype) ?: return null
        val description = semanticDescription(type, body, merchant, details)

        // The body is used only locally to derive an idempotency fingerprint and classification.
        // Raw SMS text is never included in the structured candidate sent to Synced.
        val normalized = body.lowercase().replace(Regex("""\s+"""), " ").trim()
        val referenceId = sha256("${sender.orEmpty()}|$timestamp|$normalized")

        return StructuredSmsCandidate(
            amount = amount,
            type = type,
            description = description,
            merchant = merchant,
            referenceId = referenceId,
            source = source,
            confidence = when {
                details.kind != null -> 0.98
                description.startsWith("Uncategorised") -> 0.72
                else -> 0.96
            },
            financialKind = details.kind,
            financialSubtype = details.subtype,
            counterparty = details.counterparty,
            principalAmount = details.principalAmount,
            interestAmount = details.interestAmount,
            feeAmount = details.feeAmount,
            penaltyAmount = details.penaltyAmount,
            outstandingBalance = details.outstandingBalance,
            dueAmount = details.dueAmount,
            dueDate = details.dueDate,
        )
    }

    private fun financialDetails(type: String, body: String, sender: String?, merchant: String?): FinancialDetails {
        val loan = loanWords.containsMatchIn(body)
        val debt = debtWords.containsMatchIn(body)
        if (!loan && !debt) return FinancialDetails()

        val kind = if (loan) "loan" else "debt"
        val subtype = when {
            type == "credit" && loanInWords.containsMatchIn(body) -> "loan_disbursement"
            type == "credit" && repaymentReceivedWords.containsMatchIn(body) && loan -> "loan_repayment_received"
            type == "credit" && repaymentReceivedWords.containsMatchIn(body) -> "debt_repayment_received"
            type == "debit" && loanPenaltyWords.containsMatchIn(body) -> "loan_penalty"
            type == "debit" && loanFeeWords.containsMatchIn(body) -> "loan_fee"
            type == "debit" && loanInterestWords.containsMatchIn(body) -> "loan_interest"
            type == "debit" && loanRepaymentWords.containsMatchIn(body) -> "loan_repayment"
            type == "debit" && debtRepaymentWords.containsMatchIn(body) -> "debt_repayment"
            type == "debit" && debt -> "debt_payment"
            type == "debit" && loan -> "loan_payment"
            else -> if (loan) "loan_movement" else "debt_movement"
        }

        val counterparty = merchant?.takeIf { it.isNotBlank() }
            ?: sender?.trim()?.takeIf { it.isNotBlank() }?.take(80)

        return FinancialDetails(
            kind = kind,
            subtype = subtype,
            counterparty = counterparty,
            principalAmount = extractLabeledAmount(body, listOf("principal", "principal amount")),
            interestAmount = extractLabeledAmount(body, listOf("interest", "interest amount", "finance charge")),
            feeAmount = extractLabeledAmount(body, listOf("processing fee", "facility fee", "service fee", "loan fee", "origination fee")),
            penaltyAmount = extractLabeledAmount(body, listOf("penalty", "late fee", "default fee", "arrears fee")),
            outstandingBalance = extractLabeledAmount(
                body,
                listOf(
                    "outstanding balance",
                    "loan balance",
                    "balance outstanding",
                    "remaining balance",
                    "amount outstanding",
                    "debt balance",
                    "credit card balance",
                    "card balance",
                ),
            ),
            dueAmount = extractLabeledAmount(body, listOf("amount due", "repayment due", "payment due", "instalment due", "installment due")),
            dueDate = extractDueDate(body),
        )
    }

    private fun transactionAmount(body: String, subtype: String?): Double? {
        val labels = when (subtype) {
            "loan_disbursement" -> listOf("loan disbursement", "loan proceeds", "loan amount", "loan", "advance")
            "loan_repayment", "loan_repayment_received" -> listOf("loan repayment", "loan payment", "repayment", "instalment", "installment")
            "debt_repayment", "debt_repayment_received", "debt_payment" -> listOf("debt repayment", "debt payment", "debt settlement", "arrears payment", "card repayment", "credit card payment")
            "loan_interest" -> listOf("loan interest", "interest payment", "interest", "finance charge")
            "loan_fee" -> listOf("loan fee", "processing fee", "facility fee", "service fee", "origination fee")
            "loan_penalty" -> listOf("penalty", "late fee", "default fee", "arrears fee")
            else -> emptyList()
        }
        extractLabeledAmount(body, labels)?.let { return it }

        return amountPatterns.firstNotNullOfOrNull { pattern ->
            pattern.find(body)
                ?.groupValues
                ?.getOrNull(1)
                ?.replace(",", "")
                ?.toDoubleOrNull()
        }
    }

    private fun extractLabeledAmount(body: String, labels: List<String>): Double? {
        for (label in labels) {
            val escaped = Regex.escape(label)
            val after = Regex(
                """(?i)\b$escaped\b[^0-9]{0,24}(?:UGX|UShs?|Shs?)\s*([0-9][0-9,]*(?:\.[0-9]{1,2})?)""",
            ).find(body)?.groupValues?.getOrNull(1)?.replace(",", "")?.toDoubleOrNull()
            if (after != null) return after

            val before = Regex(
                """(?i)(?:UGX|UShs?|Shs?)\s*([0-9][0-9,]*(?:\.[0-9]{1,2})?)[^A-Za-z0-9]{0,16}\b$escaped\b""",
            ).find(body)?.groupValues?.getOrNull(1)?.replace(",", "")?.toDoubleOrNull()
            if (before != null) return before
        }
        return null
    }

    private fun extractDueDate(body: String): String? = Regex(
        """(?i)\bdue(?:\s+date)?(?:\s+is|\s+on|:)?\s+([0-3]?\d[/-][01]?\d[/-](?:20)?\d{2}|[0-3]?\d\s+[A-Za-z]{3,9}\s+20\d{2}|[A-Za-z]{3,9}\s+[0-3]?\d,?\s+20\d{2})""",
    ).find(body)?.groupValues?.getOrNull(1)?.trim()?.take(32)

    private fun semanticDescription(type: String, body: String, merchant: String?, details: FinancialDetails): String {
        fun sourceOr(fallback: String): String = details.counterparty
            ?: merchant?.takeIf { it.isNotBlank() }
            ?: fallback

        if (details.kind != null) {
            return when (details.subtype) {
                "loan_disbursement" -> "Loan disbursement received from ${sourceOr("lender")}"
                "loan_repayment_received" -> "Loan repayment received from ${sourceOr("borrower")}"
                "debt_repayment_received" -> "Debt repayment received from ${sourceOr("debtor")}"
                "loan_repayment" -> "Loan repayment to ${sourceOr("lender")}"
                "loan_interest" -> "Loan interest payment to ${sourceOr("lender")}"
                "loan_fee" -> "Loan fee payment to ${sourceOr("lender")}"
                "loan_penalty" -> "Loan penalty payment to ${sourceOr("lender")}"
                "debt_repayment" -> "Debt repayment to ${sourceOr("creditor")}"
                "debt_payment" -> "Debt payment to ${sourceOr("creditor")}"
                "loan_payment" -> "Loan payment to ${sourceOr("lender")}"
                else -> if (type == "credit") {
                    "Loan or debt funds received from ${sourceOr("counterparty")}"
                } else {
                    "Loan or debt payment to ${sourceOr("counterparty")}"
                }
            }
        }

        if (type == "credit") {
            return when {
                salaryWords.containsMatchIn(body) -> "Salary income received from ${sourceOr("employer")}"
                refundWords.containsMatchIn(body) -> "Refund or reversal received from ${sourceOr("provider")}"
                interestWords.containsMatchIn(body) -> "Interest or investment income received from ${sourceOr("financial institution")}"
                freelanceWords.containsMatchIn(body) -> "Freelance or consulting income received from ${sourceOr("client")}"
                businessIncomeWords.containsMatchIn(body) -> "Business income received from ${sourceOr("customer")}"
                giftWords.containsMatchIn(body) -> "Gift, grant or allowance received from ${sourceOr("sender")}"
                body.contains("deposit", ignoreCase = true) || body.contains("cash-in", ignoreCase = true) -> "Cash deposit received"
                else -> merchant?.let { "Money received from $it" } ?: "Money received by bank or mobile money"
            }
        }

        return when {
            waterWords.containsMatchIn(body) -> "Water bill payment to ${sourceOr("NWSC")}"
            electricityWords.containsMatchIn(body) -> "Electricity bill payment to ${sourceOr("power provider")}"
            internetWords.containsMatchIn(body) -> "Internet bill payment to ${sourceOr("internet provider")}"
            dataWords.containsMatchIn(body) -> "Mobile data bundle purchase from ${sourceOr("mobile provider")}"
            airtimeWords.containsMatchIn(body) -> "Airtime purchase from ${sourceOr("mobile provider")}"
            rentWords.containsMatchIn(body) -> "Rent payment to ${sourceOr("landlord")}"
            schoolWords.containsMatchIn(body) -> "School or tuition fee payment to ${sourceOr("education provider")}"
            insuranceWords.containsMatchIn(body) -> "Insurance premium payment to ${sourceOr("insurer")}"
            taxWords.containsMatchIn(body) -> "Tax or statutory fee payment to ${sourceOr("authority")}"
            subscriptionWords.containsMatchIn(body) -> "Subscription bill payment to ${sourceOr("subscription provider")}"
            healthWords.containsMatchIn(body) -> "Healthcare payment to ${sourceOr("health provider")}"
            fuelWords.containsMatchIn(body) -> "Fuel purchase from ${sourceOr("fuel station")}"
            foodWords.containsMatchIn(body) -> "Food or grocery payment to ${sourceOr("merchant")}"
            transportWords.containsMatchIn(body) -> "Transport payment to ${sourceOr("transport provider")}"
            shoppingWords.containsMatchIn(body) -> "Shopping payment to ${sourceOr("merchant")}"
            body.contains("bill", ignoreCase = true) -> "Bill payment to ${sourceOr("provider")}"
            else -> merchant?.let { "Payment to $it" } ?: "Uncategorised payment"
        }
    }

    private fun sha256(value: String): String = MessageDigest.getInstance("SHA-256")
        .digest(value.toByteArray())
        .joinToString("") { "%02x".format(it) }
}
