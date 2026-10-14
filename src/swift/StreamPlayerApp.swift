//
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
    
    /// Konfigurerar ljudsessionen för att tillåta att ljudet fortsätter spelas
    /// i bakgrunden, samt säkerställa optimal hårdvaruacceleration för video.
    private func configureAudioSession() {
        do {
            let session = AVAudioSession.sharedInstance()
            try session.setCategory(.playback, mode: .moviePlayback, options: [.allowAirPlay, .duckOthers])
            try session.setActive(true)
        } catch {
            print("⚠️ Misslyckades att initiera AVAudioSession: \(error.localizedDescription)")
        }
    }
}
