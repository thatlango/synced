package com.tukutuku.synced.ui

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.PersonAdd
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.tukutuku.synced.app.HouseholdViewModel
import com.tukutuku.synced.ui.components.EmptyState
import com.tukutuku.synced.ui.components.SyncedCard
import com.tukutuku.synced.ui.components.money
import com.tukutuku.synced.ui.theme.*

@Composable
fun HouseholdScreen(vm: HouseholdViewModel = hiltViewModel()) {
    val state by vm.state.collectAsStateWithLifecycle()
    val invite by vm.invite.collectAsStateWithLifecycle()
    var showCreate by remember { mutableStateOf(false) }
    var showJoin by remember { mutableStateOf(false) }

    LazyColumn(
        modifier = Modifier.fillMaxSize(),
        contentPadding = PaddingValues(18.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp),
    ) {
        item {
            Text("Shared spaces", style = MaterialTheme.typography.headlineMedium, fontWeight = FontWeight.Black)
            Text("Coordinate household money without exposing personal finances unnecessarily.", color = Muted)
        }
        item {
            Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                Button(onClick = { showCreate = true }, modifier = Modifier.weight(1f)) { Text("Create") }
                OutlinedButton(onClick = { showJoin = true }, modifier = Modifier.weight(1f)) { Text("Join") }
            }
        }

        when {
            state.loading -> item { LinearProgressIndicator(Modifier.fillMaxWidth()) }
            state.data.isNullOrEmpty() -> item {
                EmptyState("No shared space yet", "Create one for a household, couple or other trusted money group.")
            }
            else -> items(state.data.orEmpty(), key = { it.id }) { household ->
                SyncedCard {
                    Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                        Column(Modifier.weight(1f)) {
                            Text(household.name, fontWeight = FontWeight.Bold, style = MaterialTheme.typography.titleMedium)
                            Text(
                                "${household.count?.members ?: 1} member${if ((household.count?.members ?: 1) == 1) "" else "s"} • ${household.role ?: "member"}",
                                color = Muted,
                            )
                            household.wallet?.let {
                                Text(money(it.balance), fontWeight = FontWeight.Black, modifier = Modifier.padding(top = 7.dp))
                            }
                        }
                        if (household.role == "admin") {
                            IconButton(onClick = { vm.invite(household.id) }) {
                                Icon(Icons.Outlined.PersonAdd, contentDescription = "Invite", tint = Primary)
                            }
                        }
                    }
                }
            }
        }
    }

    if (showCreate) {
        ValueDialog(
            title = "Create shared space",
            label = "Name",
            onDismiss = { showCreate = false },
            onDone = {
                vm.create(it)
                showCreate = false
            },
        )
    }
    if (showJoin) {
        ValueDialog(
            title = "Join shared space",
            label = "Invite code",
            onDismiss = { showJoin = false },
            onDone = { code -> vm.join(code) { if (it.isSuccess) showJoin = false } },
        )
    }
    invite?.let {
        val fallback = "synced://join?code=${it.code}"
        InviteDialog(
            code = it.code,
            qrPayload = it.qrPayload ?: fallback,
            shareUrl = it.joinUrl ?: it.qrPayload ?: fallback,
            onDismiss = vm::clearInvite,
        )
    }
}

@Composable
private fun ValueDialog(
    title: String,
    label: String,
    onDismiss: () -> Unit,
    onDone: (String) -> Unit,
) {
    var value by remember { mutableStateOf("") }
    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text(title) },
        text = { OutlinedTextField(value, { value = it }, label = { Text(label) }) },
        confirmButton = {
            Button(onClick = { onDone(value) }, enabled = value.length >= 2) { Text("Continue") }
        },
        dismissButton = { TextButton(onClick = onDismiss) { Text("Cancel") } },
    )
}
