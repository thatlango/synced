package com.tukutuku.synced.ui

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.AutoGraph
import androidx.compose.material.icons.outlined.Lightbulb
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.tukutuku.synced.app.PlanViewModel
import com.tukutuku.synced.data.model.PlanAllocation
import com.tukutuku.synced.ui.components.*
import com.tukutuku.synced.ui.theme.*

@Composable
fun PlanScreen(vm: PlanViewModel = hiltViewModel()) {
    val state by vm.state.collectAsStateWithLifecycle()
    val forecast by vm.forecast.collectAsStateWithLifecycle()
    var showCreate by remember { mutableStateOf(false) }

    LazyColumn(
        modifier = Modifier.fillMaxSize(),
        contentPadding = PaddingValues(horizontal = 18.dp, vertical = 16.dp),
        verticalArrangement = Arrangement.spacedBy(14.dp),
    ) {
        item {
            Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.Top) {
                Column(Modifier.weight(1f)) {
                    Text("Your money plan", style = MaterialTheme.typography.headlineMedium, fontWeight = FontWeight.Black, color = Ink)
                    Text("Give income a job before it disappears.", color = Muted)
                }
                TextButton(onClick = { showCreate = true }) {
                    Text(if (state.data == null) "Create" else "Replace")
                }
            }
        }

        if (forecast.data != null) {
            val f = forecast.data!!
            item {
                SyncedCard(containerColor = PrimarySoft) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Surface(shape = MaterialTheme.shapes.medium, color = Surface) {
                            Icon(Icons.Outlined.AutoGraph, null, tint = Primary, modifier = Modifier.padding(10.dp))
                        }
                        Spacer(Modifier.width(12.dp))
                        Column(Modifier.weight(1f)) {
                            Text("Forecast signal", color = Muted, style = MaterialTheme.typography.labelMedium)
                            Text(
                                if (f.daysUntilZero >= 999) "Your current balance has positive runway" else "About ${f.daysUntilZero} days of runway at recent spending",
                                color = Ink,
                                fontWeight = FontWeight.Bold,
                            )
                        }
                    }
                    Spacer(Modifier.height(14.dp))
                    Row(Modifier.fillMaxWidth()) {
                        ForecastMetric("Average income", money(f.avgMonthlyIncome), Modifier.weight(1f))
                        ForecastMetric("Average spend", money(f.avgMonthlySpend), Modifier.weight(1f))
                    }
                }
            }
        }

        when {
            state.loading -> item { LinearProgressIndicator(Modifier.fillMaxWidth()) }
            state.data == null -> {
                item {
                    EmptyState(
                        title = "Build your first monthly plan",
                        body = "Set expected income, reserve essentials, make room for transport and food, and protect savings or goals. Synced will compare actual spending against it.",
                        action = "Create my plan",
                        onAction = { showCreate = true },
                    )
                }
                item {
                    SyncedCard {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Icon(Icons.Outlined.Lightbulb, null, tint = Secondary)
                            Spacer(Modifier.width(10.dp))
                            Text("What a plan unlocks", fontWeight = FontWeight.Bold, color = Ink)
                        }
                        Spacer(Modifier.height(12.dp))
                        Text("• Category-by-category usage and overspend signals", color = Muted)
                        Text("• A clearer view of money still available", color = Muted)
                        Text("• Recommendations grounded in your ledger and bills", color = Muted)
                    }
                }
            }
            else -> {
                val plan = state.data!!
                val percent = if (plan.expectedIncome > 0) (plan.spentTotal / plan.expectedIncome * 100).toInt() else 0
                item {
                    Card(colors = CardDefaults.cardColors(containerColor = Hero), shape = MaterialTheme.shapes.extraLarge) {
                        Column(Modifier.fillMaxWidth().padding(22.dp)) {
                            Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                                Text(plan.label.uppercase(), color = androidx.compose.ui.graphics.Color.White.copy(alpha = .68f), style = MaterialTheme.typography.labelSmall, fontWeight = FontWeight.Bold)
                                StatusPill(
                                    when {
                                        percent >= 90 -> "Needs attention"
                                        percent >= 70 -> "Watch"
                                        else -> "On track"
                                    },
                                    when {
                                        percent >= 90 -> "error"
                                        percent >= 70 -> "warning"
                                        else -> "success"
                                    },
                                )
                            }
                            Spacer(Modifier.height(8.dp))
                            Text(
                                money((plan.expectedIncome - plan.spentTotal).coerceAtLeast(0.0)),
                                style = MaterialTheme.typography.headlineLarge,
                                fontWeight = FontWeight.Black,
                                color = androidx.compose.ui.graphics.Color.White,
                            )
                            Text(
                                "left from ${money(plan.expectedIncome)} expected income",
                                color = androidx.compose.ui.graphics.Color.White.copy(alpha = .7f),
                            )
                            Spacer(Modifier.height(14.dp))
                            ProgressBar(percent, if (percent >= 90) Error else if (percent >= 70) Warning else Secondary)
                            Spacer(Modifier.height(6.dp))
                            Text("$percent% used", color = androidx.compose.ui.graphics.Color.White.copy(alpha = .65f), style = MaterialTheme.typography.bodySmall)
                        }
                    }
                }
                plan.insight?.takeIf { it.isNotBlank() }?.let { item { InsightCard(it) } }
                item { SectionTitle("Plan by purpose") }
                items(plan.allocations, key = { it.id ?: it.label }) { allocation ->
                    val allocationPercent = if (allocation.plannedAmount > 0) (allocation.spentAmount / allocation.plannedAmount * 100).toInt() else 0
                    SyncedCard {
                        Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
                            Column(Modifier.weight(1f)) {
                                Text(allocation.label, fontWeight = FontWeight.Bold, color = Ink)
                                Text(categoryLabel(allocation.category), color = Muted, style = MaterialTheme.typography.bodySmall)
                            }
                            Text("$allocationPercent%", fontWeight = FontWeight.Black, color = if (allocationPercent > 100) Error else Primary)
                        }
                        Spacer(Modifier.height(7.dp))
                        Text("${money(allocation.spentAmount)} of ${money(allocation.plannedAmount)}", color = Muted, style = MaterialTheme.typography.bodySmall)
                        Spacer(Modifier.height(8.dp))
                        ProgressBar(allocationPercent, if (allocationPercent > 100) Error else Primary)
                    }
                }
            }
        }
        item { Spacer(Modifier.height(8.dp)) }
    }

    if (showCreate) {
        CreatePlanDialog(
            onDismiss = { showCreate = false },
            onCreate = { income, allocations ->
                vm.create(income, allocations) { result -> if (result.isSuccess) showCreate = false }
            },
        )
    }
}

@Composable
private fun ForecastMetric(label: String, value: String, modifier: Modifier) {
    Column(modifier) {
        Text(label, color = Muted, style = MaterialTheme.typography.labelSmall)
        Text(value, color = Ink, fontWeight = FontWeight.Bold)
    }
}

@Composable
private fun CreatePlanDialog(
    onDismiss: () -> Unit,
    onCreate: (Double, List<PlanAllocation>) -> Unit,
) {
    var income by remember { mutableStateOf("") }
    var housingBills by remember { mutableStateOf("") }
    var food by remember { mutableStateOf("") }
    var transport by remember { mutableStateOf("") }
    var saving by remember { mutableStateOf("") }

    AlertDialog(
        onDismissRequest = onDismiss,
        title = {
            Column {
                Text("Create monthly plan", fontWeight = FontWeight.Black)
                Text("Start with the money you expect, then reserve the important parts.", color = Muted, style = MaterialTheme.typography.bodySmall)
            }
        },
        text = {
            Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                MoneyField("Expected income", income) { income = it }
                MoneyField("Housing & bills", housingBills) { housingBills = it }
                MoneyField("Food", food) { food = it }
                MoneyField("Transport", transport) { transport = it }
                MoneyField("Savings / goals", saving) { saving = it }
            }
        },
        confirmButton = {
            Button(
                onClick = {
                    val allocations = buildList {
                        housingBills.toDoubleOrNull()?.takeIf { it > 0 }?.let { add(PlanAllocation(label = "Housing & bills", category = "utilities", plannedAmount = it)) }
                        food.toDoubleOrNull()?.takeIf { it > 0 }?.let { add(PlanAllocation(label = "Food", category = "food", plannedAmount = it)) }
                        transport.toDoubleOrNull()?.takeIf { it > 0 }?.let { add(PlanAllocation(label = "Transport", category = "transport", plannedAmount = it)) }
                        saving.toDoubleOrNull()?.takeIf { it > 0 }?.let { add(PlanAllocation(label = "Savings & goals", category = "savings", plannedAmount = it)) }
                    }
                    income.toDoubleOrNull()?.let { onCreate(it, allocations) }
                },
                enabled = (income.toDoubleOrNull() ?: 0.0) > 0,
            ) { Text("Create plan") }
        },
        dismissButton = { TextButton(onClick = onDismiss) { Text("Cancel") } },
    )
}

@Composable
private fun MoneyField(label: String, value: String, onValue: (String) -> Unit) {
    OutlinedTextField(
        value,
        { onValue(it.filter { c -> c.isDigit() || c == '.' }) },
        label = { Text(label) },
        modifier = Modifier.fillMaxWidth(),
        singleLine = true,
    )
}
