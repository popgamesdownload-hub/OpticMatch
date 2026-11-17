import { ChangeEvent, useMemo, useState } from 'react'
import {
  Aperture,
  ArrowUpRight,
  Camera,
  Check,
  ChevronRight,
  CircleHelp,
  CloudOff,
  Download,
  FileImage,
  Focus,
  Gauge,
  ImagePlus,
  Info,
  Layers3,
  LockKeyhole,
  Menu,
  MessageSquareText,
  Moon,
  MoveRight,
  Palette,
  RefreshCw,
  ScanLine,
  Settings2,
  Sparkles,
  Sun,
  Upload,
  WandSparkles,
  X,
  Zap,
} from 'lucide-react'
import exifr from 'exifr'

type Stage = 0 | 1 | 2 | 3 | 4

type ExifData = {
  fNumber: number
  exposureTime: string
  iso: number
  focalLength: number
  whiteBalance: string
  sceneEv: number
  source: 'EXIF' | 'fallback'
}

type VisualDelta = {
  targetBokehLevel: 'shallow' | 'moderate' | 'deep'
  exposureShiftEv: number
  subjectMotionSpeed: 'static' | 'slow' | 'fast'
  targetKelvin: number
  tintShift: 'neutral' | 'warm' | 'cool'
  lightingNotes: string
}

type Variation = {
  id: number
  title: string
  note: string
  tone: string
  selected?: boolean
  revision: number
}

type Kit = {
  body: string
  lens: string
  crop: number
  maxAperture: number
  minAperture: number
  minIso: number
  maxIso: number
  ibis: number
  focalLength: number
  maxShutterSpeed: string
}

const steps = [
  { id: 0 as Stage, label: 'Gear', meta: 'choose kit' },
  { id: 1 as Stage, label: 'Reference', meta: 'meter scene' },
  { id: 2 as Stage, label: 'Variations', meta: 'shape the look' },
  { id: 3 as Stage, label: 'Refine', meta: 'pick the branch' },
  { id: 4 as Stage, label: 'Dial sheet', meta: 'make it native' },
]

const presets = [
  { label: 'Cinematic', prompt: 'Moody cinematic portrait, warm highlights, shallow background blur.' },
  { label: 'Soft daylight', prompt: 'Soft daylight editorial look, lifted shadows, natural skin and gentle roll-off.' },
  { label: 'Night neon', prompt: 'Night street portrait, cyan shadows, warm neon highlights, controlled grain.' },
]

const defaultExif: ExifData = {
  fNumber: 1.8,
  exposureTime: '1/125s',
  iso: 320,
  focalLength: 26,
  whiteBalance: 'Auto',
  sceneEv: 8.7,
  source: 'EXIF',
}

const defaultKit: Kit = {
  body: 'Sony α7 IV',
  lens: 'FE 50mm F1.8',
  crop: 1,
  maxAperture: 1.8,
  minAperture: 22,
  minIso: 100,
  maxIso: 51200,
  ibis: 5.5,
  focalLength: 50,
  maxShutterSpeed: '1/8000',
}

const initialVariations: Variation[] = [
  { id: 1, title: 'Warm / shallow', note: 'Soft skin, amber highlights, subject separation.', tone: 'warm', selected: true, revision: 1 },
  { id: 2, title: 'Cool / crisp', note: 'Deeper shadows, cleaner blues, more edge contrast.', tone: 'cool', revision: 1 },
  { id: 3, title: 'Neutral / soft', note: 'Balanced contrast, open shadows, quiet grain.', tone: 'neutral', revision: 1 },
]

const defaultVisualDelta: VisualDelta = {
  targetBokehLevel: 'shallow',
  exposureShiftEv: -0.7,
  subjectMotionSpeed: 'slow',
  targetKelvin: 5600,
  tintShift: 'warm',
  lightingNotes: 'Underexpose highlights by ~2/3 stop to preserve sky detail.',
}

function ev100(fNumber: number, seconds: number, iso: number) {
  return Math.log2((fNumber * fNumber) / seconds) - Math.log2(iso / 100)
}

function nearestStandardIso(value: number) {
  const stops = [100, 125, 160, 200, 250, 320, 400, 500, 640, 800, 1000, 1250, 1600, 2000, 2500, 3200, 4000, 5000, 6400, 8000, 10000, 12800, 16000, 20000, 25600, 32000, 40000, 51200]
  return stops.reduce((best, iso) => (Math.abs(iso - value) < Math.abs(best - value) ? iso : best), 100)
}

function solveSettings(kit: Kit, exif: ExifData, exposureShift = -0.7, targetKelvin = 5600) {
  const targetEv = exif.sceneEv + exposureShift
  const aperture = Math.min(kit.minAperture, Math.max(kit.maxAperture, 2))
  const motionSpeed = 1 / 250
  const reciprocal = 1 / (kit.focalLength * kit.crop)
  const ibisAdjusted = reciprocal * 2 ** kit.ibis
  const fastestShutter = 1 / Number(kit.maxShutterSpeed.split('/')[1] ?? 8000)
  const seconds = Math.min(motionSpeed, Math.max(fastestShutter, ibisAdjusted))
  const rawIso = 100 * (aperture * aperture) / (seconds * 2 ** targetEv)
  const iso = Math.min(kit.maxIso, Math.max(kit.minIso, nearestStandardIso(rawIso)))
  const shutter = `1/${Math.round(1 / seconds)}s`
  return {
    aperture: `f/${aperture.toFixed(1)}`,
    shutter,
    iso: `ISO ${iso}`,
    kelvin: targetKelvin,
    targetEv,
    tip: rawIso < kit.minIso
      ? 'Scene is bright at base ISO. Stop down or add an ND filter to keep the shallow look.'
      : 'Focus on the subject’s eyes; keep highlights under control with a 2/3-stop darker exposure.',
  }
}

function App() {
  const [stage, setStage] = useState<Stage>(0)
  const [kit, setKit] = useState<Kit>(defaultKit)
  const [fileName, setFileName] = useState('Demo frame · terrace_021.jpg')
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [exif, setExif] = useState<ExifData>(defaultExif)
  const [visualDelta] = useState<VisualDelta>(defaultVisualDelta)
  const [prompt, setPrompt] = useState(presets[0].prompt)
  const [variations, setVariations] = useState(initialVariations)
  const [activeVariation, setActiveVariation] = useState(1)
  const [isGenerating, setIsGenerating] = useState(false)
  const [refinement, setRefinement] = useState('Make the shadows a little deeper and keep the face warm.')
  const [showKitMenu, setShowKitMenu] = useState(false)
  const [showHelp, setShowHelp] = useState(false)

  const active = variations.find((variation) => variation.id === activeVariation) ?? variations[0]
  const settings = useMemo(() => solveSettings(kit, exif, visualDelta.exposureShiftEv, visualDelta.targetKelvin), [kit, exif, visualDelta])
  const completedCount = stage === 4 ? 5 : stage + 1

  const handleFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    setFileName(file.name)
    setImageUrl(URL.createObjectURL(file))
    setStage(1)
    try {
      const data = await exifr.parse(file, ['FNumber', 'ExposureTime', 'ISOSpeedRatings', 'FocalLength', 'WhiteBalance'])
      if (data?.FNumber && data?.ExposureTime && data?.ISOSpeedRatings) {
        const seconds = typeof data.ExposureTime === 'number' ? data.ExposureTime : 1 / 125
        setExif({
          fNumber: Number(data.FNumber),
          exposureTime: seconds < 1 ? `1/${Math.round(1 / seconds)}s` : `${seconds}s`,
          iso: Number(data.ISOSpeedRatings),
          focalLength: Number(data.FocalLength ?? 26),
          whiteBalance: String(data.WhiteBalance ?? 'Auto'),
          sceneEv: Number(ev100(Number(data.FNumber), seconds, Number(data.ISOSpeedRatings)).toFixed(1)),
          source: 'EXIF',
        })
      } else {
        setExif((current) => ({ ...current, source: 'fallback' }))
      }
    } catch {
      setExif((current) => ({ ...current, source: 'fallback' }))
    }
  }

  const applyFallback = (sceneEv: number, label: string) => {
    setExif((current) => ({
      ...current,
      exposureTime: label,
      iso: 100,
      whiteBalance: label === 'EV 4' ? 'Auto' : 'Daylight',
      sceneEv,
      source: 'fallback',
    }))
    setStage(2)
  }

  const generate = () => {
    setIsGenerating(true)
    window.setTimeout(() => {
      setVariations([
        { id: 1, title: 'Warm / shallow', note: 'Soft skin, amber highlights, subject separation.', tone: 'warm', selected: true, revision: active.revision + 1 },
        { id: 2, title: 'Cool / crisp', note: 'Deeper shadows, cleaner blues, more edge contrast.', tone: 'cool', revision: active.revision + 1 },
        { id: 3, title: 'Neutral / soft', note: 'Balanced contrast, open shadows, quiet grain.', tone: 'neutral', revision: active.revision + 1 },
      ])
      setActiveVariation(1)
      setIsGenerating(false)
      setStage(2)
    }, 750)
  }

  const refine = () => {
    setIsGenerating(true)
    window.setTimeout(() => {
      setVariations([
        { id: 1, title: 'Deeper / warm', note: 'Branch from the selected look with protected highlights.', tone: 'warm-deep', selected: true, revision: active.revision + 1 },
        { id: 2, title: 'Low-key glow', note: 'More shape in the face, warm edge on the background.', tone: 'glow', revision: active.revision + 1 },
        { id: 3, title: 'Clean / restrained', note: 'A calmer version with a gentle highlight roll-off.', tone: 'neutral', revision: active.revision + 1 },
      ])
      setActiveVariation(1)
      setIsGenerating(false)
      setStage(3)
    }, 750)
  }

  const setPreset = (preset: typeof presets[number]) => setPrompt(preset.prompt)

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand-lockup">
          <div className="brand-mark" aria-hidden="true"><span /><span /></div>
          <div>
            <div className="brand-name">OPTIC<span>MATCH</span></div>
            <div className="brand-kicker">visual look → camera recipe</div>
          </div>
        </div>
        <div className="topbar-actions">
          <div className="session-status"><span className="status-dot" /> local session <span className="status-divider">/</span> no telemetry</div>
          <button className="icon-button subtle" aria-label="Help" onClick={() => setShowHelp((value) => !value)}><CircleHelp size={17} /></button>
          <button className="icon-button menu-button" aria-label="Menu"><Menu size={19} /></button>
        </div>
      </header>

      <main className="page-frame">
        <section className="intro-row">
          <div>
            <div className="eyebrow"><span className="eyebrow-line" /> FIELD WORKFLOW 01</div>
            <h1>Build the look before<br /><em>you touch the dial.</em></h1>
            <p className="lede">Start with a phone frame. Shape the feeling. OpticMatch translates the final look into settings your camera can actually capture.</p>
          </div>
          <div className="intro-aside">
            <div className="aside-label">ACTIVE KIT</div>
            <button className="kit-button" onClick={() => setShowKitMenu((value) => !value)}>
              <span className="kit-icon"><Camera size={17} /></span>
              <span><strong>{kit.body}</strong><small>{kit.lens} <span className="muted-dot">·</span> {kit.crop.toFixed(1)}×</small></span>
              <ChevronRight size={16} />
            </button>
            {showKitMenu && <div className="kit-popover"><button onClick={() => { setKit(defaultKit); setShowKitMenu(false) }}>Sony α7 IV · FE 50mm F1.8 <Check size={14} /></button><button onClick={() => { setKit({ ...defaultKit, body: 'Fujifilm X-T5', lens: 'XF 35mm F2 R WR', crop: 1.5, focalLength: 35 }); setShowKitMenu(false) }}>Fujifilm X-T5 · XF 35mm F2</button><button onClick={() => setShowKitMenu(false)}>+ Add custom kit</button></div>}
          </div>
        </section>

        <nav className="step-rail" aria-label="Workflow steps">
          <div className="rail-track" />
          {steps.map((step, index) => {
            const done = index < completedCount - 1
            const current = stage === step.id
            return <button key={step.id} className={`step-node ${done ? 'done' : ''} ${current ? 'current' : ''}`} onClick={() => setStage(step.id)}><span className="step-number">{done ? <Check size={12} /> : `0${index + 1}`}</span><span className="step-copy"><strong>{step.label}</strong><small>{step.meta}</small></span></button>
          })}
        </nav>

        <div className="workspace">
          <section className="main-column">
            {stage === 0 && <CapturePanel fileName={fileName} imageUrl={imageUrl} handleFile={handleFile} onNext={() => setStage(1)} />}
            {stage === 1 && <MeterPanel exif={exif} fileName={fileName} imageUrl={imageUrl} handleFile={handleFile} onNext={() => setStage(2)} setFallback={applyFallback} />}
            {stage === 2 && <VariationPanel variations={variations} activeVariation={activeVariation} setActiveVariation={setActiveVariation} prompt={prompt} setPrompt={setPrompt} setPreset={setPreset} generate={generate} isGenerating={isGenerating} onNext={() => setStage(3)} />}
            {stage === 3 && <RefinePanel active={active} variations={variations} activeVariation={activeVariation} setActiveVariation={setActiveVariation} refinement={refinement} setRefinement={setRefinement} refine={refine} isGenerating={isGenerating} onNext={() => setStage(4)} />}
            {stage === 4 && <DialSheetPanel settings={settings} kit={kit} exif={exif} active={active} delta={visualDelta} onBack={() => setStage(3)} />}
          </section>

          <aside className="evidence-rail">
            <div className="rail-card evidence-card">
              <div className="card-topline"><span className="small-label">SESSION SIGNAL</span><span className="live-pill"><span /> live</span></div>
              <div className="signal-graphic"><div className="signal-grid" /><div className="signal-wave" /><div className="signal-marker marker-one" /><div className="signal-marker marker-two" /><div className="signal-label label-one">EV <strong>{exif.sceneEv.toFixed(1)}</strong></div><div className="signal-label label-two">ISO <strong>{exif.iso}</strong></div></div>
              <div className="signal-foot"><span>ambient scene</span><strong>{exif.source === 'EXIF' ? 'metered from frame' : 'fallback preset'}</strong></div>
            </div>
            <div className="rail-card note-card">
              <div className="note-pin" />
              <div className="small-label">OPTIC NOTE / 01</div>
              <p>“The edit is a direction, not a filter. We solve for the light that makes it feel native.”</p>
              <div className="note-sign">— field guide</div>
            </div>
            <div className="privacy-card"><LockKeyhole size={14} /><span>Photos stay on this device.<br />Bring your own AI key when ready.</span></div>
          </aside>
        </div>

        {showHelp && <div className="help-popover"><div className="help-title"><Info size={15} /> How this works</div><p>OpticMatch reads the phone frame’s exposure metadata, lets you steer three look branches, then solves a dial sheet against your selected camera and lens.</p><button onClick={() => setShowHelp(false)}>Got it</button></div>}
      </main>
    </div>
  )
}

function CapturePanel({ fileName, imageUrl, handleFile, onNext }: { fileName: string; imageUrl: string | null; handleFile: (event: ChangeEvent<HTMLInputElement>) => void; onNext: () => void }) {
  return <>
    <div className="panel-heading"><div><div className="small-label accent-label">01 / GEAR + REFERENCE</div><h2>Place your reference frame.</h2></div><div className="panel-counter">01 <span>/</span> 05</div></div>
    <div className="capture-layout">
      <label className="dropzone">
        <input type="file" accept="image/jpeg,image/png,image/heic,image/dng" onChange={handleFile} />
        <div className={`frame-art ${imageUrl ? 'has-image' : ''}`} style={imageUrl ? { backgroundImage: `url(${imageUrl})` } : undefined}>
          {!imageUrl && <><div className="frame-sun" /><div className="frame-horizon" /><div className="frame-subject" /><div className="frame-glow" /></>}
          <div className="frame-corner corner-tl" /><div className="frame-corner corner-tr" /><div className="frame-corner corner-bl" /><div className="frame-corner corner-br" />
          <div className="frame-tag"><ScanLine size={13} /> {imageUrl ? 'uploaded frame' : 'demo frame'}</div>
        </div>
        <div className="drop-copy"><div className="upload-icon"><Upload size={17} /></div><strong>Drop a photo or browse</strong><span>JPEG · HEIC · DNG · PNG</span></div>
      </label>
      <div className="capture-details">
        <div className="small-label">WHAT TO CAPTURE</div>
        <h3>One frame. One feeling.</h3>
        <p>Use your phone to frame the scene exactly as you want it to feel. The original stays untouched; it becomes the baseline for every branch.</p>
        <div className="detail-list"><div><span className="detail-index">01</span><span>Keep the subject and light in frame</span></div><div><span className="detail-index">02</span><span>Leave the phone’s camera settings intact</span></div><div><span className="detail-index">03</span><span>We’ll read EXIF before you prompt the look</span></div></div>
        <div className="file-chip"><FileImage size={15} /><span>{fileName}</span><Check size={14} /></div>
        <button className="primary-button full-button" onClick={onNext}>Read the scene <ArrowUpRight size={16} /></button>
      </div>
    </div>
  </>
}

function MeterPanel({ exif, fileName, imageUrl, handleFile, onNext, setFallback }: { exif: ExifData; fileName: string; imageUrl: string | null; handleFile: (event: ChangeEvent<HTMLInputElement>) => void; onNext: () => void; setFallback: (sceneEv: number, label: string) => void }) {
  return <>
    <div className="panel-heading"><div><div className="small-label accent-label">02 / LIGHT METER</div><h2>The scene reads {exif.sceneEv.toFixed(1)} EV<sup>100</sup>.</h2></div><div className="panel-counter">02 <span>/</span> 05</div></div>
    <div className="meter-layout">
      <div className="meter-card"><div className="meter-card-head"><span className="small-label">REFERENCE FRAME</span><span className="exif-pill"><span className={exif.source === 'EXIF' ? 'pill-dot' : 'pill-dot fallback'} /> {exif.source === 'EXIF' ? 'EXIF FOUND' : 'FALLBACK'}</span></div><div className="meter-number">{exif.sceneEv.toFixed(1)}<span>EV<sub>100</sub></span></div><div className="meter-bar"><span style={{ width: `${Math.min(100, Math.max(14, exif.sceneEv / 16 * 100))}%` }} /></div><div className="meter-scale"><span>DIM / 4</span><span>INDOOR / 8</span><span>OVERCAST / 12</span><span>SUN / 15</span></div><div className="meter-scene"><div className="scene-thumb" style={imageUrl ? { backgroundImage: `url(${imageUrl})` } : undefined} /><div><strong>{fileName}</strong><span>baseline exposure · {exif.whiteBalance} WB</span></div><button className="replace-button"><label><RefreshCw size={14} /> replace<input type="file" accept="image/*" onChange={handleFile} /></label></button></div></div>
      <div className="exif-card"><div className="small-label">READ FROM EXIF</div><div className="exif-grid"><Metric label="APERTURE" value={`f/${exif.fNumber}`} /><Metric label="SHUTTER" value={exif.exposureTime} /><Metric label="ISO" value={String(exif.iso)} /><Metric label="FOCAL LENGTH" value={`${exif.focalLength}mm`} /></div><div className="formula"><span>EV<sub>100</sub></span> = log₂(N² / t) − log₂(ISO / 100)<strong>{exif.sceneEv.toFixed(1)}</strong></div><div className="fallback-note"><Sun size={15} /><span>No EXIF? Choose a lighting preset and keep moving.</span></div></div>
    </div>
    <div className="fallback-row"><button onClick={() => setFallback(4, 'EV 4')}><Moon size={14} /> Dim / night <strong>EV 4</strong></button><button onClick={() => setFallback(8, 'EV 8')}><CloudOff size={14} /> Indoor bright <strong>EV 8</strong></button><button onClick={() => setFallback(12, 'EV 12')}><Sun size={14} /> Overcast <strong>EV 12</strong></button><button onClick={() => setFallback(15, 'EV 15')}><Zap size={14} /> Bright sun <strong>EV 15</strong></button></div>
    <div className="panel-footer"><span><Info size={14} /> The phone’s meter is a starting point. Your look will tune it.</span><button className="primary-button" onClick={onNext}>Shape the look <ChevronRight size={16} /></button></div>
  </>
}

function VariationPanel({ variations, activeVariation, setActiveVariation, prompt, setPrompt, setPreset, generate, isGenerating, onNext }: { variations: Variation[]; activeVariation: number; setActiveVariation: (id: number) => void; prompt: string; setPrompt: (value: string) => void; setPreset: (preset: typeof presets[number]) => void; generate: () => void; isGenerating: boolean; onNext: () => void }) {
  return <>
    <div className="panel-heading"><div><div className="small-label accent-label">03 / SHAPE THE LOOK</div><h2>Three directions. Same scene.</h2></div><div className="panel-counter">03 <span>/</span> 05</div></div>
    <div className="prompt-bar"><div className="prompt-icon"><MessageSquareText size={17} /></div><textarea value={prompt} onChange={(event) => setPrompt(event.target.value)} aria-label="Style prompt" /><button className="generate-button" onClick={generate} disabled={isGenerating}>{isGenerating ? <><RefreshCw size={15} className="spin" /> shaping</> : <><Sparkles size={15} /> generate 3</>}</button></div>
    <div className="preset-row"><span className="small-label">QUICK START</span>{presets.map((preset) => <button key={preset.label} className={prompt === preset.prompt ? 'selected' : ''} onClick={() => setPreset(preset)}>{preset.label}</button>)}</div>
    <div className="variation-grid">{variations.map((variation, index) => <VariationCard key={`${variation.id}-${variation.revision}`} variation={variation} index={index} active={activeVariation === variation.id} onClick={() => setActiveVariation(variation.id)} />)}</div>
    <div className="branch-footer"><span><Layers3 size={15} /> 3 branches <b>·</b> revision {variations[0].revision.toString().padStart(2, '0')} <b>·</b> demo provider</span><button className="primary-button" onClick={onNext}>Refine selected <WandSparkles size={15} /></button></div>
  </>
}

function VariationCard({ variation, index, active, onClick }: { variation: Variation; index: number; active: boolean; onClick: () => void }) {
  return <button className={`variation-card ${active ? 'active' : ''}`} onClick={onClick}><div className={`variation-art art-${variation.tone}`}><div className="art-sky" /><div className="art-light" /><div className="art-subject" /><div className="art-ground" /><div className="art-grain" /><span className="variation-number">0{index + 1}</span><span className="variation-select">{active ? <Check size={13} /> : <Focus size={13} />}</span></div><div className="variation-meta"><div><strong>{variation.title}</strong><span>{variation.note}</span></div><ArrowUpRight size={15} /></div></button>
}

function RefinePanel({ active, variations, activeVariation, setActiveVariation, refinement, setRefinement, refine, isGenerating, onNext }: { active: Variation; variations: Variation[]; activeVariation: number; setActiveVariation: (id: number) => void; refinement: string; setRefinement: (value: string) => void; refine: () => void; isGenerating: boolean; onNext: () => void }) {
  return <>
    <div className="panel-heading"><div><div className="small-label accent-label">04 / REFINE THE BRANCH</div><h2>Keep the mood. Make it native.</h2></div><div className="panel-counter">04 <span>/</span> 05</div></div>
    <div className="refine-layout"><div className="refine-preview"><VariationCard variation={active} index={activeVariation - 1} active onClick={() => undefined} /><div className="approved-stamp"><Check size={14} /> working branch</div></div><div className="refine-chat"><div className="chat-history"><div className="chat-line user-line"><span>YOU</span><p>“{active.title} — {active.note.toLowerCase()}”</p></div><div className="chat-line system-line"><span>OPTICMATCH</span><p>Ready. Tell me what should move, and what should stay.</p></div></div><div className="refine-input"><textarea value={refinement} onChange={(event) => setRefinement(event.target.value)} aria-label="Refinement prompt" /><button onClick={refine} disabled={isGenerating}>{isGenerating ? <RefreshCw size={16} className="spin" /> : <MoveRight size={17} />}</button></div><div className="refine-suggestions"><button onClick={() => setRefinement('Make the shadows deeper and protect the sky.')}>deeper shadows</button><button onClick={() => setRefinement('Make the background blur just a little more.')}>more separation</button><button onClick={() => setRefinement('Keep the color, but calm the contrast.')}>calmer contrast</button></div></div></div>
    <div className="branch-strip"><span className="small-label">CHOOSE A PARENT BRANCH</span>{variations.map((variation) => <button className={activeVariation === variation.id ? 'active' : ''} key={variation.id} onClick={() => setActiveVariation(variation.id)}><span className={`mini-swatch swatch-${variation.tone}`} /> {variation.title}<ChevronRight size={14} /></button>)}</div>
    <div className="panel-footer"><span><Palette size={14} /> Every refinement creates a new visual branch.</span><button className="primary-button" onClick={onNext}>Approve this look <Check size={15} /></button></div>
  </>
}

function DialSheetPanel({ settings, kit, exif, active, delta, onBack }: { settings: ReturnType<typeof solveSettings>; kit: Kit; exif: ExifData; active: Variation; delta: VisualDelta; onBack: () => void }) {
  const downloadSheet = () => {
    const html = `<!doctype html><meta charset="utf-8"><title>OpticMatch dial sheet</title><style>body{font:18px system-ui;max-width:720px;margin:48px auto;padding:24px;background:#e7e0cf;color:#17231e}h1{font-size:42px;margin-bottom:4px}small{color:#667d6d}section{border-top:1px solid #9aa898;padding:22px 0}strong{font-size:28px;margin-right:24px}p{line-height:1.6}</style><h1>${kit.body}</h1><small>${kit.lens} · OpticMatch dial sheet</small><section><strong>MODE M</strong><strong>${settings.aperture}</strong><strong>${settings.shutter}</strong><strong>${settings.iso}</strong></section><section><small>WHITE BALANCE</small><h2>${settings.kelvin}K · ${delta.tintShift}</h2><p>${settings.tip}</p></section><small>look: ${active.title.toLowerCase()} · target ${settings.targetEv.toFixed(1)} EV</small>`
    const url = URL.createObjectURL(new Blob([html], { type: 'text/html' }))
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = 'opticmatch-dial-sheet.html'
    anchor.click()
    URL.revokeObjectURL(url)
  }
  return <>
    <div className="panel-heading"><div><div className="small-label accent-label">05 / CAMERA RECIPE</div><h2>Now make it native.</h2></div><div className="panel-counter">05 <span>/</span> 05</div></div>
    <div className="dial-sheet"><div className="dial-top"><div><div className="sheet-kicker">OPTICMATCH / DIAL SHEET</div><h3>{kit.body}<span>{kit.lens}</span></h3></div><div className="sheet-code">OM-{Math.round(exif.sceneEv * 10)}<br /><span>REV 01</span></div></div><div className="dial-values"><DialValue label="MODE" value="M" /><DialValue label="APERTURE" value={settings.aperture} /><DialValue label="SHUTTER" value={settings.shutter} /><DialValue label="ISO" value={settings.iso} /></div><div className="white-balance"><div><span className="small-label">WHITE BALANCE</span><strong>{settings.kelvin}K</strong></div><div className="balance-line"><span className="cool-end" /><span className="balance-marker" /><span className="warm-end" /></div><div className="balance-caption"><span>cool</span><span>daylight / {delta.tintShift}</span></div></div><div className="sheet-note"><div className="note-symbol"><Aperture size={18} /></div><div><span className="small-label">FIELD TIP</span><p>{settings.tip} {delta.lightingNotes}</p></div></div><div className="sheet-footer"><span>look: <strong>{active.title.toLowerCase()}</strong> <b>·</b> target {settings.targetEv.toFixed(1)} EV</span><span>generated locally</span></div></div>
    <div className="dial-actions"><button className="secondary-button" onClick={onBack}><ChevronRight size={15} className="rotate-180" /> refine again</button><button className="primary-button" onClick={downloadSheet}><Download size={15} /> save dial sheet</button></div>
  </>
}

function Metric({ label, value }: { label: string; value: string }) { return <div className="metric"><span>{label}</span><strong>{value}</strong></div> }
function DialValue({ label, value }: { label: string; value: string }) { return <div className="dial-value"><span>{label}</span><strong>{value}</strong></div> }

export default App
