package com.tukutuku.synced.sms

import android.Manifest
import android.content.Context
import android.content.pm.PackageManager
import android.provider.Telephony
import androidx.core.content.ContextCompat
import com.tukutuku.synced.data.model.StructuredSmsCandidate
import dagger.hilt.android.qualifiers.ApplicationContext
import javax.inject.Inject
import javax.inject.Singleton

data class SmsScanResult(
    val candidates: List<StructuredSmsCandidate>,
    val newestTimestamp: Long,
    val scanned: Int,
    val internalTransferPairs: Int = 0,
)

@Singleton
class SmsReader @Inject constructor(
    @param:ApplicationContext private val context: Context,
) {
    fun scan(since: Long, limit: Int = 250): SmsScanResult {
        if (ContextCompat.checkSelfPermission(context, Manifest.permission.READ_SMS) != PackageManager.PERMISSION_GRANTED) {
            return SmsScanResult(emptyList(), since, 0)
        }

        val rows = mutableListOf<StructuredSmsCandidate>()
        var newest = since
        var scanned = 0
        val projection = arrayOf(Telephony.Sms.ADDRESS, Telephony.Sms.BODY, Telephony.Sms.DATE)

        context.contentResolver.query(
            Telephony.Sms.Inbox.CONTENT_URI,
            projection,
            "${Telephony.Sms.DATE} > ?",
            arrayOf(since.toString()),
            "${Telephony.Sms.DATE} ASC",
        )?.use { cursor ->
            val addressIndex = cursor.getColumnIndex(Telephony.Sms.ADDRESS)
            val bodyIndex = cursor.getColumnIndex(Telephony.Sms.BODY)
            val dateIndex = cursor.getColumnIndex(Telephony.Sms.DATE)

            while (cursor.moveToNext() && scanned < limit) {
                scanned += 1
                val sender = if (addressIndex >= 0) cursor.getString(addressIndex) else null
                val body = if (bodyIndex >= 0) cursor.getString(bodyIndex).orEmpty() else ""
                val timestamp = if (dateIndex >= 0) cursor.getLong(dateIndex) else 0L
                newest = maxOf(newest, timestamp)
                SmsTransactionParser.parse(sender, body, timestamp)?.let(rows::add)
            }
        }

        val reconciled = SmsTransferReconciler.reconcile(rows)
        return SmsScanResult(
            candidates = reconciled.candidates,
            newestTimestamp = newest,
            scanned = scanned,
            internalTransferPairs = reconciled.internalTransferPairs,
        )
    }
}