package com.tukutuku.synced.ui

import android.Manifest
import android.content.pm.PackageManager
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.layout.*
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.PrivacyTip
import androidx.compose.material.icons.outlined.Sms
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.core.content.ContextCompat
import androidx.work.WorkInfo
import androidx.work.WorkManager
import com.tukutuku.synced.ui.components.SyncedCard
import com.tukutuku.synced.ui.theme.*
import com.tukutuku.synced.worker.SmsSyncWorker
import java.util.UUID
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.delay
import kotlinx.coroutines.withContext

@Composable
fun SmsSyncScreen(onBack: () -> Unit) {
    val context = LocalContext.current
    var granted by remember {
        mutableStateOf(
            ContextCompat.checkSelfPermission(context, Manifest.permission.READ_SMS) == PackageManager.PERMISSION_GRANTED,
        )
    }
    var backgroundSync by remember { mutableStateOf(SmsSyncWorker.isBackgroundEnabled(context)) }
    var workId by rememberSaveable { mutableStateOf<String?>(null) }
    val workInfo by produceState<WorkInfo?>(initialValue = null, key1 = workId) {
        val id = workId?.let(UUID::fromString) ?: return@produceState
        val workManager = WorkManager.getInstance(context)
        while (true) {
            val info = withContext(Dispatchers.IO) { workManager.getWorkInfoById(id).get() }
            value = info
            if (
                info == null ||
                info.state == WorkInfo.State.SUCCEEDED ||
                info.state == WorkInfo.State.FAILED ||
                info.state == WorkInfo.State.CANCELLED
            ) {
                break
            }
            delay(400)
        }
    }
    val syncing = workInfo?.state == WorkInfo.State.ENQUEUED ||
        workInfo?.state == WorkInfo.State.RUNNING ||
        workInfo?.state == WorkInfo.State.BLOCKED

    val permissionLauncher = rememberLauncherForActivityResult(ActivityResultContracts.RequestPermission()) {
        granted = it
    }

    Column(
        modifier = Modifier.fillMaxSize().padding(18.dp),
        verticalArrangement = Arrangement.spacedBy(14.dp),
    ) {
        TextButton(onClick = onBack) { Text("← Back") }
        Icon(Icons.Outlined.Sms, contentDescription = null, tint = Secondary, modifier = Modifier.size(42.dp))
        Text("SMS transaction sync", style = MaterialTheme.typography.headlineMedium, fontWeight = FontWeight.Black)
        Text(
            "Synced reads eligible financial alerts on your device, parses them locally and sends only structured transaction candidates. Raw SMS text is not uploaded.",
            color = Muted,
        )
        SyncedCard {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Icon(Icons.Outlined.PrivacyTip, contentDescription = null, tint = Success)
                Spacer(Modifier.width(10.dp))
                Text(
                    "READ_SMS is used only after you opt in. Unrelated messages are discarded on-device.",
                    color = Muted,
                    modifier = Modifier.weight(1f),
                )
            }
        }

        if (!granted) {
            Button(
                onClick = { permissionLauncher.launch(Manifest.permission.READ_SMS) },
                modifier = Modifier.fillMaxWidth(),
            ) { Text("Allow SMS access") }
        } else {
            Button(
                onClick = { workId = SmsSyncWorker.runNow(context).toString() },
                modifier = Modifier.fillMaxWidth(),
                enabled = !syncing,
            ) {
                Text(if (syncing) "Syncing…" else "Scan and sync recent messages")
            }

            SmsSyncResultCard(workInfo)

            SyncedCard {
                Row(
                    Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically,
                ) {
                    Column(Modifier.weight(1f)) {
                        Text("Background sync", fontWeight = FontWeight.Bold)
                        Text("Check new eligible messages periodically when the phone is online.", color = Muted, style = MaterialTheme.typography.bodySmall)
                    }
                    Switch(
                        checked = backgroundSync,
                        onCheckedChange = {
                            backgroundSync = it
                            if (it) SmsSyncWorker.schedule(context) else SmsSyncWorker.cancel(context)
                        },
                    )
                }
            }
        }
    }
}

@Composable
private fun SmsSyncResultCard(info: WorkInfo?) {
    if (info == null) {
        Text(
            "Manual sync rescans up to the last 90 days, so messages missed by an older Synced parser can be recovered.",
            color = Muted,
            style = MaterialTheme.typography.bodySmall,
        )
        return
    }

    when (info.state) {
        WorkInfo.State.ENQUEUED,
        WorkInfo.State.RUNNING,
        WorkInfo.State.BLOCKED,
        -> SyncedCard(containerColor = PrimarySoft) {
            LinearProgressIndicator(Modifier.fillMaxWidth())
            Spacer(Modifier.height(10.dp))
            Text("Scanning financial alerts…", fontWeight = FontWeight.Bold, color = Ink)
            Text("This can take a moment on phones with a large message history.", color = Muted, style = MaterialTheme.typography.bodySmall)
        }

        WorkInfo.State.SUCCEEDED -> {
            val scanned = info.outputData.getInt("scanned", 0)
            val candidates = info.outputData.getInt("candidates", 0)
            val processed = info.outputData.getInt("processed", 0)
            val skipped = info.outputData.getInt("skipped", 0)
            val internalTransfers = info.outputData.getInt("internalTransfers", 0)
            SyncedCard(containerColor = if (processed > 0) SuccessSoft else SurfaceAlt) {
                Text(
                    if (processed > 0) "SMS sync complete" else "No new transactions imported",
                    fontWeight = FontWeight.Bold,
                    color = Ink,
                )
                Spacer(Modifier.height(5.dp))
                Text(
                    "Scanned $scanned messages • matched $candidates • imported $processed${if (skipped > 0) " • skipped $skipped" else ""}${if (internalTransfers > 0) " • reconciled $internalTransfers internal transfer${if (internalTransfers == 1) "" else "s"}" else ""}",
                    color = Muted,
                    style = MaterialTheme.typography.bodySmall,
                )
                if (scanned > 0 && candidates == 0 && internalTransfers == 0) {
                    Spacer(Modifier.height(7.dp))
                    Text(
                        "Synced did not find a confirmed credit or debit in the scanned messages. Payment prompts, reminders, pending notices and other non-transaction messages are ignored.",
                        color = Muted,
                        style = MaterialTheme.typography.bodySmall,
                    )
                }
                if (internalTransfers > 0) {
                    Spacer(Modifier.height(7.dp))
                    Text(
                        "Matched movements between your bank and mobile-money accounts were treated as internal transfers, not new income or spending.",
                        color = Muted,
                        style = MaterialTheme.typography.bodySmall,
                    )
                }
            }
        }

        WorkInfo.State.FAILED -> SyncedCard(containerColor = ErrorSoft) {
            Text("SMS sync could not finish", fontWeight = FontWeight.Bold, color = Ink)
            Text(
                info.outputData.getString("error") ?: "Check your connection and try again.",
                color = Muted,
                style = MaterialTheme.typography.bodySmall,
            )
        }

        WorkInfo.State.CANCELLED -> Text("SMS sync was cancelled.", color = Muted, style = MaterialTheme.typography.bodySmall)
    }
}