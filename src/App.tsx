import { useState } from 'react'
import {
  AlertTriangle,
  ArrowRight,
  Bot,
  Check,
  CheckCircle2,
  ChevronRight,
  CircleHelp,
  Cloud,
  CloudDownload,
  Copy,
  Database,
  ExternalLink,
  FileKey2,
  FolderOpen,
  Github,
  GitBranch,
  HardDrive,
  KeyRound,
  LockKeyhole,
  Menu,
  MoreHorizontal,
  PackageOpen,
  Play,
  QrCode,
  RefreshCw,
  ScanLine,
  Settings2,
  ShieldCheck,
  Smartphone,
  Sparkles,
  TerminalSquare,
  UploadCloud,
  Wifi,
  X,
  Zap,
} from 'lucide-react'

type Tab = 'build' | 'preview' | 'access' | 'project'
type ProviderKey = 'gemini' | 'openai' | 'ollama'
type ConnectionStatus = 'idle' | 'connecting' | 'connected'

type Provider = {
  id: ProviderKey
  name: string
  detail: string
  badge: string
  tone: string
  icon: typeof Bot
}

const providers: Provider[] = [
  { id: 'gemini', name: 'Google Gemini', detail: 'Cloud vision + image edits', badge: 'BYOK', tone: 'violet', icon: Sparkles },
  { id: 'openai', name: 'OpenAI compatible', detail: 'Use your own endpoint', badge: 'BYOK', tone: 'green', icon: Cloud },
  { id: 'ollama', name: 'Local Ollama', detail: 'Private, on this network', badge: 'LOCAL', tone: 'amber', icon: TerminalSquare },
]

const storageRows = [
  { icon: FolderOpen, name: 'Reference photos', detail: 'Original camera frames', size: '1.2 GB+', tone: 'mint' },
  { icon: Sparkles, name: 'Edit variations', detail: 'Generated branches + previews', size: '3.6 GB+', tone: 'violet' },
  { icon: Database, name: 'Gear database', detail: 'Lensfun camera + lens specs', size: '18 MB', tone: 'blue' },
  { icon: PackageOpen, name: 'Optional model cache', detail: 'Only for local Ollama models', size: '4–12 GB', tone: 'amber' },
]

function App() {
  const [tab, setTab] = useState<Tab>('build')
  const [selectedProvider, setSelectedProvider] = useState<ProviderKey>('gemini')
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('idle')
  const [apiKey, setApiKey] = useState('')
  const [ollamaUrl, setOllamaUrl] = useState('http://localhost:11434')
  const [storageGranted, setStorageGranted] = useState(false)
  const [photosGranted, setPhotosGranted] = useState(false)
  const [networkGranted, setNetworkGranted] = useState(false)
  const [showSetup, setShowSetup] = useState(false)
  const [bootstrapStep, setBootstrapStep] = useState(0)
  const [projectPrompt, setProjectPrompt] = useState('A private camera look-matching app for portrait photographers.')
  const [copied, setCopied] = useState(false)

  const currentProvider = providers.find((provider) => provider.id === selectedProvider) ?? providers[0]
  const setupProgress = [storageGranted, photosGranted, networkGranted, bootstrapStep >= 3].filter(Boolean).length

  const chooseProvider = (id: ProviderKey) => {
    setSelectedProvider(id)
    setConnectionStatus('idle')
  }

  const connectProvider = () => {
    if (selectedProvider !== 'ollama' && !apiKey.trim()) return
    if (selectedProvider === 'ollama' && !ollamaUrl.trim()) return
    setConnectionStatus('connecting')
    window.setTimeout(() => setConnectionStatus('connected'), 850)
  }

  const bootstrap = () => {
    setBootstrapStep(1)
    window.setTimeout(() => setBootstrapStep(2), 700)
    window.setTimeout(() => setBootstrapStep(3), 1500)
  }

  const copyEndpoint = async () => {
    await navigator.clipboard?.writeText('exp://opticmatch.local/preview')
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1600)
  }

  return (
    <div className="builder-shell">
      <div className="mobile-device">
        <header className="mobile-header">
          <div className="brand-lockup compact">
            <div className="brand-mark" aria-hidden="true"><span /><span /></div>
            <div><div className="brand-name">OPTIC<span>MATCH</span></div><div className="brand-kicker">private mobile studio</div></div>
          </div>
          <div className="header-actions"><span className="local-dot" /><button className="header-icon" aria-label="Help"><CircleHelp size={17} /></button><button className="header-icon" aria-label="More"><MoreHorizontal size={19} /></button></div>
        </header>

        <main className="mobile-content">
          {tab === 'build' && <BuildView projectPrompt={projectPrompt} setProjectPrompt={setProjectPrompt} currentProvider={currentProvider} selectedProvider={selectedProvider} chooseProvider={chooseProvider} connectionStatus={connectionStatus} connectProvider={connectProvider} apiKey={apiKey} setApiKey={setApiKey} ollamaUrl={ollamaUrl} setOllamaUrl={setOllamaUrl} onSetup={() => setShowSetup(true)} onAccess={() => setTab('access')} />}
          {tab === 'preview' && <PreviewView copyEndpoint={copyEndpoint} copied={copied} />}
          {tab === 'access' && <AccessView storageGranted={storageGranted} photosGranted={photosGranted} networkGranted={networkGranted} setStorageGranted={setStorageGranted} setPhotosGranted={setPhotosGranted} setNetworkGranted={setNetworkGranted} onSetup={() => setShowSetup(true)} />}
          {tab === 'project' && <ProjectView bootstrapStep={bootstrapStep} bootstrap={bootstrap} onPreview={() => setTab('preview')} />}
        </main>

        <nav className="bottom-nav" aria-label="Mobile app navigation">
          <NavItem icon={Sparkles} label="Build" active={tab === 'build'} onClick={() => setTab('build')} />
          <NavItem icon={QrCode} label="Preview" active={tab === 'preview'} onClick={() => setTab('preview')} />
          <NavItem icon={ShieldCheck} label="Access" active={tab === 'access'} onClick={() => setTab('access')} badge={!storageGranted || !photosGranted} />
          <NavItem icon={GitBranch} label="Project" active={tab === 'project'} onClick={() => setTab('project')} />
        </nav>

        {showSetup && <SetupSheet progress={setupProgress} bootstrapStep={bootstrapStep} bootstrap={bootstrap} onClose={() => setShowSetup(false)} onAccess={() => { setShowSetup(false); setTab('access') }} />}
      </div>
    </div>
  )
}

function BuildView({ projectPrompt, setProjectPrompt, currentProvider, selectedProvider, chooseProvider, connectionStatus, connectProvider, apiKey, setApiKey, ollamaUrl, setOllamaUrl, onSetup, onAccess }: { projectPrompt: string; setProjectPrompt: (value: string) => void; currentProvider: Provider; selectedProvider: ProviderKey; chooseProvider: (id: ProviderKey) => void; connectionStatus: ConnectionStatus; connectProvider: () => void; apiKey: string; setApiKey: (value: string) => void; ollamaUrl: string; setOllamaUrl: (value: string) => void; onSetup: () => void; onAccess: () => void }) {
  const ProviderIcon = currentProvider.icon
  return <div className="screen-stack">
    <div className="screen-heading"><div><div className="screen-eyebrow">WORKSPACE / 01</div><h1>Build a mobile app<br /><em>that feels like yours.</em></h1></div><button className="round-button"><Settings2 size={17} /></button></div>
    <p className="screen-lede">Describe the experience. OpticMatch prepares a private Expo workspace, then asks before it installs anything or touches your files.</p>

    <button className={`setup-banner ${connectionStatus === 'connected' ? 'ready' : ''}`} onClick={onSetup}><div className="setup-icon"><PackageOpen size={18} /></div><div className="setup-copy"><strong>{connectionStatus === 'connected' ? 'Workspace ready to run' : 'Prepare your local workspace'}</strong><span>{connectionStatus === 'connected' ? 'Permissions are explicit · provider connected' : 'Install the runtime, choose AI, review access'}</span></div><span className="setup-state">{connectionStatus === 'connected' ? <CheckCircle2 size={17} /> : <span>2 min</span>}</span><ChevronRight size={16} /></button>

    <section className="builder-card prompt-card"><div className="card-heading"><span className="section-label">APP BRIEF</span><span className="draft-pill"><span /> draft</span></div><textarea value={projectPrompt} onChange={(event) => setProjectPrompt(event.target.value)} aria-label="App brief" /><div className="prompt-footer"><span><Sparkles size={14} /> Camera-native workflow</span><button className="arrow-button"><ArrowRight size={16} /></button></div></section>

    <section><div className="section-heading"><div><span className="section-label">CHOOSE YOUR AI</span><h2>How should your app think?</h2></div><button className="text-button" onClick={onAccess}>privacy <ArrowRight size={13} /></button></div><div className="provider-list">{providers.map((provider) => <ProviderChoice key={provider.id} provider={provider} selected={selectedProvider === provider.id} onClick={() => chooseProvider(provider.id)} />)}</div></section>

    <section className="builder-card connection-card"><div className="card-heading"><span className="section-label">ACTIVE CONNECTION</span><span className={`connection-pill ${connectionStatus}`}>{connectionStatus === 'connected' ? <><span /> ready</> : connectionStatus === 'connecting' ? <><RefreshCw size={11} className="spin" /> checking</> : <><span /> not connected</>}</span></div><div className="connection-main"><div className={`provider-avatar ${currentProvider.tone}`}><ProviderIcon size={18} /></div><div><strong>{currentProvider.name}</strong><span>{currentProvider.detail}</span></div></div>{selectedProvider === 'ollama' ? <div className="field-wrap"><label>LOCAL ENDPOINT</label><div className="field-row"><Wifi size={14} /><input value={ollamaUrl} onChange={(event) => setOllamaUrl(event.target.value)} /><button onClick={connectProvider} disabled={!ollamaUrl.trim()}>{connectionStatus === 'connected' ? <Check size={15} /> : 'check'}</button></div></div> : <div className="field-wrap"><label>{currentProvider.name.toUpperCase()} API KEY</label><div className="field-row"><KeyRound size={14} /><input type="password" placeholder="Paste key · stored locally" value={apiKey} onChange={(event) => setApiKey(event.target.value)} /><button onClick={connectProvider} disabled={!apiKey.trim()}>{connectionStatus === 'connected' ? <Check size={15} /> : 'save'}</button></div></div>}<div className="secure-note"><LockKeyhole size={13} /> Never sent to OpticMatch. Only the app runtime can read it.</div></section>

    <section className="builder-card idea-card"><div className="idea-visual"><div className="idea-grid" /><div className="idea-orb" /><div className="idea-phone"><span /><span /><span /></div></div><div className="idea-copy"><span className="section-label">STARTING POINT</span><strong>Look → dial sheet</strong><span>Turn a phone frame into a native camera recipe.</span><button onClick={onSetup}>Open starter <ArrowRight size={14} /></button></div></section>
  </div>
}

function ProviderChoice({ provider, selected, onClick }: { provider: Provider; selected: boolean; onClick: () => void }) {
  const Icon = provider.icon
  return <button className={`provider-choice ${selected ? 'selected' : ''}`} onClick={onClick}><div className={`provider-icon ${provider.tone}`}><Icon size={16} /></div><div><strong>{provider.name}</strong><span>{provider.detail}</span></div><span className="provider-badge">{provider.badge}</span>{selected && <CheckCircle2 size={16} className="provider-check" />}</button>
}

function PreviewView({ copyEndpoint, copied }: { copyEndpoint: () => void; copied: boolean }) {
  return <div className="screen-stack"><div className="screen-heading"><div><div className="screen-eyebrow">DEVICE PREVIEW / 02</div><h1>See it on<br /><em>your phone.</em></h1></div><div className="live-tag"><span /> live</div></div><p className="screen-lede">Scan with Expo Go to open the current project. Changes reload as you build—no cable, no native build queue.</p><section className="preview-card"><div className="qr-header"><div><span className="section-label">EXPO GO HANDOFF</span><strong>OpticMatch / Portrait Lab</strong></div><span className="online-chip"><span /> metro</span></div><div className="qr-stage"><div className="qr-code" aria-label="QR code preview"><QrGlyph /><div className="qr-center"><div className="brand-mark small"><span /><span /></div></div></div><div className="scan-line" /></div><div className="preview-instructions"><div><span className="instruction-number">01</span><span>Open Expo Go<br /><b>on your phone</b></span></div><div><span className="instruction-number">02</span><span>Scan this code<br /><b>to run the app</b></span></div></div><button className="primary-mobile-button"><Smartphone size={16} /> open Expo Go <ExternalLink size={14} /></button></section><section className="builder-card endpoint-card"><div className="card-heading"><span className="section-label">PREVIEW ENDPOINT</span><button className="copy-button" onClick={copyEndpoint}>{copied ? <Check size={14} /> : <Copy size={14} />}</button></div><code>exp://opticmatch.local/preview</code><span className="endpoint-note">This address is session-scoped and never saved into your repository.</span></section></div>
}

function QrGlyph() { return <div className="qr-pattern">{Array.from({ length: 81 }).map((_, index) => <i key={index} className={(index * 13 + 7) % 5 < 2 ? 'on' : ''} />)}</div> }

function AccessView({ storageGranted, photosGranted, networkGranted, setStorageGranted, setPhotosGranted, setNetworkGranted, onSetup }: { storageGranted: boolean; photosGranted: boolean; networkGranted: boolean; setStorageGranted: (value: boolean) => void; setPhotosGranted: (value: boolean) => void; setNetworkGranted: (value: boolean) => void; onSetup: () => void }) {
  return <div className="screen-stack"><div className="screen-heading"><div><div className="screen-eyebrow">TRUST CENTER / 03</div><h1>Your access,<br /><em>your call.</em></h1></div><ShieldCheck className="heading-symbol" size={22} /></div><p className="screen-lede">This app is open source and local-first. Review what it needs before the runtime creates folders or asks your operating system.</p><section className="trust-banner"><div className="trust-icon"><LockKeyhole size={17} /></div><div><strong>Nothing installs silently.</strong><span>Every permission is requested in context and can be revoked later.</span></div></section><section><div className="section-heading"><div><span className="section-label">REQUESTED ACCESS</span><h2>What the app needs</h2></div><button className="text-button" onClick={onSetup}>setup <ArrowRight size={13} /></button></div><div className="access-list"><AccessRow icon={HardDrive} name="Local storage" detail="Create /opticmatch/data for photos and edits" granted={storageGranted} onToggle={() => setStorageGranted(!storageGranted)} required /><AccessRow icon={UploadCloud} name="Photos & camera roll" detail="Choose the reference frames you want to use" granted={photosGranted} onToggle={() => setPhotosGranted(!photosGranted)} required /><AccessRow icon={Wifi} name="Local network" detail="Connect to Ollama or your self-hosted API" granted={networkGranted} onToggle={() => setNetworkGranted(!networkGranted)} /><AccessRow icon={CloudDownload} name="Model downloads" detail="Only if you choose a local Ollama model" granted={false} onToggle={() => undefined} optional /></div></section><section><div className="section-heading"><div><span className="section-label">STORAGE PLAN</span><h2>Make room for the work.</h2></div><span className="storage-total">~4.8 GB</span></div><div className="storage-list">{storageRows.map((row) => <StorageRow key={row.name} {...row} />)}</div><div className="storage-foot"><AlertTriangle size={14} /> Local model cache is optional and removable.</div></section></div>
}

function AccessRow({ icon: Icon, name, detail, granted, onToggle, required, optional }: { icon: typeof HardDrive; name: string; detail: string; granted: boolean; onToggle: () => void; required?: boolean; optional?: boolean }) { return <div className="access-row"><div className="access-icon"><Icon size={16} /></div><div className="access-copy"><strong>{name} {required && <span className="required-tag">required</span>} {optional && <span className="optional-tag">optional</span>}</strong><span>{detail}</span></div><button className={`permission-toggle ${granted ? 'granted' : ''}`} onClick={onToggle} aria-label={`Toggle ${name} access`}>{granted ? <Check size={14} /> : <span />}</button></div> }
function StorageRow({ icon: Icon, name, detail, size, tone }: { icon: typeof HardDrive; name: string; detail: string; size: string; tone: string }) { return <div className="storage-row"><div className={`storage-icon ${tone}`}><Icon size={15} /></div><div><strong>{name}</strong><span>{detail}</span></div><b>{size}</b></div> }

function ProjectView({ bootstrapStep, bootstrap, onPreview }: { bootstrapStep: number; bootstrap: () => void; onPreview: () => void }) {
  const steps = [{ label: 'Create app workspace', detail: 'Expo Router + TypeScript', icon: PackageOpen }, { label: 'Install local runtime', detail: 'Node, Expo CLI, Android / iOS bridge', icon: TerminalSquare }, { label: 'Open a device session', detail: 'Metro bundler + QR handoff', icon: Smartphone }]
  return <div className="screen-stack"><div className="screen-heading"><div><div className="screen-eyebrow">PROJECT / 04</div><h1>Your app,<br /><em>under your control.</em></h1></div><Github size={22} className="heading-symbol" /></div><p className="screen-lede">This repository is the source of truth. Connect GitHub when you want two-way sync, or keep the project entirely on your machine.</p><section className="github-card"><div className="github-mark"><Github size={24} /></div><div><span className="section-label">GITHUB SYNC</span><strong>Not connected</strong><span>Paid-plan connector · optional</span></div><button className="connect-outline">connect</button></section><section><div className="section-heading"><div><span className="section-label">LOCAL ENVIRONMENT</span><h2>Bootstrap once.</h2></div><span className={`runtime-pill ${bootstrapStep >= 3 ? 'ready' : ''}`}>{bootstrapStep >= 3 ? 'ready' : 'awaiting approval'}</span></div><div className="runtime-list">{steps.map((step, index) => { const Icon = step.icon; const done = bootstrapStep > index; return <div className={`runtime-row ${done ? 'done' : ''}`} key={step.label}><div className="runtime-index">{done ? <Check size={13} /> : `0${index + 1}`}</div><div className="runtime-copy"><strong>{step.label}</strong><span>{step.detail}</span></div>{done ? <CheckCircle2 size={16} /> : index === bootstrapStep ? <span className="runtime-now"><span /> next</span> : <Icon size={16} />}</div> })}</div><button className="primary-mobile-button" onClick={bootstrap} disabled={bootstrapStep > 0 && bootstrapStep < 3}>{bootstrapStep >= 3 ? <><Check size={16} /> environment created</> : <><Play size={15} /> ask before installing</>}</button><p className="permission-caption"><ShieldCheck size={13} /> The native OS permission sheet appears before each protected action.</p></section><section className="builder-card repo-card"><div className="repo-top"><GitBranch size={16} /><span>main</span><span className="repo-dot" /></div><strong>opticmatch</strong><span>React Native · Expo Router · NativeWind</span><div className="repo-actions"><button onClick={onPreview}><QrCode size={14} /> QR preview</button><button><GitBranch size={14} /> branches</button></div></section></div>
}

function SetupSheet({ progress, bootstrapStep, bootstrap, onClose, onAccess }: { progress: number; bootstrapStep: number; bootstrap: () => void; onClose: () => void; onAccess: () => void }) {
  return <div className="sheet-backdrop" role="dialog" aria-modal="true"><div className="setup-sheet"><div className="sheet-handle" /><div className="sheet-top"><div><span className="section-label">FIRST RUN SETUP</span><h2>Prepare your workspace.</h2></div><button className="header-icon" onClick={onClose} aria-label="Close"><X size={18} /></button></div><p>OpticMatch can create a local Expo environment, but it will never install a dependency or request access without your action.</p><div className="setup-progress"><div className="progress-track"><span style={{ width: `${Math.min(100, progress / 4 * 100)}%` }} /></div><strong>{progress} <span>/ 4 ready</span></strong></div><div className="sheet-checklist"><SheetCheck done={bootstrapStep >= 1} title="Create an isolated app environment" detail="A private folder with its own dependencies." /><SheetCheck done={bootstrapStep >= 2} title="Install the Expo runtime" detail="Only after you tap approve." /><SheetCheck done={bootstrapStep >= 3} title="Start Metro + QR preview" detail="The dev server stays on your machine." /><SheetCheck done={progress >= 2} title="Review storage and permissions" detail="You decide what the app can access." /></div><button className="primary-mobile-button" onClick={bootstrap} disabled={bootstrapStep > 0 && bootstrapStep < 3}>{bootstrapStep >= 3 ? <><Check size={16} /> workspace is ready</> : <><Zap size={16} /> approve local setup</>}</button><button className="sheet-secondary" onClick={onAccess}>Review access first <ArrowRight size={14} /></button><div className="sheet-legal"><LockKeyhole size={13} /> Open source · no analytics · no silent installs</div></div></div>
}
function SheetCheck({ done, title, detail }: { done: boolean; title: string; detail: string }) { return <div className="sheet-check"><span className={done ? 'done' : ''}>{done ? <Check size={13} /> : <span />}</span><div><strong>{title}</strong><small>{detail}</small></div></div> }
function NavItem({ icon: Icon, label, active, onClick, badge }: { icon: typeof Sparkles; label: string; active: boolean; onClick: () => void; badge?: boolean }) { return <button className={`nav-item ${active ? 'active' : ''}`} onClick={onClick}><span className="nav-icon"><Icon size={18} />{badge && <i />}</span><small>{label}</small></button> }

export default App
