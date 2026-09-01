package com.tukutuku.synced.ui

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.Add
import androidx.compose.material.icons.outlined.FilterList
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
import com.tukutuku.synced.data.model.FINANCE_CATEGORIES
import com.tukutuku.synced.ui.components.*
import com.tukutuku.synced.ui.theme.*

@Composable
fun TransactionsScreen(vm: TransactionsViewModel = hiltViewModel()) {
    val rows by vm.rows.collectAsStateWithLifecycle()
    var add by remember { mutableStateOf(false) }
    var filter by remember { mutableStateOf("all") }
    val all = rows.data.orEmpty()
    val visible = when (filter) {
        "debit" -> all.filter { it.type == "debit" }
        "credit" -> all.filter { it.type == "credit" }
        else -> all
    }
    val expenses = all.filter { it.type == "debit" }.sumOf { it.amount }
    val income = all.filter { it.type == "credit" }.sumOf { it.amount }

    Box(Modifier.fillMaxSize()) {
        LazyColumn(
            Modifier.fillMaxSize(),
            contentPadding = PaddingValues(horizontal = 18.dp, vertical = 16.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp),
        ) {
            item {
                Text("Transactions", style = MaterialTheme.typography.headlineMedium, fontWeight = FontWeight.Black, color = Ink)
                Text("One ledger for personal and shared money movement.", color = Muted)
            }
            item {
                Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                    MetricCard("Money out", money(expenses), "${all.count { it.type == "debit" }} entries", Modifier.weight(1f))
                    MetricCard("Money in", money(income), "${all.count { it.type == "credit" }} entries", Modifier.weight(1f))
                }
            }
            item {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Icon(Icons.Outlined.FilterList, null, tint = Muted)
                    Spacer(Modifier.width(8.dp))
                    FilterChip(selected = filter == "all", onClick = { filter = "all" }, label = { Text("All") })
                    Spacer(Modifier.width(8.dp))
                    FilterChip(selected = filter == "debit", onClick = { filter = "debit" }, label = { Text("Expenses") })
                    Spacer(Modifier.width(8.dp))
                    FilterChip(selected = filter == "credit", onClick = { filter = "credit" }, label = { Text("Income") })
                }
            }
            if (rows.loading) {
                item { LinearProgressIndicator(Modifier.fillMaxWidth()) }
            } else if (visible.isEmpty()) {
                item {
                    EmptyState(
                        if (all.isEmpty()) "No money movement yet" else "Nothing in this filter",
                        if (all.isEmpty()) "Add transactions manually or sync eligible mobile-money messages. Categories will feed your plans and analysis." else "Choose another filter to see more activity.",
                        if (all.isEmpty()) "Add transaction" else null,
                        if (all.isEmpty()) ({ add = true }) else null,
                    )
                }
            } else {
                items(visible, key = { it.id }) { transaction -> TransactionRow(transaction) }
            }
            item { Spacer(Modifier.height(80.dp)) }
        }
        FloatingActionButton(
            onClick = { add = true },
            modifier = Modifier.align(Alignment.BottomEnd).padding(22.dp),
            containerColor = Primary,
            contentColor = Color.White,
        ) {
            Icon(Icons.Outlined.Add, "Add transaction")
        }
    }

    if (add) {
        AddTransactionDialog(
            onDismiss = { add = false },
            onCreate = { type, amount, category, description, merchant ->
                vm.create(type, amount, category, description, merchant) { if (it.isSuccess) add = false }
            },
        )
    }
}

@Composable
private fun AddTransactionDialog(
    onDismiss: () -> Unit,
    onCreate: (String, Double, String?, String?, String?) -> Unit,
) {
    var type by remember { mutableStateOf("debit") }
    var amount by remember { mutableStateOf("") }
    var category by remember { mutableStateOf("other") }
    var desc by remember { mutableStateOf("") }
    var merchant by remember { mutableStateOf("") }
    val categories = if (type == "credit") listOf("salary", "transfer", "other") else FINANCE_CATEGORIES.filterNot { it == "salary" }

    AlertDialog(
        onDismissRequest = onDismiss,
        title = {
            Column {
                Text(if (type == "debit") "Add expense" else "Add income", fontWeight = FontWeight.Black)
                Text("Make the entry useful for your analysis.", color = Muted, style = MaterialTheme.typography.bodySmall)
            }
        },
        text = {
            Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                Row {
                    FilterChip(type == "debit", { type = "debit"; category = "other" }, { Text("Expense") })
                    Spacer(Modifier.width(8.dp))
                    FilterChip(type == "credit", { type = "credit"; category = "salary" }, { Text("Income") })
                }
                OutlinedTextField(
                    amount,
                    { amount = it.filter { c -> c.isDigit() || c == '.' } },
                    label = { Text("Amount (UGX)") },
                    modifier = Modifier.fillMaxWidth(),
                    singleLine = true,
                )
                Column {
                    Text("Category", style = MaterialTheme.typography.labelMedium, color = Muted)
                    Spacer(Modifier.height(6.dp))
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
                    desc,
                    { desc = it },
                    label = { Text("What was it for?") },
                    modifier = Modifier.fillMaxWidth(),
                    singleLine = true,
                )
                OutlinedTextField(
                    merchant,
                    { merchant = it },
                    label = { Text("Merchant / source") },
                    modifier = Modifier.fillMaxWidth(),
                    singleLine = true,
                )
                Text(
                    "Synced uses consistent categories across transactions, plans, bills and spending analysis.",
                    color = Muted,
                    style = MaterialTheme.typography.bodySmall,
                )
            }
        },
        confirmButton = {
            Button(
                onClick = {
                    amount.toDoubleOrNull()?.takeIf { it > 0 }?.let {
                        onCreate(type, it, category, desc.ifBlank { null }, merchant.ifBlank { null })
                    }
                },
                enabled = (amount.toDoubleOrNull() ?: 0.0) > 0,
            ) { Text("Save") }
        },
        dismissButton = { TextButton(onClick = onDismiss) { Text("Cancel") } },
    )
}
