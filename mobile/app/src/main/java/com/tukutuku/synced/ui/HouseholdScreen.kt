package com.tukutuku.synced.ui

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.Groups
import androidx.compose.material.icons.outlined.PersonAdd
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.tukutuku.synced.app.HouseholdViewModel
import com.tukutuku.synced.ui.components.*
import com.tukutuku.synced.ui.theme.*

@Composable
fun HouseholdScreen(vm: HouseholdViewModel = hiltViewModel()) {
    val state by vm.state.collectAsStateWithLifecycle()
    val invite by vm.invite.collectAsStateWithLifecycle()
    val analytics by vm.analytics.collectAsStateWithLifecycle()
    var showCreate by remember { mutableStateOf(false) }
    var showJoin by remember { mutableStateOf(false) }
    val spaces = state.data.orEmpty()
    val shared = analytics.data

    LazyColumn(
        modifier = Modifier.fillMaxSize(),
        contentPadding = PaddingValues(horizontal = 18.dp, vertical = 16.dp),
        verticalArrangement = Arrangement.spacedBy(14.dp),
    ) {
        item {
            Text("Shared spaces", style = MaterialTheme.typography.headlineMedium, fontWeight = FontWeight.Black, color = Ink)
            Text("Coordinate shared money while keeping personal finances private.", color = Muted)
        }
        item {
            Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                Button(onClick = { showCreate = true }, modifier = Modifier.weight(1f).heightIn(min = 50.dp)) { Text("Create space") }
                OutlinedButton(onClick = { showJoin = true }, modifier = Modifier.weight(1f).heightIn(min = 50.dp)) { Text("Join") }
            }
        }

        if (shared != null && spaces.isNotEmpty()) {
            item {
                Card(colors = CardDefaults.cardColors(containerColor = Hero), shape = MaterialTheme.shapes.extraLarge) {
                    Column(Modifier.fillMaxWidth().padding(20.dp)) {
                        Text("${spaces.first().name} this month", color = androidx.compose.ui.graphics.Color.White.copy(alpha = .68f))
                        Text(
                            money(shared.totalSpentThisMonth),
                            color = androidx.compose.ui.graphics.Color.White,
                            style = MaterialTheme.typography.headlineLarge,
                            fontWeight = FontWeight.Black,
                        )
                        Text("shared spending", color = androidx.compose.ui.graphics.Color.White.copy(alpha = .68f))
                        if (shared.byCategory.isNotEmpty()) {
                            Spacer(Modifier.height(14.dp))
                            HorizontalDivider(color = androidx.compose.ui.graphics.Color.White.copy(alpha = .12f))
                            Spacer(Modifier.height(12.dp))
                            Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                                Text("Top category", color = androidx.compose.ui.graphics.Color.White.copy(alpha = .68f))
                                Text(
                                    "${categoryLabel(shared.byCategory.first().category)} • ${shared.byCategory.first().percentage}%",
                                    color = androidx.compose.ui.graphics.Color.White,
                                    fontWeight = FontWeight.Bold,
                                )
                            }
                        }
                    }
                }
            }

            if (shared.memberBreakdown.isNotEmpty()) {
                item {
                    SectionTitle("Who spent what")
                    Spacer(Modifier.height(8.dp))
                    SyncedCard {
                        shared.memberBreakdown.take(4).forEachIndexed { index, member ->
                            Row(Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
                                Surface(shape = MaterialTheme.shapes.medium, color = PrimarySoft) {
                                    Text(
                                        member.name?.take(1)?.uppercase() ?: "•",
                                        color = Primary,
                                        fontWeight = FontWeight.Black,
                                        modifier = Modifier.padding(horizontal = 13.dp, vertical = 10.dp),
                                    )
                                }
                                Spacer(Modifier.width(10.dp))
                                Column(Modifier.weight(1f)) {
                                    Text(member.name ?: "Member", fontWeight = FontWeight.SemiBold, color = Ink)
                                    Text(
                                        member.topCategories.firstOrNull()?.let { categoryLabel(it.category) } ?: "No category yet",
                                        color = Muted,
                                        style = MaterialTheme.typography.bodySmall,
                                    )
                                }
                                Text(money(member.totalSpent), fontWeight = FontWeight.Bold, color = Ink)
                            }
                            if (index != shared.memberBreakdown.take(4).lastIndex) {
                                HorizontalDivider(Modifier.padding(vertical = 10.dp))
                            }
                        }
                    }
                }
            }
        }

        when {
            state.loading -> item { LinearProgressIndicator(Modifier.fillMaxWidth()) }
            spaces.isEmpty() -> item {
                EmptyState(
                    "Money together, boundaries intact",
                    "Create a space for a household, couple or trusted group. Shared balances and shared spending stay visible without exposing unrelated personal activity.",
                    "Create shared space",
                    { showCreate = true },
                )
            }
            else -> {
                item { SectionTitle("Your spaces") }
                items(spaces, key = { it.id }) { household ->
                    SyncedCard {
                        Row(Modifier.fillMaxWidth(), verticalAlignment = Alignment.Top) {
                            Surface(shape = MaterialTheme.shapes.medium, color = SecondarySoft) {
                                Icon(Icons.Outlined.Groups, null, tint = Secondary, modifier = Modifier.padding(11.dp))
                            }
                            Spacer(Modifier.width(12.dp))
                            Column(Modifier.weight(1f)) {
                                Text(household.name, fontWeight = FontWeight.Bold, style = MaterialTheme.typography.titleMedium, color = Ink)
                                Text(
                                    "${household.count?.members ?: 1} member${if ((household.count?.members ?: 1) == 1) "" else "s"} • ${household.role ?: "member"}",
                                    color = Muted,
                                    style = MaterialTheme.typography.bodySmall,
                                )
                                household.wallet?.let {
                                    Spacer(Modifier.height(8.dp))
                                    Text("Shared balance", color = Muted, style = MaterialTheme.typography.labelSmall)
                                    Text(money(it.balance), fontWeight = FontWeight.Black, style = MaterialTheme.typography.titleLarge, color = Ink)
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
        item { Spacer(Modifier.height(8.dp)) }
    }

    if (showCreate) {
        ValueDialog(
            title = "Create shared space",
            label = "Household or group name",
            onDismiss = { showCreate = false },
            onDone = { vm.create(it); showCreate = false },
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
        InviteDialog(
            code = it.code,
            payload = it.qrPayload ?: it.joinUrl ?: "synced://join?code=${it.code}",
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
        title = { Text(title, fontWeight = FontWeight.Black) },
        text = { OutlinedTextField(value, { value = it }, label = { Text(label) }, modifier = Modifier.fillMaxWidth()) },
        confirmButton = { Button(onClick = { onDone(value) }, enabled = value.length >= 2) { Text("Continue") } },
        dismissButton = { TextButton(onClick = onDismiss) { Text("Cancel") } },
    )
}
