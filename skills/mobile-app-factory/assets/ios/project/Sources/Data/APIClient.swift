import Foundation

/// One network boundary. `LiveAPIClient` is the shape a real backend slots into;
/// `MockAPIClient` keeps the starter runnable with no key and no server.
protocol APIClient: Sendable {
    func habits() async throws -> [HabitPayload]
    func deleteAccount() async throws
}

struct HabitPayload: Codable, Sendable, Equatable {
    let id: String
    let title: String
    let streak: Int
}

enum APIError: LocalizedError {
    case offline
    case server(status: Int)
    case decoding

    var errorDescription: String? {
        switch self {
        case .offline: "You're offline. Your saved habits are still here."
        case .server(let status): "The server returned \(status)."
        case .decoding: "The server sent something unexpected."
        }
    }
}

/// Deterministic stand-in: same values every launch, no network, no secret.
struct MockAPIClient: APIClient {
    func habits() async throws -> [HabitPayload] {
        try await Task.sleep(for: .milliseconds(180))
        return [
            HabitPayload(id: "1", title: "Morning walk", streak: 12),
            HabitPayload(id: "2", title: "Read 20 pages", streak: 4),
            HabitPayload(id: "3", title: "No phone after 22:00", streak: 1)
        ]
    }

    func deleteAccount() async throws {
        try await Task.sleep(for: .milliseconds(120))
    }
}

/// URLSession client. `token` is injected by the auth service so the client never
/// reads Keychain or UserDefaults itself.
struct LiveAPIClient: APIClient {
    let baseURL: URL
    var session: URLSession = .shared
    var token: @Sendable () -> String? = { nil }

    func habits() async throws -> [HabitPayload] {
        try await get("habits")
    }

    func deleteAccount() async throws {
        var request = URLRequest(url: baseURL.appendingPathComponent("account"))
        request.httpMethod = "DELETE"
        if let token = token() {
            request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        }
        let (_, response) = try await send(request)
        try validate(response)
    }

    private func get<T: Decodable>(_ path: String) async throws -> T {
        var request = URLRequest(url: baseURL.appendingPathComponent(path))
        request.setValue("application/json", forHTTPHeaderField: "Accept")
        if let token = token() {
            request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        }
        let (data, response) = try await send(request)
        try validate(response)
        do {
            return try JSONDecoder().decode(T.self, from: data)
        } catch {
            throw APIError.decoding
        }
    }

    private func send(_ request: URLRequest) async throws -> (Data, URLResponse) {
        do {
            return try await session.data(for: request)
        } catch let error as URLError where error.code == .notConnectedToInternet {
            throw APIError.offline
        }
    }

    private func validate(_ response: URLResponse) throws {
        guard let http = response as? HTTPURLResponse else { return }
        guard (200..<300).contains(http.statusCode) else {
            throw APIError.server(status: http.statusCode)
        }
    }
}
