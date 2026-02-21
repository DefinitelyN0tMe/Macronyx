import { useState, useEffect, useCallback } from 'react'
import { useSettingsStore } from '../../stores/settingsStore'
import { HotkeyInput } from '../common/HotkeyInput'
import type { AppSettings, ProfileRule, Profile } from '@shared/types'
import { v4 as uuid } from 'uuid'

type Tab = 'general' | 'recording' | 'playback' | 'hotkeys' | 'profiles' | 'advanced'

export function SettingsView(): JSX.Element {
  const [activeTab, setActiveTab] = useState<Tab>('general')
  const { settings, updateSettings } = useSettingsStore()

  const tabs: { id: Tab; label: string }[] = [
    { id: 'general', label: 'General' },
    { id: 'recording', label: 'Recording' },
    { id: 'playback', label: 'Playback' },
    { id: 'hotkeys', label: 'Hotkeys' },
    { id: 'profiles', label: 'Profiles' },
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
        {activeTab === 'profiles' && (
          <ProfileSettings settings={settings} onUpdate={updateSettings} />
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
      <SettingRow
        label="Status Widget"
        description="Show a floating status overlay when the app is minimized"
      >
        <Toggle
          checked={settings.general.showOverlayWidget !== false}
          onChange={(v) => onUpdate({ general: { ...settings.general, showOverlayWidget: v } })}
        />
      </SettingRow>
      <SettingRow
        label="Auto-Save"
        description="Automatically save editor changes every 60 seconds"
      >
        <Toggle
          checked={settings.general.autoSave !== false}
          onChange={(v) => onUpdate({ general: { ...settings.general, autoSave: v } })}
        />
      </SettingRow>

      {/* ── v1.3.0: Triggers ──────────────────────────────── */}
      <div
        style={{
          marginTop: 16,
          marginBottom: 4,
          fontSize: 11,
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          color: 'var(--accent-cyan)'
        }}
      >
        Automation
      </div>
      <SettingRow
        label="Enable Triggers"
        description="Allow macros to start automatically based on triggers (hotkey, schedule, window, pixel)"
      >
        <Toggle
          checked={settings.general.enableTriggers}
          onChange={(v) => onUpdate({ general: { ...settings.general, enableTriggers: v } })}
        />
      </SettingRow>
      <SettingRow
        label="Auto-Switch Profiles"
        description="Automatically switch settings profile based on the active application window"
      >
        <Toggle
          checked={settings.general.autoSwitchProfiles}
          onChange={(v) => onUpdate({ general: { ...settings.general, autoSwitchProfiles: v } })}
        />
      </SettingRow>

      {settings.general.autoSwitchProfiles && (
        <ProfileRulesEditor settings={settings} onUpdate={onUpdate} />
      )}
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
      <SettingRow
        label="Relative Positioning"
        description="Record mouse positions relative to the active window — macros adapt when windows move"
      >
        <Toggle
          checked={rec.relativePositioning}
          onChange={(v) => onUpdate({ recording: { ...rec, relativePositioning: v } })}
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
      <SettingRow label="Toggle Pause" description="Pause/resume recording or playback">
        <HotkeyInput value={hk.togglePause} onChange={(v) => updateHotkey('togglePause', v)} />
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
      <SettingRow label="Version" description="Macronyx v1.3.1">
        <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>1.3.1</span>
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

/* ─── Profile Management ───────────────────────────────────────────── */

function ProfileSettings({
  settings,
  onUpdate
}: {
  settings: AppSettings
  onUpdate: (s: Partial<AppSettings>) => void
}): JSX.Element {
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const [newName, setNewName] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingName, setEditingName] = useState('')

  const loadProfiles = useCallback(async () => {
    try {
      const list = (await window.api.listProfiles()) as Profile[]
      setProfiles(list || [])
    } catch {
      setProfiles([])
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    loadProfiles()
  }, [loadProfiles])

  const handleCreate = async (): Promise<void> => {
    const name = newName.trim()
    if (!name) return
    const profile: Profile = {
      id: uuid(),
      name,
      settings: { ...settings },
      isActive: false
    }
    await window.api.saveProfile(profile)
    setNewName('')
    await loadProfiles()
  }

  const handleActivate = async (id: string): Promise<void> => {
    await window.api.activateProfile(id)
    // Reload settings in the store so the UI reflects the new profile's settings
    await useSettingsStore.getState().loadSettings()
    await loadProfiles()
  }

  const handleRename = async (profile: Profile): Promise<void> => {
    const name = editingName.trim()
    if (!name) return
    await window.api.saveProfile({ ...profile, name })
    setEditingId(null)
    setEditingName('')
    await loadProfiles()
  }

  const handleDelete = async (id: string): Promise<void> => {
    await window.api.deleteProfile(id)
    await loadProfiles()
  }

  const handleUpdateFromCurrent = async (profile: Profile): Promise<void> => {
    await window.api.saveProfile({
      ...profile,
      settings: { ...settings }
    })
    await loadProfiles()
  }

  const inputStyle: React.CSSProperties = {
    padding: '6px 10px',
    borderRadius: 6,
    border: '1px solid var(--border-color)',
    background: 'var(--bg-primary)',
    color: 'var(--text-primary)',
    fontSize: 13
  }

  if (loading) {
    return (
      <div style={{ color: 'var(--text-secondary)', fontSize: 13, padding: 16 }}>
        Loading profiles...
      </div>
    )
  }

  return (
    <>
      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 14, lineHeight: 1.5 }}>
        Profiles save a snapshot of your current settings (recording, playback, hotkeys, general options).
        Switch between profiles to quickly change configurations. Use{' '}
        <strong style={{ color: 'var(--accent-cyan)' }}>Auto-Switch Profiles</strong> in General
        settings to switch automatically based on the active window.
      </div>

      {/* Create new profile */}
      <div
        style={{
          display: 'flex',
          gap: 8,
          marginBottom: 16,
          padding: 12,
          background: 'rgba(6, 182, 212, 0.05)',
          borderRadius: 8,
          border: '1px solid rgba(6, 182, 212, 0.15)'
        }}
      >
        <input
          type="text"
          placeholder="New profile name..."
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleCreate()
          }}
          style={{ ...inputStyle, flex: 1 }}
        />
        <button
          onClick={handleCreate}
          disabled={!newName.trim()}
          style={{
            border: 'none',
            borderRadius: 6,
            padding: '6px 14px',
            background: newName.trim() ? 'var(--accent-cyan)' : 'var(--bg-secondary)',
            color: newName.trim() ? '#000' : 'var(--text-secondary)',
            cursor: newName.trim() ? 'pointer' : 'default',
            fontSize: 12,
            fontWeight: 600,
            whiteSpace: 'nowrap'
          }}
        >
          + Save Current as Profile
        </button>
      </div>

      {/* Profile list */}
      {profiles.length === 0 ? (
        <div
          style={{
            color: 'var(--text-secondary)',
            fontSize: 13,
            textAlign: 'center',
            padding: 30,
            background: 'var(--bg-primary)',
            borderRadius: 8,
            border: '1px dashed var(--border-color)'
          }}
        >
          No profiles yet. Enter a name and click &quot;Save Current as Profile&quot; to create one.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {profiles.map((profile) => (
            <div
              key={profile.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '10px 12px',
                background: profile.isActive
                  ? 'rgba(6, 182, 212, 0.08)'
                  : 'var(--bg-primary)',
                borderRadius: 8,
                border: `1px solid ${profile.isActive ? 'rgba(6, 182, 212, 0.3)' : 'var(--border-color)'}`,
                transition: 'all 0.15s ease'
              }}
            >
              {/* Active indicator */}
              <div
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  background: profile.isActive ? '#22c55e' : '#374151',
                  flexShrink: 0
                }}
                title={profile.isActive ? 'Active profile' : 'Inactive'}
              />

              {/* Name (editable) */}
              {editingId === profile.id ? (
                <input
                  type="text"
                  value={editingName}
                  onChange={(e) => setEditingName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleRename(profile)
                    if (e.key === 'Escape') {
                      setEditingId(null)
                      setEditingName('')
                    }
                  }}
                  onBlur={() => handleRename(profile)}
                  autoFocus
                  style={{ ...inputStyle, flex: 1, fontWeight: 500 }}
                />
              ) : (
                <div
                  style={{ flex: 1, cursor: 'pointer' }}
                  onDoubleClick={() => {
                    setEditingId(profile.id)
                    setEditingName(profile.name)
                  }}
                  title="Double-click to rename"
                >
                  <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)' }}>
                    {profile.name}
                  </div>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 1 }}>
                    {profile.isActive ? '● Active' : 'Double-click to rename'}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                {!profile.isActive && (
                  <button
                    onClick={() => handleActivate(profile.id)}
                    title="Activate this profile (loads its settings)"
                    style={{
                      border: 'none',
                      borderRadius: 6,
                      padding: '4px 10px',
                      background: 'rgba(6, 182, 212, 0.15)',
                      color: 'var(--accent-cyan)',
                      cursor: 'pointer',
                      fontSize: 11,
                      fontWeight: 600
                    }}
                  >
                    Activate
                  </button>
                )}

                <button
                  onClick={() => handleUpdateFromCurrent(profile)}
                  title="Overwrite this profile with current settings"
                  style={{
                    border: 'none',
                    borderRadius: 6,
                    padding: '4px 10px',
                    background: 'rgba(139, 92, 246, 0.15)',
                    color: '#8b5cf6',
                    cursor: 'pointer',
                    fontSize: 11,
                    fontWeight: 600
                  }}
                >
                  Update
                </button>

                <button
                  onClick={() => {
                    setEditingId(profile.id)
                    setEditingName(profile.name)
                  }}
                  title="Rename"
                  style={{
                    border: 'none',
                    borderRadius: 6,
                    padding: '4px 8px',
                    background: 'rgba(255,255,255,0.05)',
                    color: 'var(--text-secondary)',
                    cursor: 'pointer',
                    fontSize: 12
                  }}
                >
                  ✏
                </button>

                <button
                  onClick={() => handleDelete(profile.id)}
                  title="Delete profile"
                  style={{
                    border: 'none',
                    borderRadius: 6,
                    padding: '4px 8px',
                    background: 'rgba(239, 68, 68, 0.1)',
                    color: '#ef4444',
                    cursor: 'pointer',
                    fontSize: 14
                  }}
                >
                  ×
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  )
}

/* ─── Profile Auto-Switch Rules Editor ─────────────────────────────── */

function ProfileRulesEditor({
  settings,
  onUpdate
}: {
  settings: AppSettings
  onUpdate: (s: Partial<AppSettings>) => void
}): JSX.Element {
  const [profiles, setProfiles] = useState<Profile[]>([])

  useEffect(() => {
    window.api.listProfiles().then((list) => setProfiles(list as Profile[]))
  }, [])

  const rules = settings.profileRules ?? []

  const updateRules = useCallback(
    (next: ProfileRule[]) => {
      onUpdate({ profileRules: next })
    },
    [onUpdate]
  )

  const addRule = (): void => {
    updateRules([
      ...rules,
      {
        id: uuid(),
        profileId: profiles[0]?.id ?? '',
        matchType: 'process',
        matchValue: '',
        priority: rules.length
      }
    ])
  }

  const removeRule = (id: string): void => {
    updateRules(rules.filter((r) => r.id !== id))
  }

  const patchRule = (id: string, patch: Partial<ProfileRule>): void => {
    updateRules(rules.map((r) => (r.id === id ? { ...r, ...patch } : r)))
  }

  const inputStyle: React.CSSProperties = {
    padding: '4px 8px',
    borderRadius: 6,
    border: '1px solid var(--border-color)',
    background: 'var(--bg-primary)',
    color: 'var(--text-primary)',
    fontSize: 12
  }

  return (
    <div style={{ paddingTop: 8 }}>
      <div
        style={{
          fontSize: 12,
          fontWeight: 600,
          color: 'var(--text-secondary)',
          marginBottom: 8
        }}
      >
        Profile Rules
      </div>
      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 10 }}>
        When the foreground window matches a rule, the corresponding profile is activated.
      </div>

      {rules.map((rule) => (
        <div
          key={rule.id}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '6px 0',
            borderBottom: '1px solid var(--border-subtle)'
          }}
        >
          {/* Profile picker */}
          <select
            value={rule.profileId}
            onChange={(e) => patchRule(rule.id, { profileId: e.target.value })}
            style={{ ...inputStyle, width: 120 }}
          >
            <option value="">— profile —</option>
            {profiles.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>

          {/* Match type */}
          <select
            value={rule.matchType}
            onChange={(e) =>
              patchRule(rule.id, {
                matchType: e.target.value as ProfileRule['matchType']
              })
            }
            style={{ ...inputStyle, width: 120 }}
          >
            <option value="process">Process name</option>
            <option value="title_contains">Title contains</option>
            <option value="title_regex">Title regex</option>
          </select>

          {/* Match value */}
          <input
            type="text"
            placeholder="e.g. chrome.exe"
            value={rule.matchValue}
            onChange={(e) => patchRule(rule.id, { matchValue: e.target.value })}
            style={{ ...inputStyle, flex: 1 }}
          />

          {/* Remove */}
          <button
            onClick={() => removeRule(rule.id)}
            title="Remove rule"
            style={{
              width: 24,
              height: 24,
              borderRadius: 4,
              border: 'none',
              background: 'transparent',
              color: 'var(--danger)',
              cursor: 'pointer',
              fontSize: 14,
              lineHeight: 1,
              flexShrink: 0
            }}
          >
            ×
          </button>
        </div>
      ))}

      <button
        onClick={addRule}
        style={{
          marginTop: 8,
          padding: '5px 12px',
          borderRadius: 6,
          border: '1px solid var(--accent-cyan)',
          background: 'transparent',
          color: 'var(--accent-cyan)',
          cursor: 'pointer',
          fontSize: 11,
          fontWeight: 500
        }}
      >
        + Add Rule
      </button>
    </div>
  )
}
