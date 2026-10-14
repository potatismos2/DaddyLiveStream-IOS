//
//  PlayerWebView.swift
//  StreamPlayer
//
//  Created for iOS 17+ | WKWebView med anpassade Referer/Origin headers och fullskärm
//

import SwiftUI
import WebKit

/// En SwiftUI-wrapper runt `WKWebView` som injicerar obligatoriska HTTP-headers
/// (`Referer` & `Origin`) och konfigurerar inline-media, Picture-in-Picture och fullskärm.
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
        // 1. Skapa och konfigurera WKWebViewConfiguration
        let configuration = WKWebViewConfiguration()
        
        // Tillåt inline media-uppspelning (hindrar automatisk fullskärm som kan krascha UI)
        configuration.allowsInlineMediaPlayback = true
        
        // Tillåt automatisk uppspelning utan krav på användarinteraktion
        configuration.mediaTypesRequiringUserActionForPlayback = []
        
        // Tillåt Picture in Picture (PiP) och AirPlay
        configuration.allowsPictureInPictureMediaPlayback = true
        configuration.allowsAirPlayForMediaPlayback = true
        
        // Tillåt HTML5 element-fullskärm (iOS 15.4+)
        let preferences = WKWebpagePreferences()
        preferences.allowsContentJavaScript = true
        configuration.defaultWebpagePreferences = preferences
        
        // 2. Injicera UserScript för att tvinga fram rätt Referrer policy i DOM:en
        // Detta säkerställer att iframes och inbäddade hls.js/video-anrop skickar rätt Referer
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
        
        // 3. Skapa WKWebView-instansen
        let webView = WKWebView(frame: .zero, configuration: configuration)
        webView.navigationDelegate = context.coordinator
        webView.uiDelegate = context.coordinator
        
        // Mörk bakgrund för att förhindra vit blixt innan strömmen startar
        webView.backgroundColor = .black
        webView.isOpaque = false
        webView.scrollView.backgroundColor = .black
        webView.scrollView.isScrollEnabled = false // Lås scrollning för ren mediaspelare
        
        // Anpassad User-Agent som matchar modern mobil Safari
        webView.customUserAgent = "Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1"
        
        // 4. Ladda URLRequest med obligatoriska headers
        loadStream(in: webView)
        
        return webView
    }
    
    public func updateUIView(_ uiView: WKWebView, context: Context) {
        // Om URL:en har ändrats, ladda den nya strömmen
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
        
        // Standard WebKit-headers för videoströmmar
        request.setValue("text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8", forHTTPHeaderField: "Accept")
        request.setValue("gzip, deflate, br", forHTTPHeaderField: "Accept-Encoding")
        request.setValue("sv-SE,sv;q=0.9,en;q=0.8", forHTTPHeaderField: "Accept-Language")
        
        webView.load(request)
    }
    
    // MARK: - Coordinator för navigering och felhantering
    
    public final class Coordinator: NSObject, WKNavigationDelegate, WKUIDelegate {
        var parent: PlayerWebView
        
        init(_ parent: PlayerWebView) {
            self.parent = parent
        }
        
        // Navigering påbörjades
        public func webView(_ webView: WKWebView, didStartProvisionalNavigation navigation: WKNavigation!) {
            DispatchQueue.main.async {
                self.parent.isLoading = true
                self.parent.errorMessage = nil
            }
        }
        
        // Navigering lyckades
        public func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) {
            DispatchQueue.main.async {
                self.parent.isLoading = false
                self.parent.onStreamReady?()
            }
        }
        
        // Fel vid laddning
        public func webView(_ webView: WKWebView, didFail navigation: WKNavigation!, withError error: Error) {
            let nsError = error as NSError
            // Ignorera avbrutna laddningar (t.ex. vid snabbt kanalbyte)
            guard nsError.code != NSURLErrorCancelled else { return }
            
            DispatchQueue.main.async {
                self.parent.isLoading = false
                self.parent.errorMessage = "Kunde inte ladda strömmen: \(error.localizedDescription)"
            }
        }
        
        // Fel vid initial uppkoppling
        public func webView(_ webView: WKWebView, didFailProvisionalNavigation navigation: WKNavigation!, withError error: Error) {
            let nsError = error as NSError
            guard nsError.code != NSURLErrorCancelled else { return }
            
            DispatchQueue.main.async {
                self.parent.isLoading = false
                self.parent.errorMessage = "Kunde inte ansluta till strömservern: \(error.localizedDescription)"
            }
        }
        
        // Hantera target="_blank" eller popups inom samma vy
        public func webView(_ webView: WKWebView, createWebViewWith configuration: WKWebViewConfiguration, for navigationAction: WKNavigationAction, windowFeatures: WKWindowFeatures) -> WKWebView? {
            if navigationAction.targetFrame == nil {
                webView.load(navigationAction.request)
            }
            return nil
        }
    }
}
