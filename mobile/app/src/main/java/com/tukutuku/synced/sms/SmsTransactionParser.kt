package com.tukutuku.synced.sms

import com.tukutuku.synced.data.model.StructuredSmsCandidate
import java.security.MessageDigest

object SmsTransactionParser {
    private val amountPatterns = listOf(
        Regex("""(?i)(?:UGX|UShs?|Shs?)\s*([0-9][0-9,]*(?:\.[0-9]{1,2})?)"""),
        Regex("""(?i)([0-9][0-9,]*(?:\.[0-9]{1,2})?)\s*(?:UGX|UShs?|Shs?)"""),
    )
    private val creditWords = Regex("""(?i)\b(received|credited|deposit(?:ed)?|cash[ -]?in|refund(?:ed)?)\b""")
    private val debitWords = Regex("""(?i)\b(sent|paid|payment|purchase|bought|withdrawn|withdrew|debited|airtime|bundle|cash[ -]?out)\b""")
    private val partyPattern = Regex("""(?i)\b(?:to|from|at)\s+([A-Za-z0-9 .&'_-]{2,45})""")

    fun likelyFinancial(sender: String?, body: String): Boolean {
        val haystack = "${sender.orEmpty()} $body"
        val knownProvider = haystack.contains("MTN", ignoreCase = true) ||
            haystack.contains("AIRTEL", ignoreCase = true) ||
            haystack.contains("MOMO", ignoreCase = true) ||
            haystack.contains("MOBILE MONEY", ignoreCase = true)
        return knownProvider &&
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

        val type = if (isCredit && !isDebit) "credit" else "debit"
        val providerText = (sender.orEmpty() + body).lowercase()
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

        val description = if (type == "credit") {
            merchant?.let { "Money received from $it" } ?: "Mobile money received"
        } else {
            merchant?.let { "Payment to $it" } ?: "Mobile money payment"
        }

        // The body is used only locally to derive an idempotency fingerprint.
        // It is never included in the structured candidate sent to Synced.
        val normalized = body.lowercase().replace(Regex("""\s+"""), " ").trim()
        val referenceId = sha256("${sender.orEmpty()}|$timestamp|$normalized")

        return StructuredSmsCandidate(
            amount = amount,
            type = type,
            description = description,
            merchant = merchant,
            referenceId = referenceId,
            source = source,
            confidence = 0.96,
        )
    }

    private fun sha256(value: String): String = MessageDigest.getInstance("SHA-256")
        .digest(value.toByteArray())
        .joinToString("") { "%02x".format(it) }
}
