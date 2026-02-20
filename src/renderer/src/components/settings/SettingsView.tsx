import { useState, useEffect } from 'react'
import { useSettingsStore } from '../../stores/settingsStore'
import { HotkeyInput } from '../common/HotkeyInput'
import type { AppSettings } from '@shared/types'

type Tab = 'general' | 'recording' | 'playback' | 'hotkeys' | 'advanced'

export function SettingsView(): JSX.Element {
  const [activeTab, setActiveTab] = useState<Tab>('general')
  const { settings, updateSettings } = useSettingsStore()

  const tabs: { id: Tab; label: string }[] = [
    { id: 'general', label: 'General' },
    { id: 'recording', label: 'Recording' },
    { id: 'playback', label: 'Playback' },
    { id: 'hotkeys', label: 'Hotkeys' },
    { id: 'advanced', label: 'Advanced' }
  ]

  return (
    <div className="animate-slide-in" style={{ maxWidth: 700 }}>
      <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 16 }}>Settings</h2>

      {/* Tabs */}
      <div
        style={{
          display: 'flex',
          gap: 2,
          marginBottom: 20,
          padding: 3,
          background: 'var(--bg-secondary)',
          borderRadius: 8
        }}
      >
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              flex: 1,
              padding: '8px 12px',
              borderRadius: 6,
              border: 'none',
              background: activeTab === tab.id ? 'var(--bg-tertiary)' : 'transparent',
              color: activeTab === tab.id ? 'var(--accent-cyan)' : 'var(--text-secondary)',
              cursor: 'pointer',
              fontSize: 12,
              fontWeight: 600,
              transition: 'all 0.15s'
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div
        style={{
          background: 'var(--bg-secondary)',
          borderRadius: 10,
          border: '1px solid var(--border-color)',
          padding: 20
        }}
      >
        {activeTab === 'general' && (
          <GeneralSettings settings={settings} onUpdate={updateSettings} />
        )}
        {activeTab === 'recording' && (
          <RecordingSettings settings={settings} onUpdate={updateSettings} />
        )}
        {activeTab === 'playback' && (
          <PlaybackSettings settings={settings} onUpdate={updateSettings} />
        )}
        {activeTab === 'hotkeys' && (
          <HotkeySettings settings={settings} onUpdate={updateSettings} />
        )}
        {activeTab === 'advanced' && <AdvancedSettings />}
      </div>
    </div>
  )
}

function SettingRow({
  label,
  description,
  children
}: {
  label: string
  description?: string
  children: React.ReactNode
}): JSX.Element {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '12px 0',
        borderBottom: '1px solid var(--border-subtle)'
      }}
    >
      <div>
        <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)' }}>{label}</div>
        {description && (
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
            {description}
          </div>
        )}
      </div>
      {children}
    </div>
  )
}

function Toggle({
  checked,
  onChange
}: {
  checked: boolean
  onChange: (val: boolean) => void
}): JSX.Element {
  return (
    <button
      onClick={() => onChange(!checked)}
      style={{
        width: 40,
        height: 22,
        borderRadius: 11,
        border: 'none',
        background: checked ? 'var(--accent-cyan)' : '#374151',
        cursor: 'pointer',
        position: 'relative',
        transition: 'background 0.2s',
        flexShrink: 0
      }}
    >
      <div
        style={{
          width: 18,
          height: 18,
          borderRadius: '50%',
          background: 'white',
          position: 'absolute',
          top: 2,
          left: checked ? 20 : 2,
          transition: 'left 0.2s'
        }}
      />
    </button>
  )
}

function GeneralSettings({
  settings,
  onUpdate
}: {
  settings: AppSettings
  onUpdate: (s: Partial<AppSettings>) => void
}): JSX.Element {
  return (
    <>
      <SettingRow label="Start Minimized" description="Launch app minimized to system tray">
        <Toggle
          checked={settings.general.startMinimized}
          onChange={(v) => onUpdate({ general: { ...settings.general, startMinimized: v } })}
        />
      </SettingRow>
      <SettingRow label="Minimize to Tray" description="Keep running in tray when window is closed">
        <Toggle
          checked={settings.general.minimizeToTray}
          onChange={(v) => onUpdate({ general: { ...settings.general, minimizeToTray: v } })}
        />
      </SettingRow>
      <SettingRow label="Launch on Startup" description="Start Macronyx when your computer boots">
        <Toggle
          checked={settings.general.launchOnStartup}
          onChange={(v) => onUpdate({ general: { ...settings.general, launchOnStartup: v } })}
        />
      </SettingRow>
    </>
  )
}

function RecordingSettings({
  settings,
  onUpdate
}: {
  settings: AppSettings
  onUpdate: (s: Partial<AppSettings>) => void
}): JSX.Element {
  const rec = settings.recording
  return (
    <>
      <SettingRow label="Mouse Movement" description="Record mouse cursor position changes">
        <Toggle
          checked={rec.captureMouseMovement}
          onChange={(v) => onUpdate({ recording: { ...rec, captureMouseMovement: v } })}
        />
      </SettingRow>
      <SettingRow label="Mouse Clicks" description="Record left, right, and middle clicks">
        <Toggle
          checked={rec.captureMouseClicks}
          onChange={(v) => onUpdate({ recording: { ...rec, captureMouseClicks: v } })}
        />
      </SettingRow>
      <SettingRow label="Mouse Scroll" description="Record scroll wheel actions">
        <Toggle
          checked={rec.captureMouseScroll}
          onChange={(v) => onUpdate({ recording: { ...rec, captureMouseScroll: v } })}
        />
      </SettingRow>
      <SettingRow label="Keyboard" description="Record key presses and releases">
        <Toggle
          checked={rec.captureKeyboard}
          onChange={(v) => onUpdate({ recording: { ...rec, captureKeyboard: v } })}
        />
      </SettingRow>
      <SettingRow
        label="Sample Rate"
        description={`Mouse position captured every ${rec.mouseMoveSampleRate}ms (~${Math.round(1000 / rec.mouseMoveSampleRate)} FPS)`}
      >
        <input
          type="range"
          min={8}
          max={100}
          value={rec.mouseMoveSampleRate}
          onChange={(e) =>
            onUpdate({ recording: { ...rec, mouseMoveSampleRate: Number(e.target.value) } })
          }
          style={{ width: 120, accentColor: 'var(--accent-cyan)' }}
        />
      </SettingRow>
    </>
  )
}

function PlaybackSettings({
  settings,
  onUpdate
}: {
  settings: AppSettings
  onUpdate: (s: Partial<AppSettings>) => void
}): JSX.Element {
  const pb = settings.playback
  return (
    <>
      <SettingRow label="Default Speed" description={`${pb.defaultSpeed}x playback speed`}>
        <input
          type="range"
          min={0.25}
          max={4}
          step={0.25}
          value={pb.defaultSpeed}
          onChange={(e) =>
            onUpdate({ playback: { ...pb, defaultSpeed: Number(e.target.value) } })
          }
          style={{ width: 120, accentColor: 'var(--accent-cyan)' }}
        />
      </SettingRow>
      <SettingRow
        label="Default Repeat Count"
        description={pb.defaultRepeatCount === 0 ? 'Infinite loop' : `${pb.defaultRepeatCount} time(s)`}
      >
        <input
          type="number"
          min={0}
          max={9999}
          value={pb.defaultRepeatCount}
          onChange={(e) =>
            onUpdate({ playback: { ...pb, defaultRepeatCount: Number(e.target.value) } })
          }
          style={{
            width: 80,
            padding: '4px 8px',
            borderRadius: 6,
            border: '1px solid var(--border-color)',
            background: 'var(--bg-primary)',
            color: 'var(--text-primary)',
            fontSize: 13,
            textAlign: 'center'
          }}
        />
      </SettingRow>
      <SettingRow label="Humanize" description="Add slight randomization to timing and positions">
        <Toggle
          checked={pb.defaultHumanize}
          onChange={(v) => onUpdate({ playback: { ...pb, defaultHumanize: v } })}
        />
      </SettingRow>
      {pb.defaultHumanize && (
        <SettingRow label="Humanize Amount" description={`${pb.defaultHumanizeAmount}% variance`}>
          <input
            type="range"
            min={1}
            max={100}
            value={pb.defaultHumanizeAmount}
            onChange={(e) =>
              onUpdate({ playback: { ...pb, defaultHumanizeAmount: Number(e.target.value) } })
            }
            style={{ width: 120, accentColor: 'var(--accent-violet)' }}
          />
        </SettingRow>
      )}
    </>
  )
}

function HotkeySettings({
  settings,
  onUpdate
}: {
  settings: AppSettings
  onUpdate: (s: Partial<AppSettings>) => void
}): JSX.Element {
  const hk = settings.hotkeys
  const updateHotkey = (key: keyof typeof hk, value: string): void => {
    onUpdate({ hotkeys: { ...hk, [key]: value } })
  }

  return (
    <>
      <SettingRow label="Start Recording" description="Begin a new macro recording">
        <HotkeyInput value={hk.recordStart} onChange={(v) => updateHotkey('recordStart', v)} />
      </SettingRow>
      <SettingRow label="Stop Recording" description="End the current recording">
        <HotkeyInput value={hk.recordStop} onChange={(v) => updateHotkey('recordStop', v)} />
      </SettingRow>
      <SettingRow label="Start Playback" description="Play the selected macro">
        <HotkeyInput value={hk.playStart} onChange={(v) => updateHotkey('playStart', v)} />
      </SettingRow>
      <SettingRow label="Stop Playback" description="Halt macro playback">
        <HotkeyInput value={hk.playStop} onChange={(v) => updateHotkey('playStop', v)} />
      </SettingRow>
      <SettingRow label="Emergency Stop" description="Immediately stop all activity">
        <HotkeyInput
          value={hk.emergencyStop}
          onChange={(v) => updateHotkey('emergencyStop', v)}
        />
      </SettingRow>
    </>
  )
}

function AdvancedSettings(): JSX.Element {
  const [portableActive, setPortableActive] = useState(false)
  const [portableLoading, setPortableLoading] = useState(true)

  const checkPortable = async (): Promise<void> => {
    try {
      const result = (await window.api.getPortableStatus()) as { active: boolean }
      setPortableActive(result.active)
    } catch {
      // ignore
    }
    setPortableLoading(false)
  }

  useEffect(() => {
    checkPortable()
  }, [])

  const handleTogglePortable = async (): Promise<void> => {
    setPortableLoading(true)
    try {
      const result = (await window.api.togglePortable(!portableActive)) as {
        success: boolean
        active: boolean
      }
      if (result.success) {
        setPortableActive(result.active)
      }
    } catch {
      // ignore
    }
    setPortableLoading(false)
  }

  return (
    <>
      <SettingRow label="Version" description="Macronyx v1.0.0">
        <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>1.0.0</span>
      </SettingRow>
      <SettingRow
        label="Portable Mode"
        description={
          portableActive
            ? 'Data is stored next to the executable. Restart to apply changes.'
            : 'Store settings and macros next to the executable instead of AppData'
        }
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span
            style={{
              fontSize: 11,
              fontWeight: 600,
              color: portableActive ? 'var(--success)' : 'var(--text-muted)'
            }}
          >
            {portableLoading ? '...' : portableActive ? 'Active' : 'Not active'}
          </span>
          <button
            onClick={handleTogglePortable}
            disabled={portableLoading}
            style={{
              padding: '5px 12px',
              borderRadius: 6,
              border: `1px solid ${portableActive ? 'var(--danger)' : 'var(--accent-cyan)'}`,
              background: 'transparent',
              color: portableActive ? 'var(--danger)' : 'var(--accent-cyan)',
              cursor: portableLoading ? 'wait' : 'pointer',
              fontSize: 11,
              fontWeight: 500,
              opacity: portableLoading ? 0.5 : 1
            }}
          >
            {portableActive ? 'Disable' : 'Enable'}
          </button>
        </div>
      </SettingRow>
      <div style={{ marginTop: 20 }}>
        <button
          onClick={async () => {
            const { DEFAULT_SETTINGS } = await import('@shared/constants')
            await window.api.setSettings(DEFAULT_SETTINGS)
            useSettingsStore.getState().loadSettings()
          }}
          style={{
            padding: '8px 16px',
            borderRadius: 6,
            border: '1px solid var(--danger)',
            background: 'transparent',
            color: 'var(--danger)',
            cursor: 'pointer',
            fontSize: 12,
            fontWeight: 500
          }}
        >
          Reset to Defaults
        </button>
      </div>
    </>
  )
}
