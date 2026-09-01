package com.tukutuku.synced.ui

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.tukutuku.synced.app.PlanViewModel
import com.tukutuku.synced.data.model.PlanAllocation
import com.tukutuku.synced.ui.components.EmptyState
import com.tukutuku.synced.ui.components.InsightCard
import com.tukutuku.synced.ui.components.ProgressBar
import com.tukutuku.synced.ui.components.SectionTitle
import com.tukutuku.synced.ui.components.SyncedCard
import com.tukutuku.synced.ui.components.money
import com.tukutuku.synced.ui.theme.*

@Composable
fun PlanScreen(vm: PlanViewModel = hiltViewModel()) {
    val state by vm.state.collectAsStateWithLifecycle()
    var showCreate by remember { mutableStateOf(false) }

    LazyColumn(
        modifier = Modifier.fillMaxSize(),
        contentPadding = PaddingValues(18.dp),
        verticalArrangement = Arrangement.spacedBy(14.dp),
    ) {
        item {
            Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                Column(Modifier.weight(1f)) {
                    Text("Your money plan", style = MaterialTheme.typography.headlineMedium, fontWeight = FontWeight.Black)
                    Text("Plan income before it disappears.", color = Muted)
                }
                TextButton(onClick = { showCreate = true }) {
                    Text(if (state.data == null) "Create" else "Replace")
                }
            }
        }

        when {
            state.loading -> item { LinearProgressIndicator(Modifier.fillMaxWidth()) }
            state.data == null -> item {
                EmptyState(
                    title = "Create your first plan",
                    body = "Set expected income and reserve money for the things that matter.",
                    action = "Create plan",
                    onAction = { showCreate = true },
                )
            }
            else -> {
                val plan = state.data!!
                item {
                    SyncedCard {
                        Text(plan.label.uppercase(), color = Primary, style = MaterialTheme.typography.labelSmall, fontWeight = FontWeight.Bold)
                        Text(
                            money((plan.expectedIncome - plan.spentTotal).coerceAtLeast(0.0)),
                            style = MaterialTheme.typography.headlineLarge,
                            fontWeight = FontWeight.Black,
                        )
                        Text("available from ${money(plan.expectedIncome)} expected income", color = Muted)
                        Spacer(Modifier.height(12.dp))
                        ProgressBar(
                            value = if (plan.expectedIncome > 0) (plan.spentTotal / plan.expectedIncome * 100).toInt() else 0,
                            color = if (plan.health == "watch") Warning else Primary,
                        )
                    }
                }
                plan.insight?.takeIf { it.isNotBlank() }?.let { insight -> item { InsightCard(insight) } }
                item { SectionTitle("Allocations") }
                items(plan.allocations, key = { it.id ?: it.label }) { allocation ->
                    SyncedCard {
                        Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                            Column {
                                Text(allocation.label, fontWeight = FontWeight.Bold)
                                Text(
                                    "${money(allocation.spentAmount)} of ${money(allocation.plannedAmount)}",
                                    color = Muted,
                                    style = MaterialTheme.typography.bodySmall,
                                )
                            }
                            Text(
                                if (allocation.plannedAmount > 0) "${(allocation.spentAmount / allocation.plannedAmount * 100).toInt()}%" else "—",
                                fontWeight = FontWeight.Bold,
                            )
                        }
                        Spacer(Modifier.height(8.dp))
                        ProgressBar(
                            if (allocation.plannedAmount > 0) (allocation.spentAmount / allocation.plannedAmount * 100).toInt() else 0,
                        )
                    }
                }
            }
        }
    }

    if (showCreate) {
        CreatePlanDialog(
            onDismiss = { showCreate = false },
            onCreate = { income, allocations ->
                vm.create(income, allocations) { result ->
                    if (result.isSuccess) showCreate = false
                }
            },
        )
    }
}

@Composable
private fun CreatePlanDialog(
    onDismiss: () -> Unit,
    onCreate: (Double, List<PlanAllocation>) -> Unit,
) {
    var income by remember { mutableStateOf("") }
    var essentials by remember { mutableStateOf("") }
    var saving by remember { mutableStateOf("") }

    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("Create monthly plan") },
        text = {
            Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                OutlinedTextField(income, { income = it.filter { c -> c.isDigit() || c == '.' } }, label = { Text("Expected income") })
                OutlinedTextField(essentials, { essentials = it.filter { c -> c.isDigit() || c == '.' } }, label = { Text("Essentials allocation") })
                OutlinedTextField(saving, { saving = it.filter { c -> c.isDigit() || c == '.' } }, label = { Text("Saving / goals") })
            }
        },
        confirmButton = {
            Button(
                onClick = {
                    val allocations = buildList {
                        essentials.toDoubleOrNull()?.takeIf { it > 0 }?.let {
                            add(PlanAllocation(label = "Essentials", category = "general", plannedAmount = it))
                        }
                        saving.toDoubleOrNull()?.takeIf { it > 0 }?.let {
                            add(PlanAllocation(label = "Goals", category = "savings", plannedAmount = it))
                        }
                    }
                    income.toDoubleOrNull()?.let { onCreate(it, allocations) }
                },
                enabled = (income.toDoubleOrNull() ?: 0.0) > 0,
            ) { Text("Create plan") }
        },
        dismissButton = { TextButton(onClick = onDismiss) { Text("Cancel") } },
    )
}
