//
//  PlayerView.swift
//  StreamPlayer
//
//  Created for iOS 17+ | SwiftUI Player View med WKWebView, Fullskärm och Kontroller
//

import SwiftUI
import AVFoundation

/// Huvudvy för videouppspelning av vald IPTV-kanal
public struct PlayerView: View {
    
    // MARK: - Properties
    
    let channel: Channel
    
    @Environment(\.dismiss) private var dismiss
    @Environment(\.horizontalSizeClass) private var horizontalSizeClass
    
    @State private var isLoading: Bool = true
    @State private var errorMessage: String? = nil
    @State private var showControls: Bool = true
    @State private var controlsTimer: Timer? = nil
    @State private var showInfoSheet: Bool = false
    @State private var reloadToken = UUID()
    
    // MARK: - Body
    
    public var body: some View {
        ZStack {
            // Svart bakgrund för optimal videovisning
            Color.black
                .ignoresSafeArea()
            
            // 1. Spelaren (WKWebView med custom headers)
            PlayerWebView(
                url: channel.streamURL,
                isLoading: $isLoading,
                errorMessage: $errorMessage,
                onStreamReady: {
                    scheduleControlsAutoDismiss()
                }
            )
            .id(reloadToken) // Möjliggör ren omladdning vid retry
            .ignoresSafeArea(edges: .all)
            .onTapGesture {
                toggleControls()
            }
            
            // 2. Laddningsindikator
            if isLoading {
                VStack(spacing: 12) {
                    ProgressView()
                        .progressViewStyle(CircularProgressViewStyle(tint: .white))
                        .scaleEffect(1.4)
                    
                    Text("Ansluter till ström...")
                        .font(.subheadline)
                        .foregroundStyle(.white.opacity(0.85))
                }
                .padding(24)
                .background(.ultraThinMaterial.opacity(0.8))
                .clipShape(RoundedRectangle(cornerRadius: 16))
                .transition(.opacity)
            }
            
            // 3. Felmeddelande-vy med retry
            if let error = errorMessage {
                VStack(spacing: 16) {
                    Image(systemName: "exclamationmark.triangle.fill")
                        .font(.system(size: 44))
                        .foregroundStyle(.yellow)
                    
                    Text("Kunde inte starta sändningen")
                        .font(.headline)
                        .foregroundStyle(.white)
                    
                    Text(error)
                        .font(.caption)
                        .foregroundStyle(.white.opacity(0.7))
                        .multilineTextAlignment(.center)
                        .padding(.horizontal, 24)
                    
                    HStack(spacing: 16) {
                        Button {
                            // Försök ladda om
                            errorMessage = nil
                            isLoading = true
                            reloadToken = UUID()
                        } label: {
                            Label("Försök igen", systemImage: "arrow.clockwise")
                                .font(.subheadline.bold())
                                .foregroundStyle(.white)
                                .padding(.horizontal, 20)
                                .padding(.vertical, 10)
                                .background(Color.blue)
                                .clipShape(RoundedRectangle(cornerRadius: 10))
                        }
                        
                        Button {
                            dismiss()
                        } label: {
                            Text("Stäng")
                                .font(.subheadline)
                                .foregroundStyle(.white.opacity(0.9))
                                .padding(.horizontal, 18)
                                .padding(.vertical, 10)
                                .background(Color.white.opacity(0.15))
                                .clipShape(RoundedRectangle(cornerRadius: 10))
                        }
                    }
                }
                .padding(28)
                .background(.black.opacity(0.85))
                .clipShape(RoundedRectangle(cornerRadius: 18))
                .padding(32)
                .transition(.opacity)
            }
            
            // 4. Kontrollgränssnitt (Header & Toolbar)
            if showControls && errorMessage == nil {
                VStack {
                    // Topplist med titel, stäng-knapp och info
                    topBar
                    
                    Spacer()
                    
                    // Bottenlist med ströminformation och verktyg
                    bottomBar
                }
                .transition(.opacity.combined(with: .move(edge: .top)))
            }
        }
        .statusBarHidden(!showControls)
        .onAppear {
            setupAudioSession()
            scheduleControlsAutoDismiss()
        }
        .sheet(isPresented: $showInfoSheet) {
            streamDiagnosticsSheet
        }
    }
    
    // MARK: - Subviews
    
    private var topBar: some View {
        HStack(spacing: 12) {
            Button {
                dismiss()
            } label: {
                Image(systemName: "xmark")
                    .font(.system(size: 16, weight: .bold))
                    .foregroundStyle(.white)
                    .frame(width: 36, height: 36)
                    .background(Color.black.opacity(0.55))
                    .clipShape(Circle())
            }
            
            VStack(alignment: .leading, spacing: 2) {
                Text(channel.name)
                    .font(.headline)
                    .foregroundStyle(.white)
                    .lineLimit(1)
                
                HStack(spacing: 6) {
                    Text(channel.category)
                        .font(.caption2.bold())
                        .foregroundStyle(.white.opacity(0.7))
                    
                    Text("•")
                        .foregroundStyle(.white.opacity(0.4))
                        .font(.caption2)
                    
                    Text("ID: \(channel.id)")
                        .font(.caption2.monospaced())
                        .foregroundStyle(.white.opacity(0.7))
                }
            }
            
            Spacer()
            
            // Knappar för info och omladdning
            HStack(spacing: 8) {
                Button {
                    showInfoSheet = true
                } label: {
                    Image(systemName: "info.circle")
                        .font(.system(size: 16, weight: .semibold))
                        .foregroundStyle(.white)
                        .frame(width: 36, height: 36)
                        .background(Color.black.opacity(0.55))
                        .clipShape(Circle())
                }
                
                Button {
                    errorMessage = nil
                    isLoading = true
                    reloadToken = UUID()
                } label: {
                    Image(systemName: "arrow.clockwise")
                        .font(.system(size: 16, weight: .semibold))
                        .foregroundStyle(.white)
                        .frame(width: 36, height: 36)
                        .background(Color.black.opacity(0.55))
                        .clipShape(Circle())
                }
            }
        }
        .padding(.horizontal, 16)
        .padding(.vertical, 12)
        .background(
            LinearGradient(
                colors: [.black.opacity(0.85), .black.opacity(0.0)],
                startPoint: .top,
                endPoint: .bottom
            )
        )
    }
    
    private var bottomBar: some View {
        HStack {
            HStack(spacing: 8) {
                Circle()
                    .fill(Color.red)
                    .frame(width: 8, height: 8)
                
                Text("LIVE")
                    .font(.caption2.bold())
                    .foregroundStyle(.white)
                
                Text("dlive.sx")
                    .font(.caption2.monospaced())
                    .foregroundStyle(.white.opacity(0.6))
            }
            .padding(.horizontal, 12)
            .padding(.vertical, 6)
            .background(Color.black.opacity(0.55))
            .clipShape(Capsule())
            
            Spacer()
            
            Text("Tryck på skärmen för full vy")
                .font(.caption2)
                .foregroundStyle(.white.opacity(0.5))
        }
        .padding(.horizontal, 16)
        .padding(.vertical, 14)
        .background(
            LinearGradient(
                colors: [.black.opacity(0.0), .black.opacity(0.85)],
                startPoint: .top,
                endPoint: .bottom
            )
        )
    }
    
    private var streamDiagnosticsSheet: some View {
        NavigationStack {
            List {
                Section("Kanalinformation") {
                    LabeledContent("Kanalnamn", value: channel.name)
                    LabeledContent("Kategori", value: channel.category)
                    LabeledContent("Kanal-ID", value: channel.id)
                }
                
                Section("Nätverkskonfiguration (Headers)") {
                    LabeledContent("Stream URL", value: channel.streamURL.absoluteString)
                    LabeledContent("Referer Header", value: "https://dlive.sx/")
                    LabeledContent("Origin Header", value: "https://dlive.sx")
                    LabeledContent("Spelarmotor", value: "WKWebView + WebKit Media")
                }
                
                Section("Status & Inställningar") {
                    LabeledContent("Inline Playback", value: "Aktiv (true)")
                    LabeledContent("PiP Stöd", value: "Aktiv (true)")
                    LabeledContent("HTML5 Fullskärm", value: "Tillåten")
                }
            }
            .navigationTitle("Ströminformation")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .confirmationAction) {
                    Button("Klar") {
                        showInfoSheet = false
                    }
                }
            }
        }
        .presentationDetents([.medium])
    }
    
    // MARK: - Helpers
    
    private func toggleControls() {
        withAnimation(.easeInOut(duration: 0.25)) {
            showControls.toggle()
        }
        if showControls {
            scheduleControlsAutoDismiss()
        }
    }
    
    private func scheduleControlsAutoDismiss() {
        controlsTimer?.invalidate()
        controlsTimer = Timer.scheduledTimer(withTimeInterval: 4.5, repeats: false) { _ in
            Task { @MainActor in
                withAnimation(.easeInOut(duration: 0.3)) {
                    self.showControls = false
                }
            }
        }
    }
    
    /// Aktiverar AVAudioSession för kontinuerlig bakgrundsuppspelning
    private func setupAudioSession() {
        do {
            try AVAudioSession.sharedInstance().setCategory(.playback, mode: .moviePlayback)
            try AVAudioSession.sharedInstance().setActive(true)
        } catch {
            print("Kunde inte konfigurera AVAudioSession: \(error)")
        }
    }
}
