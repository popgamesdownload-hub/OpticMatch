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
          <NavItem icon={Sparkles} label="Studio" active={tab === 'build'} onClick={() => setTab('build')} />
          <NavItem icon={QrCode} label="On phone" active={tab === 'preview'} onClick={() => setTab('preview')} />
          <NavItem icon={ShieldCheck} label="Access" active={tab === 'access'} onClick={() => setTab('access')} badge={!storageGranted || !photosGranted} />
          <NavItem icon={GitBranch} label="More" active={tab === 'project'} onClick={() => setTab('project')} />
        </nav>

        {showSetup && <SetupSheet progress={setupProgress} bootstrapStep={bootstrapStep} bootstrap={bootstrap} onClose={() => setShowSetup(false)} onAccess={() => { setShowSetup(false); setTab('access') }} />}
      </div>
    </div>
  )
}

function BuildView({ projectPrompt, setProjectPrompt, currentProvider, selectedProvider, chooseProvider, connectionStatus, connectProvider, apiKey, setApiKey, ollamaUrl, setOllamaUrl, onSetup, onAccess }: { projectPrompt: string; setProjectPrompt: (value: string) => void; currentProvider: Provider; selectedProvider: ProviderKey; chooseProvider: (id: ProviderKey) => void; connectionStatus: ConnectionStatus; connectProvider: () => void; apiKey: string; setApiKey: (value: string) => void; ollamaUrl: string; setOllamaUrl: (value: string) => void; onSetup: () => void; onAccess: () => void }) {
  const ProviderIcon = currentProvider.icon
  return <div className="screen-stack">
    <div className="screen-heading"><div><div className="screen-eyebrow">OPTICMATCH / STUDIO</div><h1>Make the picture<br /><em>feel like you.</em></h1></div><button className="round-button"><Settings2 size={17} /></button></div>
    <p className="screen-lede">Start with a phone photo. Shape the mood. We’ll help you find the camera settings to make it for real.</p>

    <button className={`setup-banner ${connectionStatus === 'connected' ? 'ready' : ''}`} onClick={onSetup}><div className="setup-icon"><PackageOpen size={18} /></div><div className="setup-copy"><strong>{connectionStatus === 'connected' ? 'OpticMatch is ready on this phone' : 'Set up OpticMatch on this phone'}</strong><span>{connectionStatus === 'connected' ? 'Your photos stay private · assistant connected' : 'Choose photo access, storage, and your assistant'}</span></div><span className="setup-state">{connectionStatus === 'connected' ? <CheckCircle2 size={17} /> : <span>2 min</span>}</span><ChevronRight size={16} /></button>

    <section className="builder-card prompt-card"><div className="card-heading"><span className="section-label">TODAY’S LOOK</span><span className="draft-pill"><span /> ready to shape</span></div><textarea value={projectPrompt} onChange={(event) => setProjectPrompt(event.target.value)} aria-label="Describe the look you want" /><div className="prompt-footer"><span><Sparkles size={14} /> Your camera recipe starts here</span><button className="arrow-button"><ArrowRight size={16} /></button></div></section>

    <section><div className="section-heading"><div><span className="section-label">YOUR ASSISTANT</span><h2>Choose how OpticMatch helps.</h2></div><button className="text-button" onClick={onAccess}>privacy <ArrowRight size={13} /></button></div><div className="provider-list">{providers.map((provider) => <ProviderChoice key={provider.id} provider={provider} selected={selectedProvider === provider.id} onClick={() => chooseProvider(provider.id)} />)}</div></section>

    <section className="builder-card connection-card"><div className="card-heading"><span className="section-label">ASSISTANT SETUP</span><span className={`connection-pill ${connectionStatus}`}>{connectionStatus === 'connected' ? <><span /> ready</> : connectionStatus === 'connecting' ? <><RefreshCw size={11} className="spin" /> checking</> : <><span /> waiting for you</>}</span></div><div className="connection-main"><div className={`provider-avatar ${currentProvider.tone}`}><ProviderIcon size={18} /></div><div><strong>{currentProvider.name}</strong><span>{currentProvider.detail}</span></div></div>{selectedProvider === 'ollama' ? <div className="field-wrap"><label>OLLAMA ON YOUR COMPUTER</label><div className="field-row"><Wifi size={14} /><input value={ollamaUrl} onChange={(event) => setOllamaUrl(event.target.value)} /><button onClick={connectProvider} disabled={!ollamaUrl.trim()}>{connectionStatus === 'connected' ? <Check size={15} /> : 'check'}</button></div></div> : <div className="field-wrap"><label>PASTE YOUR {currentProvider.name.toUpperCase()} KEY</label><div className="field-row"><KeyRound size={14} /><input type="password" placeholder="Only stored on this phone" value={apiKey} onChange={(event) => setApiKey(event.target.value)} /><button onClick={connectProvider} disabled={!apiKey.trim()}>{connectionStatus === 'connected' ? <Check size={15} /> : 'save'}</button></div></div>}<div className="secure-note"><LockKeyhole size={13} /> Your key stays with you. OpticMatch does not collect it.</div></section>

    <section className="builder-card idea-card"><div className="idea-visual"><div className="idea-grid" /><div className="idea-orb" /><div className="idea-phone"><span /><span /><span /></div></div><div className="idea-copy"><span className="section-label">YOUR NEXT SHOT</span><strong>Look → dial sheet</strong><span>Turn a phone frame into settings for your real camera.</span><button onClick={onSetup}>Get set up <ArrowRight size={14} /></button></div></section>
  </div>
}

function ProviderChoice({ provider, selected, onClick }: { provider: Provider; selected: boolean; onClick: () => void }) {
  const Icon = provider.icon
  return <button className={`provider-choice ${selected ? 'selected' : ''}`} onClick={onClick}><div className={`provider-icon ${provider.tone}`}><Icon size={16} /></div><div><strong>{provider.name}</strong><span>{provider.detail}</span></div><span className="provider-badge">{provider.badge}</span>{selected && <CheckCircle2 size={16} className="provider-check" />}</button>
}

function PreviewView({ copyEndpoint, copied }: { copyEndpoint: () => void; copied: boolean }) {
  return <div className="screen-stack"><div className="screen-heading"><div><div className="screen-eyebrow">ON THIS PHONE / 02</div><h1>Your camera<br /><em>companion.</em></h1></div><div className="live-tag"><span /> ready soon</div></div><p className="screen-lede">When setup is complete, OpticMatch lives on your phone. Take a frame, choose a feeling, and keep your camera close.</p><section className="preview-card"><div className="qr-header"><div><span className="section-label">PHONE INSTALL</span><strong>OpticMatch / Portrait Lab</strong></div><span className="online-chip"><span /> private</span></div><div className="phone-install-visual"><div className="install-phone"><div className="install-notch" /><div className="install-mark"><div className="brand-mark small"><span /><span /></div></div><strong>OpticMatch</strong><span>look → dial sheet</span><button><DownloadIcon /> install on this phone</button></div></div><div className="preview-instructions"><div><span className="instruction-number">01</span><span>Allow access to<br /><b>your selected photos</b></span></div><div><span className="instruction-number">02</span><span>Choose cloud or<br /><b>private local AI</b></span></div></div><button className="primary-mobile-button" onClick={copyEndpoint}><Smartphone size={16} /> prepare my phone <Check size={14} /></button></section><section className="builder-card endpoint-card"><div className="card-heading"><span className="section-label">ADVANCED PREVIEW</span><button className="copy-button" onClick={copyEndpoint}>{copied ? <Check size={14} /> : <Copy size={14} />}</button></div><code>Expo Go / GitHub tools are optional</code><span className="endpoint-note">You do not need Expo Go to use the finished photographer app.</span></section></div>
}

function QrGlyph() { return <div className="qr-pattern">{Array.from({ length: 81 }).map((_, index) => <i key={index} className={(index * 13 + 7) % 5 < 2 ? 'on' : ''} />)}</div> }
function DownloadIcon() { return <CloudDownload size={14} /> }

function AccessView({ storageGranted, photosGranted, networkGranted, setStorageGranted, setPhotosGranted, setNetworkGranted, onSetup }: { storageGranted: boolean; photosGranted: boolean; networkGranted: boolean; setStorageGranted: (value: boolean) => void; setPhotosGranted: (value: boolean) => void; setNetworkGranted: (value: boolean) => void; onSetup: () => void }) {
  return <div className="screen-stack"><div className="screen-heading"><div><div className="screen-eyebrow">YOUR PHONE / ACCESS</div><h1>Keep your work<br /><em>safe and yours.</em></h1></div><ShieldCheck className="heading-symbol" size={22} /></div><p className="screen-lede">OpticMatch only needs access to the things that make the photo workflow possible. You decide, one permission at a time.</p><section className="trust-banner"><div className="trust-icon"><LockKeyhole size={17} /></div><div><strong>Your originals stay private.</strong><span>Nothing is uploaded until you choose a cloud assistant. Local Ollama keeps the work on your network.</span></div></section><section><div className="section-heading"><div><span className="section-label">PHONE PERMISSIONS</span><h2>What should OpticMatch use?</h2></div><button className="text-button" onClick={onSetup}>setup <ArrowRight size={13} /></button></div><div className="access-list"><AccessRow icon={HardDrive} name="A private photo folder" detail="Save originals, edits, and recipes on this phone" granted={storageGranted} onToggle={() => setStorageGranted(!storageGranted)} required /><AccessRow icon={UploadCloud} name="Photos you choose" detail="Pick the reference frames you want to work with" granted={photosGranted} onToggle={() => setPhotosGranted(!photosGranted)} required /><AccessRow icon={Wifi} name="Nearby connection" detail="Only needed for local Ollama or a home server" granted={networkGranted} onToggle={() => setNetworkGranted(!networkGranted)} /><AccessRow icon={CloudDownload} name="Optional model downloads" detail="Only when you choose to keep an AI model nearby" granted={false} onToggle={() => undefined} optional /></div></section><section><div className="section-heading"><div><span className="section-label">SPACE NEEDED</span><h2>Plan for your photo library.</h2></div><span className="storage-total">~4.8 GB</span></div><div className="storage-list">{storageRows.map((row) => <StorageRow key={row.name} {...row} />)}</div><div className="storage-foot"><AlertTriangle size={14} /> The local model space is optional and can be removed anytime.</div></section></div>
}

function AccessRow({ icon: Icon, name, detail, granted, onToggle, required, optional }: { icon: typeof HardDrive; name: string; detail: string; granted: boolean; onToggle: () => void; required?: boolean; optional?: boolean }) { return <div className="access-row"><div className="access-icon"><Icon size={16} /></div><div className="access-copy"><strong>{name} {required && <span className="required-tag">required</span>} {optional && <span className="optional-tag">optional</span>}</strong><span>{detail}</span></div><button className={`permission-toggle ${granted ? 'granted' : ''}`} onClick={onToggle} aria-label={`Toggle ${name} access`}>{granted ? <Check size={14} /> : <span />}</button></div> }
function StorageRow({ icon: Icon, name, detail, size, tone }: { icon: typeof HardDrive; name: string; detail: string; size: string; tone: string }) { return <div className="storage-row"><div className={`storage-icon ${tone}`}><Icon size={15} /></div><div><strong>{name}</strong><span>{detail}</span></div><b>{size}</b></div> }

function ProjectView({ bootstrapStep, bootstrap, onPreview }: { bootstrapStep: number; bootstrap: () => void; onPreview: () => void }) {
  const steps = [{ label: 'Create app workspace', detail: 'Expo Router + TypeScript', icon: PackageOpen }, { label: 'Install local runtime', detail: 'Node, Expo CLI, Android / iOS bridge', icon: TerminalSquare }, { label: 'Open a device session', detail: 'Metro bundler + QR handoff', icon: Smartphone }]
  return <div className="screen-stack"><div className="screen-heading"><div><div className="screen-eyebrow">MORE / ADVANCED</div><h1>For your<br /><em>future studio.</em></h1></div><Github size={22} className="heading-symbol" /></div><p className="screen-lede">These tools are optional. You can use OpticMatch as a photographer without GitHub, Expo, or any developer setup.</p><section className="github-card"><div className="github-mark"><Github size={24} /></div><div><span className="section-label">OPEN SOURCE</span><strong>OpticMatch on GitHub</strong><span>Sync is optional and available as a connector.</span></div><button className="connect-outline">open</button></section><section><div className="section-heading"><div><span className="section-label">OPTIONAL SETUP</span><h2>Install the private workspace.</h2></div><span className={`runtime-pill ${bootstrapStep >= 3 ? 'ready' : ''}`}>{bootstrapStep >= 3 ? 'ready' : 'not needed yet'}</span></div><div className="runtime-list">{steps.map((step, index) => { const Icon = step.icon; const done = bootstrapStep > index; return <div className={`runtime-row ${done ? 'done' : ''}`} key={step.label}><div className="runtime-index">{done ? <Check size={13} /> : `0${index + 1}`}</div><div className="runtime-copy"><strong>{index === 0 ? 'Make a private space for your photos' : index === 1 ? 'Choose your assistant' : 'Use OpticMatch on this phone'}</strong><span>{index === 0 ? 'The app keeps originals and recipes together.' : index === 1 ? 'Cloud is optional; local Ollama is welcome.' : 'Camera, photo access, and storage are requested in context.'}</span></div>{done ? <CheckCircle2 size={16} /> : index === bootstrapStep ? <span className="runtime-now"><span /> next</span> : <Icon size={16} />}</div> })}</div><button className="primary-mobile-button" onClick={bootstrap} disabled={bootstrapStep > 0 && bootstrapStep < 3}>{bootstrapStep >= 3 ? <><Check size={16} /> private space created</> : <><Play size={15} /> review optional setup</>}</button><p className="permission-caption"><ShieldCheck size={13} /> You remain in control of every phone permission.</p></section><section className="builder-card repo-card"><div className="repo-top"><GitBranch size={16} /><span>photographer workflow</span><span className="repo-dot" /></div><strong>OpticMatch</strong><span>Camera look matching · local-first · open source</span><div className="repo-actions"><button onClick={onPreview}><Smartphone size={14} /> phone setup</button><button><CircleHelp size={14} /> about</button></div></section></div>
}

function SetupSheet({ progress, bootstrapStep, bootstrap, onClose, onAccess }: { progress: number; bootstrapStep: number; bootstrap: () => void; onClose: () => void; onAccess: () => void }) {
  return <div className="sheet-backdrop" role="dialog" aria-modal="true"><div className="setup-sheet"><div className="sheet-handle" /><div className="sheet-top"><div><span className="section-label">FIRST USE</span><h2>Set up OpticMatch.</h2></div><button className="header-icon" onClick={onClose} aria-label="Close"><X size={18} /></button></div><p>We’ll create a private space for your photos and ask for access only when it’s needed. Nothing is installed or uploaded behind your back.</p><div className="setup-progress"><div className="progress-track"><span style={{ width: `${Math.min(100, progress / 4 * 100)}%` }} /></div><strong>{progress} <span>/ 4 ready</span></strong></div><div className="sheet-checklist"><SheetCheck done={bootstrapStep >= 1} title="Create a private photo space" detail="Your originals, edits, and recipes stay together." /><SheetCheck done={bootstrapStep >= 2} title="Choose your assistant" detail="Cloud help or private Ollama on your network." /><SheetCheck done={bootstrapStep >= 3} title="Make OpticMatch ready" detail="We’ll ask before using photos, storage, or network." /><SheetCheck done={progress >= 2} title="Review what the phone can use" detail="Change your mind anytime in Access." /></div><button className="primary-mobile-button" onClick={bootstrap} disabled={bootstrapStep > 0 && bootstrapStep < 3}>{bootstrapStep >= 3 ? <><Check size={16} /> OpticMatch is ready</> : <><Zap size={16} /> set up my phone</>}</button><button className="sheet-secondary" onClick={onAccess}>Review access first <ArrowRight size={14} /></button><div className="sheet-legal"><LockKeyhole size={13} /> Your photos · your assistant · your permission</div></div></div>
}
function SheetCheck({ done, title, detail }: { done: boolean; title: string; detail: string }) { return <div className="sheet-check"><span className={done ? 'done' : ''}>{done ? <Check size={13} /> : <span />}</span><div><strong>{title}</strong><small>{detail}</small></div></div> }
function NavItem({ icon: Icon, label, active, onClick, badge }: { icon: typeof Sparkles; label: string; active: boolean; onClick: () => void; badge?: boolean }) { return <button className={`nav-item ${active ? 'active' : ''}`} onClick={onClick}><span className="nav-icon"><Icon size={18} />{badge && <i />}</span><small>{label}</small></button> }

export default App
