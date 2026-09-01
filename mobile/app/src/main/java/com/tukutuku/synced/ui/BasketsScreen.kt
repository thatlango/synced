package com.tukutuku.synced.ui

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.Add
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
import com.tukutuku.synced.ui.components.EmptyState
import com.tukutuku.synced.ui.components.ProgressBar
import com.tukutuku.synced.ui.components.SyncedCard
import com.tukutuku.synced.ui.components.money
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

    LazyColumn(
        modifier = Modifier.fillMaxSize(),
        contentPadding = PaddingValues(18.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp),
    ) {
        item {
            Row(
                Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.Top,
            ) {
                Column(Modifier.weight(1f)) {
                    Text("Baskets", style = MaterialTheme.typography.headlineMedium, fontWeight = FontWeight.Black)
                    Text("Purpose pools for school fees, emergencies, travel and shared goals.", color = Muted)
                }
                IconButton(onClick = { showCreate = true }) {
                    Icon(Icons.Outlined.Add, contentDescription = "Create Basket", tint = Primary)
                }
            }
        }
        item {
            OutlinedButton(onClick = onJoin, modifier = Modifier.fillMaxWidth()) {
                Text("Join with invite code or QR link")
            }
        }

        when {
            state.loading -> item { LinearProgressIndicator(Modifier.fillMaxWidth()) }
            state.data.isNullOrEmpty() -> item {
                EmptyState(
                    title = "No Baskets yet",
                    body = "Create a purpose pool alone or with people you trust.",
                    action = "Create Basket",
                    onAction = { showCreate = true },
                )
            }
            else -> items(state.data.orEmpty(), key = { it.id }) { basket ->
                SyncedCard {
                    Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                        Column(Modifier.weight(1f)) {
                            Text(basket.name, fontWeight = FontWeight.Bold, style = MaterialTheme.typography.titleMedium)
                            Text(money(basket.savedAmount), style = MaterialTheme.typography.headlineSmall, fontWeight = FontWeight.Black)
                            Text(
                                if (basket.targetAmount > 0) "${money(basket.targetAmount)} target" else "Open-ended Basket",
                                color = Muted,
                            )
                        }
                        IconButton(onClick = { vm.invite(basket.id) }) {
                            Icon(Icons.Outlined.PersonAdd, contentDescription = "Invite", tint = Primary)
                        }
                    }
                    basket.progressPercent?.let { progress ->
                        Spacer(Modifier.height(10.dp))
                        ProgressBar(progress, Secondary)
                        Text(
                            "$progress% funded • ${basket.members.size} member${if (basket.members.size == 1) "" else "s"}",
                            color = Muted,
                            style = MaterialTheme.typography.bodySmall,
                            modifier = Modifier.padding(top = 6.dp),
                        )
                    }
                    TextButton(onClick = { contributionTarget = basket }) { Text("Add contribution") }
                }
            }
        }
    }

    if (showCreate) {
        CreateBasketDialog(
            onDismiss = { showCreate = false },
            onCreate = { name, target ->
                vm.create(name, target) { if (it.isSuccess) showCreate = false }
            },
        )
    }

    contributionTarget?.let { basket ->
        ContributionDialog(
            basket = basket,
            onDismiss = { contributionTarget = null },
            onAdd = { amount ->
                vm.contribute(basket.id, amount) { if (it.isSuccess) contributionTarget = null }
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
private fun CreateBasketDialog(
    onDismiss: () -> Unit,
    onCreate: (String, Double?) -> Unit,
) {
    var name by remember { mutableStateOf("") }
    var target by remember { mutableStateOf("") }
    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("Create Basket") },
        text = {
            Column {
                OutlinedTextField(name, { name = it }, label = { Text("Name") })
                Spacer(Modifier.height(8.dp))
                OutlinedTextField(
                    target,
                    { target = it.filter { c -> c.isDigit() || c == '.' } },
                    label = { Text("Target amount (optional)") },
                )
            }
        },
        confirmButton = {
            Button(onClick = { onCreate(name, target.toDoubleOrNull()) }, enabled = name.length >= 2) { Text("Create") }
        },
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
        title = { Text("Contribute to ${basket.name}") },
        text = {
            OutlinedTextField(
                amount,
                { amount = it.filter { c -> c.isDigit() || c == '.' } },
                label = { Text("Amount") },
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
        title = { Text("Invite ready") },
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
