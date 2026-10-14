import React, { useState, useEffect, useRef } from 'react';
import {
  FileCode,
  Folder,
  Download,
  Copy,
  Check,
  Smartphone,
  Layers,
  ShieldCheck,
  Search,
  Star,
  RefreshCw,
  X,
  Info,
  Maximize2,
  Minimize2,
  RotateCcw,
  Key,
  ExternalLink,
  ChevronRight,
  Tv,
  Wifi,
  Radio,
  SlidersHorizontal,
  Volume2,
  Play,
  RotateCw
} from 'lucide-react';
import JSZip from 'jszip';
import { SWIFT_FILES, SwiftFileItem } from './swiftFilesData';

// Mock channels matching real Swedish IPTV / Sports channels
interface DemoChannel {
  id: string;
  name: string;
  category: string;
  logoText: string;
  bgColor: string;
  viewers: string;
}

const INITIAL_CHANNELS: DemoChannel[] = [
  { id: "101", name: "Viaplay Sport 1 HD", category: "Sport", logoText: "VP1", bgColor: "bg-blue-600", viewers: "4.8k" },
  { id: "102", name: "Viaplay Sport 2 HD", category: "Sport", logoText: "VP2", bgColor: "bg-blue-700", viewers: "2.1k" },
  { id: "103", name: "SVT 1 HD", category: "Allmänt", logoText: "SVT1", bgColor: "bg-red-600", viewers: "12.4k" },
  { id: "104", name: "SVT 2 HD", category: "Allmänt", logoText: "SVT2", bgColor: "bg-red-700", viewers: "5.3k" },
  { id: "105", name: "TV4 Direkt HD", category: "Underhållning", logoText: "TV4", bgColor: "bg-amber-600", viewers: "8.9k" },
  { id: "106", name: "Eurosport 1 Sweden", category: "Sport", logoText: "ES1", bgColor: "bg-sky-600", viewers: "3.2k" },
  { id: "107", name: "Sky Sports Premier League", category: "Sport", logoText: "SKY", bgColor: "bg-indigo-600", viewers: "15.1k" },
  { id: "108", name: "CNN International HD", category: "Nyheter", logoText: "CNN", bgColor: "bg-rose-600", viewers: "1.9k" },
  { id: "109", name: "BBC News Live", category: "Nyheter", logoText: "BBC", bgColor: "bg-neutral-800", viewers: "3.7k" },
  { id: "110", name: "Discovery Channel Nordic", category: "Dokumentär", logoText: "DISC", bgColor: "bg-teal-600", viewers: "1.4k" },
  { id: "111", name: "Kanal 5 HD", category: "Underhållning", logoText: "K5", bgColor: "bg-purple-600", viewers: "2.8k" },
  { id: "112", name: "C More Fotboll HD", category: "Sport", logoText: "CMF", bgColor: "bg-emerald-600", viewers: "6.5k" },
];

export default function App() {
  // Navigation & View state
  const [activeTab, setActiveTab] = useState<'code' | 'simulator' | 'architecture' | 'guide'>('code');
  const [selectedFileId, setSelectedFileId] = useState<string>('channel-model');
  const [copiedFileId, setCopiedFileId] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [searchCodeQuery, setSearchCodeQuery] = useState<string>('');

  // Simulator state
  const [simSearch, setSimSearch] = useState<string>('');
  const [simCategory, setSimCategory] = useState<string>('Alla');
  const [simFavorites, setSimFavorites] = useState<Set<string>>(new Set(['101', '107']));
  const [simShowOnlyFavs, setSimShowOnlyFavs] = useState<boolean>(false);
  const [activePlayingChannel, setActivePlayingChannel] = useState<DemoChannel | null>(null);
  const [simControlsVisible, setSimControlsVisible] = useState<boolean>(true);
  const [simIsLandscape, setSimIsLandscape] = useState<boolean>(false);
  const [simIsLoadingStream, setSimIsLoadingStream] = useState<boolean>(false);
  const [simApiKey, setSimApiKey] = useState<string>('my_private_stream_key_99');
  const [simShowSettings, setSimShowSettings] = useState<boolean>(false);
  const [simShowDiagnostics, setSimShowDiagnostics] = useState<boolean>(false);
  const [simIsRefreshing, setSimIsRefreshing] = useState<boolean>(false);

  // Canvas ref for video playback simulation
  const videoCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Selected file object
  const currentFile = SWIFT_FILES.find((f) => f.id === selectedFileId) || SWIFT_FILES[0];

  // Simulator clock
  const [currentTime, setCurrentTime] = useState<string>('19:42');
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    };
    updateTime();
    const interval = setInterval(updateTime, 30000);
    return () => clearInterval(interval);
  }, []);

  // Simulated video streaming animation on canvas
  useEffect(() => {
    if (!activePlayingChannel) return;
    setSimIsLoadingStream(true);
    const loadTimer = setTimeout(() => {
      setSimIsLoadingStream(false);
    }, 700);

    let animationId: number;
    let frame = 0;
    const canvas = videoCanvasRef.current;
    if (!canvas) return () => clearTimeout(loadTimer);
    const ctx = canvas.getContext('2d');
    if (!ctx) return () => clearTimeout(loadTimer);

    const render = () => {
      frame++;
      const w = canvas.width;
      const h = canvas.height;

      // Dark animated streaming gradient background
      const grad = ctx.createLinearGradient(0, 0, w, h);
      const shift = (frame * 0.01) % 1;
      grad.addColorStop(0, '#090d16');
      grad.addColorStop(0.5, '#111927');
      grad.addColorStop(1, '#0b111e');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);

      // Simulated broadcast waveform or pitch/court animation
      ctx.strokeStyle = 'rgba(59, 130, 246, 0.4)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      for (let x = 0; x < w; x += 10) {
        const y = h * 0.5 + Math.sin(x * 0.02 + frame * 0.05) * 25 + Math.cos(x * 0.01 - frame * 0.03) * 15;
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      // Secondary frequency line
      ctx.strokeStyle = 'rgba(168, 85, 247, 0.25)';
      ctx.beginPath();
      for (let x = 0; x < w; x += 12) {
        const y = h * 0.55 + Math.cos(x * 0.015 + frame * 0.04) * 30;
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      // Simulated live watermark and HUD
      ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
      ctx.font = 'bold 13px system-ui, sans-serif';
      ctx.fillText(activePlayingChannel.name, 24, 40);

      ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
      ctx.font = '11px monospace';
      ctx.fillText(`1080p60 · 6.2 Mbps · HLS .m3u8`, 24, 58);
      ctx.fillText(`Headers Verified: Referer: https://dlive.sx/`, 24, 74);

      animationId = requestAnimationFrame(render);
    };

    animationId = requestAnimationFrame(render);
    return () => {
      clearTimeout(loadTimer);
      cancelAnimationFrame(animationId);
    };
  }, [activePlayingChannel, simIsLandscape]);

  // Copy single file
  const copyCurrentCode = async (file: SwiftFileItem) => {
    try {
      await navigator.clipboard.writeText(file.content);
      setCopiedFileId(file.id);
      setTimeout(() => setCopiedFileId(null), 2200);
    } catch {
      // Fallback
    }
  };

  // Download single file
  const downloadSingleFile = (file: SwiftFileItem) => {
    const blob = new Blob([file.content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = file.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Download complete Xcode Project as ZIP
  const downloadFullProjectZip = async () => {
    setIsExporting(true);
    try {
      const zip = new JSZip();
      const rootFolder = zip.folder('StreamPlayer');

      SWIFT_FILES.forEach((file) => {
        // Strip out "StreamPlayer/" from path
        const relativePath = file.path.replace('StreamPlayer/', '');
        rootFolder?.file(relativePath, file.content);
      });

      // Add Xcode project placeholder structure
      const projectPbxproj = `// !$*UTF8*$!
{
  archiveVersion = 1;
  classes = {};
  objectVersion = 56;
  objects = {};
  rootObject = 000000000000000000000000;
}
`;
      zip.file('StreamPlayer.xcodeproj/project.pbxproj', projectPbxproj);

      const content = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(content);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'StreamPlayer-SwiftUI-iOS17.zip';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error(e);
    } finally {
      setIsExporting(false);
    }
  };

  // Filter simulator channels
  const simCategories = ['Alla', 'Sport', 'Allmänt', 'Underhållning', 'Nyheter', 'Dokumentär'];
  const filteredChannels = INITIAL_CHANNELS.filter((ch) => {
    if (simShowOnlyFavs && !simFavorites.has(ch.id)) return false;
    if (simCategory !== 'Alla' && ch.category.toLowerCase() !== simCategory.toLowerCase()) return false;
    if (simSearch.trim()) {
      const q = simSearch.toLowerCase();
      return ch.name.toLowerCase().includes(q) || ch.category.toLowerCase().includes(q) || ch.id.includes(q);
    }
    return true;
  });

  const toggleFavorite = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setSimFavorites((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSimRefresh = () => {
    setSimIsRefreshing(true);
    setTimeout(() => {
      setSimIsRefreshing(false);
    }, 800);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-blue-600 selection:text-white">
      {/* Top Bar Contract (3 zones separated by gap-8) */}
      <header className="flex items-center justify-between gap-8 px-6 py-3.5 border-b border-slate-800 bg-slate-900/90 backdrop-blur sticky top-0 z-50">
        {/* Zone 1: Single element brand mark */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
            <Tv className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base font-bold tracking-tight text-white whitespace-nowrap">
              StreamPlayer <span className="text-xs font-normal text-blue-400">iOS 17 Suite</span>
            </h1>
          </div>
        </div>

        {/* Zone 2: Single-line text navigation links */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-300">
          <button
            onClick={() => setActiveTab('code')}
            className={`transition-colors whitespace-nowrap shrink-0 flex items-center gap-2 pb-1 border-b-2 ${
              activeTab === 'code' ? 'border-blue-500 text-white font-semibold' : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileCode className="w-4 h-4" />
            Xcode-källkod
          </button>
          <button
            onClick={() => setActiveTab('simulator')}
            className={`transition-colors whitespace-nowrap shrink-0 flex items-center gap-2 pb-1 border-b-2 ${
              activeTab === 'simulator' ? 'border-blue-500 text-white font-semibold' : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Smartphone className="w-4 h-4" />
            iOS 17 Simulator
          </button>
          <button
            onClick={() => setActiveTab('architecture')}
            className={`transition-colors whitespace-nowrap shrink-0 flex items-center gap-2 pb-1 border-b-2 ${
              activeTab === 'architecture' ? 'border-blue-500 text-white font-semibold' : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            Headers & Arkitektur
          </button>
          <button
            onClick={() => setActiveTab('guide')}
            className={`transition-colors whitespace-nowrap shrink-0 flex items-center gap-2 pb-1 border-b-2 ${
              activeTab === 'guide' ? 'border-blue-500 text-white font-semibold' : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className="w-4 h-4" />
            Xcode-guide
          </button>
        </nav>

        {/* Zone 3: 1 primary action */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={downloadFullProjectZip}
            disabled={isExporting}
            className="px-4 py-2 text-xs font-medium text-white bg-blue-600 hover:bg-blue-500 rounded-lg shadow-sm transition-colors flex items-center gap-2 whitespace-nowrap shrink-0 cursor-pointer disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            {isExporting ? 'Skapar ZIP...' : 'Ladda ner Xcode (.ZIP)'}
          </button>
        </div>
      </header>

      {/* Main Workspace */}
      <main className="flex-1 flex flex-col">
        {/* TAB 1: XCODE CODE EXPLORER */}
        {activeTab === 'code' && (
          <div className="flex-1 flex flex-col lg:flex-row overflow-hidden min-h-[calc(100vh-65px)]">
            {/* Left File Tree Sidebar */}
            <aside className="w-full lg:w-80 bg-slate-900 border-r border-slate-800 p-4 flex flex-col shrink-0">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-slate-400 tracking-wider uppercase">Projektfiler (iOS 17+)</span>
                <span className="text-xs text-slate-500">{SWIFT_FILES.length} filer</span>
              </div>

              {/* Quick file search */}
              <div className="relative mb-3">
                <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Sök fil..."
                  value={searchCodeQuery}
                  onChange={(e) => setSearchCodeQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 bg-slate-950 border border-slate-800 rounded-md text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* File list grouped */}
              <div className="flex-1 overflow-y-auto space-y-1">
                {SWIFT_FILES.filter((f) => f.name.toLowerCase().includes(searchCodeQuery.toLowerCase()) || f.folder.toLowerCase().includes(searchCodeQuery.toLowerCase())).map((file) => {
                  const isSelected = file.id === currentFile.id;
                  return (
                    <button
                      key={file.id}
                      onClick={() => setSelectedFileId(file.id)}
                      className={`w-full text-left px-3 py-2.5 rounded-lg text-xs transition-colors flex items-center gap-2.5 cursor-pointer ${
                        isSelected
                          ? 'bg-blue-600/20 text-blue-300 border border-blue-500/30'
                          : 'text-slate-300 hover:bg-slate-800/60'
                      }`}
                    >
                      <FileCode className={`w-4 h-4 shrink-0 ${isSelected ? 'text-blue-400' : 'text-slate-500'}`} />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate flex items-center justify-between">
                          <span>{file.name}</span>
                          <span className="text-[10px] text-slate-500 ml-1">{file.folder}</span>
                        </div>
                        <div className="text-[10px] text-slate-500 truncate">{file.badge}</div>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Quick project info box */}
              <div className="mt-4 pt-3 border-t border-slate-800 text-[11px] text-slate-400 space-y-1">
                <div className="flex justify-between">
                  <span>Target:</span>
                  <span className="text-slate-200 font-mono">iOS 17.0+</span>
                </div>
                <div className="flex justify-between">
                  <span>UI Framework:</span>
                  <span className="text-slate-200">SwiftUI + WebKit</span>
                </div>
                <div className="flex justify-between">
                  <span>Mönster:</span>
                  <span className="text-slate-200">MVVM (@Observable)</span>
                </div>
              </div>
            </aside>

            {/* Main Code View Area */}
            <div className="flex-1 flex flex-col bg-slate-950 overflow-hidden">
              {/* File header bar */}
              <div className="px-6 py-4 border-b border-slate-800 flex flex-wrap items-center justify-between gap-4 bg-slate-900/50">
                <div>
                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    <Folder className="w-3.5 h-3.5 text-slate-500" />
                    <span>{currentFile.path}</span>
                    <span>·</span>
                    <span className="text-blue-400 font-medium">{currentFile.badge}</span>
                  </div>
                  <h2 className="text-lg font-bold text-white mt-1">{currentFile.name}</h2>
                  <p className="text-xs text-slate-400 mt-0.5">{currentFile.description}</p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => copyCurrentCode(currentFile)}
                    className="px-3 py-1.5 rounded-md bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 flex items-center gap-1.5 transition-colors cursor-pointer border border-slate-700"
                  >
                    {copiedFileId === currentFile.id ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-emerald-400">Kopierad!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Kopiera kod</span>
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => downloadSingleFile(currentFile)}
                    className="px-3 py-1.5 rounded-md bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 flex items-center gap-1.5 transition-colors cursor-pointer border border-slate-700"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Ladda ner</span>
                  </button>
                </div>
              </div>

              {/* Code display with line numbers */}
              <div className="flex-1 overflow-auto p-4 sm:p-6 font-mono text-xs leading-relaxed bg-slate-950 text-slate-300">
                <pre className="overflow-x-auto">
                  <code>{currentFile.content}</code>
                </pre>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: INTERACTIVE IOS 17 SIMULATOR */}
        {activeTab === 'simulator' && (
          <div className="flex-1 flex flex-col lg:flex-row items-center justify-center p-6 gap-8 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
            {/* Left Controls & Inspector */}
            <div className="w-full lg:w-96 space-y-4">
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                    <SlidersHorizontal className="w-4 h-4 text-blue-400" />
                    Simulator Kontrollpanel
                  </h3>
                  <button
                    onClick={() => setSimIsLandscape(!simIsLandscape)}
                    className="px-2.5 py-1 text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-md border border-slate-700 flex items-center gap-1.5 cursor-pointer"
                  >
                    <RotateCw className="w-3.5 h-3.5" />
                    <span>{simIsLandscape ? 'Porträtt' : 'Landskap'}</span>
                  </button>
                </div>

                <div className="space-y-3 text-xs">
                  <div>
                    <label className="text-slate-400 block mb-1">DaddyAPI Nyckel (Simulerad):</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={simApiKey}
                        onChange={(e) => setSimApiKey(e.target.value)}
                        className="flex-1 px-3 py-1.5 bg-slate-950 border border-slate-800 rounded text-slate-200 font-mono"
                      />
                      <button
                        onClick={handleSimRefresh}
                        className="px-2.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded cursor-pointer"
                        title="Uppdatera lista"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${simIsRefreshing ? 'animate-spin' : ''}`} />
                      </button>
                    </div>
                  </div>

                  <div className="p-3 bg-slate-950/80 rounded-lg border border-slate-800 space-y-1.5 text-[11px]">
                    <div className="text-slate-400 font-semibold mb-1">Aktiva Förfrågningsheaders:</div>
                    <div className="flex justify-between font-mono">
                      <span className="text-slate-500">Referer:</span>
                      <span className="text-emerald-400">https://dlive.sx/</span>
                    </div>
                    <div className="flex justify-between font-mono">
                      <span className="text-slate-500">Origin:</span>
                      <span className="text-emerald-400">https://dlive.sx</span>
                    </div>
                    <div className="flex justify-between font-mono">
                      <span className="text-slate-500">User-Agent:</span>
                      <span className="text-slate-300 truncate max-w-[170px]">Mobile/Safari iOS 17</span>
                    </div>
                  </div>

                  {activePlayingChannel ? (
                    <div className="p-3 bg-blue-950/30 border border-blue-800/40 rounded-lg space-y-1 text-[11px]">
                      <div className="text-blue-300 font-medium flex items-center justify-between">
                        <span>Aktiv Ström:</span>
                        <span className="text-emerald-400 font-bold flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                          SPELAR
                        </span>
                      </div>
                      <div className="text-slate-300 font-semibold">{activePlayingChannel.name}</div>
                      <div className="font-mono text-slate-400 break-all text-[10px]">
                        https://dlive.sx/stream/stream-{activePlayingChannel.id}.php
                      </div>
                      <button
                        onClick={() => setActivePlayingChannel(null)}
                        className="mt-2 w-full py-1 text-center bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-xs cursor-pointer"
                      >
                        Stäng spelare och återgå till lista
                      </button>
                    </div>
                  ) : (
                    <p className="text-slate-500 italic text-[11px]">
                      Klicka på en kanal i telefonen till höger för att testa `PlayerView` och `PlayerWebView` med Referer-bypass.
                    </p>
                  )}
                </div>
              </div>

              {/* Feature highlight */}
              <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-xl text-xs space-y-2">
                <div className="font-semibold text-slate-200">Testa dessa funktioner:</div>
                <ul className="space-y-1 text-slate-400 list-disc list-inside">
                  <li>Sök i fältet (t.ex. "Sport", "SVT", "101")</li>
                  <li>Filtrera på kategorier (Sport, Nyheter, etc.)</li>
                  <li>Klicka på stjärnan för att spara favoriter</li>
                  <li>Klicka på en kanal för att starta helskärmsspelaren</li>
                  <li>Klicka på skärmen i spelaren för att visa/dölja kontroller</li>
                </ul>
              </div>
            </div>

            {/* Interactive iPhone 15 Pro Device Frame */}
            <div
              className={`transition-all duration-300 ease-out relative select-none ${
                simIsLandscape ? 'w-[720px] h-[375px]' : 'w-[375px] h-[740px]'
              } bg-black rounded-[48px] p-3 shadow-2xl shadow-blue-900/20 ring-1 ring-slate-700/80 ring-offset-4 ring-offset-slate-950 flex flex-col overflow-hidden`}
            >
              {/* Inner screen container */}
              <div className="w-full h-full bg-slate-950 rounded-[38px] overflow-hidden flex flex-col relative border border-slate-800/80">
                {/* Dynamic Island / Notch */}
                {!simIsLandscape && (
                  <div className="absolute top-2 left-1/2 -translate-x-1/2 w-28 h-6 bg-black rounded-full z-40 flex items-center justify-between px-2.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-slate-900 ring-1 ring-slate-800"></div>
                    <div className="w-2.5 h-2.5 rounded-full bg-slate-900 flex items-center justify-center">
                      <div className="w-1 h-1 rounded-full bg-blue-500/40"></div>
                    </div>
                  </div>
                )}

                {/* Status Bar */}
                <div className="h-10 pt-1 px-7 flex items-center justify-between text-[13px] font-semibold text-white shrink-0 z-30">
                  <span>{currentTime}</span>
                  <div className="flex items-center gap-1.5 text-xs">
                    <Wifi className="w-3.5 h-3.5 text-white" />
                    <div className="w-5 h-2.5 rounded-sm border border-white p-0.5 flex items-center">
                      <div className="w-3 h-full bg-white rounded-xs"></div>
                    </div>
                  </div>
                </div>

                {/* Simulated Screen Content */}
                <div className="flex-1 flex flex-col overflow-hidden relative">
                  {/* IF ACTIVE PLAYER VIEW */}
                  {activePlayingChannel ? (
                    <div className="flex-1 bg-black flex flex-col relative overflow-hidden">
                      {/* Video streaming canvas */}
                      <canvas
                        ref={videoCanvasRef}
                        width={simIsLandscape ? 720 : 375}
                        height={simIsLandscape ? 340 : 660}
                        onClick={() => setSimControlsVisible(!simControlsVisible)}
                        className="w-full h-full object-cover cursor-pointer"
                      />

                      {/* Loading state indicator */}
                      {simIsLoadingStream && (
                        <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center gap-3 z-20">
                          <RefreshCw className="w-8 h-8 text-blue-500 animate-spin" />
                          <span className="text-xs text-slate-200 font-medium">Ansluter till stream-{activePlayingChannel.id}.php...</span>
                        </div>
                      )}

                      {/* Player Overlay Controls */}
                      {simControlsVisible && (
                        <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-4 bg-gradient-to-b from-black/80 via-transparent to-black/80 z-10">
                          {/* Top bar */}
                          <div className="flex items-center justify-between pointer-events-auto">
                            <button
                              onClick={() => setActivePlayingChannel(null)}
                              className="w-8 h-8 rounded-full bg-black/60 backdrop-blur text-white flex items-center justify-center hover:bg-black/90 cursor-pointer"
                            >
                              <X className="w-4 h-4" />
                            </button>
                            <div className="text-center">
                              <div className="text-xs font-bold text-white leading-tight">{activePlayingChannel.name}</div>
                              <div className="text-[10px] text-slate-400">
                                {activePlayingChannel.category} · #{activePlayingChannel.id}
                              </div>
                            </div>
                            <button
                              onClick={() => setSimShowDiagnostics(true)}
                              className="w-8 h-8 rounded-full bg-black/60 backdrop-blur text-white flex items-center justify-center hover:bg-black/90 cursor-pointer"
                            >
                              <Info className="w-4 h-4" />
                            </button>
                          </div>

                          {/* Bottom bar */}
                          <div className="flex items-center justify-between pointer-events-auto">
                            <div className="flex items-center gap-2">
                              <span className="px-2 py-0.5 rounded-full bg-red-600 text-[10px] font-bold text-white flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping"></span>
                                LIVE
                              </span>
                              <span className="text-[10px] text-slate-300 font-mono">dlive.sx</span>
                            </div>
                            <button
                              onClick={() => setSimIsLandscape(!simIsLandscape)}
                              className="px-2 py-1 rounded bg-black/60 text-slate-200 text-[11px] flex items-center gap-1"
                            >
                              <RotateCw className="w-3 h-3" />
                              <span>{simIsLandscape ? 'Porträtt' : 'Fullskärm'}</span>
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Diagnostics Sheet Modal */}
                      {simShowDiagnostics && (
                        <div className="absolute inset-0 bg-black/80 backdrop-blur-sm z-30 flex flex-col justify-end">
                          <div className="bg-slate-900 border-t border-slate-800 rounded-t-2xl p-4 text-xs space-y-3">
                            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                              <span className="font-bold text-white">Strömdiagnostik</span>
                              <button
                                onClick={() => setSimShowDiagnostics(false)}
                                className="text-blue-400 font-semibold"
                              >
                                Klar
                              </button>
                            </div>
                            <div className="space-y-1.5 text-[11px]">
                              <div className="flex justify-between">
                                <span className="text-slate-400">URL:</span>
                                <span className="text-slate-200 font-mono text-[10px]">
                                  dlive.sx/stream/stream-{activePlayingChannel.id}.php
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-slate-400">Referer:</span>
                                <span className="text-emerald-400 font-mono">https://dlive.sx/</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-slate-400">Origin:</span>
                                <span className="text-emerald-400 font-mono">https://dlive.sx</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-slate-400">Inline Playback:</span>
                                <span className="text-slate-200">allowsInlineMediaPlayback = true</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    /* CHANNEL LIST VIEW */
                    <div className="flex-1 flex flex-col bg-slate-900 overflow-hidden">
                      {/* Navigation Bar */}
                      <div className="px-4 pt-2 pb-2 bg-slate-900 border-b border-slate-800/80 shrink-0">
                        <div className="flex items-center justify-between mb-2">
                          <h2 className="text-lg font-bold text-white tracking-tight">Live Kanaler</h2>
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => setSimShowOnlyFavs(!simShowOnlyFavs)}
                              className={`p-1.5 rounded-full transition-colors cursor-pointer ${
                                simShowOnlyFavs ? 'text-amber-400 bg-amber-400/20' : 'text-slate-400 hover:text-white'
                              }`}
                              title="Favoriter"
                            >
                              <Star className={`w-4 h-4 ${simShowOnlyFavs ? 'fill-current' : ''}`} />
                            </button>
                            <button
                              onClick={() => setSimShowSettings(true)}
                              className="p-1.5 text-slate-400 hover:text-white rounded-full cursor-pointer"
                              title="Inställningar"
                            >
                              <Key className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        {/* Searchable input */}
                        <div className="relative">
                          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                          <input
                            type="text"
                            placeholder="Sök kanal, kategori eller ID..."
                            value={simSearch}
                            onChange={(e) => setSimSearch(e.target.value)}
                            className="w-full pl-8 pr-7 py-1.5 bg-slate-800/90 rounded-lg text-xs text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
                          />
                          {simSearch && (
                            <button
                              onClick={() => setSimSearch('')}
                              className="absolute right-2.5 top-2.5 text-slate-400 hover:text-white"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Category horizontal scroll bar */}
                      <div className="px-3 py-2 bg-slate-900 border-b border-slate-800/60 flex gap-1.5 overflow-x-auto no-scrollbar shrink-0">
                        {simCategories.map((cat) => {
                          const isSel = simCategory === cat;
                          return (
                            <button
                              key={cat}
                              onClick={() => setSimCategory(cat)}
                              className={`px-3 py-1 rounded-full text-[11px] font-medium whitespace-nowrap transition-colors cursor-pointer ${
                                isSel
                                  ? 'bg-blue-600 text-white'
                                  : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                              }`}
                            >
                              {cat}
                            </button>
                          );
                        })}
                      </div>

                      {/* Pull-to-refresh & list count indicator */}
                      <div className="px-4 py-1.5 bg-slate-950/40 flex items-center justify-between text-[10px] text-slate-400 shrink-0">
                        <span>{filteredChannels.length} kanaler</span>
                        {simIsRefreshing ? (
                          <span className="flex items-center gap-1 text-blue-400">
                            <RefreshCw className="w-2.5 h-2.5 animate-spin" /> Laddar om...
                          </span>
                        ) : (
                          <span>Dra neråt för att uppdatera</span>
                        )}
                      </div>

                      {/* Channels scroll list */}
                      <div className="flex-1 overflow-y-auto divide-y divide-slate-800/60 p-2">
                        {filteredChannels.length === 0 ? (
                          <div className="h-full flex flex-col items-center justify-center p-6 text-center text-slate-500 text-xs">
                            <Search className="w-8 h-8 mb-2 opacity-50" />
                            <span>Inga kanaler matchar sökningen</span>
                          </div>
                        ) : (
                          filteredChannels.map((ch) => {
                            const isFav = simFavorites.has(ch.id);
                            return (
                              <div
                                key={ch.id}
                                onClick={() => setActivePlayingChannel(ch)}
                                className="p-2.5 rounded-lg hover:bg-slate-800/70 transition-colors flex items-center gap-3 cursor-pointer group"
                              >
                                {/* Channel logo avatar */}
                                <div
                                  className={`w-9 h-9 rounded-lg ${ch.bgColor} text-white font-bold text-xs flex items-center justify-center shadow-xs shrink-0`}
                                >
                                  {ch.logoText}
                                </div>

                                {/* Channel info */}
                                <div className="flex-1 min-w-0">
                                  <div className="text-xs font-semibold text-white truncate group-hover:text-blue-400 transition-colors">
                                    {ch.name}
                                  </div>
                                  <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
                                    <span>{ch.category}</span>
                                    <span>·</span>
                                    <span className="font-mono">#{ch.id}</span>
                                  </div>
                                </div>

                                {/* Star favorite button */}
                                <button
                                  onClick={(e) => toggleFavorite(ch.id, e)}
                                  className={`p-1.5 rounded-md transition-colors cursor-pointer ${
                                    isFav ? 'text-amber-400' : 'text-slate-600 hover:text-slate-400'
                                  }`}
                                >
                                  <Star className={`w-3.5 h-3.5 ${isFav ? 'fill-current' : ''}`} />
                                </button>

                                <ChevronRight className="w-3.5 h-3.5 text-slate-600 group-hover:text-slate-400 transition-colors" />
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>
                  )}

                  {/* Settings Sheet in simulator */}
                  {simShowSettings && (
                    <div className="absolute inset-0 bg-black/80 backdrop-blur-sm z-40 flex flex-col justify-end">
                      <div className="bg-slate-900 border-t border-slate-800 rounded-t-2xl p-4 text-xs space-y-3">
                        <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                          <span className="font-bold text-white">DaddyAPI Inställningar</span>
                          <button
                            onClick={() => setSimShowSettings(false)}
                            className="text-blue-400 font-semibold"
                          >
                            Klar
                          </button>
                        </div>
                        <div>
                          <label className="text-slate-400 block mb-1">API-Nyckel:</label>
                          <input
                            type="text"
                            value={simApiKey}
                            onChange={(e) => setSimApiKey(e.target.value)}
                            className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded text-slate-200 font-mono text-xs"
                          />
                        </div>
                        <div className="p-2.5 bg-slate-950 rounded border border-slate-800 text-[10px] text-slate-400">
                          Appen sparar nyckeln säkert i `UserDefaults` och anropar därefter:
                          <code className="text-blue-400 block mt-1 break-all">
                            https://dlive.sx/daddyapi.php?key={simApiKey}&endpoint=channels
                          </code>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Home Indicator */}
                {!simIsLandscape && (
                  <div className="h-5 flex items-center justify-center shrink-0">
                    <div className="w-28 h-1 bg-slate-600/60 rounded-full"></div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: ARCHITECTURE & HEADERS DEEP DIVE */}
        {activeTab === 'architecture' && (
          <div className="flex-1 p-6 md:p-10 max-w-5xl mx-auto space-y-8">
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold text-blue-400 uppercase tracking-wider">
                Senior iOS Arkitektur
              </div>
              <h2 className="text-2xl font-bold text-white mt-1">
                Lösning för HTTP Referer & WebKit Hotlink Bypass
              </h2>
              <p className="text-slate-400 text-sm mt-2 leading-relaxed">
                Stream-servrarna på <code className="text-blue-300">dlive.sx</code> validerar att anropande klienter skickar
                exakt <code className="text-blue-300">Referer: https://dlive.sx/</code> och{' '}
                <code className="text-blue-300">Origin: https://dlive.sx</code>. Här är varför WKWebView i SwiftUI är den överlägsna lösningen.
              </p>
            </div>

            {/* Architecture diagram card */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Layers className="w-5 h-5 text-blue-400" />
                Data- och Uppspelningsflöde (MVVM)
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
                  <div className="font-bold text-blue-400">01. Model & Decodable</div>
                  <div className="font-semibold text-white">Channel.swift</div>
                  <p className="text-slate-400 text-[11px]">
                    Hanterar variationer i DaddyAPI (Int/String IDs, channel_name vs name). Beräknar ström-URL automatiskt.
                  </p>
                </div>

                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
                  <div className="font-bold text-blue-400">02. Nätverksservice</div>
                  <div className="font-semibold text-white">ChannelService.swift</div>
                  <p className="text-slate-400 text-[11px]">
                    Körs med modern <code className="text-slate-200">async/await</code> och URLSession. Läser JSON arrays eller wrap-objekt.
                  </p>
                </div>

                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
                  <div className="font-bold text-blue-400">03. State Management</div>
                  <div className="font-semibold text-white">ChannelListViewModel.swift</div>
                  <p className="text-slate-400 text-[11px]">
                    iOS 17 <code className="text-slate-200">@Observable</code> på <code className="text-slate-200">@MainActor</code>. Sök, kategorier och sparade favoriter.
                  </p>
                </div>

                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
                  <div className="font-bold text-blue-400">04. Spelarmotor</div>
                  <div className="font-semibold text-white">PlayerWebView.swift</div>
                  <p className="text-slate-400 text-[11px]">
                    Injicerar Referer och Origin i URLRequest, tillåter inline media och hanterar inbäddade tokens.
                  </p>
                </div>
              </div>
            </div>

            {/* Comparison table: WKWebView vs Native AVPlayer */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
              <h3 className="text-base font-bold text-white">
                Varför WKWebView & framtida AVPlayer-stöd
              </h3>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400">
                      <th className="py-2.5 px-3">Egenskap</th>
                      <th className="py-2.5 px-3 text-blue-400 font-semibold">WKWebView (Implementerad)</th>
                      <th className="py-2.5 px-3 text-slate-400">Native AVPlayer (Alternativ)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 text-slate-300">
                    <tr>
                      <td className="py-2.5 px-3 font-medium text-white">Referer & Origin Headers</td>
                      <td className="py-2.5 px-3 text-emerald-400">✅ 100% stöd i initial förfrågan + meta script</td>
                      <td className="py-2.5 px-3 text-amber-400">⚠️ Kräver AVURLAssetHTTPHeaderFieldsKey</td>
                    </tr>
                    <tr>
                      <td className="py-2.5 px-3 font-medium text-white">Inbäddade JavaScript-tokens</td>
                      <td className="py-2.5 px-3 text-emerald-400">✅ Kör PHP, iframes och sessionstokens direkt</td>
                      <td className="py-2.5 px-3 text-red-400">❌ Kan inte köra sidans JavaScript eller cookies</td>
                    </tr>
                    <tr>
                      <td className="py-2.5 px-3 font-medium text-white">HLS / HTML5 Fullskärm</td>
                      <td className="py-2.5 px-3 text-emerald-400">✅ Native WebKit fullskärm + PiP</td>
                      <td className="py-2.5 px-3 text-emerald-400">✅ Native AVPlayerViewController</td>
                    </tr>
                    <tr>
                      <td className="py-2.5 px-3 font-medium text-white">Stabilitet vid backend-ändringar</td>
                      <td className="py-2.5 px-3 text-emerald-400">✅ Hög; tål att stream-{'{id}'}.php ändrar logik</td>
                      <td className="py-2.5 px-3 text-amber-400">⚠️ Kräver kontinuerlig scraping av direkt .m3u8</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Audio & ATS Settings summary */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-2">
                <div className="flex items-center gap-2 text-sm font-bold text-white">
                  <Volume2 className="w-4 h-4 text-blue-400" />
                  Bakgrundsljud & AVAudioSession
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  I <code className="text-slate-200">StreamPlayerApp.swift</code> sätts ljudsessionen till:
                </p>
                <pre className="p-3 bg-slate-950 rounded text-[11px] font-mono text-blue-300 overflow-x-auto">
                  {`try session.setCategory(.playback,\n  mode: .moviePlayback,\n  options: [.allowAirPlay])`}
                </pre>
                <p className="text-[11px] text-slate-400">
                  I kombination med <code className="text-slate-300">UIBackgroundModes = ["audio"]</code> i Info.plist
                  kan användaren lyssna på livesändningar även med låst skärm.
                </p>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-2">
                <div className="flex items-center gap-2 text-sm font-bold text-white">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  App Transport Security (ATS)
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Eftersom många IPTV-kanaler och CDN-nätverk serverar HLS .ts/.m3u8-bitar över HTTP krävs följande i Info.plist:
                </p>
                <pre className="p-3 bg-slate-950 rounded text-[11px] font-mono text-emerald-300 overflow-x-auto">
                  {`<key>NSAppTransportSecurity</key>\n<dict>\n  <key>NSAllowsArbitraryLoadsInWebContent</key>\n  <true/>\n</dict>`}
                </pre>
                <p className="text-[11px] text-slate-400">
                  Detta tillåter att WebKit laddar mediakällor utan att Apple ATS blockerar anslutningen.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: QUICK GUIDE & XCODE SETUP */}
        {activeTab === 'guide' && (
          <div className="flex-1 p-6 md:p-10 max-w-4xl mx-auto space-y-6">
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold text-blue-400 uppercase tracking-wider">
                Steg-för-steg Instruktioner
              </div>
              <h2 className="text-2xl font-bold text-white mt-1">Så sätter du upp projektet i Xcode</h2>
              <p className="text-slate-400 text-sm mt-1">
                Följ dessa 4 steg för att köra appen på din iPhone eller iOS 17 Simulator inom 2 minuter.
              </p>
            </div>

            <div className="space-y-4">
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex gap-4">
                <div className="w-8 h-8 rounded-full bg-blue-600/20 text-blue-400 font-bold text-sm flex items-center justify-center shrink-0 border border-blue-500/30">
                  1
                </div>
                <div className="space-y-1.5 text-xs text-slate-300">
                  <div className="text-sm font-bold text-white">Skapa nytt SwiftUI-projekt i Xcode</div>
                  <p className="text-slate-400">
                    Öppna Xcode &gt; <strong>File &gt; New &gt; Project</strong>. Välj fliken <strong>iOS</strong> och mallen <strong>App</strong>.
                  </p>
                  <p className="text-slate-400">
                    Sätt <strong>Product Name:</strong> <code className="text-blue-300">StreamPlayer</code>,{' '}
                    <strong>Interface:</strong> <code className="text-blue-300">SwiftUI</code>, och <strong>Language:</strong>{' '}
                    <code className="text-blue-300">Swift</code>.
                  </p>
                </div>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex gap-4">
                <div className="w-8 h-8 rounded-full bg-blue-600/20 text-blue-400 font-bold text-sm flex items-center justify-center shrink-0 border border-blue-500/30">
                  2
                </div>
                <div className="space-y-1.5 text-xs text-slate-300">
                  <div className="text-sm font-bold text-white">Lägg till Swift-filerna</div>
                  <p className="text-slate-400">
                    Klicka på knappen <strong>"Ladda ner Xcode (.ZIP)"</strong> högst upp till höger i studion. Packa upp mappen och dra in filerna i din Xcode-projektnavigator:
                  </p>
                  <div className="grid grid-cols-2 gap-2 text-slate-400 font-mono text-[11px] mt-2">
                    <div className="bg-slate-950 p-2 rounded">📁 Models/Channel.swift</div>
                    <div className="bg-slate-950 p-2 rounded">📁 Services/ChannelService.swift</div>
                    <div className="bg-slate-950 p-2 rounded">📁 ViewModels/ChannelListViewModel.swift</div>
                    <div className="bg-slate-950 p-2 rounded">📁 Views/PlayerWebView.swift</div>
                    <div className="bg-slate-950 p-2 rounded">📁 Views/ChannelListView.swift</div>
                    <div className="bg-slate-950 p-2 rounded">📁 Views/PlayerView.swift</div>
                  </div>
                </div>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex gap-4">
                <div className="w-8 h-8 rounded-full bg-blue-600/20 text-blue-400 font-bold text-sm flex items-center justify-center shrink-0 border border-blue-500/30">
                  3
                </div>
                <div className="space-y-1.5 text-xs text-slate-300">
                  <div className="text-sm font-bold text-white">Aktivera Bakgrundsljud (Signing & Capabilities)</div>
                  <p className="text-slate-400">
                    Välj ditt Target i Xcode &gt; fliken <strong>Signing & Capabilities</strong> &gt; Klicka på <strong>+ Capability</strong>.
                  </p>
                  <p className="text-slate-400">
                    Lägg till <strong>Background Modes</strong> och kryssa i:
                  </p>
                  <div className="p-2 bg-slate-950 rounded text-emerald-400 font-mono text-[11px]">
                    ☑ Audio, AirPlay, and Picture in Picture
                  </div>
                </div>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex gap-4">
                <div className="w-8 h-8 rounded-full bg-blue-600/20 text-blue-400 font-bold text-sm flex items-center justify-center shrink-0 border border-blue-500/30">
                  4
                </div>
                <div className="space-y-1.5 text-xs text-slate-300">
                  <div className="text-sm font-bold text-white">Kör på simulator eller iPhone</div>
                  <p className="text-slate-400">
                    Tryck på <kbd className="px-1.5 py-0.5 bg-slate-800 rounded border border-slate-700">Cmd + R</kbd>. Appen startar, visar kanallistan med sökning och laddar streams med rätt Referer!
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
