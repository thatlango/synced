package com.tukutuku.synced.ui

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.Add
import androidx.compose.material.icons.outlined.GroupAdd
import androidx.compose.material.icons.outlined.Groups
import androidx.compose.material.icons.outlined.PersonAdd
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.tukutuku.synced.app.HouseholdViewModel
import com.tukutuku.synced.ui.components.EmptyState
import com.tukutuku.synced.ui.components.GradientCard
import com.tukutuku.synced.ui.components.SectionTitle
import com.tukutuku.synced.ui.components.SyncedCard
import com.tukutuku.synced.ui.components.money
import com.tukutuku.synced.ui.theme.*

@Composable
fun HouseholdScreen(vm: HouseholdViewModel = hiltViewModel()) {
    val state by vm.state.collectAsStateWithLifecycle()
    val invite by vm.invite.collectAsStateWithLifecycle()
    var showCreate by remember { mutableStateOf(false) }
    var showJoin by remember { mutableStateOf(false) }
    val households = state.data.orEmpty()

    LazyColumn(
        modifier = Modifier.fillMaxSize(),
        contentPadding = PaddingValues(start = 20.dp, end = 20.dp, top = 20.dp, bottom = 28.dp),
        verticalArrangement = Arrangement.spacedBy(14.dp),
    ) {
        item {
            Text("Shared", style = MaterialTheme.typography.headlineLarge, fontWeight = FontWeight.Black, color = Ink)
            Text("Coordinate money with people you trust.", color = Muted, style = MaterialTheme.typography.bodyLarge)
        }

        if (households.isNotEmpty()) {
            item {
                val totalShared = households.sumOf { it.wallet?.balance ?: 0.0 }
                val totalMembers = households.sumOf { it.count?.members ?: 1 }
                GradientCard(Modifier.fillMaxWidth()) {
                    Text("SHARED BALANCE", color = Color.White.copy(alpha = .68f), style = MaterialTheme.typography.labelMedium)
                    Spacer(Modifier.height(7.dp))
                    Text(money(totalShared), color = Color.White, style = MaterialTheme.typography.displaySmall, fontWeight = FontWeight.Black)
                    Text(
                        "Across ${households.size} space${if (households.size == 1) "" else "s"} · $totalMembers member${if (totalMembers == 1) "" else "s"}",
                        color = Color.White.copy(alpha = .72f),
                    )
                }
            }
        }

        item {
            Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                SharedAction(
                    label = "Create space",
                    icon = Icons.Outlined.Add,
                    onClick = { showCreate = true },
                    modifier = Modifier.weight(1f),
                )
                SharedAction(
                    label = "Join space",
                    icon = Icons.Outlined.GroupAdd,
                    onClick = { showJoin = true },
                    modifier = Modifier.weight(1f),
                )
            }
        }

        when {
            state.loading -> item { LinearProgressIndicator(Modifier.fillMaxWidth(), color = Primary) }
            households.isEmpty() -> item {
                EmptyState(
                    "No shared space yet",
                    "Create one for a household, couple or any trusted money group.",
                    "Create space",
                ) { showCreate = true }
            }
            else -> {
                item { SectionTitle("Your spaces") }
                items(households, key = { it.id }) { household ->
                    SyncedCard {
                        Row(Modifier.fillMaxWidth(), verticalAlignment = Alignment.Top) {
                            Surface(shape = CircleShape, color = PrimarySoft) {
                                Icon(
                                    Icons.Outlined.Groups,
                                    contentDescription = null,
                                    tint = Primary,
                                    modifier = Modifier.padding(11.dp),
                                )
                            }
                            Spacer(Modifier.width(12.dp))
                            Column(Modifier.weight(1f)) {
                                Text(household.name, fontWeight = FontWeight.Bold, style = MaterialTheme.typography.titleMedium, color = Ink)
                                Text(
                                    "${household.count?.members ?: 1} member${if ((household.count?.members ?: 1) == 1) "" else "s"} · ${household.role ?: "member"}",
                                    color = Muted,
                                    style = MaterialTheme.typography.bodySmall,
                                )
                                household.wallet?.let {
                                    Spacer(Modifier.height(9.dp))
                                    Text(money(it.balance), fontWeight = FontWeight.Black, color = Ink, style = MaterialTheme.typography.headlineSmall)
                                    Text("shared balance", color = Muted, style = MaterialTheme.typography.labelSmall)
                                }
                            }
                            if (household.role == "admin") {
                                Surface(shape = RoundedCornerShape(15.dp), color = SecondarySoft) {
                                    IconButton(onClick = { vm.invite(household.id) }) {
                                        Icon(Icons.Outlined.PersonAdd, contentDescription = "Invite", tint = Secondary)
                                    }
                                }
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
private fun SharedAction(
    label: String,
    icon: androidx.compose.ui.graphics.vector.ImageVector,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
) {
    Surface(
        onClick = onClick,
        modifier = modifier,
        shape = RoundedCornerShape(20.dp),
        color = Surface,
        shadowElevation = 1.dp,
    ) {
        Column(Modifier.padding(15.dp), horizontalAlignment = Alignment.Start) {
            Surface(shape = CircleShape, color = PrimarySoft) {
                Icon(icon, contentDescription = null, tint = Primary, modifier = Modifier.padding(9.dp).size(19.dp))
            }
            Spacer(Modifier.height(10.dp))
            Text(label, color = Ink, fontWeight = FontWeight.SemiBold, style = MaterialTheme.typography.bodyMedium)
        }
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
