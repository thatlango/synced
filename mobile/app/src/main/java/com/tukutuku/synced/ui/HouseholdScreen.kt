package com.tukutuku.synced.ui

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.Add
import androidx.compose.material.icons.outlined.Groups
import androidx.compose.material.icons.outlined.PersonAdd
import androidx.compose.material.icons.outlined.ReceiptLong
import androidx.compose.material.icons.outlined.Savings
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
import com.tukutuku.synced.data.model.FINANCE_CATEGORIES
import com.tukutuku.synced.data.model.Transaction
import com.tukutuku.synced.ui.components.*
import com.tukutuku.synced.ui.theme.*

@Composable
fun HouseholdScreen(
    onJoin: () -> Unit,
    vm: HouseholdViewModel = hiltViewModel(),
) {
    val state by vm.state.collectAsStateWithLifecycle()
    val selectedId by vm.selectedId.collectAsStateWithLifecycle()
    val invite by vm.invite.collectAsStateWithLifecycle()
    val analytics by vm.analytics.collectAsStateWithLifecycle()
    val activity by vm.activity.collectAsStateWithLifecycle()
    val actionError by vm.actionError.collectAsStateWithLifecycle()

    var showCreate by remember { mutableStateOf(false) }
    var entryType by remember { mutableStateOf<String?>(null) }

    val spaces = state.data.orEmpty()
    val selected = spaces.firstOrNull { it.id == selectedId } ?: spaces.firstOrNull()
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
                Button(
                    onClick = { showCreate = true },
                    modifier = Modifier.weight(1f).heightIn(min = 50.dp),
                ) { Text("Create space") }
                OutlinedButton(
                    onClick = onJoin,
                    modifier = Modifier.weight(1f).heightIn(min = 50.dp),
                ) { Text("Join with code") }
            }
        }

        actionError?.let { message ->
            item {
                Card(colors = CardDefaults.cardColors(containerColor = Error.copy(alpha = .08f))) {
                    Row(
                        Modifier.fillMaxWidth().padding(14.dp),
                        verticalAlignment = Alignment.CenterVertically,
                    ) {
                        Text(message, color = Error, modifier = Modifier.weight(1f), style = MaterialTheme.typography.bodySmall)
                        TextButton(onClick = vm::clearActionError) { Text("Dismiss") }
                    }
                }
            }
        }

        if (spaces.size > 1) {
            item {
                Text("Viewing", style = MaterialTheme.typography.labelMedium, color = Muted)
                Spacer(Modifier.height(7.dp))
                LazyRow(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    items(spaces, key = { it.id }) { space ->
                        FilterChip(
                            selected = space.id == selected?.id,
                            onClick = { vm.select(space.id) },
                            label = { Text(space.name) },
                            leadingIcon = { Icon(Icons.Outlined.Groups, null) },
                        )
                    }
                }
            }
        }

        when {
            state.loading && spaces.isEmpty() -> item { LinearProgressIndicator(Modifier.fillMaxWidth()) }
            state.error != null && spaces.isEmpty() -> item {
                EmptyState(
                    "Shared spaces unavailable",
                    state.error ?: "Could not load your shared spaces.",
                    "Try again",
                    vm::refresh,
                )
            }
            spaces.isEmpty() -> item {
                EmptyState(
                    "Money together, boundaries intact",
                    "Create a space for a household, couple or trusted group. Shared balances and shared spending stay visible without exposing unrelated personal activity.",
                    "Create shared space",
                    { showCreate = true },
                )
            }
            selected != null -> {
                item {
                    Card(colors = CardDefaults.cardColors(containerColor = Hero), shape = MaterialTheme.shapes.extraLarge) {
                        Column(Modifier.fillMaxWidth().padding(22.dp)) {
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                Column(Modifier.weight(1f)) {
                                    Text(selected.name, color = Color.White.copy(alpha = .7f), fontWeight = FontWeight.SemiBold)
                                    Text("Shared balance", color = Color.White.copy(alpha = .6f), style = MaterialTheme.typography.labelMedium)
                                }
                                StatusPill(selected.role ?: "member", if (selected.role == "admin") "success" else "neutral")
                            }
                            Spacer(Modifier.height(8.dp))
                            Text(
                                money(selected.wallet?.balance ?: 0.0, selected.wallet?.currency ?: "UGX"),
                                color = Color.White,
                                style = MaterialTheme.typography.headlineLarge,
                                fontWeight = FontWeight.Black,
                            )
                            Spacer(Modifier.height(16.dp))
                            HorizontalDivider(color = Color.White.copy(alpha = .12f))
                            Spacer(Modifier.height(12.dp))
                            Row(Modifier.fillMaxWidth()) {
                                Column(Modifier.weight(1f)) {
                                    Text("Spent this month", color = Color.White.copy(alpha = .6f), style = MaterialTheme.typography.labelSmall)
                                    Text(money(shared?.totalSpentThisMonth ?: 0.0), color = Color.White, fontWeight = FontWeight.Bold)
                                }
                                Column(Modifier.weight(1f)) {
                                    Text("Members", color = Color.White.copy(alpha = .6f), style = MaterialTheme.typography.labelSmall)
                                    Text("${selected.count?.members ?: shared?.memberBreakdown?.size ?: 1}", color = Color.White, fontWeight = FontWeight.Bold)
                                }
                            }
                        }
                    }
                }

                item {
                    Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                        SharedAction(
                            label = "Add money",
                            icon = Icons.Outlined.Savings,
                            modifier = Modifier.weight(1f),
                            onClick = { entryType = "credit" },
                        )
                        SharedAction(
                            label = "Expense",
                            icon = Icons.Outlined.ReceiptLong,
                            modifier = Modifier.weight(1f),
                            onClick = { entryType = "debit" },
                        )
                        if (selected.role == "admin") {
                            SharedAction(
                                label = "Invite",
                                icon = Icons.Outlined.PersonAdd,
                                modifier = Modifier.weight(1f),
                                onClick = { vm.invite(selected.id) },
                            )
                        }
                    }
                }

                if (analytics.loading) {
                    item { LinearProgressIndicator(Modifier.fillMaxWidth()) }
                } else if (shared != null && shared.memberBreakdown.isNotEmpty()) {
                    item {
                        SectionTitle("Who spent what")
                        Spacer(Modifier.height(8.dp))
                        SyncedCard {
                            shared.memberBreakdown.forEachIndexed { index, member ->
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
                                            member.topCategories.firstOrNull()?.let { categoryLabel(it.category) } ?: "No shared spending yet",
                                            color = Muted,
                                            style = MaterialTheme.typography.bodySmall,
                                        )
                                    }
                                    Text(money(member.totalSpent), fontWeight = FontWeight.Bold, color = Ink)
                                }
                                if (index != shared.memberBreakdown.lastIndex) {
                                    HorizontalDivider(Modifier.padding(vertical = 10.dp))
                                }
                            }
                        }
                    }
                }

                if (shared?.byCategory?.isNotEmpty() == true) {
                    item {
                        SectionTitle("Shared spending")
                        Spacer(Modifier.height(8.dp))
                        SyncedCard {
                            shared.byCategory.take(4).forEachIndexed { index, category ->
                                Row(Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
                                    Text(categoryLabel(category.category), color = Ink, modifier = Modifier.weight(1f))
                                    Text("${category.percentage}%", color = Muted)
                                    Spacer(Modifier.width(12.dp))
                                    Text(money(category.amount), fontWeight = FontWeight.Bold, color = Ink)
                                }
                                if (index != shared.byCategory.take(4).lastIndex) {
                                    HorizontalDivider(Modifier.padding(vertical = 9.dp))
                                }
                            }
                        }
                    }
                }

                item { SectionTitle("Recent shared activity") }
                when {
                    activity.loading -> item { LinearProgressIndicator(Modifier.fillMaxWidth()) }
                    activity.error != null -> item {
                        Text(activity.error ?: "Could not load shared activity", color = Error, style = MaterialTheme.typography.bodySmall)
                    }
                    activity.data.orEmpty().isEmpty() -> item {
                        Text("No shared money movement yet. Add money or record an expense to start the shared ledger.", color = Muted)
                    }
                    else -> items(activity.data.orEmpty().take(8), key = { it.id }) { transaction ->
                        SharedActivityRow(transaction)
                    }
                }

                if (spaces.size == 1) {
                    item {
                        Text(
                            "Only activity posted to ${selected.name} is visible here. Personal transactions and balances stay outside the shared space.",
                            color = Muted,
                            style = MaterialTheme.typography.bodySmall,
                        )
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
            onDone = { name ->
                vm.create(name) { result -> if (result.isSuccess) showCreate = false }
            },
        )
    }

    entryType?.let { type ->
        SharedEntryDialog(
            type = type,
            spaceName = selected?.name.orEmpty(),
            onDismiss = { entryType = null },
            onCreate = { amount, category, description, merchant ->
                vm.addSharedTransaction(type, amount, category, description, merchant) { result ->
                    if (result.isSuccess) entryType = null
                }
            },
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
private fun SharedAction(
    label: String,
    icon: androidx.compose.ui.graphics.vector.ImageVector,
    modifier: Modifier = Modifier,
    onClick: () -> Unit,
) {
    OutlinedButton(
        onClick = onClick,
        modifier = modifier.heightIn(min = 54.dp),
        contentPadding = PaddingValues(horizontal = 8.dp),
    ) {
        Icon(icon, null)
        Spacer(Modifier.width(6.dp))
        Text(label, maxLines = 1)
    }
}

@Composable
private fun SharedActivityRow(transaction: Transaction) {
    SyncedCard {
        Row(Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
            Surface(
                shape = MaterialTheme.shapes.medium,
                color = if (transaction.type == "credit") SecondarySoft else PrimarySoft,
            ) {
                Icon(
                    if (transaction.type == "credit") Icons.Outlined.Add else Icons.Outlined.ReceiptLong,
                    null,
                    tint = if (transaction.type == "credit") Secondary else Primary,
                    modifier = Modifier.padding(10.dp),
                )
            }
            Spacer(Modifier.width(10.dp))
            Column(Modifier.weight(1f)) {
                Text(
                    transaction.description ?: transaction.merchant ?: categoryLabel(transaction.category ?: "other"),
                    fontWeight = FontWeight.SemiBold,
                    color = Ink,
                )
                Text(
                    listOfNotNull(
                        transaction.user?.name,
                        transaction.category?.let(::categoryLabel),
                    ).joinToString(" • ").ifBlank { "Shared activity" },
                    color = Muted,
                    style = MaterialTheme.typography.bodySmall,
                )
            }
            Text(
                "${if (transaction.type == "credit") "+" else "−"}${money(transaction.amount)}",
                fontWeight = FontWeight.Black,
                color = Ink,
            )
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
        title = { Text(title, fontWeight = FontWeight.Black) },
        text = { OutlinedTextField(value, { value = it }, label = { Text(label) }, modifier = Modifier.fillMaxWidth()) },
        confirmButton = {
            Button(onClick = { onDone(value.trim()) }, enabled = value.trim().length >= 2) {
                Text("Continue")
            }
        },
        dismissButton = { TextButton(onClick = onDismiss) { Text("Cancel") } },
    )
}

@Composable
private fun SharedEntryDialog(
    type: String,
    spaceName: String,
    onDismiss: () -> Unit,
    onCreate: (Double, String, String?, String?) -> Unit,
) {
    var amount by remember { mutableStateOf("") }
    var category by remember { mutableStateOf(if (type == "credit") "transfer" else "other") }
    var description by remember { mutableStateOf("") }
    var merchant by remember { mutableStateOf("") }
    val categories = FINANCE_CATEGORIES.filterNot { it in listOf("salary", "savings") }

    AlertDialog(
        onDismissRequest = onDismiss,
        title = {
            Column {
                Text(if (type == "credit") "Add shared money" else "Record shared expense", fontWeight = FontWeight.Black)
                Text(spaceName, color = Muted, style = MaterialTheme.typography.bodySmall)
            }
        },
        text = {
            Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                OutlinedTextField(
                    value = amount,
                    onValueChange = { amount = it.filter { c -> c.isDigit() || c == '.' } },
                    label = { Text("Amount (UGX)") },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth(),
                )
                if (type == "debit") {
                    Text("Category", color = Muted, style = MaterialTheme.typography.labelMedium)
                    LazyRow(horizontalArrangement = Arrangement.spacedBy(7.dp)) {
                        items(categories) { item ->
                            FilterChip(
                                selected = category == item,
                                onClick = { category = item },
                                label = { Text(categoryLabel(item)) },
                            )
                        }
                    }
                }
                OutlinedTextField(
                    value = description,
                    onValueChange = { description = it },
                    label = { Text(if (type == "credit") "Contribution note (optional)" else "What was it for?") },
                    modifier = Modifier.fillMaxWidth(),
                    singleLine = true,
                )
                if (type == "debit") {
                    OutlinedTextField(
                        value = merchant,
                        onValueChange = { merchant = it },
                        label = { Text("Merchant / payee (optional)") },
                        modifier = Modifier.fillMaxWidth(),
                        singleLine = true,
                    )
                }
                Text(
                    if (type == "credit")
                        "This increases the shared balance and is visible to members as your contribution."
                    else
                        "This is recorded against the shared wallet and appears in member and category analysis.",
                    color = Muted,
                    style = MaterialTheme.typography.bodySmall,
                )
            }
        },
        confirmButton = {
            Button(
                onClick = {
                    onCreate(
                        amount.toDoubleOrNull() ?: 0.0,
                        if (type == "credit") "transfer" else category,
                        description.ifBlank { if (type == "credit") "Shared contribution" else null },
                        merchant.ifBlank { null },
                    )
                },
                enabled = (amount.toDoubleOrNull() ?: 0.0) > 0,
            ) { Text(if (type == "credit") "Add money" else "Save expense") }
        },
        dismissButton = { TextButton(onClick = onDismiss) { Text("Cancel") } },
    )
}
