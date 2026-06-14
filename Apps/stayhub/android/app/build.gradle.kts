plugins {
    id("com.android.application")
    // ❌ REMOVED: id("org.jetbrains.kotlin.android")
    id("dev.flutter.flutter-gradle-plugin")
    id("com.google.gms.google-services")
}

android {
    namespace = "com.stayhub"
    compileSdk = flutter.compileSdkVersion
    ndkVersion = flutter.ndkVersion

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }

    tasks.withType<JavaCompile>().configureEach {
        options.compilerArgs.add("-Xlint:-deprecation")
    }

    defaultConfig {
        applicationId = "com.stayhub"
        minSdk = flutter.minSdkVersion
        targetSdk = flutter.targetSdkVersion
        versionCode = flutter.versionCode
        versionName = flutter.versionName
    }

    buildTypes {
        release {
            signingConfig = signingConfigs.getByName("debug")
        }
    }
}

// ❌ REMOVE the entire kotlin { } block too — Flutter manages this now
// kotlin {
//     compilerOptions {
//         jvmTarget.set(...)
//         languageVersion.set(...)
//     }
// }

kotlin {
    jvmToolchain(17)
}

flutter {
    source = "../.."
}