package com.tukutuku.synced.sms

import com.tukutuku.synced.data.model.StructuredSmsCandidate
import kotlin.math.abs

data class TransferReconciliationResult(val candidates: List<StructuredSmsCandidate>, val internalTransferPairs: Int, val reconciledReferenceIds: List<String> = emptyList())

object SmsTransferReconciler {
    private const val WINDOW_MS = 20 * 60 * 1000L
    private val timestampPattern = Regex("\\[synced-ts:(\\d+)]")
    private val knownBanks = listOf("stanbic", "dfcu", "equity", "centenary", "postbank", "absa", "standard chartered")

    fun reconcile(input: List<StructuredSmsCandidate>): TransferReconciliationResult {
        if (input.size < 2) return TransferReconciliationResult(input, 0)
        val output = input.toMutableList(); val matched = mutableSetOf<Int>(); var pairs = 0
        for (i in output.indices) {
            if (i in matched) continue
            val first = output[i]; val firstTime = timestamp(first) ?: continue
            val partner = output.indices.asSequence().filter { it != i && it !in matched }.mapNotNull { j ->
                val second = output[j]; val secondTime = timestamp(second) ?: return@mapNotNull null
                if (!strongInternalTransferPair(first, second, firstTime, secondTime)) return@mapNotNull null
                j to abs(firstTime - secondTime)
            }.minByOrNull { it.second }?.first ?: continue
            matched += i; matched += partner; pairs += 1
        }
        return TransferReconciliationResult(output.filterIndexed { index, _ -> index !in matched }, pairs, matched.mapNotNull { output[it].referenceId }.distinct())
    }

    private fun strongInternalTransferPair(first: StructuredSmsCandidate, second: StructuredSmsCandidate, firstTime: Long, secondTime: Long): Boolean {
        if (first.type == second.type || abs(first.amount - second.amount) > 1.0 || abs(firstTime - secondTime) > WINDOW_MS) return false
        val firstBank = isBankMovement(first); val secondBank = isBankMovement(second); val firstMobile = isMobileTransferMovement(first); val secondMobile = isMobileTransferMovement(second)
        return (firstBank && secondMobile) || (secondBank && firstMobile) || (firstMobile && secondMobile && first.source != second.source)
    }
    private fun isBankMovement(candidate: StructuredSmsCandidate): Boolean { if (candidate.source != "sms") return false; val text = "${candidate.description} ${candidate.merchant.orEmpty()}".lowercase(); return listOf("bank credit","bank debit","account credited","account debited","credit received","debit processed").any { it in text } || knownBanks.any { it in text } }
    private fun isMobileTransferMovement(candidate: StructuredSmsCandidate): Boolean { if (candidate.source !in setOf("mtn","airtel")) return false; val text = candidate.description.lowercase(); return listOf("money received from","money sent to","received from","sent to").any { it in text } }
    private fun timestamp(candidate: StructuredSmsCandidate): Long? = timestampPattern.find(candidate.description)?.groupValues?.getOrNull(1)?.toLongOrNull()
}