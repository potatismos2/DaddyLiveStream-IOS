//
//  ChannelListViewModel.swift
//  StreamPlayer
//
//  Created for iOS 17+ | Modern Observation Framework (@Observable)
//

import Foundation
import SwiftUI
import Observation

/// ViewModel för hantering av kanalvisning, sökning, kategorifiltrering och favoriter.
/// Använder Swift iOS 17 Observation-arkitektur (`@Observable`) på `@MainActor`.
@Observable
@MainActor
public final class ChannelListViewModel {
    
    // MARK: - Dependencies
    private let channelService: ChannelServiceProtocol
    
    // MARK: - State Properties
    
    /// Alla hämtade kanaler från API:et
    public private(set) var channels: [Channel] = []
    
    /// Text från sökfältet i UI
    public var searchText: String = ""
    
    /// Vald kategori för filtrering (nil innebär alla kategorier)
    public var selectedCategory: String? = nil
    
    /// Visar om en hämtning pågår (för laddningsindikator och pull-to-refresh)
    public private(set) var isLoading: Bool = false
    
    /// Eventuellt felmeddelande att presentera i användargränssnittet
    public var errorMessage: String? = nil
    
    /// API-nyckel för DaddyAPI (sparad i UserDefaults)
    public var apiKey: String {
        didSet {
            UserDefaults.standard.set(apiKey, forKey: "daddyapi_key")
        }
    }
    
    /// Sparade favorit-kanaler (IDs sparade i UserDefaults)
    public private(set) var favoriteIDs: Set<String> = []
    
    /// Filterflagga för att endast visa favoriter
    public var showOnlyFavorites: Bool = false
    
    // MARK: - Beräknade Egenskaper
    
    /// Unika kategorier extraherade från den aktuella kanallistan
    public var availableCategories: [String] {
        let set = Set(channels.map { $0.category })
        return ["Alla"] + Array(set).sorted()
    }
    
    /// Filtrerad lista av kanaler baserat på söksträng, kategori och eventuell favoritfiltrering
    public var filteredChannels: [Channel] {
        channels.filter { channel in
            // Favorit-filter
            if showOnlyFavorites && !favoriteIDs.contains(channel.id) {
                return false
            }
            
            // Kategori-filter
            if let selected = selectedCategory, selected != "Alla" {
                if channel.category.caseInsensitiveCompare(selected) != .orderedSame {
                    return false
                }
            }
            
            // Sökfilter
            let trimmedSearch = searchText.trimmingCharacters(in: .whitespaces)
            if trimmedSearch.isEmpty {
                return true
            }
            
            let matchesName = channel.name.localizedCaseInsensitiveContains(trimmedSearch)
            let matchesCategory = channel.category.localizedCaseInsensitiveContains(trimmedSearch)
            let matchesID = channel.id.localizedCaseInsensitiveContains(trimmedSearch)
            
            return matchesName || matchesCategory || matchesID
        }
    }
    
    // MARK: - Initialisering
    
    public init(channelService: ChannelServiceProtocol = ChannelService()) {
        self.channelService = channelService
        
        // Läs in sparad API-nyckel eller använd standard platshållare
        let savedKey = UserDefaults.standard.string(forKey: "daddyapi_key") ?? ""
        self.apiKey = savedKey
        
        // Läs in sparade favoriter
        if let savedFavorites = UserDefaults.standard.array(forKey: "favorite_channel_ids") as? [String] {
            self.favoriteIDs = Set(savedFavorites)
        }
    }
    
    // MARK: - Publika Åtgärder
    
    /// Hämtar kanaler från API:et
    public func fetchChannels() async {
        guard !apiKey.trimmingCharacters(in: .whitespaces).isEmpty else {
            self.errorMessage = "Ingen API-nyckel konfigurerad. Klicka på kugghjulet för att ange din nyckel."
            return
        }
        
        isLoading = true
        errorMessage = nil
        
        do {
            let loaded = try await channelService.fetchChannels(apiKey: apiKey)
            self.channels = loaded
            self.isLoading = false
        } catch let error as ChannelServiceError {
            self.errorMessage = error.localizedDescription
            self.isLoading = false
        } catch {
            self.errorMessage = "Ett oväntat fel inträffade: \(error.localizedDescription)"
            self.isLoading = false
        }
    }
    
    /// Laddar om listan (anropas vid pull-to-refresh)
    public func refresh() async {
        await fetchChannels()
    }
    
    /// Växlar favoritstatus för en specifik kanal
    public func toggleFavorite(for channel: Channel) {
        if favoriteIDs.contains(channel.id) {
            favoriteIDs.remove(channel.id)
        } else {
            favoriteIDs.insert(channel.id)
        }
        UserDefaults.standard.set(Array(favoriteIDs), forKey: "favorite_channel_ids")
    }
    
    /// Kontrollerar om en kanal är markerad som favorit
    public func isFavorite(channel: Channel) -> Bool {
        favoriteIDs.contains(channel.id)
    }
    
    /// Laddar mock/demodata för utveckling och snabbtester i Xcode Preview
    public func loadPreviewData() {
        self.channels = [
            Channel(id: "101", name: "Viaplay Sport 1 HD", category: "Sport", logoURL: URL(string: "https://dlive.sx/logos/viaplay1.png")),
            Channel(id: "102", name: "Viaplay Sport 2 HD", category: "Sport", logoURL: URL(string: "https://dlive.sx/logos/viaplay2.png")),
            Channel(id: "103", name: "SVT 1 HD", category: "Allmänt", logoURL: URL(string: "https://dlive.sx/logos/svt1.png")),
            Channel(id: "104", name: "SVT 2 HD", category: "Allmänt", logoURL: URL(string: "https://dlive.sx/logos/svt2.png")),
            Channel(id: "105", name: "TV4 Direkt", category: "Underhållning", logoURL: URL(string: "https://dlive.sx/logos/tv4.png")),
            Channel(id: "106", name: "Eurosport 1", category: "Sport", logoURL: URL(string: "https://dlive.sx/logos/eurosport.png")),
            Channel(id: "107", name: "Sky Sports Premier League", category: "Sport", logoURL: nil),
            Channel(id: "108", name: "CNN International", category: "Nyheter", logoURL: nil),
            Channel(id: "109", name: "BBC News HD", category: "Nyheter", logoURL: nil),
            Channel(id: "110", name: "Discovery Channel", category: "Dokumentär", logoURL: nil)
        ]
    }
}
