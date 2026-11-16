// Top-level build file. Plugin versions come from gradle/libs.versions.toml.
// Kotlin itself is built into AGP 9 — there is no kotlin-android plugin to apply.
plugins {
    alias(libs.plugins.android.application) apply false
    alias(libs.plugins.kotlin.compose) apply false
    alias(libs.plugins.ksp) apply false
    alias(libs.plugins.hilt) apply false
}
