//
//  Channel.swift
//  StreamPlayer
//
//  Created for iOS 17+ | SwiftUI & WKWebView IPTV Architecture
//

import Foundation

/// Datamodell för en IPTV/Live Stream-kanal.
/// Implementerar `Identifiable`, `Codable` och `Hashable` med flexibel avkodning
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
        let urlString = "https://dlive.sx/stream/stream-\(id).php"
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
            // Generera fallback UUID om ID saknas
            self.id = UUID().uuidString
        }
        
        // 2. Avkoda Kanalnamn (hanterar "name" eller "channel_name")
        if let rawName = try? container.decode(String.self, forKey: .name), !rawName.trimmingCharacters(in: .whitespaces).isEmpty {
            self.name = rawName.trimmingCharacters(in: .whitespaces)
        } else if let rawChannelName = try? container.decode(String.self, forKey: .channelName), !rawChannelName.trimmingCharacters(in: .whitespaces).isEmpty {
            self.name = rawChannelName.trimmingCharacters(in: .whitespaces)
        } else {
            self.name = "Kanal \(self.id)"
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
}
