# Production R8/ProGuard rules (starter). Keep/adjust for your SDKs.
# Kotlin serialization / reflection users: add required keeps.
# -keepattributes *Annotation*
# -keepclassmembers class **$$serializer { *; }

# Keep app models if using reflection-based JSON (prefer kotlinx.serialization/codegen).
# Example:
# -keep class com.example.app.data.model.** { *; }

# Remove debug logging in release (optional, verify impact)
# -assumenosideeffects class android.util.Log {
#   public static *** d(...);
#   public static *** v(...);
#   public static *** i(...);
# }

# Add SDK-specific rules (Firebase, Retrofit/OkHttp, Room, etc.) per their docs.
