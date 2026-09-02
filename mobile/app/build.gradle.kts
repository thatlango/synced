plugins {
    alias(libs.plugins.android.application)
    alias(libs.plugins.kotlin.compose)
    alias(libs.plugins.kotlin.serialization)
    alias(libs.plugins.ksp)
    alias(libs.plugins.hilt)
}

android {
    namespace = "com.tukutuku.synced"
    compileSdk {
        version = release(37) { minorApiLevel = 1 }
    }

    defaultConfig {
        applicationId = "com.tukutuku.synced"
        minSdk = 26
        targetSdk = 36
        versionCode = 4
        versionName = "1.1.2"
        testInstrumentationRunner = "androidx.test.runner.AndroidJUnitRunner"
        buildConfigField("String", "SYNCED_API_BASE_URL", "\"https://api.synced.tukutuku.org/api/v1/\"")
        buildConfigField("String", "TUKU_CORE_API_BASE_URL", "\"https://core.tukutuku.org/api/v1/\"")
    }

    signingConfigs {
        create("release") {
            val path = System.getenv("SYNCED_ANDROID_KEYSTORE_FILE") ?: providers.gradleProperty("SYNCED_ANDROID_KEYSTORE_FILE").orNull
            val storePass = System.getenv("SYNCED_ANDROID_KEYSTORE_PASSWORD") ?: providers.gradleProperty("SYNCED_ANDROID_KEYSTORE_PASSWORD").orNull
            val alias = System.getenv("SYNCED_ANDROID_KEY_ALIAS") ?: providers.gradleProperty("SYNCED_ANDROID_KEY_ALIAS").orNull
            val keyPass = System.getenv("SYNCED_ANDROID_KEY_PASSWORD") ?: providers.gradleProperty("SYNCED_ANDROID_KEY_PASSWORD").orNull
            if (!path.isNullOrBlank()) storeFile = file(path)
            if (!storePass.isNullOrBlank()) storePassword = storePass
            if (!alias.isNullOrBlank()) keyAlias = alias
            if (!keyPass.isNullOrBlank()) keyPassword = keyPass
        }
    }

    buildTypes {
        debug { applicationIdSuffix = ".debug"; versionNameSuffix = "-debug" }
        release {
            val cfg = signingConfigs.getByName("release")
            val signingReady = cfg.storeFile != null && !cfg.storePassword.isNullOrBlank() && !cfg.keyAlias.isNullOrBlank() && !cfg.keyPassword.isNullOrBlank()
            val releaseRequested = gradle.startParameter.taskNames.any { it.contains("release", ignoreCase = true) || it.contains("bundle", ignoreCase = true) }
            if (releaseRequested && !signingReady) {
                throw GradleException("Synced release signing is not configured. Set the Synced Android signing environment variables.")
            }
            if (signingReady) signingConfig = cfg
            isMinifyEnabled = true
            isShrinkResources = true
            proguardFiles(getDefaultProguardFile("proguard-android-optimize.txt"), "proguard-rules.pro")
        }
    }
    compileOptions { sourceCompatibility = JavaVersion.VERSION_17; targetCompatibility = JavaVersion.VERSION_17 }
    buildFeatures { compose = true; buildConfig = true }
    packaging { resources.excludes += "/META-INF/{AL2.0,LGPL2.1}" }
}

dependencies {
    implementation(platform(libs.androidx.compose.bom))
    implementation(libs.androidx.core.ktx)
    implementation(libs.androidx.activity.compose)
    implementation(libs.androidx.lifecycle.runtime.ktx)
    implementation(libs.androidx.lifecycle.runtime.compose)
    implementation(libs.androidx.lifecycle.viewmodel.compose)
    implementation(libs.androidx.compose.ui)
    implementation(libs.androidx.compose.ui.graphics)
    implementation(libs.androidx.compose.ui.tooling.preview)
    implementation(libs.androidx.compose.material3)
    implementation(libs.androidx.compose.material.icons.extended)
    implementation(libs.androidx.navigation.compose)
    implementation(libs.androidx.hilt.navigation.compose)
    implementation(libs.androidx.hilt.work)
    ksp(libs.androidx.hilt.compiler)
    implementation(libs.hilt.android)
    ksp(libs.hilt.compiler)
    implementation(libs.retrofit)
    implementation(libs.retrofit.serialization)
    implementation(libs.okhttp)
    implementation(libs.okhttp.logging)
    implementation(libs.kotlinx.serialization.json)
    implementation(libs.kotlinx.coroutines.android)
    implementation(libs.androidx.datastore.preferences)
    implementation(libs.androidx.room.runtime)
    implementation(libs.androidx.room.ktx)
    ksp(libs.androidx.room.compiler)
    implementation(libs.androidx.work.runtime.ktx)
    implementation(libs.zxing.core)
    testImplementation(libs.junit)
    testImplementation(libs.mockk)
    testImplementation(libs.kotlinx.coroutines.test)
    debugImplementation(libs.androidx.compose.ui.tooling)
}
