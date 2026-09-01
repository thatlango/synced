package com.tukutuku.synced.ui

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.Add
import androidx.compose.material.icons.outlined.Flag
import androidx.compose.material.icons.outlined.PersonAdd
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.tukutuku.synced.app.BasketsViewModel
import com.tukutuku.synced.data.model.Basket
import com.tukutuku.synced.ui.components.*
import com.tukutuku.synced.ui.theme.*

@Composable
fun BasketsScreen(
    onJoin: () -> Unit,
    vm: BasketsViewModel = hiltViewModel(),
) {
    val state by vm.state.collectAsStateWithLifecycle()
    val invite by vm.invite.collectAsStateWithLifecycle()
    var showCreate by remember { mutableStateOf(false) }
    var contributionTarget by remember { mutableStateOf<Basket?>(null) }
    val baskets = state.data.orEmpty()
    val totalSaved = baskets.sumOf { it.savedAmount }
    val totalTarget = baskets.filter { it.targetAmount > 0 }.sumOf { it.targetAmount }

    LazyColumn(
        modifier = Modifier.fillMaxSize(),
        contentPadding = PaddingValues(horizontal = 18.dp, vertical = 16.dp),
        verticalArrangement = Arrangement.spacedBy(14.dp),
    ) {
        item {
            Row(
                Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.Top,
            ) {
                Column(Modifier.weight(1f)) {
                    Text("Baskets", style = MaterialTheme.typography.headlineMedium, fontWeight = FontWeight.Black, color = Ink)
                    Text("Put money aside for the things you can see coming.", color = Muted)
                }
                FilledIconButton(onClick = { showCreate = true }) {
                    Icon(Icons.Outlined.Add, contentDescription = "Create Basket")
                }
            }
        }

        if (baskets.isNotEmpty()) {
            item {
                Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                    MetricCard("Saved in Baskets", money(totalSaved), "Across ${baskets.size} goals", Modifier.weight(1f))
                    MetricCard(
                        "Known targets",
                        if (totalTarget > 0) money(totalTarget) else "Open-ended",
                        "Purpose money",
                        Modifier.weight(1f),
                    )
                }
            }
        }

        item {
            OutlinedButton(onClick = onJoin, modifier = Modifier.fillMaxWidth().heightIn(min = 50.dp)) {
                Icon(Icons.Outlined.PersonAdd, null)
                Spacer(Modifier.width(8.dp))
                Text("Join a Basket with code or QR")
            }
        }

        when {
            state.loading -> item { LinearProgressIndicator(Modifier.fillMaxWidth()) }
            baskets.isEmpty() -> item {
                EmptyState(
                    title = "Create a purpose for your money",
                    body = "School fees, an emergency buffer, travel or a shared family goal — a Basket keeps progress visible without mixing everything together.",
                    action = "Create Basket",
                    onAction = { showCreate = true },
                )
            }
            else -> items(baskets, key = { it.id }) { basket ->
                val progress = basket.progressPercent ?: if (basket.targetAmount > 0) {
                    (basket.savedAmount / basket.targetAmount * 100).toInt().coerceIn(0, 100)
                } else null
                SyncedCard {
                    Row(Modifier.fillMaxWidth(), verticalAlignment = Alignment.Top) {
                        Surface(shape = MaterialTheme.shapes.medium, color = SecondarySoft) {
                            Icon(Icons.Outlined.Flag, null, tint = Secondary, modifier = Modifier.padding(11.dp))
                        }
                        Spacer(Modifier.width(12.dp))
                        Column(Modifier.weight(1f)) {
                            Text(basket.name, fontWeight = FontWeight.Bold, style = MaterialTheme.typography.titleMedium, color = Ink)
                            Text(
                                if (basket.targetAmount > 0) "Target ${money(basket.targetAmount)}" else "Open-ended purpose fund",
                                color = Muted,
                                style = MaterialTheme.typography.bodySmall,
                            )
                        }
                        IconButton(onClick = { vm.invite(basket.id) }) {
                            Icon(Icons.Outlined.PersonAdd, contentDescription = "Invite", tint = Primary)
                        }
                    }
                    Spacer(Modifier.height(14.dp))
                    Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.Bottom) {
                        Column {
                            Text("Saved", color = Muted, style = MaterialTheme.typography.labelMedium)
                            Text(money(basket.savedAmount), style = MaterialTheme.typography.headlineSmall, fontWeight = FontWeight.Black, color = Ink)
                        }
                        if (progress != null) StatusPill("$progress% funded", if (progress >= 100) "success" else "primary")
                    }
                    if (progress != null) {
                        Spacer(Modifier.height(10.dp))
                        ProgressBar(progress, Secondary)
                        Spacer(Modifier.height(7.dp))
                        Text(
                            "${money((basket.targetAmount - basket.savedAmount).coerceAtLeast(0.0))} remaining • ${basket.members.size} member${if (basket.members.size == 1) "" else "s"}",
                            color = Muted,
                            style = MaterialTheme.typography.bodySmall,
                        )
                    } else {
                        Spacer(Modifier.height(7.dp))
                        Text("${basket.members.size} member${if (basket.members.size == 1) "" else "s"}", color = Muted, style = MaterialTheme.typography.bodySmall)
                    }
                    Spacer(Modifier.height(8.dp))
                    Button(onClick = { contributionTarget = basket }, modifier = Modifier.fillMaxWidth()) {
                        Text("Add contribution")
                    }
                }
            }
        }
        item { Spacer(Modifier.height(8.dp)) }
    }

    if (showCreate) {
        CreateBasketDialog(
            onDismiss = { showCreate = false },
            onCreate = { name, target -> vm.create(name, target) { if (it.isSuccess) showCreate = false } },
        )
    }

    contributionTarget?.let { basket ->
        ContributionDialog(
            basket = basket,
            onDismiss = { contributionTarget = null },
            onAdd = { amount -> vm.contribute(basket.id, amount) { if (it.isSuccess) contributionTarget = null } },
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
private fun CreateBasketDialog(
    onDismiss: () -> Unit,
    onCreate: (String, Double?) -> Unit,
) {
    var name by remember { mutableStateOf("") }
    var target by remember { mutableStateOf("") }
    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("Create Basket", fontWeight = FontWeight.Black) },
        text = {
            Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                OutlinedTextField(name, { name = it }, label = { Text("What are you saving for?") }, modifier = Modifier.fillMaxWidth())
                OutlinedTextField(
                    target,
                    { target = it.filter { c -> c.isDigit() || c == '.' } },
                    label = { Text("Target amount (optional)") },
                    modifier = Modifier.fillMaxWidth(),
                )
                Text("You can keep a Basket private or invite trusted people after creating it.", color = Muted, style = MaterialTheme.typography.bodySmall)
            }
        },
        confirmButton = { Button(onClick = { onCreate(name, target.toDoubleOrNull()) }, enabled = name.length >= 2) { Text("Create") } },
        dismissButton = { TextButton(onClick = onDismiss) { Text("Cancel") } },
    )
}

@Composable
private fun ContributionDialog(
    basket: Basket,
    onDismiss: () -> Unit,
    onAdd: (Double) -> Unit,
) {
    var amount by remember { mutableStateOf("") }
    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("Contribute to ${basket.name}", fontWeight = FontWeight.Black) },
        text = {
            OutlinedTextField(
                amount,
                { amount = it.filter { c -> c.isDigit() || c == '.' } },
                label = { Text("Amount (UGX)") },
                modifier = Modifier.fillMaxWidth(),
            )
        },
        confirmButton = {
            Button(
                onClick = { amount.toDoubleOrNull()?.let(onAdd) },
                enabled = (amount.toDoubleOrNull() ?: 0.0) > 0,
            ) { Text("Add") }
        },
        dismissButton = { TextButton(onClick = onDismiss) { Text("Cancel") } },
    )
}

@Composable
fun InviteDialog(
    code: String,
    payload: String,
    onDismiss: () -> Unit,
) {
    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("Invite ready", fontWeight = FontWeight.Black) },
        text = {
            Column(horizontalAlignment = Alignment.CenterHorizontally) {
                QrCode(payload, Modifier.size(190.dp))
                Spacer(Modifier.height(10.dp))
                Text(code, style = MaterialTheme.typography.headlineMedium, fontWeight = FontWeight.Black)
                Text("Scan the QR or share this code.", color = Muted)
            }
        },
        confirmButton = { TextButton(onClick = onDismiss) { Text("Done") } },
    )
}
