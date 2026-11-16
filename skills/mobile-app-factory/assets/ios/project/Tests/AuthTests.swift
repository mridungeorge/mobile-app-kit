import XCTest
@testable import __PROJECT_NAME__

final class AuthTests: XCTestCase {
    func testEmailProviderAcceptsAValidPair() async throws {
        let session = try await EmailAuthProvider().signIn(email: "user@example.com", password: "correct horse")
        XCTAssertEqual(session.provider, .email)
        XCTAssertEqual(session.email, "user@example.com")
    }

    func testEmailProviderTrimsSurroundingSpace() async throws {
        let session = try await EmailAuthProvider().signIn(email: "  user@example.com ", password: "correct horse")
        XCTAssertEqual(session.email, "user@example.com")
    }

    func testEmailProviderRejectsAMalformedAddress() async {
        do {
            _ = try await EmailAuthProvider().signIn(email: "nope", password: "correct horse")
            XCTFail("expected invalidEmail")
        } catch AuthError.invalidEmail {
            // expected
        } catch {
            XCTFail("unexpected error \(error)")
        }
    }

    func testEmailProviderRejectsAShortPassword() async {
        do {
            _ = try await EmailAuthProvider().signIn(email: "user@example.com", password: "short")
            XCTFail("expected weakPassword")
        } catch AuthError.weakPassword {
            // expected
        } catch {
            XCTFail("unexpected error \(error)")
        }
    }

    /// The Apple and Google stubs must fail loudly until a developer wires the real flow.
    /// A starter that returns success here would ship a fake sign-in to the store.
    func testAppleProviderRefusesUntilWired() async {
        do {
            _ = try await AppleAuthProvider().signIn(email: "user@example.com", password: "correct horse")
            XCTFail("the Apple stub must not succeed")
        } catch AuthError.needsCapability {
            // expected
        } catch {
            XCTFail("unexpected error \(error)")
        }
    }

    @MainActor
    func testServiceSurfacesAFailedSignInAsAnError() async {
        let service = AuthService(api: MockAPIClient())
        await service.signIn(provider: .apple, email: "user@example.com", password: "correct horse")
        XCTAssertNil(service.session)
        XCTAssertNotNil(service.lastError)
    }

    @MainActor
    func testServiceKeepsTheSessionOnSuccess() async {
        let service = AuthService(api: MockAPIClient())
        await service.signIn(provider: .email, email: "user@example.com", password: "correct horse")
        XCTAssertEqual(service.session?.provider, .email)
        service.signOut()
        XCTAssertNil(service.session)
    }
}
