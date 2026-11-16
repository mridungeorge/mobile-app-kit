import StoreKit

struct Entitlement: Codable, Equatable { var isPro: Bool; var expires: Date? }

protocol PurchaseService {
    func products(ids: [String]) async throws -> [Product]
    func purchase(_ product: Product) async throws -> Entitlement
    func restore() async throws -> Entitlement
    func currentEntitlement() async -> Entitlement
}

/// StoreKit 2 implementation. Verified transactions only; the last good result is cached
/// so the app still unlocks offline. Validate server-side before granting anything of value.
final class StoreKitPurchaseService: PurchaseService {
    private let cacheKey = "entitlement.cache"
    private let defaults: UserDefaults
    init(defaults: UserDefaults = .standard) { self.defaults = defaults }

    func products(ids: [String]) async throws -> [Product] { try await Product.products(for: ids) }

    func purchase(_ product: Product) async throws -> Entitlement {
        switch try await product.purchase() {
        case .success(let result):
            if case .verified(let tx) = result { await tx.finish() }
            return await refresh()
        default: return await currentEntitlement()
        }
    }

    func restore() async throws -> Entitlement { try await AppStore.sync(); return await refresh() }

    func currentEntitlement() async -> Entitlement {
        if let data = defaults.data(forKey: cacheKey), let cached = try? JSONDecoder().decode(Entitlement.self, from: data) { return cached }
        return await refresh()
    }

    private func refresh() async -> Entitlement {
        var best = Entitlement(isPro: false, expires: nil)
        for await result in Transaction.currentEntitlements {
            if case .verified(let tx) = result, tx.revocationDate == nil { best = Entitlement(isPro: true, expires: tx.expirationDate) }
        }
        if let data = try? JSONEncoder().encode(best) { defaults.set(data, forKey: cacheKey) }
        return best
    }
}
