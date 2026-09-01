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
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.core.content.ContextCompat
import com.tukutuku.synced.ui.components.SyncedCard
import com.tukutuku.synced.ui.theme.*
import com.tukutuku.synced.worker.SmsSyncWorker

@Composable
fun SmsSyncScreen(onBack: () -> Unit) {
    val context = LocalContext.current
    var granted by remember {
        mutableStateOf(
            ContextCompat.checkSelfPermission(context, Manifest.permission.READ_SMS) == PackageManager.PERMISSION_GRANTED,
        )
    }
    var backgroundSync by remember { mutableStateOf(false) }
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
            "Synced reads eligible mobile-money messages on your device, parses them locally and sends only structured transaction candidates. Raw SMS text is not uploaded.",
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
                onClick = { SmsSyncWorker.runNow(context) },
                modifier = Modifier.fillMaxWidth(),
            ) { Text("Sync eligible messages now") }

            SyncedCard {
                Row(
                    Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically,
                ) {
                    Column(Modifier.weight(1f)) {
                        Text("Background sync", fontWeight = FontWeight.Bold)
                        Text("Check periodically when the phone is online.", color = Muted, style = MaterialTheme.typography.bodySmall)
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
