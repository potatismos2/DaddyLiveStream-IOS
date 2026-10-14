export interface SwiftFileItem {
  id: string;
  name: string;
  folder: string;
  path: string;
  language: string;
  description: string;
  badge: string;
  content: string;
}

export const SWIFT_FILES: SwiftFileItem[] = [
  {
    id: "channel-model",
    name: "Channel.swift",
    folder: "Models",
    path: "StreamPlayer/Models/Channel.swift",
    language: "swift",
    description: "Datamodell för IPTV-kanaler med flexibel JSON-avkodning som hanterar variationer i DaddyAPI-fält samt automatisk konstruktion av streamURL.",
    badge: "Model (Codable)",
    content: `//
//  Channel.swift
//  StreamPlayer
//
//  Created for iOS 17+ | SwiftUI & WKWebView IPTV Architecture
//

import Foundation

/// Datamodell för en IPTV/Live Stream-kanal.
/// Implementerar Identifiable, Codable och Hashable med flexibel avkodning
/// för att hantera skillnader i externa API-strukturer (t.ex. sträng vs heltal för ID).
public struct Channel: Identifiable, Codable, Hashable, Sendable {
    
    // MARK: - Properties
    
    /// Unikt kanal-ID (t.ex. "101" eller 101)
    public let id: String
    
    /// Kanalens namn (t.ex. "Viaplay Sport 1", "SVT 1 HD")
    public let name: String
    
    /// Kategori eller genre (t.ex. "Sport", "Underhållning", "Nyheter")
    public let category: String
    
    /// URL till kanalens logotyp (valfri)
    public let logoURL: URL?
    
    /// Konstruerad stream-URL baserad på DaddyAPI / dlive-mönstret:
    /// https://dlive.sx/stream/stream-{channel_id}.php
    public var streamURL: URL {
        let urlString = "https://dlive.sx/stream/stream-\\(id).php"
        return URL(string: urlString) ?? URL(string: "https://dlive.sx")!
    }
    
    // MARK: - CodingKeys & Flexibel JSON-avkodning
    
    enum CodingKeys: String, CodingKey {
        case id
        case channelId = "channel_id"
        case name
        case channelName = "channel_name"
        case category
        case group
        case logo
        case image
        case icon = "stream_icon"
    }
    
    public init(id: String, name: String, category: String = "Övrigt", logoURL: URL? = nil) {
        self.id = id
        self.name = name
        self.category = category
        self.logoURL = logoURL
    }
    
    public init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        
        // 1. Avkoda ID (hanterar både "id" och "channel_id", samt Int och String)
        if let stringID = try? container.decode(String.self, forKey: .id) {
            self.id = stringID
        } else if let intID = try? container.decode(Int.self, forKey: .id) {
            self.id = String(intID)
        } else if let stringChannelID = try? container.decode(String.self, forKey: .channelId) {
            self.id = stringChannelID
        } else if let intChannelID = try? container.decode(Int.self, forKey: .channelId) {
            self.id = String(intChannelID)
        } else {
            self.id = UUID().uuidString
        }
        
        // 2. Avkoda Kanalnamn (hanterar "name" eller "channel_name")
        if let rawName = try? container.decode(String.self, forKey: .name), !rawName.trimmingCharacters(in: .whitespaces).isEmpty {
            self.name = rawName.trimmingCharacters(in: .whitespaces)
        } else if let rawChannelName = try? container.decode(String.self, forKey: .channelName), !rawChannelName.trimmingCharacters(in: .whitespaces).isEmpty {
            self.name = rawChannelName.trimmingCharacters(in: .whitespaces)
        } else {
            self.name = "Kanal \\(self.id)"
        }
        
        // 3. Avkoda Kategori (hanterar "category" eller "group")
        if let rawCategory = try? container.decode(String.self, forKey: .category), !rawCategory.isEmpty {
            self.category = rawCategory.trimmingCharacters(in: .whitespaces)
        } else if let rawGroup = try? container.decode(String.self, forKey: .group), !rawGroup.isEmpty {
            self.category = rawGroup.trimmingCharacters(in: .whitespaces)
        } else {
            self.category = "Allmänt"
        }
        
        // 4. Avkoda Logotyp URL (hanterar "logo", "image" eller "stream_icon")
        var parsedURL: URL? = nil
        if let logoString = try? container.decode(String.self, forKey: .logo), let url = URL(string: logoString) {
            parsedURL = url
        } else if let imageString = try? container.decode(String.self, forKey: .image), let url = URL(string: imageString) {
            parsedURL = url
        } else if let iconString = try? container.decode(String.self, forKey: .icon), let url = URL(string: iconString) {
            parsedURL = url
        }
        self.logoURL = parsedURL
    }
    
    public func encode(to encoder: Encoder) throws {
        var container = encoder.container(keyedBy: CodingKeys.self)
        try container.encode(id, forKey: .id)
        try container.encode(name, forKey: .name)
        try container.encode(category, forKey: .category)
        try container.encodeIfPresent(logoURL?.absoluteString, forKey: .logo)
    }
}`
  },
  {
    id: "channel-service",
    name: "ChannelService.swift",
    folder: "Services",
    path: "StreamPlayer/Services/ChannelService.swift",
    language: "swift",
    description: "Nätverkslager med async/await och URLSession som hämtar och avkodar kanallistan från DaddyAPI med custom referer headers och feltolerans.",
    badge: "Service (Async/Await)",
    content: `//
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
            return "Nätverksfel vid kontakt med kanalservern: \\(details)"
        case .invalidResponse(let statusCode):
            return "Servern svarade med felkod \\(statusCode)."
        case .decodingError(let details):
            return "Kunde inte tolka kanallistan från servern: \\(details)"
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
    /// - Returns: En array av avkodade Channel-objekt
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
        
        let preview = String(data: data.prefix(200), encoding: .utf8) ?? "Binaer data"
        throw ChannelServiceError.decodingError("Serverns svar matchade inte formatet. Svar: \\(preview)")
    }
}`
  },
  {
    id: "channel-viewmodel",
    name: "ChannelListViewModel.swift",
    folder: "ViewModels",
    path: "StreamPlayer/ViewModels/ChannelListViewModel.swift",
    language: "swift",
    description: "State management med iOS 17 @Observable & @MainActor för sökning, kategorier, laddningstillstånd och sparade favoriter.",
    badge: "ViewModel (@Observable)",
    content: `//
//  ChannelListViewModel.swift
//  StreamPlayer
//
//  Created for iOS 17+ | Modern Observation Framework (@Observable)
//

import Foundation
import SwiftUI
import Observation

/// ViewModel för hantering av kanalvisning, sökning, kategorifiltrering och favoriter.
/// Använder Swift iOS 17 Observation-arkitektur (@Observable) på @MainActor.
@Observable
@MainActor
public final class ChannelListViewModel {
    
    // MARK: - Dependencies
    private let channelService: ChannelServiceProtocol
    
    // MARK: - State Properties
    
    public private(set) var channels: [Channel] = []
    public var searchText: String = ""
    public var selectedCategory: String? = nil
    public private(set) var isLoading: Bool = false
    public var errorMessage: String? = nil
    
    public var apiKey: String {
        didSet {
            UserDefaults.standard.set(apiKey, forKey: "daddyapi_key")
        }
    }
    
    public private(set) var favoriteIDs: Set<String> = []
    public var showOnlyFavorites: Bool = false
    
    // MARK: - Beräknade Egenskaper
    
    public var availableCategories: [String] {
        let set = Set(channels.map { $0.category })
        return ["Alla"] + Array(set).sorted()
    }
    
    public var filteredChannels: [Channel] {
        channels.filter { channel in
            if showOnlyFavorites && !favoriteIDs.contains(channel.id) {
                return false
            }
            
            if let selected = selectedCategory, selected != "Alla" {
                if channel.category.caseInsensitiveCompare(selected) != .orderedSame {
                    return false
                }
            }
            
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
        
        let savedKey = UserDefaults.standard.string(forKey: "daddyapi_key") ?? ""
        self.apiKey = savedKey
        
        if let savedFavorites = UserDefaults.standard.array(forKey: "favorite_channel_ids") as? [String] {
            self.favoriteIDs = Set(savedFavorites)
        }
    }
    
    // MARK: - Publika Åtgärder
    
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
            self.errorMessage = "Ett oväntat fel inträffade: \\(error.localizedDescription)"
            self.isLoading = false
        }
    }
    
    public func refresh() async {
        await fetchChannels()
    }
    
    public func toggleFavorite(for channel: Channel) {
        if favoriteIDs.contains(channel.id) {
            favoriteIDs.remove(channel.id)
        } else {
            favoriteIDs.insert(channel.id)
        }
        UserDefaults.standard.set(Array(favoriteIDs), forKey: "favorite_channel_ids")
    }
    
    public func isFavorite(channel: Channel) -> Bool {
        favoriteIDs.contains(channel.id)
    }
    
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
}`
  },
  {
    id: "player-webview",
    name: "PlayerWebView.swift",
    folder: "Views",
    path: "StreamPlayer/Views/PlayerWebView.swift",
    language: "swift",
    description: "Kritiskt tekniskt krav: UIViewRepresentable för WKWebView med anpassad Referer (https://dlive.sx/), Origin, inline playback och fullskärmsstöd.",
    badge: "UIViewRepresentable",
    content: `//
//  PlayerWebView.swift
//  StreamPlayer
//
//  Created for iOS 17+ | WKWebView med anpassade Referer/Origin headers och fullskärm
//

import SwiftUI
import WebKit

/// En SwiftUI-wrapper runt WKWebView som injicerar obligatoriska HTTP-headers
/// (Referer & Origin) och konfigurerar inline-media, Picture-in-Picture och fullskärm.
public struct PlayerWebView: UIViewRepresentable {
    
    // MARK: - Inputs
    
    let url: URL
    @Binding var isLoading: Bool
    @Binding var errorMessage: String?
    var onStreamReady: (() -> Void)? = nil
    
    // MARK: - UIViewRepresentable Lifecycle
    
    public func makeCoordinator() -> Coordinator {
        Coordinator(self)
    }
    
    public func makeUIView(context: Context) -> WKWebView {
        let configuration = WKWebViewConfiguration()
        
        // Tillåt inline media-uppspelning
        configuration.allowsInlineMediaPlayback = true
        
        // Tillåt automatisk uppspelning
        configuration.mediaTypesRequiringUserActionForPlayback = []
        
        // Tillåt Picture in Picture (PiP) och AirPlay
        configuration.allowsPictureInPictureMediaPlayback = true
        configuration.allowsAirPlayForMediaPlayback = true
        
        // Tillåt HTML5 element-fullskärm (iOS 15.4+)
        let preferences = WKWebpagePreferences()
        preferences.allowsContentJavaScript = true
        configuration.defaultWebpagePreferences = preferences
        
        // Injicera meta referrer-script så att inbäddade iframes och fetches ärver Referer-policyn
        let referrerMetaScript = WKUserScript(
            source: """
            (function() {
                var meta = document.createElement('meta');
                meta.name = "referrer";
                meta.content = "always";
                document.head.appendChild(meta);
            })();
            """,
            injectionTime: .atDocumentStart,
            forMainFrameOnly: false
        )
        configuration.userContentController.addUserScript(referrerMetaScript)
        
        // Skapa WKWebView-instansen
        let webView = WKWebView(frame: .zero, configuration: configuration)
        webView.navigationDelegate = context.coordinator
        webView.uiDelegate = context.coordinator
        
        webView.backgroundColor = .black
        webView.isOpaque = false
        webView.scrollView.backgroundColor = .black
        webView.scrollView.isScrollEnabled = false
        
        webView.customUserAgent = "Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1"
        
        loadStream(in: webView)
        return webView
    }
    
    public func updateUIView(_ uiView: WKWebView, context: Context) {
        if uiView.url != url {
            loadStream(in: uiView)
        }
    }
    
    // MARK: - Hjälpmetod för att ladda ström med rätt headers
    
    private func loadStream(in webView: WKWebView) {
        var request = URLRequest(url: url)
        request.timeoutInterval = 20.0
        
        // KRITISKT KRAV: Stream-servrarna kräver exakt Referer och Origin
        request.setValue("https://dlive.sx/", forHTTPHeaderField: "Referer")
        request.setValue("https://dlive.sx", forHTTPHeaderField: "Origin")
        
        request.setValue("text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8", forHTTPHeaderField: "Accept")
        request.setValue("gzip, deflate, br", forHTTPHeaderField: "Accept-Encoding")
        request.setValue("sv-SE,sv;q=0.9,en;q=0.8", forHTTPHeaderField: "Accept-Language")
        
        webView.load(request)
    }
    
    // MARK: - Coordinator
    
    public final class Coordinator: NSObject, WKNavigationDelegate, WKUIDelegate {
        var parent: PlayerWebView
        
        init(_ parent: PlayerWebView) {
            self.parent = parent
        }
        
        public func webView(_ webView: WKWebView, didStartProvisionalNavigation navigation: WKNavigation!) {
            DispatchQueue.main.async {
                self.parent.isLoading = true
                self.parent.errorMessage = nil
            }
        }
        
        public func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) {
            DispatchQueue.main.async {
                self.parent.isLoading = false
                self.parent.onStreamReady?()
            }
        }
        
        public func webView(_ webView: WKWebView, didFail navigation: WKNavigation!, withError error: Error) {
            let nsError = error as NSError
            guard nsError.code != NSURLErrorCancelled else { return }
            
            DispatchQueue.main.async {
                self.parent.isLoading = false
                self.parent.errorMessage = "Kunde inte ladda strömmen: \\(error.localizedDescription)"
            }
        }
        
        public func webView(_ webView: WKWebView, didFailProvisionalNavigation navigation: WKNavigation!, withError error: Error) {
            let nsError = error as NSError
            guard nsError.code != NSURLErrorCancelled else { return }
            
            DispatchQueue.main.async {
                self.parent.isLoading = false
                self.parent.errorMessage = "Kunde inte ansluta till strömservern: \\(error.localizedDescription)"
            }
        }
        
        public func webView(_ webView: WKWebView, createWebViewWith configuration: WKWebViewConfiguration, for navigationAction: WKNavigationAction, windowFeatures: WKWindowFeatures) -> WKWebView? {
            if navigationAction.targetFrame == nil {
                webView.load(navigationAction.request)
            }
            return nil
        }
    }
}`
  },
  {
    id: "channel-list-view",
    name: "ChannelListView.swift",
    folder: "Views",
    path: "StreamPlayer/Views/ChannelListView.swift",
    language: "swift",
    description: "SwiftUI Huvudvy med .searchable, kategoriband, pull-to-refresh, AsyncImage-logotyper, favoriter och sheet-inställningar.",
    badge: "SwiftUI View",
    content: `//
//  ChannelListView.swift
//  StreamPlayer
//
//  Created for iOS 17+ | SwiftUI Channel Browser med Sökning, Kategorier och Favoriter
//

import SwiftUI

public struct ChannelListView: View {
    @State private var viewModel = ChannelListViewModel()
    @State private var selectedChannel: Channel? = nil
    @State private var showSettingsSheet: Bool = false
    
    public var body: some View {
        NavigationStack {
            ZStack {
                Color(uiColor: .systemGroupedBackground)
                    .ignoresSafeArea()
                
                VStack(spacing: 0) {
                    if !viewModel.channels.isEmpty {
                        categoryFilterBar
                    }
                    
                    if viewModel.isLoading && viewModel.channels.isEmpty {
                        loadingView
                    } else if let error = viewModel.errorMessage, viewModel.channels.isEmpty {
                        errorView(error)
                    } else if viewModel.filteredChannels.isEmpty {
                        emptyFilterView
                    } else {
                        channelList
                    }
                }
            }
            .navigationTitle("Live Kanaler")
            .navigationBarTitleDisplayMode(.large)
            .searchable(
                text: $viewModel.searchText,
                placement: .navigationBarDrawer(displayMode: .always),
                prompt: "Sök kanal, kategori eller ID..."
            )
            .toolbar {
                ToolbarItemGroup(placement: .topBarTrailing) {
                    Button {
                        withAnimation {
                            viewModel.showOnlyFavorites.toggle()
                        }
                    } label: {
                        Image(systemName: viewModel.showOnlyFavorites ? "star.fill" : "star")
                            .foregroundStyle(viewModel.showOnlyFavorites ? .yellow : .primary)
                    }
                    
                    Button {
                        showSettingsSheet = true
                    } label: {
                        Image(systemName: "gearshape")
                    }
                }
            }
            .refreshable {
                await viewModel.refresh()
            }
            .task {
                if viewModel.channels.isEmpty {
                    if viewModel.apiKey.isEmpty {
                        viewModel.loadPreviewData()
                    } else {
                        await viewModel.fetchChannels()
                    }
                }
            }
            .fullScreenCover(item: $selectedChannel) { channel in
                PlayerView(channel: channel)
            }
            .sheet(isPresented: $showSettingsSheet) {
                settingsSheet
            }
        }
    }
    
    private var categoryFilterBar: some View {
        ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: 8) {
                ForEach(viewModel.availableCategories, id: \\.self) { category in
                    let isSelected = (viewModel.selectedCategory == category) ||
                                     (viewModel.selectedCategory == nil && category == "Alla")
                    
                    Button {
                        withAnimation(.easeInOut(duration: 0.2)) {
                            if category == "Alla" {
                                viewModel.selectedCategory = nil
                            } else {
                                viewModel.selectedCategory = category
                            }
                        }
                    } label: {
                        Text(category)
                            .font(.subheadline)
                            .fontWeight(isSelected ? .semibold : .regular)
                            .padding(.horizontal, 14)
                            .padding(.vertical, 7)
                            .background(isSelected ? Color.blue : Color(uiColor: .secondarySystemGroupedBackground))
                            .foregroundStyle(isSelected ? .white : .primary)
                            .clipShape(Capsule())
                    }
                    .buttonStyle(.plain)
                }
            }
            .padding(.horizontal, 16)
            .padding(.vertical, 10)
        }
        .background(Color(uiColor: .systemBackground))
        .overlay(Divider(), alignment: .bottom)
    }
    
    private var channelList: some View {
        List {
            Section {
                ForEach(viewModel.filteredChannels) { channel in
                    ChannelRowView(
                        channel: channel,
                        isFavorite: viewModel.isFavorite(channel: channel),
                        onToggleFavorite: {
                            viewModel.toggleFavorite(for: channel)
                        }
                    )
                    .contentShape(Rectangle())
                    .onTapGesture {
                        selectedChannel = channel
                    }
                }
            } header: {
                HStack {
                    Text("\\(viewModel.filteredChannels.count) kanaler tillgängliga")
                    Spacer()
                    if viewModel.showOnlyFavorites {
                        Text("Endast favoriter").foregroundStyle(.yellow)
                    }
                }
                .font(.caption)
            }
        }
        .listStyle(.insetGrouped)
    }
    
    private var loadingView: some View {
        VStack(spacing: 16) {
            Spacer()
            ProgressView().scaleEffect(1.5)
            Text("Hämtar kanallista från DaddyAPI...")
                .font(.subheadline)
                .foregroundStyle(.secondary)
            Spacer()
        }
    }
    
    private func errorView(_ error: String) -> some View {
        VStack(spacing: 16) {
            Spacer()
            Image(systemName: "wifi.exclamationmark")
                .font(.system(size: 48))
                .foregroundStyle(.orange)
            Text("Kunde inte hämta kanaler").font(.headline)
            Text(error)
                .font(.subheadline)
                .foregroundStyle(.secondary)
                .multilineTextAlignment(.center)
                .padding(.horizontal, 32)
            Button {
                Task { await viewModel.fetchChannels() }
            } label: {
                Label("Försök igen", systemImage: "arrow.clockwise")
                    .font(.subheadline.bold())
                    .padding(.horizontal, 16)
                    .padding(.vertical, 10)
                    .background(Color.blue)
                    .foregroundStyle(.white)
                    .clipShape(RoundedRectangle(cornerRadius: 10))
            }
            Spacer()
        }
    }
    
    private var emptyFilterView: some View {
        VStack(spacing: 12) {
            Spacer()
            Image(systemName: "magnifyingglass")
                .font(.system(size: 44))
                .foregroundStyle(.secondary)
            Text("Inga kanaler matchar sökningen").font(.headline)
            Button("Rensa filter") {
                viewModel.searchText = ""
                viewModel.selectedCategory = nil
                viewModel.showOnlyFavorites = false
            }
            Spacer()
        }
    }
    
    private var settingsSheet: some View {
        NavigationStack {
            Form {
                Section("DaddyAPI Nyckel") {
                    SecureField("DIN_API_NYCKEL", text: $viewModel.apiKey)
                        .textInputAutocapitalization(.never)
                        .autocorrectionDisabled(true)
                }
                Section("Kommandon") {
                    Button("Ladda demodata (Offline)") {
                        viewModel.loadPreviewData()
                        showSettingsSheet = false
                    }
                }
            }
            .navigationTitle("Inställningar")
            .toolbar {
                ToolbarItem(placement: .confirmationAction) {
                    Button("Klar") { showSettingsSheet = false }
                }
            }
        }
    }
}

public struct ChannelRowView: View {
    let channel: Channel
    let isFavorite: Bool
    let onToggleFavorite: () -> Void
    
    public var body: some View {
        HStack(spacing: 14) {
            channelLogo
                .frame(width: 44, height: 44)
                .clipShape(RoundedRectangle(cornerRadius: 8))
            
            VStack(alignment: .leading, spacing: 3) {
                Text(channel.name)
                    .font(.body)
                    .fontWeight(.medium)
                    .lineLimit(1)
                
                HStack(spacing: 6) {
                    Text(channel.category)
                        .font(.caption)
                        .foregroundStyle(.secondary)
                    Text("•").font(.caption2).foregroundStyle(.secondary.opacity(0.6))
                    Text("#\\(channel.id)").font(.caption2.monospaced()).foregroundStyle(.secondary)
                }
            }
            
            Spacer()
            
            Button {
                onToggleFavorite()
            } label: {
                Image(systemName: isFavorite ? "star.fill" : "star")
                    .foregroundStyle(isFavorite ? .yellow : .secondary.opacity(0.4))
                    .font(.system(size: 18))
            }
            .buttonStyle(.plain)
            
            Image(systemName: "chevron.right")
                .font(.system(size: 13, weight: .semibold))
                .foregroundStyle(.tertiary)
        }
        .padding(.vertical, 4)
    }
    
    @ViewBuilder
    private var channelLogo: some View {
        if let logoURL = channel.logoURL {
            AsyncImage(url: logoURL) { phase in
                switch phase {
                case .success(let image):
                    image.resizable().aspectRatio(contentMode: .fit).padding(4)
                default:
                    placeholderLogo
                }
            }
        } else {
            placeholderLogo
        }
    }
    
    private var placeholderLogo: some View {
        ZStack {
            Color.blue.opacity(0.12)
            Text(String(channel.name.prefix(2)).uppercased())
                .font(.system(size: 14, weight: .bold))
                .foregroundStyle(Color.blue)
        }
    }
}`
  },
  {
    id: "player-view",
    name: "PlayerView.swift",
    folder: "Views",
    path: "StreamPlayer/Views/PlayerView.swift",
    language: "swift",
    description: "Fullskärms videospelare som omsluter PlayerWebView, med auto-hiding overlay-kontroller, stream-status, diagnostics och AVAudioSession.",
    badge: "SwiftUI View (Player)",
    content: `//
//  PlayerView.swift
//  StreamPlayer
//
//  Created for iOS 17+ | SwiftUI Player View med WKWebView, Fullskärm och Kontroller
//

import SwiftUI
import AVFoundation

public struct PlayerView: View {
    let channel: Channel
    
    @Environment(\\.dismiss) private var dismiss
    @State private var isLoading: Bool = true
    @State private var errorMessage: String? = nil
    @State private var showControls: Bool = true
    @State private var reloadToken = UUID()
    @State private var showInfoSheet: Bool = false
    
    public var body: some View {
        ZStack {
            Color.black.ignoresSafeArea()
            
            PlayerWebView(
                url: channel.streamURL,
                isLoading: $isLoading,
                errorMessage: $errorMessage
            )
            .id(reloadToken)
            .ignoresSafeArea(edges: .all)
            .onTapGesture {
                withAnimation { showControls.toggle() }
            }
            
            if isLoading {
                ProgressView("Ansluter...")
                    .progressViewStyle(CircularProgressViewStyle(tint: .white))
                    .foregroundStyle(.white)
                    .padding(20)
                    .background(.ultraThinMaterial.opacity(0.8))
                    .clipShape(RoundedRectangle(cornerRadius: 14))
            }
            
            if let error = errorMessage {
                VStack(spacing: 16) {
                    Image(systemName: "exclamationmark.triangle.fill")
                        .font(.largeTitle)
                        .foregroundStyle(.yellow)
                    Text("Kunde inte starta strömmen").font(.headline).foregroundStyle(.white)
                    Text(error).font(.caption).foregroundStyle(.white.opacity(0.7)).multilineTextAlignment(.center)
                    Button("Försök igen") {
                        errorMessage = nil
                        isLoading = true
                        reloadToken = UUID()
                    }
                    .padding(.horizontal, 20)
                    .padding(.vertical, 10)
                    .background(Color.blue)
                    .clipShape(Capsule())
                }
                .padding(24)
                .background(.black.opacity(0.85))
                .clipShape(RoundedRectangle(cornerRadius: 16))
            }
            
            if showControls && errorMessage == nil {
                VStack {
                    topBar
                    Spacer()
                    bottomBar
                }
            }
        }
        .statusBarHidden(!showControls)
        .onAppear {
            try? AVAudioSession.sharedInstance().setCategory(.playback, mode: .moviePlayback)
            try? AVAudioSession.sharedInstance().setActive(true)
        }
        .sheet(isPresented: $showInfoSheet) {
            NavigationStack {
                List {
                    Section("Headers & Stream") {
                        LabeledContent("Stream URL", value: channel.streamURL.absoluteString)
                        LabeledContent("Referer", value: "https://dlive.sx/")
                        LabeledContent("Origin", value: "https://dlive.sx")
                    }
                }
                .navigationTitle("Strömdetaljer")
            }
        }
    }
    
    private var topBar: some View {
        HStack {
            Button { dismiss() } label: {
                Image(systemName: "xmark")
                    .font(.headline)
                    .foregroundStyle(.white)
                    .padding(10)
                    .background(Color.black.opacity(0.6))
                    .clipShape(Circle())
            }
            
            VStack(alignment: .leading, spacing: 2) {
                Text(channel.name).font(.headline).foregroundStyle(.white).lineLimit(1)
                Text("\\(channel.category) • ID: \\(channel.id)").font(.caption).foregroundStyle(.white.opacity(0.7))
            }
            Spacer()
            Button { showInfoSheet = true } label: {
                Image(systemName: "info.circle")
                    .font(.headline)
                    .foregroundStyle(.white)
                    .padding(10)
                    .background(Color.black.opacity(0.6))
                    .clipShape(Circle())
            }
        }
        .padding()
        .background(LinearGradient(colors: [.black.opacity(0.8), .clear], startPoint: .top, endPoint: .bottom))
    }
    
    private var bottomBar: some View {
        HStack {
            Label("LIVE • dlive.sx", systemImage: "antenna.radiowaves.left.and.right")
                .font(.caption2.bold())
                .foregroundStyle(.white)
                .padding(.horizontal, 10)
                .padding(.vertical, 6)
                .background(Color.red.opacity(0.85))
                .clipShape(Capsule())
            Spacer()
        }
        .padding()
        .background(LinearGradient(colors: [.clear, .black.opacity(0.8)], startPoint: .top, endPoint: .bottom))
    }
}`
  },
  {
    id: "stream-player-app",
    name: "StreamPlayerApp.swift",
    folder: "App",
    path: "StreamPlayer/App/StreamPlayerApp.swift",
    language: "swift",
    description: "App-startpunkt med @main som aktiverar AVAudioSession .playback mode för bakgrundsuppspelning och laddar ChannelListView.",
    badge: "App Entry Point",
    content: `//
//  StreamPlayerApp.swift
//  StreamPlayer
//
//  Created for iOS 17+ | App Entry Point med AudioSession-initiering
//

import SwiftUI
import AVFoundation

@main
struct StreamPlayerApp: App {
    
    init() {
        configureAudioSession()
    }
    
    var body: some Scene {
        WindowGroup {
            ChannelListView()
        }
    }
    
    private func configureAudioSession() {
        do {
            let session = AVAudioSession.sharedInstance()
            try session.setCategory(.playback, mode: .moviePlayback, options: [.allowAirPlay, .duckOthers])
            try session.setActive(true)
        } catch {
            print("⚠️ Misslyckades att initiera AVAudioSession: \\(error.localizedDescription)")
        }
    }
}`
  },
  {
    id: "info-plist",
    name: "Info.plist",
    folder: "Config",
    path: "StreamPlayer/Info.plist",
    language: "xml",
    description: "Obligatorisk säkerhets- och bakgrundskonfiguration: NSAppTransportSecurity (NSAllowsArbitraryLoadsInWebContent) och UIBackgroundModes (audio).",
    badge: "Config (ATS & Audio)",
    content: `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>CFBundleName</key>
    <string>StreamPlayer</string>
    <key>CFBundleShortVersionString</key>
    <string>1.0</string>
    <key>CFBundleVersion</key>
    <string>1</string>
    <key>LSRequiresIPhoneOS</key>
    <true/>

    <!-- ================================================================= -->
    <!-- KRITISKT FÖR LIVESTREAM: App Transport Security (ATS)            -->
    <!-- ================================================================= -->
    <key>NSAppTransportSecurity</key>
    <dict>
        <key>NSAllowsArbitraryLoadsInWebContent</key>
        <true/>
        <key>NSAllowsArbitraryLoads</key>
        <true/>
    </dict>

    <!-- ================================================================= -->
    <!-- BAKGRUNDSLJUD & PICTURE IN PICTURE                               -->
    <!-- ================================================================= -->
    <key>UIBackgroundModes</key>
    <array>
        <string>audio</string>
    </array>

    <key>UISupportedInterfaceOrientations</key>
    <array>
        <string>UIInterfaceOrientationPortrait</string>
        <string>UIInterfaceOrientationLandscapeLeft</string>
        <string>UIInterfaceOrientationLandscapeRight</string>
    </array>

    <key>UIViewControllerBasedStatusBarAppearance</key>
    <true/>
</dict>
</plist>`
  },
  {
    id: "xcode-guide",
    name: "XcodeSetupGuide.md",
    folder: "Documentation",
    path: "StreamPlayer/XcodeSetupGuide.md",
    language: "markdown",
    description: "Steg-för-steg-instruktioner för att skapa projektet i Xcode 15/16, ställa in Deployment Target iOS 17+, och testa på enhet/simulator.",
    badge: "Guide",
    content: `# Guide: Skapa IPTV-spelaren i Xcode (iOS 17+)

### 1. Skapa projektet
1. Öppna Xcode > File > New > Project
2. Välj iOS > App
3. Interface: SwiftUI, Language: Swift, Storage: None
4. Sätt Deployment Target till iOS 17.0+

### 2. Importera filerna
Kopiera in filerna från zip-arkivet till ditt Xcode-projekt:
- Models/Channel.swift
- Services/ChannelService.swift
- ViewModels/ChannelListViewModel.swift
- Views/PlayerWebView.swift
- Views/ChannelListView.swift
- Views/PlayerView.swift
- App/StreamPlayerApp.swift

### 3. Aktivera Background Modes
- Klicka på ditt Target > Signing & Capabilities > + Capability > Background Modes
- Kryssa i "Audio, AirPlay, and Picture in Picture"

### 4. Headers för dlive.sx
Spelaren skickar:
- Referer: https://dlive.sx/
- Origin: https://dlive.sx
vilket förhindrar 403 Forbidden.`
  }
];
