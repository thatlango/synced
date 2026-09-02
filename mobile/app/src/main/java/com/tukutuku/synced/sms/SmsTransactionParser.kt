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
        """(?i)\b(sent|paid|payment|purchase|bought|withdrawn|withdrew|debited|airtime|bundle|cash[ -]?out|charged|deducted|repayment)\b""",
    )
    private val ignoreWords = Regex(
        """(?i)\b(otp|one[ -]?time password|verification code|promo(?:tion)?|loan offer|failed|declined|insufficient funds)\b""",
    )
    private val partyPattern = Regex(
        """(?i)\b(?:to|from|at)\s+([A-Za-z0-9 .&'_-]{2,45}?)(?=\.|,|\s+(?:on|your|available|balance|ref|reference|txn|transaction)\b|$)""",
    )

    private val salaryWords = Regex("""(?i)\b(salary|payroll|wage|net pay|monthly pay|employer payment)\b""")
    private val refundWords = Regex("""(?i)\b(refund(?:ed)?|reversal|reversed|cashback|chargeback)\b""")
    private val interestWords = Regex("""(?i)\b(interest|dividend|investment return|investment income)\b""")
    private val loanInWords = Regex("""(?i)\b(loan disbursement|loan proceeds|loan credited|credit facility disbursed)\b""")
    private val freelanceWords = Regex("""(?i)\b(consulting fee|professional fee|freelance|gig payment|consultancy payment)\b""")
    private val businessIncomeWords = Regex("""(?i)\b(client payment|customer payment|sales revenue|sales proceeds|business income|invoice payment|merchant settlement)\b""")
    private val giftWords = Regex("""(?i)\b(gift|grant|donation|allowance)\b""")

    private val waterWords = Regex("""(?i)\b(nwsc|water bill|water payment|water utility)\b""")
    private val electricityWords = Regex("""(?i)\b(uedcl|umeme|yaka|electricity|power bill|power token)\b""")
    private val internetWords = Regex("""(?i)\b(internet bill|fibre|fiber|starlink|liquid telecom|utande|wifi bill)\b""")
    private val airtimeWords = Regex("""(?i)\b(airtime|voice top[ -]?up|recharge)\b""")
    private val dataWords = Regex("""(?i)\b(data bundle|internet bundle|mobile data|bundle purchase)\b""")
    private val subscriptionWords = Regex("""(?i)\b(subscription|renewal|netflix|spotify|youtube premium|dstv|showmax|canal\+?)\b""")
    private val rentWords = Regex("""(?i)\b(rent|rental|landlord|housing payment|apartment payment)\b""")
    private val schoolWords = Regex("""(?i)\b(school fees?|tuition|term fees?|university fees?|college fees?|exam fees?)\b""")
    private val loanRepaymentWords = Regex("""(?i)\b(loan repayment|loan instalment|loan installment|credit repayment|microfinance repayment)\b""")
    private val insuranceWords = Regex("""(?i)\b(insurance|premium payment|policy premium)\b""")
    private val taxWords = Regex("""(?i)\b(ura|tax payment|taxes|government fee|licen[cs]e fee|statutory fee)\b""")
    private val healthWords = Regex("""(?i)\b(hospital|clinic|pharmacy|medical|doctor|laboratory|dental)\b""")
    private val fuelWords = Regex("""(?i)\b(fuel|petrol|diesel|shell|totalenergies|total petrol|vivo energy|puma energy)\b""")
    private val foodWords = Regex("""(?i)\b(restaurant|cafe|java house|cafe javas|kfc|supermarket|grocery|lunch|dinner|breakfast)\b""")
    private val transportWords = Regex("""(?i)\b(uber|bolt|safeboda|yango|boda|taxi|bus fare|transport fare|flight ticket)\b""")
    private val shoppingWords = Regex("""(?i)\b(jumia|kilimall|shopping|clothes|fashion|electronics|phone purchase|laptop)\b""")

    fun likelyFinancial(sender: String?, body: String): Boolean {
        if (ignoreWords.containsMatchIn(body)) return false

        val haystack = "${sender.orEmpty()} $body"
        val knownProvider = listOf(
            "MTN", "AIRTEL", "MOMO", "MOBILE MONEY", "STANBIC", "DFCU", "EQUITY",
            "CENTENARY", "POSTBANK", "ABSA", "STANDARD CHARTERED", "BANK OF AFRICA",
            "KCB", "NCBA", "HOUSING FINANCE", "PRIDE MICROFINANCE",
        ).any { haystack.contains(it, ignoreCase = true) }

        val bankLikeMessage = body.contains("account", ignoreCase = true) &&
            (creditWords.containsMatchIn(body) || debitWords.containsMatchIn(body))

        return (knownProvider || bankLikeMessage) &&
            amountPatterns.any { it.containsMatchIn(body) } &&
            (creditWords.containsMatchIn(body) || debitWords.containsMatchIn(body))
    }

    fun parse(sender: String?, body: String, timestamp: Long): StructuredSmsCandidate? {
        if (!likelyFinancial(sender, body)) return null

        val amount = amountPatterns.firstNotNullOfOrNull { pattern ->
            pattern.find(body)
                ?.groupValues
                ?.getOrNull(1)
                ?.replace(",", "")
                ?.toDoubleOrNull()
        } ?: return null

        val isCredit = creditWords.containsMatchIn(body)
        val isDebit = debitWords.containsMatchIn(body)
        if (!isCredit && !isDebit) return null

        val type = when {
            isCredit && !isDebit -> "credit"
            isDebit && !isCredit -> "debit"
            refundWords.containsMatchIn(body) -> "credit"
            salaryWords.containsMatchIn(body) -> "credit"
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
            ?.take(45)

        val description = semanticDescription(type, body, merchant)

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
            confidence = if (description.startsWith("Uncategorised")) 0.72 else 0.96,
        )
    }

    private fun semanticDescription(type: String, body: String, merchant: String?): String {
        fun sourceOr(fallback: String): String = merchant?.takeIf { it.isNotBlank() } ?: fallback

        if (type == "credit") {
            return when {
                salaryWords.containsMatchIn(body) -> "Salary income received from ${sourceOr("employer")}" 
                refundWords.containsMatchIn(body) -> "Refund or reversal received from ${sourceOr("provider")}" 
                interestWords.containsMatchIn(body) -> "Interest or investment income received from ${sourceOr("financial institution")}" 
                loanInWords.containsMatchIn(body) -> "Loan proceeds received from ${sourceOr("lender")}" 
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
            loanRepaymentWords.containsMatchIn(body) -> "Loan repayment to ${sourceOr("lender")}" 
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
