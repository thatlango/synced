package com.tukutuku.synced.ui

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.outlined.ArrowBack
import androidx.compose.material.icons.outlined.Add
import androidx.compose.material.icons.outlined.Autorenew
import androidx.compose.material.icons.outlined.CheckCircle
import androidx.compose.material.icons.outlined.ReceiptLong
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.tukutuku.synced.app.BillsViewModel
import com.tukutuku.synced.data.model.CreateBillRequest
import com.tukutuku.synced.data.model.FINANCE_CATEGORIES
import com.tukutuku.synced.ui.components.*
import com.tukutuku.synced.ui.theme.*

@Composable
fun BillsScreen(
    onBack: () -> Unit,
    vm: BillsViewModel = hiltViewModel(),
) {
    val state by vm.state.collectAsStateWithLifecycle()
    var showCreate by remember { mutableStateOf(false) }
    val data = state.data

    LazyColumn(
        Modifier.fillMaxSize(),
        contentPadding = PaddingValues(horizontal = 18.dp, vertical = 12.dp),
        verticalArrangement = Arrangement.spacedBy(14.dp),
    ) {
        item {
            Row(verticalAlignment = Alignment.CenterVertically) {
                IconButton(onClick = onBack) { Icon(Icons.AutoMirrored.Outlined.ArrowBack, "Back") }
                Spacer(Modifier.width(4.dp))
                Column(Modifier.weight(1f)) {
                    Text("Bills & recurring", style = MaterialTheme.typography.headlineSmall, fontWeight = FontWeight.Black, color = Ink)
                    Text("Know what is due before it surprises you.", color = Muted)
                }
                FilledIconButton(onClick = { showCreate = true }) { Icon(Icons.Outlined.Add, "Add bill") }
            }
        }

        if (data != null) {
            item {
                Card(colors = CardDefaults.cardColors(containerColor = Hero), shape = MaterialTheme.shapes.extraLarge) {
                    Column(Modifier.fillMaxWidth().padding(22.dp)) {
                        Text("Due in the next 60 days", color = androidx.compose.ui.graphics.Color.White.copy(alpha = .68f))
                        Text(
                            money(data.summary.totalUpcoming),
                            color = androidx.compose.ui.graphics.Color.White,
                            style = MaterialTheme.typography.headlineLarge,
                            fontWeight = FontWeight.Black,
                        )
                        Text(
                            "${data.summary.count} bill${if (data.summary.count == 1) "" else "s"} and recurring charge${if (data.summary.count == 1) "" else "s"}",
                            color = androidx.compose.ui.graphics.Color.White.copy(alpha = .68f),
                        )
                        Spacer(Modifier.height(16.dp))
                        Row(Modifier.fillMaxWidth()) {
                            BillMetric("Bills", money(data.summary.billsTotal), Modifier.weight(1f))
                            BillMetric("Subscriptions", money(data.summary.subscriptionsTotal), Modifier.weight(1f))
                        }
                    }
                }
            }
        }

        if (state.loading) {
            item { LinearProgressIndicator(Modifier.fillMaxWidth()) }
        } else if (data == null || (data.bills.isEmpty() && data.subscriptions.isEmpty())) {
            item {
                EmptyState(
                    "No upcoming obligations",
                    "Add rent, utilities, school fees or other recurring bills. Synced will bring them into your plan, forecast and recommendations.",
                    "Add a bill",
                    { showCreate = true },
                )
            }
        } else {
            if (data.bills.isNotEmpty()) {
                item { SectionTitle("Upcoming bills") }
                items(data.bills, key = { it.id }) { bill ->
                    SyncedCard {
                        Row(verticalAlignment = Alignment.Top) {
                            Surface(shape = MaterialTheme.shapes.medium, color = WarningSoft) {
                                Icon(Icons.Outlined.ReceiptLong, null, tint = Warning, modifier = Modifier.padding(11.dp))
                            }
                            Spacer(Modifier.width(12.dp))
                            Column(Modifier.weight(1f)) {
                                Row(verticalAlignment = Alignment.CenterVertically) {
                                    Text(bill.name, fontWeight = FontWeight.Bold, color = Ink, modifier = Modifier.weight(1f))
                                    if (bill.recurring) StatusPill("Recurring", "primary")
                                }
                                Text(
                                    listOfNotNull(categoryLabel(bill.category), bill.provider).joinToString(" • "),
                                    color = Muted,
                                    style = MaterialTheme.typography.bodySmall,
                                )
                                Spacer(Modifier.height(8.dp))
                                Text(money(bill.amount, bill.currency), style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Black, color = Ink)
                                Text("Due ${shortDate(bill.dueDate)}", color = Warning, style = MaterialTheme.typography.bodySmall, fontWeight = FontWeight.SemiBold)
                            }
                        }
                        Spacer(Modifier.height(10.dp))
                        OutlinedButton(onClick = { vm.markPaid(bill.id) }, modifier = Modifier.fillMaxWidth()) {
                            Icon(Icons.Outlined.CheckCircle, null)
                            Spacer(Modifier.width(8.dp))
                            Text("Mark as paid")
                        }
                    }
                }
            }

            if (data.subscriptions.isNotEmpty()) {
                item { SectionTitle("Subscriptions & recurring charges") }
                items(data.subscriptions, key = { it.id }) { subscription ->
                    SyncedCard(containerColor = SecondarySoft) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Surface(shape = MaterialTheme.shapes.medium, color = Surface) {
                                Icon(Icons.Outlined.Autorenew, null, tint = Secondary, modifier = Modifier.padding(11.dp))
                            }
                            Spacer(Modifier.width(12.dp))
                            Column(Modifier.weight(1f)) {
                                Text(subscription.name, fontWeight = FontWeight.Bold, color = Ink)
                                Text(
                                    "${categoryLabel(subscription.category)} • ${subscription.billingCycle}",
                                    color = Muted,
                                    style = MaterialTheme.typography.bodySmall,
                                )
                                Text("Next ${shortDate(subscription.nextDueDate)}", color = Muted, style = MaterialTheme.typography.bodySmall)
                            }
                            Column(horizontalAlignment = Alignment.End) {
                                Text(money(subscription.amount, subscription.currency), fontWeight = FontWeight.Black, color = Ink)
                                StatusPill(if (subscription.autoRenew) "Auto-renews" else "Manual", if (subscription.autoRenew) "success" else "neutral")
                            }
                        }
                    }
                }
            }
        }
        item { Spacer(Modifier.height(8.dp)) }
    }

    if (showCreate) {
        CreateBillDialog(
            onDismiss = { showCreate = false },
            onCreate = { request -> vm.create(request) { if (it.isSuccess) showCreate = false } },
        )
    }
}

@Composable
private fun BillMetric(label: String, value: String, modifier: Modifier) {
    Column(modifier) {
        Text(label, color = androidx.compose.ui.graphics.Color.White.copy(alpha = .6f), style = MaterialTheme.typography.labelSmall)
        Text(value, color = androidx.compose.ui.graphics.Color.White, fontWeight = FontWeight.Bold)
    }
}

@Composable
private fun CreateBillDialog(
    onDismiss: () -> Unit,
    onCreate: (CreateBillRequest) -> Unit,
) {
    var name by remember { mutableStateOf("") }
    var amount by remember { mutableStateOf("") }
    var dueDate by remember { mutableStateOf("") }
    var category by remember { mutableStateOf("utilities") }
    var provider by remember { mutableStateOf("") }
    var accountRef by remember { mutableStateOf("") }
    var recurring by remember { mutableStateOf(false) }

    AlertDialog(
        onDismissRequest = onDismiss,
        title = {
            Column {
                Text("Add bill", fontWeight = FontWeight.Black)
                Text("Bills feed your plan, forecast and recommendations.", color = Muted, style = MaterialTheme.typography.bodySmall)
            }
        },
        text = {
            Column(verticalArrangement = Arrangement.spacedBy(9.dp)) {
                OutlinedTextField(name, { name = it }, label = { Text("Bill name") }, modifier = Modifier.fillMaxWidth(), singleLine = true)
                OutlinedTextField(
                    amount,
                    { amount = it.filter { c -> c.isDigit() || c == '.' } },
                    label = { Text("Amount (UGX)") },
                    modifier = Modifier.fillMaxWidth(),
                    singleLine = true,
                )
                OutlinedTextField(
                    dueDate,
                    { dueDate = it.take(10) },
                    label = { Text("Due date") },
                    supportingText = { Text("YYYY-MM-DD") },
                    modifier = Modifier.fillMaxWidth(),
                    singleLine = true,
                )
                Text("Category", color = Muted, style = MaterialTheme.typography.labelMedium)
                LazyRow(horizontalArrangement = Arrangement.spacedBy(7.dp)) {
                    items(FINANCE_CATEGORIES.filterNot { it in listOf("salary", "transfer", "savings") }) { item ->
                        FilterChip(selected = category == item, onClick = { category = item }, label = { Text(categoryLabel(item)) })
                    }
                }
                OutlinedTextField(provider, { provider = it }, label = { Text("Provider (optional)") }, modifier = Modifier.fillMaxWidth(), singleLine = true)
                OutlinedTextField(accountRef, { accountRef = it }, label = { Text("Account / reference (optional)") }, modifier = Modifier.fillMaxWidth(), singleLine = true)
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Switch(checked = recurring, onCheckedChange = { recurring = it })
                    Spacer(Modifier.width(10.dp))
                    Column {
                        Text("Recurring bill", fontWeight = FontWeight.SemiBold, color = Ink)
                        Text("Treat this as a monthly obligation", color = Muted, style = MaterialTheme.typography.bodySmall)
                    }
                }
            }
        },
        confirmButton = {
            Button(
                onClick = {
                    onCreate(
                        CreateBillRequest(
                            name = name.trim(),
                            category = category,
                            amount = amount.toDoubleOrNull() ?: 0.0,
                            dueDate = dueDate,
                            recurring = recurring,
                            billingCycle = if (recurring) "monthly" else null,
                            provider = provider.ifBlank { null },
                            accountRef = accountRef.ifBlank { null },
                        ),
                    )
                },
                enabled = name.length >= 2 && (amount.toDoubleOrNull() ?: 0.0) > 0 && Regex("\\d{4}-\\d{2}-\\d{2}").matches(dueDate),
            ) { Text("Save bill") }
        },
        dismissButton = { TextButton(onClick = onDismiss) { Text("Cancel") } },
    )
}
