package com.tukutuku.synced.ui.theme

import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Typography
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color

private val SyncedLightScheme = lightColorScheme(
    primary = Primary,
    onPrimary = Color.White,
    secondary = Secondary,
    onSecondary = Color.White,
    background = Canvas,
    onBackground = Ink,
    surface = Surface,
    onSurface = Ink,
    error = Error,
    outline = Border,
)

@Composable
fun SyncedTheme(content: @Composable () -> Unit) {
    MaterialTheme(
        colorScheme = SyncedLightScheme,
        typography = Typography(),
        content = content,
    )
}
