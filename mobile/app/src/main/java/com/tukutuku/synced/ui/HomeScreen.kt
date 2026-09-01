package com.tukutuku.synced.ui

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.outlined.Logout
import androidx.compose.material.icons.outlined.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.tukutuku.synced.app.AuthViewModel
import com.tukutuku.synced.app.HomeViewModel
import com.tukutuku.synced.data.model.Transaction
import com.tukutuku.synced.domain.AuthState
import com.tukutuku.synced.ui.components.*
import com.tukutuku.synced.ui.theme.*

@Composable
fun HomeScreen(
    onAdd: () -> Unit,
    onSms: () -> Unit,
    onHousehold: () -> Unit,
    onTransactions: () -> Unit,
    onAsk: () -> Unit,
    onBills: () -> Unit,
    onInsights: () -> Unit,
    home: HomeViewModel = hiltViewModel(),
    auth: AuthViewModel = hiltViewModel(),
) {
    val wallet by home.wallet.collectAsStateWithLifecycle()
    val tx by home.transactions.collectAsStateWithLifecycle()
    val insight by home.insight.collectAsStateWithLifecycle()
    val analytics by home.analytics.collectAsStateWithLifecycle()
    val upcoming by home.upcoming.collectAsStateWithLifecycle()
    val forecast by home.forecast.collectAsStateWithLifecycle()
    val authState by auth.state.collectAsStateWithLifecycle()
    val user = (authState as? AuthState.SignedIn)?.user
    val topCategory = analytics.data?.byCategory?.firstOrNull()
    val nextBill = upcoming.data?.bills?.firstOrNull()
    val trend = analytics.data?.thisMonth

    LazyColumn(
        Modifier.fillMaxSize(),
        contentPadding = PaddingValues(horizontal = 18.dp, vertical = 16.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp),
    ) {
        item {
            Row(
                Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically,
            ) {
                Column {
                    Text("Synced", color = Primary, style = MaterialTheme.typography.labelLarge, fontWeight = FontWeight.Bold)
                    Text(
                        "Hi, ${user?.name?.substringBefore(' ')?.ifBlank { null } ?: "there"}",
                        style = MaterialTheme.typography.headlineMedium,
                        fontWeight = FontWeight.Black,
                        color = Ink,
                    )
                    Text("Your money, understood.", color = Muted)
                }
                IconButton(onClick = { auth.signOut() }) {
                    Icon(Icons.AutoMirrored.Outlined.Logout, "Sign out", tint = Muted)
                }
            }
        }

        item {
            Card(
                colors = CardDefaults.cardColors(containerColor = Hero),
                shape = MaterialTheme.shapes.extraLarge,
            ) {
                Column(Modifier.fillMaxWidth().padding(22.dp)) {
                    Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                        Text("Available money", color = Color.White.copy(alpha = .72f))
                        StatusPill("Personal + shared", "primary")
                    }
                    Text(
                        money(wallet.data?.summary?.combinedBalance ?: 0.0),
                        style = MaterialTheme.typography.headlineLarge,
                        fontWeight = FontWeight.Black,
                        color = Color.White,
                        modifier = Modifier.padding(top = 8.dp),
                    )
                    Text(
                        "Personal ${money(wallet.data?.summary?.personalBalance ?: 0.0)}",
                        color = Color.White.copy(alpha = .7f),
                        style = MaterialTheme.typography.bodySmall,
                    )
                    Spacer(Modifier.height(18.dp))
                    HorizontalDivider(color = Color.White.copy(alpha = .12f))
                    Spacer(Modifier.height(14.dp))
                    Row(Modifier.fillMaxWidth()) {
                        HeroMetric(
                            "Spent this month",
                            money(trend?.total ?: 0.0),
                            if ((trend?.change ?: 0) == 0) "On recent pattern" else "${kotlin.math.abs(trend?.change ?: 0)}% ${if ((trend?.change ?: 0) > 0) "higher" else "lower"}",
                            Modifier.weight(1f),
                        )
                        HeroMetric(
                            "Due next 30 days",
                            money(upcoming.data?.summary?.totalUpcoming ?: 0.0),
                            "${upcoming.data?.summary?.count ?: 0} obligations",
                            Modifier.weight(1f),
                        )
                    }
                }
            }
        }

        item {
            SectionTitle("Do something")
            Spacer(Modifier.height(10.dp))
            Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(9.dp)) {
                Quick("Add", Icons.Outlined.AddCircle, onAdd, Modifier.weight(1f))
                Quick("Bills", Icons.Outlined.ReceiptLong, onBills, Modifier.weight(1f))
                Quick("SMS sync", Icons.Outlined.Sms, onSms, Modifier.weight(1f))
                Quick("Ask Synced", Icons.Outlined.AutoAwesome, onAsk, Modifier.weight(1f))
            }
        }

        insight?.deterministicInsight?.takeIf { it.isNotBlank() }?.let { recommendation ->
            item { InsightCard(recommendation, "See full analysis", onInsights) }
        }

        item {
            SectionTitle("Money pulse", "Full analysis", onInsights)
            Spacer(Modifier.height(10.dp))
            Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                MetricCard(
                    "Top category",
                    topCategory?.let { categoryLabel(it.category) } ?: "No spend yet",
                    topCategory?.let { "${it.percentage}% • ${money(it.amount)}" },
                    Modifier.weight(1f),
                )
                MetricCard(
                    "Runway signal",
                    forecast.data?.let { if (it.daysUntilZero >= 999) "Stable" else "${it.daysUntilZero} days" } ?: "Building",
                    forecast.data?.let { "Avg spend ${money(it.avgMonthlySpend)}" },
                    Modifier.weight(1f),
                )
            }
        }

        if (topCategory != null) {
            item {
                SyncedCard {
                    Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                        Column {
                            Text("Where money is going", fontWeight = FontWeight.Bold, color = Ink)
                            Text(categoryLabel(topCategory.category), color = Muted)
                        }
                        Text("${topCategory.percentage}%", fontWeight = FontWeight.Black, color = Primary)
                    }
                    Spacer(Modifier.height(10.dp))
                    ProgressBar(topCategory.percentage, Primary)
                    analytics.data?.byCategory?.drop(1)?.take(2)?.forEach { category ->
                        Spacer(Modifier.height(12.dp))
                        Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                            Text(categoryLabel(category.category), color = Muted, style = MaterialTheme.typography.bodySmall)
                            Text(money(category.amount), color = Ink, style = MaterialTheme.typography.bodySmall, fontWeight = FontWeight.SemiBold)
                        }
                    }
                }
            }
        }

        if (nextBill != null) {
            item {
                SyncedCard(containerColor = WarningSoft) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Surface(shape = MaterialTheme.shapes.medium, color = Surface) {
                            Icon(Icons.Outlined.Event, null, tint = Warning, modifier = Modifier.padding(11.dp))
                        }
                        Spacer(Modifier.width(12.dp))
                        Column(Modifier.weight(1f)) {
                            Text("Next bill", color = Muted, style = MaterialTheme.typography.labelMedium)
                            Text(nextBill.name, fontWeight = FontWeight.Bold, color = Ink)
                            Text("Due ${shortDate(nextBill.dueDate)}", color = Muted, style = MaterialTheme.typography.bodySmall)
                        }
                        Text(money(nextBill.amount), fontWeight = FontWeight.Black, color = Ink)
                    }
                    TextButton(onClick = onBills, contentPadding = PaddingValues(0.dp)) { Text("Manage bills") }
                }
            }
        }

        item { SectionTitle("Recent activity", "See all", onTransactions) }
        if (tx.loading) {
            item { LinearProgressIndicator(Modifier.fillMaxWidth()) }
        } else if (tx.data.isNullOrEmpty()) {
            item {
                EmptyState(
                    "Start building your money picture",
                    "Add an expense or sync eligible mobile-money messages. Synced will classify activity and build analysis from it.",
                    "Add transaction",
                    onAdd,
                )
            }
        } else {
            items(tx.data!!.take(6).size) { i -> TransactionRow(tx.data!![i]) }
        }

        item { Spacer(Modifier.height(8.dp)) }
    }
}

@Composable
private fun HeroMetric(label: String, value: String, supporting: String, modifier: Modifier) {
    Column(modifier) {
        Text(label, color = Color.White.copy(alpha = .62f), style = MaterialTheme.typography.labelSmall)
        Text(value, color = Color.White, fontWeight = FontWeight.Bold, style = MaterialTheme.typography.titleMedium)
        Text(supporting, color = Color.White.copy(alpha = .62f), style = MaterialTheme.typography.labelSmall)
    }
}

@Composable
private fun Quick(
    label: String,
    icon: ImageVector,
    onClick: () -> Unit,
    modifier: Modifier,
) {
    FilledTonalButton(
        onClick = onClick,
        modifier = modifier.height(82.dp),
        contentPadding = PaddingValues(6.dp),
    ) {
        Column(horizontalAlignment = Alignment.CenterHorizontally) {
            Icon(icon, null)
            Spacer(Modifier.height(6.dp))
            Text(label, style = MaterialTheme.typography.labelSmall, maxLines = 1)
        }
    }
}

@Composable
fun TransactionRow(tx: Transaction) {
    SyncedCard {
        Row(Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
            Surface(
                shape = MaterialTheme.shapes.medium,
                color = if (tx.type == "credit") SuccessSoft else SurfaceAlt,
            ) {
                Icon(
                    if (tx.type == "credit") Icons.Outlined.SouthWest else Icons.Outlined.NorthEast,
                    null,
                    tint = if (tx.type == "credit") Success else Primary,
                    modifier = Modifier.padding(10.dp),
                )
            }
            Spacer(Modifier.width(12.dp))
            Column(Modifier.weight(1f)) {
                Text(
                    tx.description ?: tx.merchant ?: categoryLabel(tx.category),
                    fontWeight = FontWeight.SemiBold,
                    color = Ink,
                    maxLines = 1,
                )
                Text(
                    listOf(categoryLabel(tx.category), tx.source).filter { it.isNotBlank() }.joinToString(" • "),
                    color = Muted,
                    style = MaterialTheme.typography.bodySmall,
                )
            }
            Text(
                (if (tx.type == "credit") "+" else "-") + money(tx.amount),
                fontWeight = FontWeight.Bold,
                color = if (tx.type == "credit") Success else Ink,
            )
        }
    }
}

fun shortDate(raw: String?): String {
    if (raw.isNullOrBlank()) return "soon"
    return raw.take(10)
}
