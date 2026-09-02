package com.tukutuku.synced.ui

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.outlined.ArrowBack
import androidx.compose.material.icons.outlined.AutoGraph
import androidx.compose.material.icons.outlined.Event
import androidx.compose.material.icons.outlined.Storefront
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.tukutuku.synced.app.BillsViewModel
import com.tukutuku.synced.app.IntelligenceViewModel
import com.tukutuku.synced.data.model.MonthlyTrend
import com.tukutuku.synced.ui.components.*
import com.tukutuku.synced.ui.theme.*
import kotlin.math.max

private data class ObligationDisplay(
    val kind: String,
    val name: String,
    val category: String,
    val amount: Double,
    val dueDate: String,
)

@Composable
fun IntelligenceScreen(
    onBack: () -> Unit,
    vm: IntelligenceViewModel = hiltViewModel(),
    billsVm: BillsViewModel = hiltViewModel(),
) {
    val analytics by vm.analytics.collectAsStateWithLifecycle()
    val trends by vm.trends.collectAsStateWithLifecycle()
    val forecast by vm.forecast.collectAsStateWithLifecycle()
    val insight by vm.insight.collectAsStateWithLifecycle()
    val upcoming by billsVm.state.collectAsStateWithLifecycle()
    val data = analytics.data
    val f = forecast.data
    val obligations = buildList {
        upcoming.data?.bills.orEmpty().forEach { bill ->
            add(
                ObligationDisplay(
                    kind = "Bill",
                    name = bill.name,
                    category = bill.category,
                    amount = bill.amount,
                    dueDate = bill.dueDate,
                ),
            )
        }
        upcoming.data?.subscriptions.orEmpty().forEach { subscription ->
            add(
                ObligationDisplay(
                    kind = "Subscription",
                    name = subscription.name,
                    category = subscription.category,
                    amount = subscription.amount,
                    dueDate = subscription.nextDueDate,
                ),
            )
        }
    }.sortedBy { it.dueDate }

    LazyColumn(
        Modifier.fillMaxSize(),
        contentPadding = PaddingValues(horizontal = 18.dp, vertical = 12.dp),
        verticalArrangement = Arrangement.spacedBy(14.dp),
    ) {
        item {
            Row(verticalAlignment = Alignment.CenterVertically) {
                IconButton(onClick = onBack) { Icon(Icons.AutoMirrored.Outlined.ArrowBack, "Back") }
                Spacer(Modifier.width(4.dp))
                Column {
                    Text("Money intelligence", style = MaterialTheme.typography.headlineSmall, fontWeight = FontWeight.Black, color = Ink)
                    Text("Analysis built from your actual Synced records.", color = Muted)
                }
            }
        }

        if (analytics.loading || forecast.loading || upcoming.loading) {
            item { LinearProgressIndicator(Modifier.fillMaxWidth()) }
        }

        if (data != null) {
            item {
                Card(colors = CardDefaults.cardColors(containerColor = Hero), shape = MaterialTheme.shapes.extraLarge) {
                    Column(Modifier.fillMaxWidth().padding(22.dp)) {
                        Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
                            Column {
                                Text("Spent this month", color = androidx.compose.ui.graphics.Color.White.copy(alpha = .65f))
                                Text(
                                    money(data.thisMonth.total),
                                    color = androidx.compose.ui.graphics.Color.White,
                                    style = MaterialTheme.typography.headlineLarge,
                                    fontWeight = FontWeight.Black,
                                )
                            }
                            StatusPill(
                                when (data.thisMonth.trend) {
                                    "up" -> "${kotlin.math.abs(data.thisMonth.change)}% higher"
                                    "down" -> "${kotlin.math.abs(data.thisMonth.change)}% lower"
                                    else -> "Stable"
                                },
                                when (data.thisMonth.trend) {
                                    "up" -> "warning"
                                    "down" -> "success"
                                    else -> "primary"
                                },
                            )
                        }
                        Spacer(Modifier.height(14.dp))
                        Text(
                            "Last month ${money(data.lastMonth.total)}",
                            color = androidx.compose.ui.graphics.Color.White.copy(alpha = .68f),
                        )
                    }
                }
            }
        }

        insight?.deterministicInsight?.takeIf { it.isNotBlank() }?.let { item { InsightCard(it) } }

        if (obligations.isNotEmpty()) {
            item { SectionTitle("Bills & subscriptions due") }
            item {
                val totalDue = upcoming.data?.summary?.totalUpcoming ?: 0.0
                val currentBalance = f?.currentBalance ?: 0.0
                val shortfall = (totalDue - currentBalance).coerceAtLeast(0.0)
                SyncedCard(containerColor = if (shortfall > 0) WarningSoft else SecondarySoft) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Surface(shape = MaterialTheme.shapes.medium, color = Surface) {
                            Icon(Icons.Outlined.Event, null, tint = if (shortfall > 0) Warning else Secondary, modifier = Modifier.padding(11.dp))
                        }
                        Spacer(Modifier.width(12.dp))
                        Column(Modifier.weight(1f)) {
                            Text("Known obligations", color = Muted, style = MaterialTheme.typography.labelMedium)
                            Text(
                                "${money(totalDue)} due across ${obligations.size} item${if (obligations.size == 1) "" else "s"}",
                                fontWeight = FontWeight.Bold,
                                color = Ink,
                            )
                            Text(
                                if (shortfall > 0) {
                                    "Recorded balance is short by ${money(shortfall)}. Prioritise these before discretionary spending."
                                } else {
                                    "Covered by the recorded balance. Reserve this amount before discretionary spending."
                                },
                                color = Muted,
                                style = MaterialTheme.typography.bodySmall,
                            )
                        }
                    }
                }
            }
            items(obligations.take(8), key = { "${it.kind}:${it.name}:${it.dueDate}" }) { obligation ->
                SyncedCard {
                    Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
                        Column(Modifier.weight(1f)) {
                            Text(obligation.name, fontWeight = FontWeight.Bold, color = Ink)
                            Text(
                                "${obligation.kind} • ${categoryLabel(obligation.category)} • due ${shortDate(obligation.dueDate)}",
                                color = Muted,
                                style = MaterialTheme.typography.bodySmall,
                            )
                        }
                        Spacer(Modifier.width(12.dp))
                        Text(money(obligation.amount), fontWeight = FontWeight.Black, color = Ink)
                    }
                }
            }
        }

        if (data != null && data.byCategory.isNotEmpty()) {
            item { SectionTitle("Spending by category") }
            items(data.byCategory.take(8), key = { it.category }) { category ->
                SyncedCard {
                    Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                        Column {
                            Text(categoryLabel(category.category), fontWeight = FontWeight.Bold, color = Ink)
                            Text(money(category.amount), color = Muted, style = MaterialTheme.typography.bodySmall)
                        }
                        Text("${category.percentage}%", fontWeight = FontWeight.Black, color = Primary)
                    }
                    Spacer(Modifier.height(8.dp))
                    ProgressBar(category.percentage, if (category.percentage >= 35) Warning else Primary)
                }
            }
        }

        if (!trends.data.isNullOrEmpty()) {
            item {
                SectionTitle("Six-month pattern")
                Spacer(Modifier.height(8.dp))
                SyncedCard {
                    val maxValue = trends.data.orEmpty().fold(1.0) { acc, row -> max(acc, max(row.spend, row.income)) }
                    trends.data.orEmpty().forEachIndexed { index, row ->
                        TrendRow(row, maxValue)
                        if (index != trends.data.orEmpty().lastIndex) HorizontalDivider(Modifier.padding(vertical = 10.dp))
                    }
                    Spacer(Modifier.height(8.dp))
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        LegendDot(Primary)
                        Text(" Spend", color = Muted, style = MaterialTheme.typography.labelSmall)
                        Spacer(Modifier.width(14.dp))
                        LegendDot(Secondary)
                        Text(" Income", color = Muted, style = MaterialTheme.typography.labelSmall)
                    }
                }
            }
        }

        if (f != null) {
            item { SectionTitle("Forecast") }
            item {
                SyncedCard(containerColor = SecondarySoft) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Surface(shape = MaterialTheme.shapes.medium, color = Surface) {
                            Icon(Icons.Outlined.AutoGraph, null, tint = Secondary, modifier = Modifier.padding(11.dp))
                        }
                        Spacer(Modifier.width(12.dp))
                        Column(Modifier.weight(1f)) {
                            Text("Recent monthly averages", color = Muted, style = MaterialTheme.typography.labelMedium)
                            Text("Income ${money(f.avgMonthlyIncome)}", fontWeight = FontWeight.Bold, color = Ink)
                            Text("Spend ${money(f.avgMonthlySpend)}", color = Muted)
                        }
                    }
                    if (f.upcomingObligations > 0) {
                        Spacer(Modifier.height(12.dp))
                        Text("Runway reserves ${money(f.upcomingObligations)} for known near-term obligations.", color = Muted)
                    }
                    if (f.monthlySubscriptionCost > 0) {
                        Spacer(Modifier.height(8.dp))
                        Text("Recurring subscriptions add ${money(f.monthlySubscriptionCost)} per month.", color = Muted)
                    }
                }
            }
            items(f.projections, key = { it.month }) { projection ->
                SyncedCard {
                    Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
                        Column {
                            Text(projection.month, fontWeight = FontWeight.Bold, color = Ink)
                            Text("Projected balance", color = Muted, style = MaterialTheme.typography.bodySmall)
                        }
                        Text(money(projection.projectedBalance), fontWeight = FontWeight.Black, color = if (projection.projectedBalance > 0) Success else Error)
                    }
                    Spacer(Modifier.height(8.dp))
                    Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                        Text("Income ${money(projection.projectedIncome)}", color = Secondary, style = MaterialTheme.typography.bodySmall)
                        Text("Spend ${money(projection.projectedSpend)}", color = Muted, style = MaterialTheme.typography.bodySmall)
                    }
                }
            }
        }

        if (data != null && data.topMerchants.isNotEmpty()) {
            item { SectionTitle("Frequent spend destinations") }
            item {
                SyncedCard {
                    data.topMerchants.take(5).forEachIndexed { index, merchant ->
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Icon(Icons.Outlined.Storefront, null, tint = Primary)
                            Spacer(Modifier.width(10.dp))
                            Column(Modifier.weight(1f)) {
                                Text(merchant.merchant, fontWeight = FontWeight.SemiBold, color = Ink)
                                Text("${merchant.count} transaction${if (merchant.count == 1) "" else "s"}", color = Muted, style = MaterialTheme.typography.bodySmall)
                            }
                            Text(money(merchant.amount), fontWeight = FontWeight.Bold, color = Ink)
                        }
                        if (index != data.topMerchants.take(5).lastIndex) HorizontalDivider(Modifier.padding(vertical = 10.dp))
                    }
                }
            }
        }

        if (analytics.error != null && data == null) {
            item { EmptyState("Analysis is not ready", analytics.error ?: "Synced could not load your analysis yet.") }
        }
        item { Spacer(Modifier.height(8.dp)) }
    }
}

@Composable
private fun TrendRow(row: MonthlyTrend, maxValue: Double) {
    Column {
        Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
            Text(row.month, fontWeight = FontWeight.SemiBold, color = Ink, style = MaterialTheme.typography.bodySmall)
            Text("Net ${money(row.net)}", color = if (row.net >= 0) Success else Error, style = MaterialTheme.typography.bodySmall)
        }
        Spacer(Modifier.height(7.dp))
        Row(Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
            Text("Out", color = Muted, style = MaterialTheme.typography.labelSmall, modifier = Modifier.width(28.dp))
            MiniBar(if (maxValue > 0) (row.spend / maxValue).toFloat() else 0f, Primary, Modifier.weight(1f))
            Spacer(Modifier.width(8.dp))
            Text(money(row.spend), color = Muted, style = MaterialTheme.typography.labelSmall)
        }
        Spacer(Modifier.height(5.dp))
        Row(Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
            Text("In", color = Muted, style = MaterialTheme.typography.labelSmall, modifier = Modifier.width(28.dp))
            MiniBar(if (maxValue > 0) (row.income / maxValue).toFloat() else 0f, Secondary, Modifier.weight(1f))
            Spacer(Modifier.width(8.dp))
            Text(money(row.income), color = Muted, style = MaterialTheme.typography.labelSmall)
        }
    }
}

@Composable
private fun MiniBar(value: Float, color: androidx.compose.ui.graphics.Color, modifier: Modifier = Modifier) {
    Box(modifier.height(7.dp).clip(RoundedCornerShape(100.dp)).background(Border)) {
        Box(Modifier.fillMaxHeight().fillMaxWidth(value.coerceIn(0f, 1f)).background(color))
    }
}

@Composable
private fun LegendDot(color: androidx.compose.ui.graphics.Color) {
    Box(Modifier.size(8.dp).clip(RoundedCornerShape(100.dp)).background(color))
}
