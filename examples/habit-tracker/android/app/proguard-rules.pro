# Keep rules for release builds (R8).
# Add rules for reflection-based SDKs and serializers you actually ship.
# Documentation: https://developer.android.com/build/shrink-code

# Kotlin metadata used by reflection-based libraries.
-keepattributes *Annotation*, InnerClasses, Signature

# Keep line numbers for readable crash reports, hide the original source file.
-keepattributes SourceFile,LineNumberTable
-renamesourcefileattribute SourceFile

# Strip verbose Android logging in release.
-assumenosideeffects class android.util.Log {
    public static *** d(...);
    public static *** v(...);
}
