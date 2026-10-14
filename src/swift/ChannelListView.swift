//
//  ChannelListView.swift
//  StreamPlayer
//
//  Created for iOS 17+ | SwiftUI Channel Browser med Sökning, Kategorier och Favoriter
//

import SwiftUI

/// Huvudvy för att söka, filtrera och välja IPTV-kanaler
public struct ChannelListView: View {
    
    // MARK: - State
    
    @State private var viewModel = ChannelListViewModel()
    @State private var selectedChannel: Channel? = nil
    @State private var showSettingsSheet: Bool = false
    
    // MARK: - Body
    
    public var body: some View {
        NavigationStack {
            ZStack {
                Color(uiColor: .systemGroupedBackground)
                    .ignoresSafeArea()
                
                VStack(spacing: 0) {
                    // 1. Kategoriväljare (om kanaler finns)
                    if !viewModel.channels.isEmpty {
                        categoryFilterBar
                    }
                    
                    // 2. Kanallista eller Tomt tillstånd
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
                    // Filter för favoriter
                    Button {
                        withAnimation {
                            viewModel.showOnlyFavorites.toggle()
                        }
                    } label: {
                        Image(systemName: viewModel.showOnlyFavorites ? "star.fill" : "star")
                            .foregroundStyle(viewModel.showOnlyFavorites ? .yellow : .primary)
                    }
                    .accessibilityLabel("Visa endast favoriter")
                    
                    // Inställningar för API-nyckel
                    Button {
                        showSettingsSheet = true
                    } label: {
                        Image(systemName: "gearshape")
                    }
                    .accessibilityLabel("Inställningar")
                }
            }
            .refreshable {
                await viewModel.refresh()
            }
            .task {
                if viewModel.channels.isEmpty {
                    if viewModel.apiKey.isEmpty {
                        // Om ingen nyckel finns, ladda preview-data så användaren kan prova direkt
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
    
    // MARK: - Subviews
    
    /// Horisontell rullningsbar rad för kategorier
    private var categoryFilterBar: some View {
        ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: 8) {
                ForEach(viewModel.availableCategories, id: \.self) { category in
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
                            .overlay(
                                Capsule()
                                    .strokeBorder(isSelected ? Color.clear : Color.primary.opacity(0.1), lineWidth: 1)
                            )
                    }
                    .buttonStyle(.plain)
                }
            }
            .padding(.horizontal, 16)
            .padding(.vertical, 10)
        }
        .background(Color(uiColor: .systemBackground))
        .overlay(
            Divider(), alignment: .bottom
        )
    }
    
    /// Huvudlistan över kanaler
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
                    Text("\(viewModel.filteredChannels.count) kanaler tillgängliga")
                    Spacer()
                    if viewModel.showOnlyFavorites {
                        Text("Endast favoriter")
                            .foregroundStyle(.yellow)
                    }
                }
                .font(.caption)
            }
        }
        .listStyle(.insetGrouped)
    }
    
    /// Laddningsvy vid första anrop
    private var loadingView: some View {
        VStack(spacing: 16) {
            Spacer()
            ProgressView()
                .scaleEffect(1.5)
            Text("Hämtar kanallista från DaddyAPI...")
                .font(.subheadline)
                .foregroundStyle(.secondary)
            Spacer()
        }
    }
    
    /// Felvy vid misslyckad hämtning
    private func errorView(_ error: String) -> some View {
        VStack(spacing: 16) {
            Spacer()
            Image(systemName: "wifi.exclamationmark")
                .font(.system(size: 48))
                .foregroundStyle(.orange)
            
            Text("Kunde inte hämta kanaler")
                .font(.headline)
            
            Text(error)
                .font(.subheadline)
                .foregroundStyle(.secondary)
                .multilineTextAlignment(.center)
                .padding(.horizontal, 32)
            
            HStack(spacing: 12) {
                Button {
                    Task {
                        await viewModel.fetchChannels()
                    }
                } label: {
                    Label("Försök igen", systemImage: "arrow.clockwise")
                        .font(.subheadline.bold())
                        .padding(.horizontal, 16)
                        .padding(.vertical, 10)
                        .background(Color.blue)
                        .foregroundStyle(.white)
                        .clipShape(RoundedRectangle(cornerRadius: 10))
                }
                
                Button {
                    showSettingsSheet = true
                } label: {
                    Text("API-nyckel")
                        .font(.subheadline)
                        .padding(.horizontal, 16)
                        .padding(.vertical, 10)
                        .background(Color(uiColor: .secondarySystemFill))
                        .foregroundStyle(.primary)
                        .clipShape(RoundedRectangle(cornerRadius: 10))
                }
            }
            Spacer()
        }
    }
    
    /// Tomt tillstånd när sökningen inte ger resultat
    private var emptyFilterView: some View {
        VStack(spacing: 12) {
            Spacer()
            Image(systemName: "magnifyingglass")
                .font(.system(size: 44))
                .foregroundStyle(.secondary)
            
            Text("Inga kanaler matchar sökningen")
                .font(.headline)
            
            if !viewModel.searchText.isEmpty {
                Text("Inga träffar för \"\(viewModel.searchText)\"")
                    .font(.subheadline)
                    .foregroundStyle(.secondary)
            }
            
            Button("Rensa filter") {
                viewModel.searchText = ""
                viewModel.selectedCategory = nil
                viewModel.showOnlyFavorites = false
            }
            .font(.subheadline)
            .padding(.top, 8)
            Spacer()
        }
    }
    
    /// Inställningsblad för att hantera DaddyAPI-nyckeln
    private var settingsSheet: some View {
        NavigationStack {
            Form {
                Section {
                    SecureField("DIN_API_NYCKEL", text: $viewModel.apiKey)
                        .textInputAutocapitalization(.never)
                        .autocorrectionDisabled(true)
                } header: {
                    Text("DaddyAPI Nyckel")
                } footer: {
                    Text("Appen använder nyckeln för att göra förfrågningar mot https://dlive.sx/daddyapi.php?key=...&endpoint=channels")
                }
                
                Section("Snabbkommandon") {
                    Button {
                        viewModel.loadPreviewData()
                        showSettingsSheet = false
                    } label: {
                        Label("Ladda demodata (Offline)", systemImage: "sparkles")
                    }
                    
                    Button {
                        Task {
                            showSettingsSheet = false
                            await viewModel.fetchChannels()
                        }
                    } label: {
                        Label("Hämta skarpa kanaler", systemImage: "arrow.clockwise")
                    }
                    .disabled(viewModel.apiKey.trimmingCharacters(in: .whitespaces).isEmpty)
                }
                
                Section("Om spelaren") {
                    LabeledContent("Headers", value: "Referer: https://dlive.sx/")
                    LabeledContent("Origin", value: "https://dlive.sx")
                    LabeledContent("Kanal-mönster", value: "stream-{id}.php")
                    LabeledContent("SwiftUI / iOS", value: "iOS 17.0+")
                }
            }
            .navigationTitle("Inställningar")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .confirmationAction) {
                    Button("Klar") {
                        showSettingsSheet = false
                        Task {
                            if !viewModel.apiKey.isEmpty {
                                await viewModel.fetchChannels()
                            }
                        }
                    }
                }
            }
        }
        .presentationDetents([.medium, .large])
    }
}

// MARK: - Kanalrad Komponent

public struct ChannelRowView: View {
    let channel: Channel
    let isFavorite: Bool
    let onToggleFavorite: () -> Void
    
    public var body: some View {
        HStack(spacing: 14) {
            // Logotyp eller Ikon med fallback
            channelLogo
                .frame(width: 44, height: 44)
                .clipShape(RoundedRectangle(cornerRadius: 8))
                .overlay(
                    RoundedRectangle(cornerRadius: 8)
                        .stroke(Color.primary.opacity(0.08), lineWidth: 1)
                )
            
            // Textinformation
            VStack(alignment: .leading, spacing: 3) {
                Text(channel.name)
                    .font(.body)
                    .fontWeight(.medium)
                    .lineLimit(1)
                
                HStack(spacing: 6) {
                    Text(channel.category)
                        .font(.caption)
                        .foregroundStyle(.secondary)
                    
                    Text("•")
                        .font(.caption2)
                        .foregroundStyle(.secondary.opacity(0.6))
                    
                    Text("#\(channel.id)")
                        .font(.caption2.monospaced())
                        .foregroundStyle(.secondary)
                }
            }
            
            Spacer()
            
            // Favoritknapp
            Button {
                onToggleFavorite()
            } label: {
                Image(systemName: isFavorite ? "star.fill" : "star")
                    .foregroundStyle(isFavorite ? .yellow : .secondary.opacity(0.4))
                    .font(.system(size: 18))
            }
            .buttonStyle(.plain)
            
            // Play-indikator
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
                    image
                        .resizable()
                        .aspectRatio(contentMode: .fit)
                        .padding(4)
                        .background(Color(uiColor: .tertiarySystemGroupedBackground))
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
            Text(channelInitials)
                .font(.system(size: 14, weight: .bold))
                .foregroundStyle(Color.blue)
        }
    }
    
    private var channelInitials: String {
        let words = channel.name.components(separatedBy: .whitespaces)
        if words.count >= 2, let first = words[0].first, let second = words[1].first {
            return "\(first)\(second)".uppercased()
        }
        return String(channel.name.prefix(2)).uppercased()
    }
}
