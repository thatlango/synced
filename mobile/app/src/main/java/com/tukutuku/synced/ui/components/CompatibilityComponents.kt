package com.tukutuku.synced.ui.components

import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.tukutuku.synced.ui.theme.*
import java.time.LocalDate
import java.time.format.DateTimeFormatter
import java.time.format.DateTimeParseException

fun categoryLabel(value: String?): String = when (value) {
    "school_fees" -> "School fees"
    "mobile_data" -> "Airtime & data"
    "bill_payment" -> "Bill payments"
    "healthcare" -> "Health"
    null, "" -> "Other"
    else -> value.replace('_', ' ').replaceFirstChar { it.uppercase() }
}

fun shortDate(value: String?): String {
    if (value.isNullOrBlank()) return "—"
    val normalized = value.take(10)
    return try {
        LocalDate.parse(normalized).format(DateTimeFormatter.ofPattern("d MMM"))
    } catch (_: DateTimeParseException) {
        normalized
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
    val background = when (tone) {
        "success" -> SuccessSoft
        "warning" -> WarningSoft
        "error" -> ErrorSoft
        "primary" -> PrimarySoft
        else -> SurfaceSoft
    }
    val foreground = when (tone) {
        "success" -> Success
        "warning" -> Warning
        "error" -> Error
        "primary" -> Primary
        else -> Muted
    }
    Surface(shape = RoundedCornerShape(100.dp), color = background) {
        Text(
            text = text,
            color = foreground,
            style = MaterialTheme.typography.labelMedium,
            fontWeight = FontWeight.SemiBold,
            modifier = Modifier.padding(horizontal = 10.dp, vertical = 6.dp),
        )
    }
}
