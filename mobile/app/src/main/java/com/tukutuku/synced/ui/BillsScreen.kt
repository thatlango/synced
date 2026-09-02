package com.tukutuku.synced.ui

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.outlined.ArrowBack
import androidx.compose.material.icons.outlined.Add
import androidx.compose.material.icons.outlined.ArrowDropDown
import androidx.compose.material.icons.outlined.AutoAwesome
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
import com.tukutuku.synced.ui.components.*
import com.tukutuku.synced.ui.theme.*

private val BILL_CATEGORY_OPTIONS = listOf(
    "rent",
    "utilities",
    "school_fees",
    "mobile_data",
    "subscriptions",
    "healthcare",
    "transport",
    "food",
    "fuel",
    "shopping",
    "entertainment",
    "bill_payment",
    "other",
)

@Composable
fun BillsScreen(
    onBack: () -> Unit,
    vm: BillsViewModel = hiltViewModel(),
) {
    val state by vm.state.collectAsStateWithLifecycle()
    var showCreate by remember { mutableStateOf(false) }
    var creating by remember { mutableStateOf(false) }
    var createError by remember { mutableStateOf<String?>(null) }
    val data = state.data

    fun openCreate() {
        createError = null
        showCreate = true
    }

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
                    Text("Synced also learns recurring obligations from your payment history.", color = Muted)
                }
                FilledIconButton(onClick = { openCreate() }) { Icon(Icons.Outlined.Add, "Add bill") }
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
                            "${data.summary.count} known obligation${if (data.summary.count == 1) "" else "s"}",
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

            if (data.recurringDetection.autoCreated > 0) {
                item {
                    InsightCard(
                        "Synced found ${data.recurringDetection.autoCreated} strong recurring payment pattern${if (data.recurringDetection.autoCreated == 1) "" else "s"} and created the next bill automatically."
                    )
                }
            }

            if (data.detectedPatterns.isNotEmpty()) {
                item {
                    SectionTitle("Detected from your payments")
                    Spacer(Modifier.height(5.dp))
                    Text(
                        "Synced compares provider, timing and amount patterns. Strong bill-like matches are tracked automatically; weaker matches stay suggestions.",
                        color = Muted,
                        style = MaterialTheme.typography.bodySmall,
                    )
                }
                items(data.detectedPatterns.take(6), key = { it.patternKey }) { pattern ->
                    SyncedCard(containerColor = SecondarySoft) {
                        Row(verticalAlignment = Alignment.Top) {
                            Surface(shape = MaterialTheme.shapes.medium, color = Surface) {
                                Icon(Icons.Outlined.AutoAwesome, null, tint = Secondary, modifier = Modifier.padding(11.dp))
                            }
                            Spacer(Modifier.width(12.dp))
                            Column(Modifier.weight(1f)) {
                                Row(verticalAlignment = Alignment.CenterVertically) {
                                    Text(pattern.name, fontWeight = FontWeight.Bold, color = Ink, modifier = Modifier.weight(1f))
                                    StatusPill(
                                        when {
                                            pattern.linkedBillId != null -> "Tracked"
                                            pattern.autoCreateEligible -> "Strong match"
                                            else -> "Possible"
                                        },
                                        when {
                                            pattern.linkedBillId != null -> "success"
                                            pattern.autoCreateEligible -> "primary"
                                            else -> "neutral"
                                        },
                                    )
                                }
                                Text(
                                    "${categoryLabel(pattern.category)} • ${pattern.billingCycle} • ${(pattern.confidence * 100).toInt()}% confidence",
                                    color = Muted,
                                    style = MaterialTheme.typography.bodySmall,
                                )
                                Spacer(Modifier.height(5.dp))
                                Text(pattern.evidence, color = Muted, style = MaterialTheme.typography.bodySmall)
                                Spacer(Modifier.height(7.dp))
                                Text(
                                    "Expected ${money(pattern.expectedAmount)} • next ${shortDate(pattern.nextDue)}",
                                    fontWeight = FontWeight.SemiBold,
                                    color = Ink,
                                )
                            }
                        }
                        if (pattern.linkedBillId == null && pattern.nextDue != null) {
                            Spacer(Modifier.height(10.dp))
                            OutlinedButton(
                                onClick = {
                                    vm.create(
                                        CreateBillRequest(
                                            name = pattern.name,
                                            category = pattern.category,
                                            amount = pattern.expectedAmount,
                                            dueDate = pattern.nextDue.take(10),
                                            recurring = true,
                                            billingCycle = pattern.billingCycle,
                                            provider = pattern.provider ?: pattern.name,
                                            accountRef = "synced:recurrence:${pattern.patternKey.replace(" ", "-")}",
                                        ),
                                    ) { }
                                },
                                modifier = Modifier.fillMaxWidth(),
                            ) {
                                Text("Track as recurring bill")
                            }
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
                    if (data?.detectedPatterns?.isNotEmpty() == true)
                        "No tracked bill is due yet. Review the recurring-payment patterns above."
                    else
                        "Add rent, utilities, school fees or sync transaction history. Synced will detect recurring obligations and bring them into your forecast.",
                    "Add a bill",
                    { openCreate() },
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
                                    if (bill.inferredBySynced) {
                                        StatusPill("Detected", "success")
                                    } else if (bill.recurring) {
                                        StatusPill("Recurring", "primary")
                                    }
                                }
                                Text(
                                    listOfNotNull(categoryLabel(bill.category), bill.provider).joinToString(" • "),
                                    color = Muted,
                                    style = MaterialTheme.typography.bodySmall,
                                )
                                if (bill.inferredBySynced) {
                                    Text("Created from a recurring payment pattern", color = Secondary, style = MaterialTheme.typography.bodySmall)
                                }
                                Spacer(Modifier.height(8.dp))
                                Text(money(bill.amount, bill.currency), style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Black, color = Ink)
                                Text("Due ${shortDate(bill.dueDate)}", color = Warning, style = MaterialTheme.typography.bodySmall, fontWeight = FontWeight.SemiBold)
                            }
                        }
                        Spacer(Modifier.height(10.dp))
                        OutlinedButton(onClick = { vm.markPaid(bill.id) }, modifier = Modifier.fillMaxWidth()) {
                            Icon(Icons.Outlined.CheckCircle, null)
                            Spacer(Modifier.width(8.dp))
                            Text(if (bill.recurring) "Mark paid and schedule next" else "Mark as paid")
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
            onDismiss = {
                if (!creating) {
                    showCreate = false
                    createError = null
                }
            },
            saving = creating,
            error = createError,
            onCreate = { request ->
                creating = true
                createError = null
                vm.create(request) { result ->
                    creating = false
                    result
                        .onSuccess {
                            showCreate = false
                            createError = null
                        }
                        .onFailure {
                            createError = it.message ?: "Bill could not be saved. Check the details and try again."
                        }
                }
            },
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
    saving: Boolean,
    error: String?,
    onCreate: (CreateBillRequest) -> Unit,
) {
    var name by remember { mutableStateOf("") }
    var amount by remember { mutableStateOf("") }
    var dueDate by remember { mutableStateOf("") }
    var category by remember { mutableStateOf("utilities") }
    var categoryMenu by remember { mutableStateOf(false) }
    var provider by remember { mutableStateOf("") }
    var accountRef by remember { mutableStateOf("") }
    var recurring by remember { mutableStateOf(false) }

    AlertDialog(
        onDismissRequest = { if (!saving) onDismiss() },
        title = {
            Column {
                Text("Add bill", fontWeight = FontWeight.Black)
                Text("Bills feed your plan, cash forecast and recommendations.", color = Muted, style = MaterialTheme.typography.bodySmall)
            }
        },
        text = {
            Column(verticalArrangement = Arrangement.spacedBy(9.dp)) {
                OutlinedTextField(
                    name,
                    { name = it },
                    label = { Text("Bill name") },
                    modifier = Modifier.fillMaxWidth(),
                    singleLine = true,
                    enabled = !saving,
                )
                OutlinedTextField(
                    amount,
                    { amount = it.filter { c -> c.isDigit() || c == '.' } },
                    label = { Text("Amount (UGX)") },
                    modifier = Modifier.fillMaxWidth(),
                    singleLine = true,
                    enabled = !saving,
                )
                OutlinedTextField(
                    dueDate,
                    { dueDate = it.take(10) },
                    label = { Text("Due date") },
                    supportingText = { Text("YYYY-MM-DD") },
                    modifier = Modifier.fillMaxWidth(),
                    singleLine = true,
                    enabled = !saving,
                )
                Text("Category", color = Muted, style = MaterialTheme.typography.labelMedium)
                Box(Modifier.fillMaxWidth()) {
                    OutlinedButton(
                        onClick = { categoryMenu = true },
                        modifier = Modifier.fillMaxWidth(),
                        enabled = !saving,
                    ) {
                        Text(categoryLabel(category), modifier = Modifier.weight(1f))
                        Icon(Icons.Outlined.ArrowDropDown, contentDescription = "Choose bill category")
                    }
                    DropdownMenu(
                        expanded = categoryMenu,
                        onDismissRequest = { categoryMenu = false },
                    ) {
                        BILL_CATEGORY_OPTIONS.forEach { item ->
                            DropdownMenuItem(
                                text = { Text(categoryLabel(item)) },
                                onClick = {
                                    category = item
                                    categoryMenu = false
                                },
                            )
                        }
                    }
                }
                Text(
                    "Selected category: ${categoryLabel(category)}. This is saved with the bill and used in obligations, forecasts and analysis.",
                    color = Muted,
                    style = MaterialTheme.typography.bodySmall,
                )
                OutlinedTextField(
                    provider,
                    { provider = it },
                    label = { Text("Provider (optional)") },
                    modifier = Modifier.fillMaxWidth(),
                    singleLine = true,
                    enabled = !saving,
                )
                OutlinedTextField(
                    accountRef,
                    { accountRef = it },
                    label = { Text("Account / reference (optional)") },
                    modifier = Modifier.fillMaxWidth(),
                    singleLine = true,
                    enabled = !saving,
                )
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Switch(checked = recurring, onCheckedChange = { recurring = it }, enabled = !saving)
                    Spacer(Modifier.width(10.dp))
                    Column {
                        Text("Recurring bill", fontWeight = FontWeight.SemiBold, color = Ink)
                        Text("Treat this as a monthly obligation", color = Muted, style = MaterialTheme.typography.bodySmall)
                    }
                }
                error?.takeIf { it.isNotBlank() }?.let {
                    Text(it, color = Error, style = MaterialTheme.typography.bodySmall, fontWeight = FontWeight.SemiBold)
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
                enabled = !saving &&
                    name.length >= 2 &&
                    (amount.toDoubleOrNull() ?: 0.0) > 0 &&
                    Regex("\\d{4}-\\d{2}-\\d{2}").matches(dueDate) &&
                    category in BILL_CATEGORY_OPTIONS,
            ) { Text(if (saving) "Saving…" else "Save bill") }
        },
        dismissButton = {
            TextButton(onClick = onDismiss, enabled = !saving) { Text("Cancel") }
        },
    )
}
