import Foundation

/// One state shape for every screen: loading, empty, offline, error or content.
/// A screen that cannot represent empty and error is not finished.
enum UiState<Value> {
    case loading
    case empty
    case offline
    case error(String)
    case content(Value)
}

extension UiState: Equatable where Value: Equatable {}

extension UiState {
    var contentValue: Value? {
        if case .content(let value) = self { return value }
        return nil
    }

    var isFailure: Bool {
        switch self {
        case .offline, .error: true
        default: false
        }
    }
}
