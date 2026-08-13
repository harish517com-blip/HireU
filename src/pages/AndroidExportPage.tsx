import React, { useState, useEffect } from 'react';
import {
  Smartphone,
  Download,
  Copy,
  Check,
  ExternalLink,
  Layers,
  Terminal,
  Settings,
  ShieldCheck,
  Zap,
  Globe,
  Sparkles,
  Package,
  FileCode,
  SmartphoneNfc,
  Info,
} from 'lucide-react';
import { useApp } from '../context/AppContext';

export const AndroidExportPage: React.FC = () => {
  const { logActivity } = useApp();

  const [packageName, setPackageName] = useState('com.hireu.copilot');
  const [appName, setAppName] = useState('HireU Copilot');
  const [versionName, setVersionName] = useState('1.0.0');
  const [versionCode, setVersionCode] = useState('1');
  const [copiedSection, setCopiedSection] = useState<string | null>(null);
  const [installPrompt, setInstallPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [activeTab, setActiveTab] = useState<'cloud' | 'local' | 'pwa' | 'config'>('cloud');

  const appUrl = typeof window !== 'undefined' ? window.location.origin : 'https://hireu-copilot.app';

  useEffect(() => {
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    };
  }, []);

  const handleCopy = (text: string, sectionId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(sectionId);
    setTimeout(() => setCopiedSection(null), 2000);
  };

  const handleInstallPWA = async () => {
    if (installPrompt) {
      installPrompt.prompt();
      const { outcome } = await installPrompt.userChoice;
      if (outcome === 'accepted') {
        setIsInstalled(true);
        logActivity('Android PWA Installed', 'User installed HireU Copilot on Android device');
      }
      setInstallPrompt(null);
    } else {
      alert(
        'To install on Android:\n1. Open this website in Google Chrome on your Android phone.\n2. Tap the 3 dots menu (⋮) at top right.\n3. Tap "Add to Home screen" or "Install app".'
      );
    }
  };

  const downloadAndroidZip = () => {
    logActivity('Android Project Download', `Generated Android Studio project package for ${packageName}`);
    window.open('/api/download-android-project', '_blank');
  };

  const capacitorConfigJson = JSON.stringify(
    {
      appId: packageName,
      appName: appName,
      webDir: 'dist',
      bundledWebRuntime: false,
      server: {
        url: appUrl,
        cleartext: true,
      },
      android: {
        allowMixedContent: true,
        captureInput: true,
        webContentsDebuggingEnabled: true,
      },
      plugins: {
        SplashScreen: {
          launchShowDuration: 2000,
          backgroundColor: '#0F172A',
          showSpinner: true,
          spinnerColor: '#4F46E5',
        },
      },
    },
    null,
    2
  );

  const twaManifestJson = JSON.stringify(
    {
      packageId: packageName,
      name: appName,
      launcherName: appName.substring(0, 12),
      display: 'standalone',
      themeColor: '#4F46E5',
      navigationColor: '#0F172A',
      backgroundColor: '#0F172A',
      enableNotifications: true,
      startUrl: '/',
      host: appUrl.replace('https://', '').replace('http://', ''),
      iconUrl: `${appUrl}/icon-512.png`,
      maskableIconUrl: `${appUrl}/icon-512.png`,
      splashScreenFadeOutDuration: 300,
      signingKey: {
        path: './android.keystore',
        alias: 'hireu-key',
      },
      appVersionName: versionName,
      appVersionCode: parseInt(versionCode) || 1,
    },
    null,
    2
  );

  const capacitorCommands = `# 1. Install Capacitor CLI dependencies in project
npm install @capacitor/core @capacitor/cli @capacitor/android

# 2. Initialize Capacitor with App ID
npx cap init "${appName}" "${packageName}" --web-dir dist

# 3. Add Android platform code
npx cap add android

# 4. Sync web build files to Android project
npm run build
npx cap sync android

# 5. Build Release APK and AAB binaries using Gradle
cd android
./gradlew assembleRelease # Outputs APK in android/app/build/outputs/apk/release/
./gradlew bundleRelease   # Outputs AAB in android/app/build/outputs/bundle/release/
`;

  const bubblewrapCommands = `# 1. Install Bubblewrap CLI globally
npm install -g @bubblewrap/cli

# 2. Generate Android TWA project from Web Manifest
bubblewrap init --manifest="${appUrl}/manifest.json"

# 3. Compile Android APK (.apk) and Play Store App Bundle (.aab)
bubblewrap build

# Generated binaries:
# - app-release-signed.apk (Direct install on Android phone)
# - app-release-bundle.aab (Upload to Google Play Console)
`;

  const pwabuilderUrl = `https://www.pwabuilder.com/reportcard?site=${encodeURIComponent(appUrl)}`;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Page Header */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl p-6 text-white shadow-xl border border-indigo-500/20 relative overflow-hidden">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-400/30 uppercase tracking-wider flex items-center gap-1.5">
                <Smartphone className="w-3 h-3 text-indigo-400" />
                Android APK & AAB Studio
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 uppercase tracking-wider">
                Native Wrapper Ready
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
              Export HireU Copilot for Android (.apk & .aab)
            </h1>
            <p className="text-slate-300 text-xs md:text-sm max-w-2xl leading-relaxed">
              Package your AI Recruitment Copilot into an official Android App (.APK for direct phone install) or Google Play Store Bundle (.AAB for Play Console distribution).
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={downloadAndroidZip}
              className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-lg shadow-indigo-600/30 flex items-center space-x-2 transition-all"
            >
              <Download className="w-4 h-4" />
              <span>Download Android Studio Project (.zip)</span>
            </button>
            <a
              href={pwabuilderUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold text-xs flex items-center space-x-2 transition-all"
            >
              <span>Instant Cloud Builder</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </div>

      {/* Quick Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex items-center space-x-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-50 border border-emerald-100 text-emerald-600 flex items-center justify-center shrink-0 font-bold">
            APK
          </div>
          <div>
            <p className="text-xs font-bold text-slate-800">Android Package (.apk)</p>
            <p className="text-[11px] text-slate-500">Direct phone install & side-loading</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex items-center space-x-3">
          <div className="w-10 h-10 rounded-lg bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center shrink-0 font-bold">
            AAB
          </div>
          <div>
            <p className="text-xs font-bold text-slate-800">App Bundle (.aab)</p>
            <p className="text-[11px] text-slate-500">Google Play Store publishing format</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex items-center space-x-3">
          <div className="w-10 h-10 rounded-lg bg-purple-50 border border-purple-100 text-purple-600 flex items-center justify-center shrink-0 font-bold">
            PWA
          </div>
          <div>
            <p className="text-xs font-bold text-slate-800">Android Web App</p>
            <p className="text-[11px] text-slate-500">1-Tap Chrome Home Screen install</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex items-center space-x-3">
          <div className="w-10 h-10 rounded-lg bg-amber-50 border border-amber-100 text-amber-600 flex items-center justify-center shrink-0 font-bold">
            TWA
          </div>
          <div>
            <p className="text-xs font-bold text-slate-800">Trusted Web Activity</p>
            <p className="text-[11px] text-slate-500">Native Chromium web runtime wrapper</p>
          </div>
        </div>
      </div>

      {/* Customization Panel */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-4">
        <div className="flex items-center space-x-2 text-slate-900 border-b border-slate-100 pb-3">
          <Settings className="w-4 h-4 text-indigo-600" />
          <h2 className="text-sm font-bold">Android App Settings & Metadata Customizer</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              App Title
            </label>
            <input
              type="text"
              value={appName}
              onChange={(e) => setAppName(e.target.value)}
              className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Package ID (Android Domain)
            </label>
            <input
              type="text"
              value={packageName}
              onChange={(e) => setPackageName(e.target.value)}
              className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-mono focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Version Name
            </label>
            <input
              type="text"
              value={versionName}
              onChange={(e) => setVersionName(e.target.value)}
              className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-mono focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Version Code
            </label>
            <input
              type="number"
              value={versionCode}
              onChange={(e) => setVersionCode(e.target.value)}
              className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-mono focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-200 space-x-2">
        <button
          onClick={() => setActiveTab('cloud')}
          className={`pb-3 px-4 text-xs font-semibold transition-colors border-b-2 flex items-center space-x-2 ${
            activeTab === 'cloud'
              ? 'border-indigo-600 text-indigo-600 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Zap className="w-4 h-4" />
          <span>1. Instant Cloud Build (No Code Setup)</span>
        </button>

        <button
          onClick={() => setActiveTab('local')}
          className={`pb-3 px-4 text-xs font-semibold transition-colors border-b-2 flex items-center space-x-2 ${
            activeTab === 'local'
              ? 'border-indigo-600 text-indigo-600 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Terminal className="w-4 h-4" />
          <span>2. CLI Commands (Capacitor & Bubblewrap)</span>
        </button>

        <button
          onClick={() => setActiveTab('pwa')}
          className={`pb-3 px-4 text-xs font-semibold transition-colors border-b-2 flex items-center space-x-2 ${
            activeTab === 'pwa'
              ? 'border-indigo-600 text-indigo-600 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <SmartphoneNfc className="w-4 h-4" />
          <span>3. Direct Mobile PWA Install</span>
        </button>

        <button
          onClick={() => setActiveTab('config')}
          className={`pb-3 px-4 text-xs font-semibold transition-colors border-b-2 flex items-center space-x-2 ${
            activeTab === 'config'
              ? 'border-indigo-600 text-indigo-600 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <FileCode className="w-4 h-4" />
          <span>4. View Generated Android Manifests</span>
        </button>
      </div>

      {/* TAB 1: CLOUD BUILD */}
      {activeTab === 'cloud' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold">
                <Globe className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">PWABuilder Cloud Build</h3>
                <p className="text-xs text-slate-500">Generates APK & Play Store AAB online in 30 seconds</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              PWABuilder (supported by Microsoft) reads this application's live manifest and packages it into an APK or AAB binary ready for instant phone installation or Google Play store submission.
            </p>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Live URL:</span>
                <span className="font-mono text-slate-800 truncate max-w-[240px]">{appUrl}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">App ID:</span>
                <span className="font-mono text-indigo-600 font-semibold">{packageName}</span>
              </div>
            </div>

            <a
              href={pwabuilderUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs flex items-center justify-center space-x-2 transition-colors shadow-md"
            >
              <span>Build APK / AAB on PWABuilder.com</span>
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold">
                <Package className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Download Full Android Native Source</h3>
                <p className="text-xs text-slate-500">Includes Gradle, AndroidManifest, & Capacitor wrapper</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Download the complete Android Studio source project with all Android build files pre-configured. Open in Android Studio or compile with standard `./gradlew assembleRelease`.
            </p>

            <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 space-y-1 text-xs text-emerald-900">
              <div className="flex items-center space-x-1.5 font-bold">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Includes Full Native Android Files:</span>
              </div>
              <ul className="list-disc list-inside text-[11px] text-emerald-800 space-y-0.5 pl-1">
                <li><code>build.gradle</code> & <code>app/build.gradle</code></li>
                <li><code>AndroidManifest.xml</code> with permissions</li>
                <li><code>capacitor.config.json</code> & <code>twa-manifest.json</code></li>
                <li>Full Web bundle assets and icons</li>
              </ul>
            </div>

            <button
              onClick={downloadAndroidZip}
              className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs flex items-center justify-center space-x-2 transition-colors shadow-md"
            >
              <Download className="w-4 h-4" />
              <span>Download Android Source Project (.zip)</span>
            </button>
          </div>
        </div>
      )}

      {/* TAB 2: LOCAL CLI */}
      {activeTab === 'local' && (
        <div className="space-y-6">
          {/* Capacitor CLI */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Terminal className="w-4 h-4 text-indigo-600" />
                <h3 className="text-sm font-bold text-slate-900">Method A: Capacitor CLI (Recommended for Native Hybrid APK/AAB)</h3>
              </div>
              <button
                onClick={() => handleCopy(capacitorCommands, 'cap_cli')}
                className="px-3 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center space-x-1 transition-colors"
              >
                {copiedSection === 'cap_cli' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedSection === 'cap_cli' ? 'Copied!' : 'Copy Commands'}</span>
              </button>
            </div>

            <pre className="p-4 bg-slate-900 text-indigo-300 rounded-xl text-xs font-mono overflow-x-auto leading-relaxed">
              {capacitorCommands}
            </pre>
          </div>

          {/* Bubblewrap CLI */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Terminal className="w-4 h-4 text-emerald-600" />
                <h3 className="text-sm font-bold text-slate-900">Method B: Google Bubblewrap CLI (Official Trusted Web Activity)</h3>
              </div>
              <button
                onClick={() => handleCopy(bubblewrapCommands, 'bw_cli')}
                className="px-3 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center space-x-1 transition-colors"
              >
                {copiedSection === 'bw_cli' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedSection === 'bw_cli' ? 'Copied!' : 'Copy Commands'}</span>
              </button>
            </div>

            <pre className="p-4 bg-slate-900 text-emerald-300 rounded-xl text-xs font-mono overflow-x-auto leading-relaxed">
              {bubblewrapCommands}
            </pre>
          </div>
        </div>
      )}

      {/* TAB 3: PWA MOBILE */}
      {activeTab === 'pwa' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-6">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-bold text-lg shadow-md">
              <Smartphone className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Direct Android PWA Installation</h3>
              <p className="text-xs text-slate-500">Install HireU Copilot as a standalone app directly on Android phones</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="w-7 h-7 rounded-full bg-indigo-100 text-indigo-700 font-bold text-xs flex items-center justify-center">
                1
              </div>
              <p className="text-xs font-bold text-slate-800">Open in Chrome for Android</p>
              <p className="text-[11px] text-slate-500">Navigate to this app URL on your Android mobile device.</p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="w-7 h-7 rounded-full bg-indigo-100 text-indigo-700 font-bold text-xs flex items-center justify-center">
                2
              </div>
              <p className="text-xs font-bold text-slate-800">Tap Install Prompt or Menu</p>
              <p className="text-[11px] text-slate-500">Tap the "Install" button below, or Chrome options (⋮) &gt; "Add to Home screen".</p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="w-7 h-7 rounded-full bg-indigo-100 text-indigo-700 font-bold text-xs flex items-center justify-center">
                3
              </div>
              <p className="text-xs font-bold text-slate-800">Launch App Icon</p>
              <p className="text-[11px] text-slate-500">The app will appear in your Android launcher with full-screen view!</p>
            </div>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
            <button
              onClick={handleInstallPWA}
              disabled={isInstalled}
              className={`px-6 py-3 rounded-xl font-bold text-xs flex items-center space-x-2 transition-all ${
                isInstalled
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                  : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/30'
              }`}
            >
              <Smartphone className="w-4 h-4" />
              <span>{isInstalled ? 'App Installed on Android' : 'Install HireU App on Android Device'}</span>
            </button>

            {isInstalled && (
              <span className="text-xs text-emerald-600 font-semibold flex items-center gap-1">
                <Check className="w-4 h-4" /> Running in mobile standalone mode
              </span>
            )}
          </div>
        </div>
      )}

      {/* TAB 4: MANIFESTS */}
      {activeTab === 'config' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-900">capacitor.config.json</span>
              <button
                onClick={() => handleCopy(capacitorConfigJson, 'cap_cfg')}
                className="px-2.5 py-1 rounded bg-slate-100 text-xs font-semibold text-slate-700 flex items-center gap-1"
              >
                {copiedSection === 'cap_cfg' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                <span>Copy</span>
              </button>
            </div>
            <pre className="p-3 bg-slate-900 text-indigo-300 rounded-xl text-[11px] font-mono overflow-x-auto max-h-80">
              {capacitorConfigJson}
            </pre>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-900">twa-manifest.json</span>
              <button
                onClick={() => handleCopy(twaManifestJson, 'twa_cfg')}
                className="px-2.5 py-1 rounded bg-slate-100 text-xs font-semibold text-slate-700 flex items-center gap-1"
              >
                {copiedSection === 'twa_cfg' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                <span>Copy</span>
              </button>
            </div>
            <pre className="p-3 bg-slate-900 text-emerald-300 rounded-xl text-[11px] font-mono overflow-x-auto max-h-80">
              {twaManifestJson}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
};
