package com.tukutuku.synced.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import com.tukutuku.synced.ui.theme.*
import java.text.NumberFormat
import java.util.Locale

fun money(v: Double, currency: String = "UGX"): String {
    val formatter = NumberFormat.getNumberInstance(Locale.US).apply {
        minimumFractionDigits = 0
        maximumFractionDigits = if (currency.equals("UGX", ignoreCase = true)) 0 else 2
    }
    return "$currency ${formatter.format(v)}"
}

fun categoryLabel(value: String?): String = when (value) {
    "school_fees" -> "School fees"
    "mobile_data" -> "Airtime & data"
    "bill_payment" -> "Bill payments"
    "healthcare" -> "Health"
    null, "" -> "Other"
    else -> value.replace('_', ' ').replaceFirstChar { it.uppercase() }
}

@Composable
fun SyncedCard(
    modifier: Modifier = Modifier,
    containerColor: Color = Surface,
    content: @Composable ColumnScope.() -> Unit,
) {
    Card(
        modifier = modifier,
        shape = MaterialTheme.shapes.large,
        colors = CardDefaults.cardColors(containerColor = containerColor),
        border = CardDefaults.outlinedCardBorder(enabled = true),
        elevation = CardDefaults.cardElevation(defaultElevation = 0.dp),
    ) {
        Column(Modifier.padding(18.dp), content = content)
    }
}

@Composable
fun SectionTitle(title: String, action: String? = null, onAction: (() -> Unit)? = null) {
    Row(
        Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically,
    ) {
        Text(title, style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold, color = Ink)
        if (action != null && onAction != null) TextButton(onClick = onAction) { Text(action) }
    }
}

@Composable
fun ProgressBar(value: Int, color: Color = Primary) {
    val f = value.coerceIn(0, 100) / 100f
    Box(
        Modifier
            .fillMaxWidth()
            .height(8.dp)
            .clip(RoundedCornerShape(100.dp))
            .background(Border),
    ) {
        Box(Modifier.fillMaxHeight().fillMaxWidth(f).background(color))
    }
}

@Composable
fun EmptyState(
    title: String,
    body: String,
    action: String? = null,
    onAction: (() -> Unit)? = null,
) {
    SyncedCard(containerColor = SurfaceAlt) {
        Column(
            Modifier.fillMaxWidth().padding(vertical = 14.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
        ) {
            Surface(shape = RoundedCornerShape(100.dp), color = PrimarySoft) {
                Text("✦", color = Primary, modifier = Modifier.padding(horizontal = 14.dp, vertical = 8.dp))
            }
            Spacer(Modifier.height(14.dp))
            Text(title, fontWeight = FontWeight.Bold, color = Ink, textAlign = TextAlign.Center)
            Spacer(Modifier.height(6.dp))
            Text(
                body,
                color = Muted,
                style = MaterialTheme.typography.bodyMedium,
                textAlign = TextAlign.Center,
            )
            if (action != null && onAction != null) {
                Spacer(Modifier.height(16.dp))
                Button(onClick = onAction) { Text(action) }
            }
        }
    }
}

@Composable
fun InsightCard(text: String, action: String? = null, onAction: (() -> Unit)? = null) {
    Card(
        shape = MaterialTheme.shapes.large,
        colors = CardDefaults.cardColors(containerColor = PrimarySoft),
    ) {
        Row(Modifier.fillMaxWidth().padding(18.dp), verticalAlignment = Alignment.Top) {
            Surface(shape = RoundedCornerShape(100.dp), color = Surface) {
                Text("✦", color = Primary, fontWeight = FontWeight.Black, modifier = Modifier.padding(9.dp))
            }
            Spacer(Modifier.width(12.dp))
            Column(Modifier.weight(1f)) {
                Text("Synced recommendation", fontWeight = FontWeight.Bold, color = Ink)
                Spacer(Modifier.height(3.dp))
                Text(text, color = Muted, style = MaterialTheme.typography.bodyMedium)
                if (action != null && onAction != null) {
                    TextButton(onClick = onAction, contentPadding = PaddingValues(0.dp)) { Text(action) }
                }
            }
        }
    }
}

@Composable
fun MetricCard(
    label: String,
    value: String,
    supporting: String? = null,
    modifier: Modifier = Modifier,
) {
    SyncedCard(modifier = modifier) {
        Text(label, color = Muted, style = MaterialTheme.typography.labelMedium)
        Spacer(Modifier.height(6.dp))
        Text(value, color = Ink, style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Black)
        supporting?.let {
            Spacer(Modifier.height(4.dp))
            Text(it, color = Muted, style = MaterialTheme.typography.bodySmall)
        }
    }
}

@Composable
fun StatusPill(text: String, tone: String = "neutral") {
    val bg = when (tone) {
        "success" -> SuccessSoft
        "warning" -> WarningSoft
        "error" -> ErrorSoft
        "primary" -> PrimarySoft
        else -> SurfaceAlt
    }
    val fg = when (tone) {
        "success" -> Success
        "warning" -> Warning
        "error" -> Error
        "primary" -> Primary
        else -> Muted
    }
    Surface(shape = RoundedCornerShape(100.dp), color = bg) {
        Text(
            text,
            color = fg,
            style = MaterialTheme.typography.labelMedium,
            fontWeight = FontWeight.SemiBold,
            modifier = Modifier.padding(horizontal = 10.dp, vertical = 6.dp),
        )
    }
}
