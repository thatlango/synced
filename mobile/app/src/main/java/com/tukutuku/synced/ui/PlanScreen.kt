package com.tukutuku.synced.ui

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.Edit
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
import com.tukutuku.synced.app.PlanViewModel
import com.tukutuku.synced.data.model.PlanAllocation
import com.tukutuku.synced.ui.components.*
import com.tukutuku.synced.ui.theme.*

@Composable
fun PlanScreen(vm: PlanViewModel = hiltViewModel()) {
    val state by vm.state.collectAsStateWithLifecycle()
    var showCreate by remember { mutableStateOf(false) }

    LazyColumn(
        modifier = Modifier.fillMaxSize(),
        contentPadding = PaddingValues(start = 20.dp, end = 20.dp, top = 20.dp, bottom = 28.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp),
    ) {
        item {
            Row(
                Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically,
            ) {
                Column(Modifier.weight(1f)) {
                    Text("Your money plan", style = MaterialTheme.typography.headlineLarge, fontWeight = FontWeight.Black, color = Ink)
                    Text("Give your income a job before it disappears.", color = Muted, style = MaterialTheme.typography.bodyLarge)
                }
                if (state.data != null) {
                    Surface(shape = RoundedCornerShape(16.dp), color = Surface, shadowElevation = 1.dp) {
                        IconButton(onClick = { showCreate = true }) {
                            Icon(Icons.Outlined.Edit, contentDescription = "Replace plan", tint = Primary)
                        }
                    }
                }
            }
        }

        when {
            state.loading -> item { LinearProgressIndicator(Modifier.fillMaxWidth(), color = Primary) }
            state.data == null -> item {
                EmptyState(
                    title = "Create your first plan",
                    body = "Set expected income and reserve money for essentials, goals and everything else.",
                    action = "Create plan",
                    onAction = { showCreate = true },
                )
            }
            else -> {
                val plan = state.data!!
                val available = (plan.expectedIncome - plan.spentTotal).coerceAtLeast(0.0)
                val spentPercent = if (plan.expectedIncome > 0) {
                    (plan.spentTotal / plan.expectedIncome * 100).toInt().coerceIn(0, 100)
                } else 0

                item {
                    GradientCard(Modifier.fillMaxWidth()) {
                        Row(
                            Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically,
                        ) {
                            Text(
                                plan.label.uppercase(),
                                color = Color.White.copy(alpha = .7f),
                                style = MaterialTheme.typography.labelMedium,
                                fontWeight = FontWeight.Bold,
                            )
                            Surface(
                                color = Color.White.copy(alpha = .14f),
                                shape = RoundedCornerShape(100.dp),
                            ) {
                                Text(
                                    when (plan.health) {
                                        "watch" -> "Needs attention"
                                        "healthy" -> "On track"
                                        else -> "This month"
                                    },
                                    color = Color.White,
                                    style = MaterialTheme.typography.labelSmall,
                                    modifier = Modifier.padding(horizontal = 10.dp, vertical = 6.dp),
                                )
                            }
                        }
                        Spacer(Modifier.height(10.dp))
                        Text(
                            money(available),
                            style = MaterialTheme.typography.displaySmall,
                            fontWeight = FontWeight.Black,
                            color = Color.White,
                        )
                        Text(
                            "available from ${money(plan.expectedIncome)} expected income",
                            color = Color.White.copy(alpha = .72f),
                            style = MaterialTheme.typography.bodyMedium,
                        )
                        Spacer(Modifier.height(20.dp))
                        ProgressBar(
                            value = spentPercent,
                            color = if (plan.health == "watch") Color(0xFFFFC85A) else Color.White,
                            trackColor = Color.White.copy(alpha = .18f),
                        )
                        Spacer(Modifier.height(8.dp))
                        Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                            Text("${money(plan.spentTotal)} used", color = Color.White.copy(alpha = .74f), style = MaterialTheme.typography.labelSmall)
                            Text("$spentPercent%", color = Color.White, fontWeight = FontWeight.Bold, style = MaterialTheme.typography.labelSmall)
                        }
                    }
                }

                plan.insight?.takeIf { it.isNotBlank() }?.let { insight ->
                    item { InsightCard(insight) }
                }

                item { SectionTitle("Allocations") }

                if (plan.allocations.isEmpty()) {
                    item {
                        SyncedCard {
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                Surface(shape = RoundedCornerShape(18.dp), color = PrimarySoft) {
                                    Icon(
                                        Icons.Outlined.Savings,
                                        contentDescription = null,
                                        tint = Primary,
                                        modifier = Modifier.padding(11.dp),
                                    )
                                }
                                Spacer(Modifier.width(12.dp))
                                Column(Modifier.weight(1f)) {
                                    Text("No allocations yet", fontWeight = FontWeight.Bold, color = Ink)
                                    Text("Split this plan into essentials, goals or custom categories.", color = Muted, style = MaterialTheme.typography.bodySmall)
                                }
                                TextButton(onClick = { showCreate = true }) { Text("Set up") }
                            }
                        }
                    }
                } else {
                    items(plan.allocations, key = { it.id ?: it.label }) { allocation ->
                        AllocationCard(allocation)
                    }
                }

                item {
                    TextButton(
                        onClick = { showCreate = true },
                        modifier = Modifier.fillMaxWidth(),
                    ) {
                        Icon(Icons.Outlined.Edit, contentDescription = null, modifier = Modifier.size(18.dp))
                        Spacer(Modifier.width(7.dp))
                        Text("Replace this plan")
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
private fun AllocationCard(allocation: PlanAllocation) {
    val percent = if (allocation.plannedAmount > 0) {
        (allocation.spentAmount / allocation.plannedAmount * 100).toInt().coerceIn(0, 100)
    } else 0
    SyncedCard {
        Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.Top) {
            Column(Modifier.weight(1f)) {
                Text(allocation.label, fontWeight = FontWeight.Bold, color = Ink, style = MaterialTheme.typography.titleMedium)
                Text(
                    "${money(allocation.spentAmount)} of ${money(allocation.plannedAmount)}",
                    color = Muted,
                    style = MaterialTheme.typography.bodySmall,
                )
            }
            Surface(
                color = if (percent >= 90) WarningSoft else PrimarySoft,
                shape = RoundedCornerShape(100.dp),
            ) {
                Text(
                    if (allocation.plannedAmount > 0) "$percent%" else "—",
                    color = if (percent >= 90) Warning else PrimaryDeep,
                    fontWeight = FontWeight.Bold,
                    style = MaterialTheme.typography.labelMedium,
                    modifier = Modifier.padding(horizontal = 10.dp, vertical = 6.dp),
                )
            }
        }
        Spacer(Modifier.height(13.dp))
        ProgressBar(percent, color = if (percent >= 90) Warning else Primary)
        Spacer(Modifier.height(7.dp))
        Text(
            if (allocation.plannedAmount <= 0) "No target set" else "${money((allocation.plannedAmount - allocation.spentAmount).coerceAtLeast(0.0))} left",
            color = Muted,
            style = MaterialTheme.typography.labelSmall,
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
