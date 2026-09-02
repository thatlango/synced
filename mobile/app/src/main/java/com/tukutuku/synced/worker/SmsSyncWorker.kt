package com.tukutuku.synced.worker

import android.content.Context
import androidx.hilt.work.HiltWorker
import androidx.work.*
import com.tukutuku.synced.data.repository.FinanceRepository
import com.tukutuku.synced.data.session.SessionStore
import com.tukutuku.synced.sms.SmsReader
import dagger.assisted.Assisted
import dagger.assisted.AssistedInject
import java.util.UUID
import java.util.concurrent.TimeUnit

@HiltWorker
class SmsSyncWorker @AssistedInject constructor(
    @Assisted context: Context,
    @Assisted params: WorkerParameters,
    private val reader: SmsReader,
    private val repo: FinanceRepository,
    private val sessions: SessionStore,
) : CoroutineWorker(context, params) {

    override suspend fun doWork(): Result {
        val wallet = repo.personalWalletId()
            ?: return retryOrFail("Personal wallet unavailable")

        val rescan = inputData.getBoolean(KEY_RESCAN, false)
        val now = System.currentTimeMillis()
        val previousCheckpoint = sessions.smsLastTimestamp()
        val since = if (rescan) {
            now - RESCAN_DAYS * DAY_MS
        } else {
            previousCheckpoint.takeIf { it > 0 } ?: now - RESCAN_DAYS * DAY_MS
        }

        return try {
            val scan = reader.scan(since, limit = if (rescan) 1500 else 400)
            if (scan.candidates.isEmpty()) {
                if (!rescan && scan.newestTimestamp > previousCheckpoint) {
                    sessions.setSmsLastTimestamp(scan.newestTimestamp)
                }
                return Result.success(
                    workDataOf(
                        "scanned" to scan.scanned,
                        "candidates" to 0,
                        "processed" to 0,
                        "skipped" to 0,
                        "rescanDays" to RESCAN_DAYS,
                    ),
                )
            }

            val ingestion = repo.ingestCandidates(wallet, scan.candidates)
            val processed = ingestion?.processed ?: scan.candidates.size
            val skipped = ingestion?.skipped ?: 0

            // Keep the incremental cursor moving forward after a successful network pass.
            // Manual sync still performs an explicit 90-day rescan, so parser improvements can
            // recover older messages even if an earlier app version advanced the cursor.
            if (scan.newestTimestamp > previousCheckpoint) {
                sessions.setSmsLastTimestamp(scan.newestTimestamp)
            }

            Result.success(
                workDataOf(
                    "scanned" to scan.scanned,
                    "candidates" to scan.candidates.size,
                    "processed" to processed,
                    "skipped" to skipped,
                    "rescanDays" to RESCAN_DAYS,
                ),
            )
        } catch (e: Exception) {
            retryOrFail(e.message ?: "SMS sync failed")
        }
    }

    private fun retryOrFail(message: String): Result =
        if (runAttemptCount < 2) Result.retry()
        else Result.failure(workDataOf("error" to message.take(200)))

    companion object {
        const val UNIQUE = "synced-sms-finance-sync"
        private const val KEY_RESCAN = "rescan"
        private const val PREFS = "synced_sms_sync"
        private const val BACKGROUND_ENABLED = "background_enabled"
        private const val RESCAN_DAYS = 90
        private const val DAY_MS = 86_400_000L

        fun schedule(context: Context) {
            context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
                .edit()
                .putBoolean(BACKGROUND_ENABLED, true)
                .apply()
            val constraints = Constraints.Builder()
                .setRequiredNetworkType(NetworkType.CONNECTED)
                .build()
            val request = PeriodicWorkRequestBuilder<SmsSyncWorker>(15, TimeUnit.MINUTES)
                .setConstraints(constraints)
                .build()
            WorkManager.getInstance(context).enqueueUniquePeriodicWork(
                UNIQUE,
                ExistingPeriodicWorkPolicy.UPDATE,
                request,
            )
        }

        fun cancel(context: Context) {
            context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
                .edit()
                .putBoolean(BACKGROUND_ENABLED, false)
                .apply()
            WorkManager.getInstance(context).cancelUniqueWork(UNIQUE)
        }

        fun isBackgroundEnabled(context: Context): Boolean =
            context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
                .getBoolean(BACKGROUND_ENABLED, false)

        fun runNow(context: Context): UUID {
            val request = OneTimeWorkRequestBuilder<SmsSyncWorker>()
                .setInputData(workDataOf(KEY_RESCAN to true))
                .setConstraints(
                    Constraints.Builder()
                        .setRequiredNetworkType(NetworkType.CONNECTED)
                        .build(),
                )
                .build()
            WorkManager.getInstance(context).enqueue(request)
            return request.id
        }
    }
}
