package com.tukutuku.synced.ui

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.AccountBalance
import androidx.compose.material.icons.outlined.Add
import androidx.compose.material.icons.outlined.ArrowDownward
import androidx.compose.material.icons.outlined.ArrowUpward
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.tukutuku.synced.app.TransactionsViewModel
import com.tukutuku.synced.data.model.deriveDebtSummary
import com.tukutuku.synced.ui.components.EmptyState
import com.tukutuku.synced.ui.components.SyncedCard
import com.tukutuku.synced.ui.components.money
import com.tukutuku.synced.ui.theme.*

@Composable
fun TransactionsScreen(vm: TransactionsViewModel = hiltViewModel()) {
    val rows by vm.rows.collectAsStateWithLifecycle()
    var showAdd by remember { mutableStateOf(false) }
    var filter by remember { mutableStateOf("all") }

    val allRows = rows.data.orEmpty()
    val visibleRows = remember(allRows, filter) {
        when (filter) {
            "credit" -> allRows.filter { it.type == "credit" }
            "debit" -> allRows.filter { it.type != "credit" }
            else -> allRows
        }
    }
    val debt = remember(allRows) { deriveDebtSummary(allRows) }
    val moneyIn = remember(allRows) { allRows.filter { it.type == "credit" }.sumOf { it.amount } }
    val moneyOut = remember(allRows) { allRows.filter { it.type != "credit" }.sumOf { it.amount } }

    Box(Modifier.fillMaxSize()) {
        LazyColumn(
            modifier = Modifier.fillMaxSize(),
            contentPadding = PaddingValues(start = 20.dp, end = 20.dp, top = 20.dp, bottom = 104.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp),
        ) {
            item {
                Text("Activity", style = MaterialTheme.typography.headlineLarge, fontWeight = FontWeight.Black, color = Ink)
                Text("Money in and money out, clearly.", color = Muted, style = MaterialTheme.typography.bodyLarge)
            }

            item {
                SyncedCard {
                    Text("CURRENT VIEW", color = Muted, style = MaterialTheme.typography.labelSmall, fontWeight = FontWeight.Bold)
                    Spacer(Modifier.height(12.dp))
                    Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                        ActivityMetric(
                            label = "Money in",
                            amount = money(moneyIn),
                            icon = { Icon(Icons.Outlined.ArrowDownward, null, tint = Success, modifier = Modifier.size(18.dp)) },
                            tint = SuccessSoft,
                            modifier = Modifier.weight(1f),
                        )
                        ActivityMetric(
                            label = "Money out",
                            amount = money(moneyOut),
                            icon = { Icon(Icons.Outlined.ArrowUpward, null, tint = Error, modifier = Modifier.size(18.dp)) },
                            tint = ErrorSoft,
                            modifier = Modifier.weight(1f),
                        )
                    }
                }
            }

            item {
                Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    ActivityFilter("All", filter == "all") { filter = "all" }
                    ActivityFilter("Money out", filter == "debit") { filter = "debit" }
                    ActivityFilter("Money in", filter == "credit") { filter = "credit" }
                }
            }

            if (debt.detectedEvents > 0) {
                item {
                    SyncedCard(containerColor = SecondarySoft) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Surface(shape = CircleShape, color = Color.White.copy(alpha = .82f)) {
                                Icon(
                                    Icons.Outlined.AccountBalance,
                                    contentDescription = null,
                                    tint = Secondary,
                                    modifier = Modifier.padding(10.dp),
                                )
                            }
                            Spacer(Modifier.width(12.dp))
                            Column(Modifier.weight(1f)) {
                                Text("Debt position", fontWeight = FontWeight.Bold, color = Ink)
                                Text("Known balances from classified messages", color = Muted, style = MaterialTheme.typography.bodySmall)
                            }
                        }
                        Spacer(Modifier.height(14.dp))
                        Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                            Column {
                                Text("Outstanding", color = Muted, style = MaterialTheme.typography.labelSmall)
                                Text(money(debt.knownOutstanding), fontWeight = FontWeight.Black, color = Ink)
                            }
                            Column(horizontalAlignment = Alignment.End) {
                                Text("Due", color = Muted, style = MaterialTheme.typography.labelSmall)
                                Text(money(debt.knownDue), fontWeight = FontWeight.Black, color = if (debt.knownDue > 0) Error else Ink)
                            }
                        }
                        debt.counterparties.take(2).forEach { item ->
                            Spacer(Modifier.height(10.dp))
                            HorizontalDivider(color = Color.White.copy(alpha = .8f))
                            Spacer(Modifier.height(10.dp))
                            Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                                Column(Modifier.weight(1f)) {
                                    Text(item.name, fontWeight = FontWeight.SemiBold, color = Ink)
                                    item.dueDate?.let {
                                        Text("Due ${it.substringBefore('T')}", color = Muted, style = MaterialTheme.typography.bodySmall)
                                    }
                                }
                                item.outstandingBalance?.let { Text(money(it), fontWeight = FontWeight.Bold, color = Ink) }
                            }
                        }
                    }
                }
            }

            when {
                rows.loading -> item { LinearProgressIndicator(Modifier.fillMaxWidth(), color = Primary) }
                allRows.isEmpty() -> item {
                    EmptyState(
                        "Nothing here yet",
                        "Transactions will appear here as you add them or sync eligible messages.",
                        "Add transaction",
                    ) { showAdd = true }
                }
                visibleRows.isEmpty() -> item {
                    EmptyState("No matches", "There are no transactions in this view yet.")
                }
                else -> items(visibleRows, key = { it.id }) { transaction -> TransactionRow(transaction) }
            }
        }

        FloatingActionButton(
            onClick = { showAdd = true },
            modifier = Modifier.align(Alignment.BottomEnd).padding(22.dp),
            containerColor = Primary,
            contentColor = Color.White,
            shape = RoundedCornerShape(20.dp),
        ) {
            Icon(Icons.Outlined.Add, contentDescription = "Add transaction")
        }
    }

    if (showAdd) {
        AddTransactionDialog(
            onDismiss = { showAdd = false },
            onCreate = { type, amount, category, description, merchant ->
                vm.create(type, amount, category, description, merchant) {
                    if (it.isSuccess) showAdd = false
                }
            },
        )
    }
}

@Composable
private fun ActivityMetric(
    label: String,
    amount: String,
    icon: @Composable () -> Unit,
    tint: Color,
    modifier: Modifier = Modifier,
) {
    Surface(modifier = modifier, color = SurfaceSoft, shape = RoundedCornerShape(18.dp)) {
        Column(Modifier.padding(13.dp)) {
            Surface(shape = CircleShape, color = tint) {
                Box(Modifier.padding(8.dp), contentAlignment = Alignment.Center) { icon() }
            }
            Spacer(Modifier.height(10.dp))
            Text(label, color = Muted, style = MaterialTheme.typography.labelSmall)
            Text(amount, color = Ink, fontWeight = FontWeight.Bold, style = MaterialTheme.typography.bodyMedium)
        }
    }
}

@Composable
private fun RowScope.ActivityFilter(label: String, selected: Boolean, onClick: () -> Unit) {
    FilterChip(
        selected = selected,
        onClick = onClick,
        label = { Text(label, style = MaterialTheme.typography.labelMedium) },
        modifier = Modifier.weight(1f),
        colors = FilterChipDefaults.filterChipColors(
            selectedContainerColor = PrimarySoft,
            selectedLabelColor = PrimaryDeep,
            containerColor = Surface,
            labelColor = Muted,
        ),
        border = FilterChipDefaults.filterChipBorder(
            enabled = true,
            selected = selected,
            borderColor = Border,
            selectedBorderColor = PrimarySoft,
        ),
    )
}

@Composable
private fun AddTransactionDialog(
    onDismiss: () -> Unit,
    onCreate: (String, Double, String?, String?, String?) -> Unit,
) {
    var type by remember { mutableStateOf("debit") }
    var amount by remember { mutableStateOf("") }
    var category by remember { mutableStateOf("general") }
    var description by remember { mutableStateOf("") }
    var merchant by remember { mutableStateOf("") }

    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text(if (type == "debit") "Add expense" else "Add income") },
        text = {
            Column(verticalArrangement = Arrangement.spacedBy(9.dp)) {
                Row {
                    FilterChip(type == "debit", { type = "debit" }, { Text("Expense") })
                    Spacer(Modifier.width(8.dp))
                    FilterChip(type == "credit", { type = "credit" }, { Text("Income") })
                }
                OutlinedTextField(amount, { amount = it.filter { c -> c.isDigit() || c == '.' } }, label = { Text("Amount (UGX)") })
                OutlinedTextField(category, { category = it }, label = { Text("Category") })
                OutlinedTextField(description, { description = it }, label = { Text("Description") })
                OutlinedTextField(merchant, { merchant = it }, label = { Text("Merchant / source") })
            }
        },
        confirmButton = {
            Button(
                onClick = {
                    amount.toDoubleOrNull()?.takeIf { it > 0 }?.let {
                        onCreate(
                            type,
                            it,
                            category.ifBlank { null },
                            description.ifBlank { null },
                            merchant.ifBlank { null },
                        )
                    }
                },
                enabled = (amount.toDoubleOrNull() ?: 0.0) > 0,
            ) { Text("Save") }
        },
        dismissButton = { TextButton(onClick = onDismiss) { Text("Cancel") } },
    )
}
