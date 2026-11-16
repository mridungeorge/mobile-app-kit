package __PACKAGE__.data.billing

import android.app.Activity
import android.content.Context
import com.android.billingclient.api.*
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow

data class Entitlement(val isPro: Boolean, val expiresAt: Long? = null)

interface PurchaseService {
    val entitlement: StateFlow<Entitlement>
    suspend fun products(ids: List<String>): List<ProductDetails>
    fun purchase(activity: Activity, product: ProductDetails, offerToken: String)
    suspend fun restore()
}

/** Play Billing 7. Acknowledge within 3 days; verify purchaseToken server-side before granting. */
class PlayPurchaseService(context: Context) : PurchaseService, PurchasesUpdatedListener {
    private val _entitlement = MutableStateFlow(Entitlement(false))
    override val entitlement: StateFlow<Entitlement> = _entitlement
    private val client = BillingClient.newBuilder(context)
        .setListener(this)
        .enablePendingPurchases(PendingPurchasesParams.newBuilder().enableOneTimeProducts().build())
        .build()

    private fun ready() {
        if (!client.isReady) client.startConnection(object : BillingClientStateListener {
            override fun onBillingSetupFinished(result: BillingResult) {}
            override fun onBillingServiceDisconnected() {}
        })
    }

    override suspend fun products(ids: List<String>): List<ProductDetails> {
        ready()
        val params = QueryProductDetailsParams.newBuilder().setProductList(ids.map {
            QueryProductDetailsParams.Product.newBuilder().setProductId(it).setProductType(BillingClient.ProductType.SUBS).build()
        }).build()
        return client.queryProductDetails(params).productDetailsList.orEmpty()
    }

    override fun purchase(activity: Activity, product: ProductDetails, offerToken: String) {
        val p = BillingFlowParams.ProductDetailsParams.newBuilder().setProductDetails(product).setOfferToken(offerToken).build()
        client.launchBillingFlow(activity, BillingFlowParams.newBuilder().setProductDetailsParamsList(listOf(p)).build())
    }

    override suspend fun restore() {
        ready()
        val result = client.queryPurchasesAsync(QueryPurchasesParams.newBuilder().setProductType(BillingClient.ProductType.SUBS).build())
        apply(result.purchasesList)
    }

    override fun onPurchasesUpdated(result: BillingResult, purchases: MutableList<Purchase>?) {
        if (result.responseCode == BillingClient.BillingResponseCode.OK) apply(purchases.orEmpty())
    }

    private fun apply(purchases: List<Purchase>) {
        val active = purchases.any { it.purchaseState == Purchase.PurchaseState.PURCHASED }
        _entitlement.value = Entitlement(active)
        purchases.filter { !it.isAcknowledged && it.purchaseState == Purchase.PurchaseState.PURCHASED }.forEach {
            client.acknowledgePurchase(AcknowledgePurchaseParams.newBuilder().setPurchaseToken(it.purchaseToken).build()) {}
        }
    }
}
