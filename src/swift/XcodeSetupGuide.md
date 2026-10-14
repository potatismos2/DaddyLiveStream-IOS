# Guide: Skapa projektet i Xcode (iOS 17+)

Följ dessa enkla steg för att köra projektet i Xcode på din Mac:

### 1. Skapa ett nytt Xcode-projekt
1. Öppna **Xcode** och välj **File > New > Project...** (eller `Cmd + Shift + N`).
2. Välj fliken **iOS** och mallen **App**.
3. Fyll i inställningarna:
   - **Product Name:** `StreamPlayer`
   - **Team:** Ditt personliga Apple-ID eller Developer-konto
   - **Organization Identifier:** `se.dittnamn` (eller liknande)
   - **Interface:** `SwiftUI`
   - **Language:** `Swift`
   - **Storage:** None
4. Välj mapp och klicka på **Create**.

### 2. Sätt lägsta iOS-version (Deployment Target)
1. Klicka på projektfilen (blå ikonen högst upp i navigatorn till vänster).
2. Under fliken **General** > **Minimum Deployments**, sätt **iOS 17.0** (eller högre).

### 3. Lägg till Swift-filerna
Dra eller skapa följande filer i projektet under mappen `StreamPlayer`:
- `Channel.swift` (Models)
- `ChannelService.swift` (Services)
- `ChannelListViewModel.swift` (ViewModels)
- `PlayerWebView.swift` (Views)
- `ChannelListView.swift` (Views)
- `PlayerView.swift` (Views)
- Ersätt den genererade `StreamPlayerApp.swift` med den medföljande källkoden.

### 4. Konfigurera Info.plist (Nätverk & Bakgrundsljud)
1. Välj ditt **Target** > fliken **Signing & Capabilities**.
2. Klicka på **+ Capability** och lägg till **Background Modes**.
3. Kryssa i **Audio, AirPlay, and Picture in Picture**.
4. Gå till fliken **Info**:
   - Högerklicka och välj **Add Row**.
   - Lägg till **App Transport Security Settings** (`NSAppTransportSecurity`).
   - Under den, lägg till **Allow Arbitrary Loads in Web Content** (`NSAllowsArbitraryLoadsInWebContent`) och sätt till `YES`.
   - Lägg valfritt till **Allow Arbitrary Loads** (`NSAllowsArbitraryLoads`) och sätt till `YES`.

### 5. Varför WKWebView är det optimala valet för dlive.sx
Webbsidan `https://dlive.sx/stream/stream-{id}.php` använder sessionstokens, cookies och JavaScript för att initiera HLS-videon. 
Genom att använda `WKWebView` med:
- `Referer: https://dlive.sx/`
- `Origin: https://dlive.sx`
- `allowsInlineMediaPlayback = true`
får du 100% kompatibilitet utan att hotlink-blockeringar slår till!
