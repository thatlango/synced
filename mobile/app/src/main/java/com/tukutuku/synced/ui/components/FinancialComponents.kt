package com.tukutuku.synced.ui.components

import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.AutoAwesome
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import com.tukutuku.synced.ui.theme.*
import java.text.NumberFormat
import java.util.Locale

fun money(v: Double, currency: String = "UGX"): String =
    "$currency ${NumberFormat.getNumberInstance(Locale.US).format(v)}"

@Composable
fun SyncedCard(
    modifier: Modifier = Modifier,
    containerColor: Color = Surface,
    contentPadding: PaddingValues = PaddingValues(18.dp),
    content: @Composable ColumnScope.() -> Unit,
) {
    Card(
        modifier = modifier,
        shape = RoundedCornerShape(24.dp),
        colors = CardDefaults.cardColors(containerColor = containerColor),
        elevation = CardDefaults.cardElevation(defaultElevation = 1.dp),
    ) {
        Column(Modifier.padding(contentPadding), content = content)
    }
}

@Composable
fun GradientCard(
    modifier: Modifier = Modifier,
    content: @Composable ColumnScope.() -> Unit,
) {
    val shape = RoundedCornerShape(28.dp)
    Box(
        modifier = modifier
            .shadow(12.dp, shape, ambientColor = Primary.copy(alpha = .15f), spotColor = Primary.copy(alpha = .18f))
            .clip(shape)
            .background(
                Brush.linearGradient(
                    colors = listOf(PrimaryDeep, Primary, PrimaryBright),
                ),
            ),
    ) {
        Column(Modifier.padding(22.dp), content = content)
    }
}

@Composable
fun SectionTitle(
    title: String,
    action: String? = null,
    onAction: (() -> Unit)? = null,
) {
    Row(
        Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically,
    ) {
        Text(
            title,
            style = MaterialTheme.typography.titleLarge,
            fontWeight = FontWeight.Bold,
            color = Ink,
        )
        if (action != null && onAction != null) {
            TextButton(onClick = onAction, contentPadding = PaddingValues(horizontal = 8.dp, vertical = 4.dp)) {
                Text(action, color = Primary)
            }
        }
    }
}

@Composable
fun ProgressBar(
    value: Int,
    color: Color = Primary,
    trackColor: Color = SurfaceSoft,
) {
    val fraction = value.coerceIn(0, 100) / 100f
    Box(
        Modifier
            .fillMaxWidth()
            .height(8.dp)
            .clip(RoundedCornerShape(100.dp))
            .background(trackColor),
    ) {
        Box(
            Modifier
                .fillMaxHeight()
                .fillMaxWidth(fraction)
                .background(color),
        )
    }
}

@Composable
fun EmptyState(
    title: String,
    body: String,
    action: String? = null,
    onAction: (() -> Unit)? = null,
) {
    SyncedCard(containerColor = Surface) {
        Column(
            Modifier.fillMaxWidth().padding(vertical = 8.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
        ) {
            Surface(shape = CircleShape, color = PrimarySoft) {
                Icon(
                    Icons.Outlined.AutoAwesome,
                    contentDescription = null,
                    tint = Primary,
                    modifier = Modifier.padding(12.dp),
                )
            }
            Spacer(Modifier.height(14.dp))
            Text(title, fontWeight = FontWeight.Bold, color = Ink, style = MaterialTheme.typography.titleMedium)
            Spacer(Modifier.height(6.dp))
            Text(
                body,
                color = Muted,
                style = MaterialTheme.typography.bodyMedium,
                textAlign = TextAlign.Center,
            )
            if (action != null && onAction != null) {
                Spacer(Modifier.height(14.dp))
                Button(onClick = onAction) { Text(action) }
            }
        }
    }
}

@Composable
fun InsightCard(text: String) {
    Surface(
        shape = RoundedCornerShape(24.dp),
        color = PrimarySoft,
    ) {
        Row(
            Modifier.fillMaxWidth().padding(17.dp),
            verticalAlignment = Alignment.Top,
        ) {
            Surface(shape = CircleShape, color = Color.White.copy(alpha = .9f)) {
                Icon(
                    Icons.Outlined.AutoAwesome,
                    contentDescription = null,
                    tint = Primary,
                    modifier = Modifier.padding(9.dp).size(18.dp),
                )
            }
            Spacer(Modifier.width(12.dp))
            Column {
                Text("Synced insight", fontWeight = FontWeight.Bold, color = Ink)
                Spacer(Modifier.height(3.dp))
                Text(text, color = Muted, style = MaterialTheme.typography.bodyMedium)
            }
        }
    }
}

@Composable
fun RingChart(
    segments: List<Pair<Int, Color>>,
    centerTop: String,
    centerBottom: String,
    modifier: Modifier = Modifier,
) {
    Box(modifier = modifier, contentAlignment = Alignment.Center) {
        Canvas(Modifier.fillMaxSize()) {
            val strokeWidth = 14.dp.toPx()
            if (segments.isEmpty() || segments.sumOf { it.first }.coerceAtLeast(0) == 0) {
                drawArc(
                    color = Border,
                    startAngle = -90f,
                    sweepAngle = 360f,
                    useCenter = false,
                    style = Stroke(width = strokeWidth, cap = StrokeCap.Round),
                )
            } else {
                val total = segments.sumOf { it.first }.toFloat().coerceAtLeast(1f)
                var start = -90f
                segments.forEach { (value, color) ->
                    val sweep = value.coerceAtLeast(0) / total * 360f
                    if (sweep > 1f) {
                        drawArc(
                            color = color,
                            startAngle = start,
                            sweepAngle = (sweep - 4f).coerceAtLeast(1f),
                            useCenter = false,
                            style = Stroke(width = strokeWidth, cap = StrokeCap.Round),
                        )
                    }
                    start += sweep
                }
            }
        }
        Column(horizontalAlignment = Alignment.CenterHorizontally) {
            Text(centerTop, fontWeight = FontWeight.Black, color = Ink, style = MaterialTheme.typography.titleLarge)
            Text(centerBottom, color = Muted, style = MaterialTheme.typography.labelSmall)
        }
    }
}

@Composable
fun MetricPill(
    label: String,
    value: String,
    modifier: Modifier = Modifier,
) {
    Surface(
        modifier = modifier,
        color = Color.White.copy(alpha = .13f),
        shape = RoundedCornerShape(18.dp),
    ) {
        Column(Modifier.padding(horizontal = 13.dp, vertical = 10.dp)) {
            Text(label, color = Color.White.copy(alpha = .68f), style = MaterialTheme.typography.labelSmall)
            Spacer(Modifier.height(2.dp))
            Text(value, color = Color.White, fontWeight = FontWeight.SemiBold, style = MaterialTheme.typography.bodyMedium)
        }
    }
}
