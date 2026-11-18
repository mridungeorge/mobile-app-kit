import XCTest
@testable import __PROJECT_NAME__

final class EntitlementCacheTests: XCTestCase {
    func testEntitlementRoundTripsThroughCache() throws {
        let defaults = UserDefaults(suiteName: "billing-test")!
        defaults.removePersistentDomain(forName: "billing-test")
        let value = Entitlement(isPro: true, expires: Date(timeIntervalSince1970: 2_000_000_000))
        defaults.set(try JSONEncoder().encode(value), forKey: "entitlement.cache")
        let decoded = try JSONDecoder().decode(Entitlement.self, from: defaults.data(forKey: "entitlement.cache")!)
        XCTAssertEqual(decoded, value)
    }
}
