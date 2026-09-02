package com.tukutuku.synced.ui

import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.tukutuku.synced.app.InviteViewModel
import com.tukutuku.synced.data.model.RedeemInviteResult
import com.tukutuku.synced.ui.theme.*

@Composable
fun JoinInviteScreen(
    initialCode: String? = null,
    onDone: (RedeemInviteResult) -> Unit,
    onBack: () -> Unit,
    vm: InviteViewModel = hiltViewModel(),
) {
    var code by remember(initialCode) { mutableStateOf(initialCode.orEmpty()) }
    var redeeming by remember { mutableStateOf(false) }
    var redeemError by remember { mutableStateOf<String?>(null) }
    val preview by vm.preview.collectAsStateWithLifecycle()

    LaunchedEffect(initialCode) {
        if (!initialCode.isNullOrBlank()) vm.preview(initialCode)
    }

    Column(
        Modifier.fillMaxSize().padding(20.dp),
        verticalArrangement = Arrangement.spacedBy(14.dp),
    ) {
        TextButton(onClick = onBack) { Text("← Back") }
        Text("Join Synced", style = MaterialTheme.typography.headlineMedium, fontWeight = FontWeight.Black)
        Text("Enter an invite code from a shared space or Basket.", color = Muted)
        OutlinedTextField(
            value = code,
            onValueChange = {
                code = it.uppercase().filter { char -> char.isLetterOrDigit() }.take(12)
                redeemError = null
            },
            label = { Text("Invite code") },
            modifier = Modifier.fillMaxWidth(),
            singleLine = true,
        )
        Button(
            onClick = { vm.preview(code) },
            enabled = code.length >= 4 && !redeeming,
            modifier = Modifier.fillMaxWidth(),
        ) { Text("Preview invite") }

        if (preview.loading) LinearProgressIndicator(Modifier.fillMaxWidth())
        preview.error?.let { Text(it, color = Error) }
        redeemError?.let { Text(it, color = Error) }

        preview.data?.let { invite ->
            Card {
                Column(Modifier.padding(18.dp)) {
                    Text(
                        if (invite.targetType == "household") "Shared space" else "Basket",
                        color = Secondary,
                        fontWeight = FontWeight.Bold,
                    )
                    Text(
                        "Invite ${invite.code}",
                        style = MaterialTheme.typography.titleLarge,
                        fontWeight = FontWeight.Black,
                    )
                    Text("Role: ${invite.role ?: "member"}", color = Muted)
                    Spacer(Modifier.height(12.dp))
                    Button(
                        onClick = {
                            redeeming = true
                            redeemError = null
                            vm.redeem(code) { result ->
                                redeeming = false
                                result
                                    .onSuccess(onDone)
                                    .onFailure { redeemError = it.message ?: "Could not join this invite" }
                            }
                        },
                        enabled = !redeeming,
                        modifier = Modifier.fillMaxWidth(),
                    ) {
                        if (redeeming) {
                            CircularProgressIndicator(
                                modifier = Modifier.size(18.dp),
                                strokeWidth = 2.dp,
                            )
                            Spacer(Modifier.width(8.dp))
                        }
                        Text(if (redeeming) "Joining…" else "Join")
                    }
                }
            }
        }
    }
}
