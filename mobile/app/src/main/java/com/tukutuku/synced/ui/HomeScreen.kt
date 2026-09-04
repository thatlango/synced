package com.tukutuku.synced.ui

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.outlined.Logout
import androidx.compose.material.icons.outlined.*
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.tukutuku.synced.app.AuthViewModel
import com.tukutuku.synced.app.FinancialOutlookViewModel
import com.tukutuku.synced.app.HomeViewModel
import com.tukutuku.synced.data.model.CategorySpend
import com.tukutuku.synced.data.model.Transaction
import com.tukutuku.synced.domain.AuthState
import com.tukutuku.synced.ui.components.*
import com.tukutuku.synced.ui.theme.*

private val overviewColors = listOf(ChartBlue, ChartPurple, ChartGreen, ChartAmber)

@Composable
fun HomeScreen(
    onAdd: () -> Unit,
    onSms: () -> Unit,
    onHousehold: () -> Unit,
    onTransactions: () -> Unit,
    onAsk: () -> Unit,
    home: HomeViewModel = hiltViewModel(),
    outlook: FinancialOutlookViewModel = hiltViewModel(),
    auth: AuthViewModel = hiltViewModel(),
) {
    val wallet by home.wallet.collectAsStateWithLifecycle()
    val transactions by home.transactions.collectAsStateWithLifecycle()
    val insight by home.insight.collectAsStateWithLifecycle()
    val authState by auth.state.collectAsStateWithLifecycle()
    val user = (authState as? AuthState.SignedIn)?.user
    val upcoming by outlook.upcoming.collectAsStateWithLifecycle()
    val forecast by outlook.forecast.collectAsStateWithLifecycle()
    val analytics by outlook.analytics.collectAsStateWithLifecycle()

    val personalBalance = wallet.data?.summary?.personalBalance ?: 0.0
    val combinedBalance = wallet.data?.summary?.combinedBalance ?: personalBalance
    val sharedBalance = (combinedBalance - personalBalance).coerceAtLeast(0.0)
    val firstName = user?.name?.trim()?.substringBefore(' ')?.ifBlank { null } ?: "there"
    val analyticsData = analytics.data
    val upcomingData = upcoming.data

    LazyColumn(
        modifier = Modifier.fillMaxSize(),
        contentPadding = PaddingValues(start = 20.dp, end = 20.dp, top = 20.dp, bottom = 28.dp),
        verticalArrangement = Arrangement.spacedBy(18.dp),
    ) {
        item {
            Row(
                Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically,
            ) {
                Column {
                    Text("Good to see you", color = Muted, style = MaterialTheme.typography.bodyLarge)
                    Text(
                        firstName,
                        style = MaterialTheme.typography.headlineLarge,
                        fontWeight = FontWeight.Black,
                        color = Ink,
                    )
                }
                Surface(shape = CircleShape, color = Surface, shadowElevation = 2.dp) {
                    IconButton(onClick = { auth.signOut() }) {
                        Icon(Icons.AutoMirrored.Outlined.Logout, "Sign out", tint = Muted)
                    }
                }
            }
        }

        item {
            GradientCard(Modifier.fillMaxWidth()) {
                Text(
                    "TOTAL AVAILABLE",
                    color = Color.White.copy(alpha = .68f),
                    style = MaterialTheme.typography.labelMedium,
                    fontWeight = FontWeight.Bold,
                )
                Spacer(Modifier.height(7.dp))
                Text(
                    money(personalBalance),
                    style = MaterialTheme.typography.displaySmall,
                    fontWeight = FontWeight.Black,
                    color = Color.White,
                )
                Text(
                    "Your personal wallet",
                    color = Color.White.copy(alpha = .72f),
                    style = MaterialTheme.typography.bodyMedium,
                )
                Spacer(Modifier.height(20.dp))
                Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                    MetricPill("Shared spaces", money(sharedBalance), Modifier.weight(1f))
                    MetricPill(
                        "Next 30 days",
                        money(upcomingData?.summary?.totalUpcoming ?: 0.0),
                        Modifier.weight(1f),
                    )
                }
            }
        }

        insight?.deterministicInsight?.takeIf { it.isNotBlank() }?.let { text ->
            item { InsightCard(text) }
        }

        analyticsData?.let { analyticsValue ->
            item {
                SectionTitle("This month")
                Spacer(Modifier.height(10.dp))
                SyncedCard {
                    val categories = analyticsValue.byCategory.take(4)
                    val dominant = categories.maxByOrNull { it.percentage }
                    Row(
                        Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically,
                    ) {
                        Column(Modifier.weight(1f)) {
                            Text("Spending", color = Muted, style = MaterialTheme.typography.bodyMedium)
                            Text(
                                money(analyticsValue.thisMonth.total),
                                color = Ink,
                                style = MaterialTheme.typography.headlineSmall,
                                fontWeight = FontWeight.Black,
                            )
                            Spacer(Modifier.height(8.dp))
                            val change = analyticsValue.thisMonth.change
                            Surface(
                                color = if (change > 0) ErrorSoft else SuccessSoft,
                                shape = RoundedCornerShape(100.dp),
                            ) {
                                Text(
                                    if (change == 0) "Similar to last month" else "${if (change > 0) "+" else ""}$change% vs last month",
                                    color = if (change > 0) Error else Success,
                                    style = MaterialTheme.typography.labelSmall,
                                    modifier = Modifier.padding(horizontal = 10.dp, vertical = 6.dp),
                                )
                            }
                        }
                        RingChart(
                            segments = categories.mapIndexed { index, category ->
                                category.percentage to overviewColors[index % overviewColors.size]
                            },
                            centerTop = if (dominant == null) "—" else "${dominant.percentage}%",
                            centerBottom = dominant?.category?.let(::categoryLabel) ?: "tracked",
                            modifier = Modifier.size(116.dp),
                        )
                    }
                    if (categories.isNotEmpty()) {
                        Spacer(Modifier.height(18.dp))
                        HorizontalDivider(color = Divider)
                        Spacer(Modifier.height(12.dp))
                        categories.take(3).forEachIndexed { index, category ->
                            CategoryLegend(category, overviewColors[index % overviewColors.size])
                            if (index < categories.take(3).lastIndex) Spacer(Modifier.height(10.dp))
                        }
                    } else {
                        Spacer(Modifier.height(12.dp))
                        Text(
                            "Category detail appears as Synced classifies more transactions.",
                            color = Muted,
                            style = MaterialTheme.typography.bodySmall,
                        )
                    }
                }
            }
        }

        upcomingData?.let { bills ->
            item {
                SectionTitle("Coming up")
                Spacer(Modifier.height(10.dp))
                SyncedCard {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Surface(shape = CircleShape, color = SecondarySoft) {
                            Icon(
                                Icons.Outlined.ReceiptLong,
                                contentDescription = null,
                                tint = Secondary,
                                modifier = Modifier.padding(11.dp),
                            )
                        }
                        Spacer(Modifier.width(12.dp))
                        Column(Modifier.weight(1f)) {
                            Text(
                                if (bills.summary.count == 0) "No bills due soon" else "${bills.summary.count} payment${if (bills.summary.count == 1) "" else "s"} in 30 days",
                                fontWeight = FontWeight.Bold,
                                color = Ink,
                            )
                            Text(
                                bills.summary.nextDue?.let { "Next due ${it.substringBefore('T')}" }
                                    ?: "Your next 30 days are clear.",
                                color = Muted,
                                style = MaterialTheme.typography.bodySmall,
                            )
                        }
                        if (bills.summary.count > 0) {
                            Text(
                                money(bills.summary.totalUpcoming),
                                color = Ink,
                                fontWeight = FontWeight.Black,
                                style = MaterialTheme.typography.bodyMedium,
                            )
                        }
                    }
                }
            }
        }

        forecast.data?.let { forecastValue ->
            item {
                SectionTitle("Cash outlook")
                Spacer(Modifier.height(10.dp))
                SyncedCard {
                    Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                        OutlookMetric("Monthly income", money(forecastValue.avgMonthlyIncome), Success, Modifier.weight(1f))
                        OutlookMetric(
                            "Monthly spend",
                            money(forecastValue.avgMonthlySpend + forecastValue.monthlySubscriptionCost),
                            Ink,
                            Modifier.weight(1f),
                        )
                    }
                    forecastValue.projections.firstOrNull()?.let { projection ->
                        Spacer(Modifier.height(16.dp))
                        HorizontalDivider(color = Divider)
                        Spacer(Modifier.height(13.dp))
                        Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                            Text("${projection.month} projected balance", color = Muted, style = MaterialTheme.typography.bodyMedium)
                            Text(money(projection.projectedBalance), fontWeight = FontWeight.Bold, color = Ink)
                        }
                    }
                    if (forecastValue.daysUntilZero in 0..90) {
                        Spacer(Modifier.height(12.dp))
                        Surface(color = WarningSoft, shape = RoundedCornerShape(14.dp)) {
                            Text(
                                "At the current pace, available cash covers about ${forecastValue.daysUntilZero} days.",
                                color = Warning,
                                style = MaterialTheme.typography.bodySmall,
                                modifier = Modifier.padding(11.dp),
                            )
                        }
                    }
                }
            }
        }

        item {
            SectionTitle("Quick actions")
            Spacer(Modifier.height(10.dp))
            Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                QuickAction("Add", Icons.Outlined.Add, onAdd, Modifier.weight(1f))
                QuickAction("Sync", Icons.Outlined.Sms, onSms, Modifier.weight(1f))
                QuickAction("Shared", Icons.Outlined.Group, onHousehold, Modifier.weight(1f))
                QuickAction("Ask", Icons.Outlined.AutoAwesome, onAsk, Modifier.weight(1f))
            }
        }

        item { SectionTitle("Recent activity", "See all", onTransactions) }

        when {
            transactions.loading -> item {
                Box(Modifier.fillMaxWidth().padding(24.dp), contentAlignment = Alignment.Center) {
                    CircularProgressIndicator(color = Primary)
                }
            }
            transactions.data.isNullOrEmpty() -> item {
                EmptyState(
                    "No transactions yet",
                    "Add an expense, fund your wallet or sync eligible mobile-money messages.",
                    "Add expense",
                    onAdd,
                )
            }
            else -> items(transactions.data.orEmpty().take(5), key = { it.id }) { transaction ->
                TransactionRow(transaction)
            }
        }
    }
}

@Composable
private fun QuickAction(
    label: String,
    icon: ImageVector,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
) {
    Surface(
        onClick = onClick,
        modifier = modifier,
        shape = RoundedCornerShape(20.dp),
        color = Surface,
        shadowElevation = 1.dp,
    ) {
        Column(
            Modifier.padding(vertical = 14.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
        ) {
            Surface(shape = CircleShape, color = PrimarySoft) {
                Icon(icon, contentDescription = null, tint = Primary, modifier = Modifier.padding(9.dp).size(19.dp))
            }
            Spacer(Modifier.height(8.dp))
            Text(label, color = Ink, style = MaterialTheme.typography.labelSmall)
        }
    }
}

@Composable
private fun CategoryLegend(category: CategorySpend, color: Color) {
    Row(Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
        Box(Modifier.size(8.dp).background(color, CircleShape))
        Spacer(Modifier.width(9.dp))
        Text(categoryLabel(category.category), color = Muted, modifier = Modifier.weight(1f))
        Text("${money(category.amount)} · ${category.percentage}%", color = Ink, fontWeight = FontWeight.SemiBold)
    }
}

@Composable
private fun OutlookMetric(label: String, value: String, valueColor: Color, modifier: Modifier = Modifier) {
    Surface(modifier = modifier, color = SurfaceSoft, shape = RoundedCornerShape(18.dp)) {
        Column(Modifier.padding(13.dp)) {
            Text(label, color = Muted, style = MaterialTheme.typography.labelSmall)
            Spacer(Modifier.height(4.dp))
            Text(value, color = valueColor, fontWeight = FontWeight.Bold, style = MaterialTheme.typography.bodyMedium)
        }
    }
}

@Composable
fun TransactionRow(tx: Transaction) {
    Surface(
        shape = RoundedCornerShape(20.dp),
        color = Surface,
        shadowElevation = 1.dp,
    ) {
        Row(
            Modifier.fillMaxWidth().padding(horizontal = 14.dp, vertical = 13.dp),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            Surface(
                shape = RoundedCornerShape(15.dp),
                color = if (tx.type == "credit") SuccessSoft else ErrorSoft,
            ) {
                Icon(
                    if (tx.type == "credit") Icons.Outlined.SouthWest else Icons.Outlined.NorthEast,
                    contentDescription = null,
                    tint = if (tx.type == "credit") Success else Error,
                    modifier = Modifier.padding(10.dp).size(21.dp),
                )
            }
            Spacer(Modifier.width(12.dp))
            Column(Modifier.weight(1f)) {
                Text(
                    tx.description ?: tx.merchant ?: tx.category?.let(::categoryLabel) ?: "Transaction",
                    fontWeight = FontWeight.SemiBold,
                    color = Ink,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis,
                )
                val meta = listOfNotNull(tx.category?.let(::categoryLabel), tx.source).joinToString(" • ")
                if (meta.isNotBlank()) {
                    Text(meta, color = Muted, style = MaterialTheme.typography.bodySmall, maxLines = 1)
                }
            }
            Spacer(Modifier.width(8.dp))
            Text(
                (if (tx.type == "credit") "+" else "-") + money(tx.amount),
                fontWeight = FontWeight.Bold,
                color = if (tx.type == "credit") Success else Ink,
                style = MaterialTheme.typography.bodyMedium,
            )
        }
    }
}

private fun categoryLabel(raw: String?): String = raw
    ?.replace('_', ' ')
    ?.trim()
    ?.takeIf { it.isNotBlank() }
    ?.replaceFirstChar { if (it.isLowerCase()) it.titlecase() else it.toString() }
    ?: "Other"
