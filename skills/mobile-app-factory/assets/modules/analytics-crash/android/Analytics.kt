package __PACKAGE__.data.analytics

interface Analytics {
    fun track(event: String, properties: Map<String, String> = emptyMap())
    fun recordError(error: Throwable)
}

object NoopAnalytics : Analytics {
    override fun track(event: String, properties: Map<String, String>) {}
    override fun recordError(error: Throwable) {}
}

/** Blocks everything until the user has consented. Wrap your vendor adapter in this. */
class ConsentGate(private val inner: Analytics, private val consent: () -> Boolean) : Analytics {
    override fun track(event: String, properties: Map<String, String>) { if (consent()) inner.track(event, properties) }
    override fun recordError(error: Throwable) { if (consent()) inner.recordError(error) }
}
