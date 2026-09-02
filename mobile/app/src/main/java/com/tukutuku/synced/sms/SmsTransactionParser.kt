package com.tukutuku.synced.sms

import com.tukutuku.synced.data.model.StructuredSmsCandidate
import java.security.MessageDigest

object SmsTransactionParser {
    private const val CURRENCY = "(?:UGX|UShs?|Shs?|Ug(?:\\.|andan)?\\s+Shs\\.?)"
    private const val AMOUNT = "([0-9][0-9,\\s]*(?:\\.[0-9]{1,2})?)"

    private data class Rule(
        val regex: Regex,
        val type: String,
        val descriptionPrefix: String,
        val amountGroup: Int = 1,
        val merchantGroup: Int? = null,
    )

    private data class ParsedMatch(
        val amount: Double,
        val type: String,
        val description: String,
        val merchant: String?,
    )

    // These messages mention money but do not prove that money moved. They are
    // intentionally rejected before transaction rules are evaluated.
    private val nonMovementPatterns = listOf(
        Regex("(?i)\\b(?:payment|transaction|debit|credit|withdrawal|deposit)\\s+(?:request|prompt|reminder|pending|initiated|awaiting|scheduled)\\b"),
        Regex("(?i)\\b(?:request to pay|payment request|collect request|please pay|amount due|due date|bill reminder|invoice reminder)\\b"),
        Regex("(?i)\\b(?:enter|use)\\s+(?:your\\s+)?(?:pin|otp)\\b|\\bone[- ]time password\\b|\\bverification code\\b"),
        Regex("(?i)\\b(?:authori[sz]e|approve)\\s+(?:this|the|a)?\\s*(?:payment|transaction|debit|transfer)\\b"),
        Regex("(?i)\\b(?:will be|may be|can be)\\s+(?:debited|credited|charged)\\b"),
        Regex("(?i)\\b(?:failed|declined|unsuccessful|cancelled|canceled|reversal pending)\\b"),
    )

    private val rules = listOf(
        Rule(
            Regex("(?i)\\byou have received\\s+$CURRENCY\\s*$AMOUNT\\s+from\\s+(.+?)(?:\\.|,|$)"),
            "credit",
            "Money received from",
            merchantGroup = 2,
        ),
        Rule(
            Regex("(?i)\\b$CURRENCY\\s*$AMOUNT\\s+received from\\s+(.+?)(?:\\.|,|$)"),
            "credit",
            "Money received from",
            merchantGroup = 2,
        ),
        Rule(
            Regex("(?i)\\b(?:your\\s+)?(?:airtel money\\s+)?payment of\\s+$CURRENCY\\s*$AMOUNT\\s+to\\s+(.+?)\\s+(?:has been completed|was successful|is successful|successful)(?:\\.|,|$)"),
            "debit",
            "Payment to",
            merchantGroup = 2,
        ),
        Rule(
            Regex("(?i)\\byou have sent\\s+$CURRENCY\\s*$AMOUNT\\s+to\\s+(.+?)(?:\\.|,|$)"),
            "debit",
            "Money sent to",
            merchantGroup = 2,
        ),
        Rule(
            Regex("(?i)\\b$CURRENCY\\s*$AMOUNT\\s+sent to\\s+(.+?)(?:\\.|,|\\s+on\\s+|$)"),
            "debit",
            "Money sent to",
            merchantGroup = 2,
        ),
        Rule(
            Regex("(?i)\\byou (?:have )?paid\\s+$CURRENCY\\s*$AMOUNT\\s+to\\s+(.+?)(?:\\.|,|$)"),
            "debit",
            "Payment to",
            merchantGroup = 2,
        ),
        Rule(
            Regex("(?i)\\b$CURRENCY\\s*$AMOUNT\\s+paid to\\s+(.+?)(?:\\.|,|$)"),
            "debit",
            "Payment to",
            merchantGroup = 2,
        ),
        Rule(
            Regex("(?i)\\byou have withdrawn\\s+$CURRENCY\\s*$AMOUNT(?:\\s+from\\s+(.+?))?(?:\\.|,|$)"),
            "debit",
            "Cash withdrawal from",
            merchantGroup = 2,
        ),
        Rule(
            Regex("(?i)\\bcash withdrawn\\s+$CURRENCY\\s*$AMOUNT(?:\\s+from\\s+(.+?))?(?:\\.|,|$)"),
            "debit",
            "Cash withdrawal from",
            merchantGroup = 2,
        ),
        Rule(
            Regex("(?i)\\byou have deposited\\s+$CURRENCY\\s*$AMOUNT(?:\\s+(?:to|at)\\s+(.+?))?(?:\\.|,|$)"),
            "credit",
            "Cash deposit",
            merchantGroup = 2,
        ),
        Rule(
            Regex("(?i)\\bairtime purchase of\\s+$CURRENCY\\s*$AMOUNT(?:\\s+for\\s+(.+?))?\\s+(?:was successful|successful)(?:\\.|,|$)"),
            "debit",
            "Airtime purchase for",
            merchantGroup = 2,
        ),
        Rule(
            Regex("(?i)\\b$CURRENCY\\s*$AMOUNT\\s+(?:data\\s+)?bundle\\s+(?:purchase\\s+)?(?:activated|purchased|bought)\\s+successfully"),
            "debit",
            "Data bundle purchase",
        ),
        Rule(
            Regex("(?i)\\b(Stanbic|DFCU|Equity|Centenary|PostBank|Absa|Standard Chartered)(?:\\s+Bank)?[^\\n]{0,60}?$CURRENCY\\s*$AMOUNT\\s+(?:has been\\s+)?credited\\b"),
            "credit",
            "Bank credit at",
            amountGroup = 2,
            merchantGroup = 1,
        ),
        Rule(
            Regex("(?i)\\b(Stanbic|DFCU|Equity|Centenary|PostBank|Absa|Standard Chartered)(?:\\s+Bank)?[^\\n]{0,60}?$CURRENCY\\s*$AMOUNT\\s+(?:has been\\s+)?debited\\b"),
            "debit",
            "Bank debit at",
            amountGroup = 2,
            merchantGroup = 1,
        ),
        Rule(
            Regex("(?i)\\b(?:your\\s+)?(?:account|acct|a/c)[^\\n]{0,32}?\\b(?:has\\s+been\\s+)?credited(?:\\s+with)?\\s+$CURRENCY\\s*$AMOUNT\\b"),
            "credit",
            "Account credited",
        ),
        Rule(
            Regex("(?i)\\b(?:your\\s+)?(?:account|acct|a/c)[^\\n]{0,32}?\\b(?:has\\s+been\\s+)?debited(?:\\s+with)?\\s+$CURRENCY\\s*$AMOUNT\\b"),
            "debit",
            "Account debited",
        ),
        Rule(
            Regex("(?i)\\byou have been credited(?:\\s+with)?\\s+$CURRENCY\\s*$AMOUNT\\b"),
            "credit",
            "Account credited",
        ),
        Rule(
            Regex("(?i)\\byou have been debited(?:\\s+with)?\\s+$CURRENCY\\s*$AMOUNT\\b"),
            "debit",
            "Account debited",
        ),
        Rule(
            Regex("(?i)\\b$CURRENCY\\s*$AMOUNT\\s+(?:has been\\s+)?credited(?:\\s+to\\s+(?:your\\s+)?(?:account|acct|a/c))?\\b"),
            "credit",
            "Credit received",
        ),
        Rule(
            Regex("(?i)\\b$CURRENCY\\s*$AMOUNT\\s+(?:has been\\s+)?debited(?:\\s+from\\s+(?:your\\s+)?(?:account|acct|a/c))?\\b"),
            "debit",
            "Debit processed",
        ),
        Rule(
            Regex("(?i)\\bTxId:\\s*\\w+\\s+$CURRENCY\\s*$AMOUNT\\s+sent to\\s+(.+?)\\s+on\\b"),
            "debit",
            "Money sent to",
            merchantGroup = 2,
        ),
    )

    fun likelyFinancial(sender: String?, body: String): Boolean = match(body) != null

    fun parse(sender: String?, body: String, timestamp: Long): StructuredSmsCandidate? {
        val parsed = match(body) ?: return null
        val providerText = "${sender.orEmpty()} $body".lowercase()
        val source = when {
            "airtel" in providerText -> "airtel"
            "mtn" in providerText ||
                "momo" in providerText ||
                "mobilemoney" in providerText ||
                "mobile money" in providerText -> "mtn"
            else -> "sms"
        }

        val normalized = body.lowercase().replace(Regex("\\s+"), " ").trim()
        val referenceId = sha256("${sender.orEmpty()}|$timestamp|$normalized")

        return StructuredSmsCandidate(
            amount = parsed.amount,
            type = parsed.type,
            description = "${parsed.description} [synced-ts:$timestamp]",
            merchant = parsed.merchant,
            referenceId = referenceId,
            source = source,
            confidence = 0.99,
        )
    }

    private fun match(body: String): ParsedMatch? {
        if (body.isBlank() || nonMovementPatterns.any { it.containsMatchIn(body) }) return null

        for (rule in rules) {
            val result = rule.regex.find(body) ?: continue
            val rawAmount = result.groupValues.getOrNull(rule.amountGroup).orEmpty()
            val amount = rawAmount.replace(",", "").replace(" ", "").toDoubleOrNull() ?: continue
            if (amount <= 0) continue

            val merchant = rule.merchantGroup
                ?.let { result.groupValues.getOrNull(it) }
                ?.trim()
                ?.trimEnd('.', ',')
                ?.takeIf { it.isNotBlank() }
                ?.take(80)

            val description = if (merchant != null) {
                "${rule.descriptionPrefix} $merchant"
            } else {
                rule.descriptionPrefix.removeSuffix(" from").removeSuffix(" for")
            }

            return ParsedMatch(
                amount = amount,
                type = rule.type,
                description = description,
                merchant = merchant,
            )
        }
        return null
    }

    private fun sha256(value: String): String = MessageDigest.getInstance("SHA-256")
        .digest(value.toByteArray())
        .joinToString("") { "%02x".format(it) }
}