import XCTest
@testable import HabitTracker

/// The state machine every screen shares. Loading, empty, offline and error are the four
/// states a store reviewer checks, so they are covered once here instead of per screen.
final class UiStateTests: XCTestCase {
    func testContentValueOnlyForContent() {
        XCTAssertEqual(UiState<Int>.content(3).contentValue, 3)
        XCTAssertNil(UiState<Int>.loading.contentValue)
        XCTAssertNil(UiState<Int>.empty.contentValue)
        XCTAssertNil(UiState<Int>.offline.contentValue)
        XCTAssertNil(UiState<Int>.error("boom").contentValue)
    }

    func testFailureFlags() {
        XCTAssertFalse(UiState<Int>.loading.isFailure)
        XCTAssertFalse(UiState<Int>.empty.isFailure)
        XCTAssertFalse(UiState<Int>.content(1).isFailure)
        XCTAssertTrue(UiState<Int>.offline.isFailure)
        XCTAssertTrue(UiState<Int>.error("boom").isFailure)
    }

    func testErrorKeepsTheMessageTheScreenShows() {
        guard case .error(let message) = UiState<Int>.error("Could not load") else {
            return XCTFail("expected an error state")
        }
        XCTAssertEqual(message, "Could not load")
    }
}
