package com.tukutuku.synced.ui

import android.content.Intent
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.Add
import androidx.compose.material.icons.outlined.Groups
import androidx.compose.material.icons.outlined.PersonAdd
import androidx.compose.material.icons.outlined.Savings
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
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

    LazyColumn(
        modifier = Modifier.fillMaxSize(),
        contentPadding = PaddingValues(start = 20.dp, end = 20.dp, top = 20.dp, bottom = 28.dp),
        verticalArrangement = Arrangement.spacedBy(14.dp),
    ) {
        item {
            Row(
                Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically,
            ) {
                Column(Modifier.weight(1f)) {
                    Text("Baskets", style = MaterialTheme.typography.headlineLarge, fontWeight = FontWeight.Black, color = Ink)
                    Text("Save for a purpose, alone or together.", color = Muted, style = MaterialTheme.typography.bodyLarge)
                }
                Surface(shape = RoundedCornerShape(16.dp), color = Surface, shadowElevation = 1.dp) {
                    IconButton(onClick = { showCreate = true }) {
                        Icon(Icons.Outlined.Add, contentDescription = "Create Basket", tint = Primary)
                    }
                }
            }
        }

        if (baskets.isNotEmpty()) {
            item {
                val totalSaved = baskets.sumOf { it.savedAmount }
                val totalTarget = baskets.sumOf { it.targetAmount }
                val overallPercent = if (totalTarget > 0) (totalSaved / totalTarget * 100).toInt().coerceIn(0, 100) else 0
                GradientCard(Modifier.fillMaxWidth()) {
                    Text("SAVED ACROSS BASKETS", color = Color.White.copy(alpha = .68f), style = MaterialTheme.typography.labelMedium)
                    Spacer(Modifier.height(7.dp))
                    Text(money(totalSaved), color = Color.White, style = MaterialTheme.typography.displaySmall, fontWeight = FontWeight.Black)
                    Text("${baskets.size} active basket${if (baskets.size == 1) "" else "s"}", color = Color.White.copy(alpha = .72f))
                    if (totalTarget > 0) {
                        Spacer(Modifier.height(18.dp))
                        ProgressBar(overallPercent, color = Color.White, trackColor = Color.White.copy(alpha = .18f))
                        Spacer(Modifier.height(7.dp))
                        Text("$overallPercent% of ${money(totalTarget)} combined targets", color = Color.White.copy(alpha = .76f), style = MaterialTheme.typography.labelSmall)
                    }
                }
            }
        }

        item {
            Surface(
                onClick = onJoin,
                shape = RoundedCornerShape(20.dp),
                color = PrimarySoft,
            ) {
                Row(Modifier.fillMaxWidth().padding(15.dp), verticalAlignment = Alignment.CenterVertically) {
                    Surface(shape = CircleShape, color = Color.White.copy(alpha = .9f)) {
                        Icon(Icons.Outlined.Groups, contentDescription = null, tint = Primary, modifier = Modifier.padding(9.dp))
                    }
                    Spacer(Modifier.width(12.dp))
                    Column(Modifier.weight(1f)) {
                        Text("Join a Basket", fontWeight = FontWeight.Bold, color = Ink)
                        Text("Use an invite code or QR link", color = Muted, style = MaterialTheme.typography.bodySmall)
                    }
                    Icon(Icons.Outlined.PersonAdd, contentDescription = null, tint = Primary)
                }
            }
        }

        when {
            state.loading -> item { LinearProgressIndicator(Modifier.fillMaxWidth(), color = Primary) }
            baskets.isEmpty() -> item {
                EmptyState(
                    title = "No Baskets yet",
                    body = "Create a purpose pool for school fees, emergencies, travel or any goal.",
                    action = "Create Basket",
                    onAction = { showCreate = true },
                )
            }
            else -> {
                item { SectionTitle("Your Baskets") }
                items(baskets, key = { it.id }) { basket ->
                    BasketCard(
                        basket = basket,
                        onInvite = { vm.invite(basket.id) },
                        onContribute = { contributionTarget = basket },
                    )
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
        val fallback = "synced://join?code=${it.code}"
        InviteDialog(
            code = it.code,
            qrPayload = it.qrPayload ?: fallback,
            shareUrl = it.joinUrl ?: it.qrPayload ?: fallback,
            onDismiss = vm::clearInvite,
        )
    }
}

@Composable
private fun BasketCard(
    basket: Basket,
    onInvite: () -> Unit,
    onContribute: () -> Unit,
) {
    SyncedCard {
        Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.Top) {
            Column(Modifier.weight(1f)) {
                Text(basket.name, fontWeight = FontWeight.Bold, style = MaterialTheme.typography.titleMedium, color = Ink)
                Spacer(Modifier.height(5.dp))
                Text(money(basket.savedAmount), style = MaterialTheme.typography.headlineSmall, fontWeight = FontWeight.Black, color = Ink)
                Text(
                    if (basket.targetAmount > 0) "of ${money(basket.targetAmount)} target" else "Open-ended Basket",
                    color = Muted,
                    style = MaterialTheme.typography.bodySmall,
                )
            }
            Surface(shape = RoundedCornerShape(15.dp), color = PrimarySoft) {
                IconButton(onClick = onInvite) {
                    Icon(Icons.Outlined.PersonAdd, contentDescription = "Invite", tint = Primary)
                }
            }
        }
        basket.progressPercent?.let { progress ->
            Spacer(Modifier.height(14.dp))
            ProgressBar(progress, Secondary)
            Spacer(Modifier.height(8.dp))
            Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                Text("$progress% funded", color = Muted, style = MaterialTheme.typography.labelSmall)
                Text("${basket.members.size} member${if (basket.members.size == 1) "" else "s"}", color = Muted, style = MaterialTheme.typography.labelSmall)
            }
        }
        Spacer(Modifier.height(10.dp))
        Button(onClick = onContribute, modifier = Modifier.fillMaxWidth()) {
            Icon(Icons.Outlined.Savings, contentDescription = null, modifier = Modifier.size(18.dp))
            Spacer(Modifier.width(7.dp))
            Text("Add contribution")
        }
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
    qrPayload: String,
    shareUrl: String,
    onDismiss: () -> Unit,
) {
    val context = LocalContext.current
    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("Invite ready") },
        text = {
            Column(horizontalAlignment = Alignment.CenterHorizontally) {
                QrCode(qrPayload, Modifier.size(190.dp))
                Spacer(Modifier.height(10.dp))
                Text(code, style = MaterialTheme.typography.headlineMedium, fontWeight = FontWeight.Black)
                Text("Scan the QR, share the link, or send this code.", color = Muted)
            }
        },
        confirmButton = {
            Button(
                onClick = {
                    val message = "Join me on Synced. Open this invite: $shareUrl\nInvite code: $code"
                    val intent = Intent(Intent.ACTION_SEND).apply {
                        type = "text/plain"
                        putExtra(Intent.EXTRA_TEXT, message)
                    }
                    context.startActivity(Intent.createChooser(intent, "Share Synced invite"))
                },
            ) { Text("Share invite") }
        },
        dismissButton = { TextButton(onClick = onDismiss) { Text("Done") } },
    )
}
