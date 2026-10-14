//
//  ChannelService.swift
//  StreamPlayer
//
//  Created for iOS 17+ | Modern Async/Await Networking Service
//

import Foundation

/// Feltyper som kan uppstå vid nätverksanrop mot DaddyAPI
public enum ChannelServiceError: LocalizedError, Sendable {
    case invalidURL
    case invalidAPIKey
    case networkError(String)
    case invalidResponse(statusCode: Int)
    case decodingError(String)
    case emptyChannelList
    
    public var errorDescription: String? {
        switch self {
        case .invalidURL:
            return "Kunde inte skapa en giltig förfrågan för API-adressen."
        case .invalidAPIKey:
            return "API-nyckeln är ogiltig eller saknas. Vänligen ange din nyckel i inställningar."
        case .networkError(let details):
            return "Nätverksfel vid kontakt med kanalservern: \(details)"
        case .invalidResponse(let statusCode):
            return "Servern svarade med felkod \(statusCode)."
        case .decodingError(let details):
            return "Kunde inte tolka kanallistan från servern: \(details)"
        case .emptyChannelList:
            return "Servern returnerade inga kanaler för det valda anropet."
        }
    }
}

/// Protokoll för ChannelService för att underlätta Dependency Injection och enhetstester
public protocol ChannelServiceProtocol: Sendable {
    func fetchChannels(apiKey: String) async throws -> [Channel]
}

/// Ansvarar för nätverksanrop och JSON-avkodning mot DaddyAPI
public final class ChannelService: ChannelServiceProtocol, Sendable {
    
    // MARK: - Konfiguration
    
    /// Bas-URL för DaddyAPI
    private let baseURLString = "https://dlive.sx/daddyapi.php"
    
    /// URLSession med rimlig timeout och cachepolicy
    private let session: URLSession
    
    public init(session: URLSession = .shared) {
        self.session = session
    }
    
    // MARK: - API Metoder
    
    /// Hämtar kanallistan asynkront med modern async/await
    /// - Parameter apiKey: Din personliga API-nyckel till dlive / DaddyAPI
    /// - Returns: En array av avkodade `Channel`-objekt
    public func fetchChannels(apiKey: String) async throws -> [Channel] {
        let cleanedKey = apiKey.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !cleanedKey.isEmpty else {
            throw ChannelServiceError.invalidAPIKey
        }
        
        // Konstruera URL: https://dlive.sx/daddyapi.php?key=DIN_API_NYCKEL&endpoint=channels
        var components = URLComponents(string: baseURLString)
        components?.queryItems = [
            URLQueryItem(name: "key", value: cleanedKey),
            URLQueryItem(name: "endpoint", value: "channels")
        ]
        
        guard let url = components?.url else {
            throw ChannelServiceError.invalidURL
        }
        
        var request = URLRequest(url: url)
        request.httpMethod = "GET"
        request.timeoutInterval = 15.0
        
        // Sätt säkra headers för anropet
        request.setValue("application/json", forHTTPHeaderField: "Accept")
        request.setValue("https://dlive.sx/", forHTTPHeaderField: "Referer")
        request.setValue("https://dlive.sx", forHTTPHeaderField: "Origin")
        request.setValue("StreamPlayer-iOS/1.0", forHTTPHeaderField: "User-Agent")
        
        // Utför asynkront nätverksanrop
        let data: Data
        let response: URLResponse
        
        do {
            (data, response) = try await session.data(for: request)
        } catch {
            throw ChannelServiceError.networkError(error.localizedDescription)
        }
        
        // Validera HTTP-status
        guard let httpResponse = response as? HTTPURLResponse else {
            throw ChannelServiceError.networkError("Ogiltigt svar från servern.")
        }
        
        guard (200...299).contains(httpResponse.statusCode) else {
            throw ChannelServiceError.invalidResponse(statusCode: httpResponse.statusCode)
        }
        
        // Avkoda JSON med tolerans för olika rot-strukturer
        return try decodeChannels(from: data)
    }
    
    // MARK: - Hjälpmetod för parsing
    
    /// Tolkar data som antingen en direkt array eller ett wrapper-objekt { "channels": [...] }
    private func decodeChannels(from data: Data) throws -> [Channel] {
        let decoder = JSONDecoder()
        
        // Försök 1: Direkt array av kanaler [Channel]
        if let directList = try? decoder.decode([Channel].self, from: data) {
            guard !directList.isEmpty else {
                throw ChannelServiceError.emptyChannelList
            }
            return directList
        }
        
        // Försök 2: Wrapper med "channels" nyckel
        struct ChannelsWrapper: Decodable {
            let channels: [Channel]?
            let data: [Channel]?
            let result: [Channel]?
        }
        
        if let wrapper = try? decoder.decode(ChannelsWrapper.self, from: data) {
            let list = wrapper.channels ?? wrapper.data ?? wrapper.result ?? []
            guard !list.isEmpty else {
                throw ChannelServiceError.emptyChannelList
            }
            return list
        }
        
        // Försök 3: Key-Value dictionary där nycklar är ID:n { "1": { ... }, "2": { ... } }
        if let dict = try? decoder.decode([String: Channel].self, from: data) {
            let list = Array(dict.values)
            guard !list.isEmpty else {
                throw ChannelServiceError.emptyChannelList
            }
            return list.sorted { $0.id < $1.id }
        }
        
        // Om ingen avkodning lyckades, ge ett detaljerat felmeddelande
        let preview = String(data: data.prefix(200), encoding: .utf8) ?? "Binaer data"
        throw ChannelServiceError.decodingError("Serverns svar matchade inte formatet. Svar: \(preview)")
    }
}
