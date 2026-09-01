package com.tukutuku.synced.ui.theme

import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Shapes
import androidx.compose.material3.Typography
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp

private val SyncedLightScheme = lightColorScheme(
    primary = Primary,
    onPrimary = Color.White,
    primaryContainer = PrimarySoft,
    onPrimaryContainer = PrimaryDark,
    secondary = Secondary,
    onSecondary = Color.White,
    secondaryContainer = SecondarySoft,
    onSecondaryContainer = Ink,
    background = Canvas,
    onBackground = Ink,
    surface = Surface,
    surfaceVariant = SurfaceAlt,
    onSurface = Ink,
    onSurfaceVariant = Muted,
    error = Error,
    outline = Border,
    outlineVariant = Border,
)

private val SyncedShapes = Shapes(
    small = RoundedCornerShape(12.dp),
    medium = RoundedCornerShape(18.dp),
    large = RoundedCornerShape(26.dp),
    extraLarge = RoundedCornerShape(30.dp),
)

@Composable
fun SyncedTheme(content: @Composable () -> Unit) {
    MaterialTheme(
        colorScheme = SyncedLightScheme,
        typography = Typography(),
        shapes = SyncedShapes,
        content = content,
    )
}
