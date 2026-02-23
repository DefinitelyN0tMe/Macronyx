import { useState } from 'react'

// ─── Shared styles ──────────────────────────────────────────────────────────

const sectionStyle: React.CSSProperties = {
  background: 'var(--bg-secondary)',
  borderRadius: 8,
  border: '1px solid var(--border-color)',
  overflow: 'hidden'
}

const headerStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '12px 16px',
  cursor: 'pointer',
  userSelect: 'none',
  fontSize: 13,
  fontWeight: 600,
  color: 'var(--text-primary)',
  transition: 'background 0.15s'
}

const bodyStyle: React.CSSProperties = {
  padding: '0 16px 14px',
  fontSize: 12,
  lineHeight: 1.7,
  color: 'var(--text-secondary)'
}

const kbdStyle: React.CSSProperties = {
  display: 'inline-block',
  padding: '1px 6px',
  borderRadius: 4,
  border: '1px solid var(--border-color)',
  background: 'var(--bg-tertiary)',
  fontFamily: 'monospace',
  fontSize: 11,
  fontWeight: 600,
  color: 'var(--accent-cyan)',
  lineHeight: 1.6
}

const tipStyle: React.CSSProperties = {
  background: 'rgba(6, 182, 212, 0.08)',
  border: '1px solid rgba(6, 182, 212, 0.2)',
  borderRadius: 6,
  padding: '8px 12px',
  fontSize: 11,
  color: 'var(--text-secondary)',
  marginTop: 8
}

const tableStyle: React.CSSProperties = {
  width: '100%',
  borderCollapse: 'collapse',
  fontSize: 12
}

const thStyle: React.CSSProperties = {
  textAlign: 'left',
  padding: '6px 10px',
  borderBottom: '1px solid var(--border-color)',
  color: 'var(--text-muted)',
  fontWeight: 600,
  fontSize: 11,
  textTransform: 'uppercase',
  letterSpacing: 0.5
}

const tdStyle: React.CSSProperties = {
  padding: '6px 10px',
  borderBottom: '1px solid var(--border-subtle)',
  color: 'var(--text-secondary)'
}

// ─── Collapsible section component ──────────────────────────────────────────

function Section({
  title,
  icon,
  defaultOpen,
  children
}: {
  title: string
  icon: string
  defaultOpen?: boolean
  children: React.ReactNode
}): JSX.Element {
  const [open, setOpen] = useState(defaultOpen ?? false)

  return (
    <div style={sectionStyle}>
      <div
        style={{
          ...headerStyle,
          background: open ? 'rgba(6, 182, 212, 0.04)' : 'transparent'
        }}
        onClick={() => setOpen(!open)}
      >
        <span>
          {icon} &nbsp;{title}
        </span>
        <span
          style={{
            fontSize: 10,
            color: 'var(--text-muted)',
            transition: 'transform 0.2s',
            transform: open ? 'rotate(180deg)' : 'rotate(0deg)'
          }}
        >
          ▼
        </span>
      </div>
      {open && <div style={bodyStyle}>{children}</div>}
    </div>
  )
}

function Kbd({ children }: { children: React.ReactNode }): JSX.Element {
  return <span style={kbdStyle}>{children}</span>
}

function Tip({ children }: { children: React.ReactNode }): JSX.Element {
  return (
    <div style={tipStyle}>
      <strong style={{ color: 'var(--accent-cyan)' }}>Tip:</strong> {children}
    </div>
  )
}

function StepList({ steps }: { steps: string[] }): JSX.Element {
  return (
    <ol style={{ margin: '6px 0', paddingLeft: 20 }}>
      {steps.map((step, i) => (
        <li key={i} style={{ marginBottom: 4 }}>{step}</li>
      ))}
    </ol>
  )
}

// ─── Main component ─────────────────────────────────────────────────────────

export function HelpView(): JSX.Element {
  return (
    <div className="animate-slide-in" style={{ maxWidth: 800, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
          Help & Documentation
        </h1>
        <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 6 }}>
          Everything you need to know about Macronyx. Click any section to expand.
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {/* ── 1. Getting Started ───────────────────────────────────────── */}
        <Section title="Getting Started" icon="🚀" defaultOpen>
          <p>Macronyx records your mouse and keyboard actions and plays them back exactly as performed. Here's how to get started in 30 seconds:</p>
          <StepList steps={[
            'Open Macronyx and go to the Recorder tab.',
            'Press F9 (or click the record button) to start recording.',
            'Perform your actions — move the mouse, click, scroll, type.',
            'Press F10 to stop recording.',
            'Your macro appears in the Library automatically.',
            'Select a macro and press F11 to play it back.'
          ]} />
          <Tip>
            You can control Macronyx entirely via hotkeys without opening the window. Minimize to tray and use <Kbd>F9</Kbd>/<Kbd>F10</Kbd>/<Kbd>F11</Kbd> to record and play.
          </Tip>
        </Section>

        {/* ── 2. Recording ──────────────────────────────────────────────── */}
        <Section title="Recording" icon="⏺">
          <p><strong>Starting a recording:</strong> Press <Kbd>F9</Kbd> or click the record button on the Recorder page. A timer and event counter appear in real-time.</p>

          <p style={{ marginTop: 8 }}><strong>Pause / Resume:</strong> Press <Kbd>Shift+F9</Kbd> to pause mid-recording. Press it again to resume. Paused time is excluded from the final macro — no idle gaps.</p>

          <p style={{ marginTop: 8 }}><strong>Selective capture:</strong> In Settings → Recording, toggle which inputs to capture:</p>
          <ul style={{ margin: '4px 0', paddingLeft: 20 }}>
            <li>Mouse movement</li>
            <li>Mouse clicks</li>
            <li>Mouse scroll</li>
            <li>Keyboard input</li>
          </ul>

          <p style={{ marginTop: 8 }}><strong>Mouse sampling rate:</strong> Controls how often mouse position is sampled (8ms–100ms). Lower values = smoother paths but larger macros.</p>

          <p style={{ marginTop: 8 }}><strong>Relative positioning:</strong> When enabled (Settings → Recording), mouse coordinates are recorded relative to the active window. This means your macro adapts when the window moves or resizes.</p>

          <Tip>
            Disable mouse movement capture if you only need clicks and keyboard input — the macro file will be much smaller and playback faster.
          </Tip>
        </Section>

        {/* ── 3. Playback ───────────────────────────────────────────────── */}
        <Section title="Playback" icon="▶">
          <p>Select a macro in the Library and press <Kbd>F11</Kbd> to start playback. Configure these options in Settings → Playback:</p>

          <ul style={{ margin: '6px 0', paddingLeft: 20 }}>
            <li><strong>Speed</strong> — 0.25x to 4x. Affects all delays between events.</li>
            <li><strong>Repeat count</strong> — how many times to play. Minimum 1.</li>
            <li><strong>Repeat delay</strong> — pause (ms) between each repeat cycle.</li>
            <li><strong>Humanize</strong> — adds natural variance to timing and cursor position. Configurable amount (1–100).</li>
          </ul>

          <p style={{ marginTop: 8 }}><strong>Mouse curves:</strong> Open a macro in the Editor, click the "Curves" button in the toolbar to configure bezier-based cursor movement with curvature, overshoot, and speed profile (constant / ease-in-out / natural).</p>

          <p style={{ marginTop: 8 }}><strong>Pause / Resume:</strong> Press <Kbd>Shift+F9</Kbd> during playback to pause. Press again to resume.</p>

          <p style={{ marginTop: 8 }}><strong>Emergency stop:</strong> Press <Kbd>Escape</Kbd> to immediately stop all recording, playback, and chain execution.</p>

          <Tip>
            The overlay widget shows real-time playback status, elapsed time, and a success/fail counter. It's visible even over fullscreen apps.
          </Tip>
        </Section>

        {/* ── 4. Timeline Editor ──────────────────────────────────────── */}
        <Section title="Timeline Editor" icon="🎬">
          <p>Open a macro from the Library and click <strong>Edit</strong> to enter the Timeline Editor.</p>

          <p style={{ marginTop: 8 }}><strong>Selection:</strong></p>
          <ul style={{ margin: '4px 0', paddingLeft: 20 }}>
            <li>Click an event to select it</li>
            <li><Kbd>Ctrl</Kbd>+click to toggle additional events</li>
            <li><Kbd>Shift</Kbd>+click for range selection</li>
            <li><Kbd>Ctrl+A</Kbd> to select all</li>
          </ul>

          <p style={{ marginTop: 8 }}><strong>Editing:</strong></p>
          <ul style={{ margin: '4px 0', paddingLeft: 20 }}>
            <li><strong>Drag-and-drop</strong> events to reposition them in time</li>
            <li><Kbd>Ctrl+C</Kbd> / <Kbd>Ctrl+V</Kbd> — copy and paste events</li>
            <li><Kbd>Delete</Kbd> — remove selected events</li>
            <li><Kbd>Ctrl+Z</Kbd> — undo, <Kbd>Ctrl+Y</Kbd> — redo</li>
          </ul>

          <p style={{ marginTop: 8 }}><strong>Event Inspector:</strong> Select an event to see its properties in the right panel. Edit timestamp, position (X, Y), delay, key code, and more.</p>

          <p style={{ marginTop: 8 }}><strong>Batch editing:</strong> Select multiple events to offset timestamps, scale delays, or assign groups in bulk.</p>

          <p style={{ marginTop: 8 }}><strong>Event grouping:</strong> Assign events to named groups with colored timeline bands to organize complex macros visually.</p>

          <p style={{ marginTop: 8 }}><strong>Smooth Delays:</strong> Click the "Smooth" button to apply moving-average smoothing to irregular delays. Configurable window size and min/max clamping.</p>

          <p style={{ marginTop: 8 }}><strong>Playback Preview:</strong> Use the preview control bar below the mouse path canvas to preview playback with play/pause/seek controls and speed selector — without moving the real cursor.</p>

          <Tip>
            Changes auto-save every 60 seconds. A dot indicator shows unsaved changes. A navigation guard warns you before leaving the editor with unsaved work.
          </Tip>
        </Section>

        {/* ── 5. Triggers & Automation ───────────────────────────────── */}
        <Section title="Triggers & Automation" icon="⚡">
          <p>Triggers let macros start automatically based on conditions. Open a macro in the Editor → switch to the <strong>Triggers</strong> tab.</p>

          <p style={{ marginTop: 10 }}><strong>Trigger types:</strong></p>

          <div style={{ marginTop: 6, padding: '8px 12px', background: 'var(--bg-primary)', borderRadius: 6 }}>
            <p><strong>Hotkey Combo</strong> — Press a custom key combination to fire the macro.</p>
            <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>Example: Ctrl+Shift+1 to auto-fill a form.</p>
          </div>

          <div style={{ marginTop: 6, padding: '8px 12px', background: 'var(--bg-primary)', borderRadius: 6 }}>
            <p><strong>Schedule</strong> — Cron-based scheduling. Use quick presets (every 5 min, hourly, daily) or enter a custom cron expression.</p>
            <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>Example: Run a data backup macro every day at 9:00 AM.</p>
          </div>

          <div style={{ marginTop: 6, padding: '8px 12px', background: 'var(--bg-primary)', borderRadius: 6 }}>
            <p><strong>Window Focus</strong> — Fire when a specific application gains focus. Match by process name, title substring, or regex.</p>
            <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>Example: Auto-arrange windows when Photoshop opens.</p>
          </div>

          <div style={{ marginTop: 6, padding: '8px 12px', background: 'var(--bg-primary)', borderRadius: 6 }}>
            <p><strong>Pixel Color</strong> — Fire when a pixel at (X, Y) matches a target color within tolerance. Supports repeat mode.</p>
            <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>Example: Click a "Ready" button when it turns green. Use "Pick from screen" to select the pixel.</p>
          </div>

          <p style={{ marginTop: 10 }}>
            <strong>Important:</strong> Triggers must be enabled globally in <strong>Settings → General → Enable Triggers</strong> for any trigger to fire.
          </p>
        </Section>

        {/* ── 6. Conditional Logic ──────────────────────────────────── */}
        <Section title="Conditional Logic (IF / ELSE / END)" icon="🔀">
          <p>Add branching logic to macros so events only execute when conditions are met.</p>

          <StepList steps={[
            'Open a macro in the Editor → Timeline tab.',
            'Click the green "+ IF" button in the toolbar.',
            'Select the IF event on the timeline and configure the condition in the Event Inspector.',
            'Place events between IF and ELSE — these run when the condition is TRUE.',
            'Place events between ELSE and END — these run when the condition is FALSE.',
          ]} />

          <p style={{ marginTop: 8 }}><strong>Condition types:</strong></p>
          <ul style={{ margin: '4px 0', paddingLeft: 20 }}>
            <li><strong>Pixel color</strong> — check if the pixel at (X, Y) matches a target color (with tolerance)</li>
            <li><strong>Window title</strong> — check if the foreground window title contains, equals, or matches a regex</li>
            <li><strong>Time of day</strong> — check if the current time is after/before a specified time</li>
          </ul>

          <p style={{ marginTop: 8 }}>Conditions can be nested (IF inside IF) for complex branching.</p>

          <Tip>
            Use pixel color conditions to wait for a UI element to appear before clicking it — much more reliable than fixed delays.
          </Tip>
        </Section>

        {/* ── 7. Macro Chains ───────────────────────────────────────── */}
        <Section title="Macro Chains" icon="🔗">
          <p>Run multiple macros in sequence — like a playlist.</p>

          <StepList steps={[
            'Go to the Chains page from the sidebar.',
            'Click "+ New Chain" to create a chain.',
            'Add macros from the dropdown; drag to reorder.',
            'Set a delay (ms) between steps if needed.',
            'Toggle individual steps on/off.',
            'Press Play or F11 to execute the chain.',
          ]} />

          <p style={{ marginTop: 8 }}>Chain playback respects your global playback settings (speed, humanize). The repeat count applies to the entire chain cycle, not individual macros.</p>

          <p style={{ marginTop: 4 }}>You can pause chain playback with <Kbd>Shift+F9</Kbd> — the overlay widget will show "Paused" status.</p>
        </Section>

        {/* ── 8. Profiles ──────────────────────────────────────────── */}
        <Section title="Profiles" icon="👤">
          <p>Save snapshots of your settings and switch between them instantly.</p>

          <StepList steps={[
            'Go to Settings → Profiles tab.',
            'Enter a name and click "Save Current as Profile".',
            'Click Activate on any profile to switch.',
            'Double-click a profile name to rename it.',
          ]} />

          <p style={{ marginTop: 8 }}><strong>Auto-switch:</strong> Enable "Auto-Switch Profiles" in Settings → General, then add rules in the Profiles tab. When a matching application gains focus, the profile switches automatically.</p>

          <Tip>
            Create separate profiles for different workflows — e.g. "Gaming" with fast speed and no humanize, "Data Entry" with slower speed and precision settings.
          </Tip>
        </Section>

        {/* ── 9. Analytics & Performance ─────────────────────────── */}
        <Section title="Analytics & Performance" icon="📊">
          <p>The Dashboard tracks how your macros perform over time.</p>

          <p style={{ marginTop: 8 }}><strong>Overview tab:</strong> Total plays, time saved, success rate, active macros, and a 14-day usage chart.</p>
          <p style={{ marginTop: 4 }}><strong>Per-Macro tab:</strong> Select a macro to see its run history, success rate donut chart, average duration, and last run timestamp.</p>
          <p style={{ marginTop: 4 }}><strong>Performance tab:</strong> Timing drift analysis for each playback run — mean/P95/max drift, accuracy percentage, sparkline chart, and histogram.</p>

          <p style={{ marginTop: 8 }}><strong>Export:</strong> Download all playback data as CSV or JSON for external analysis.</p>
          <p style={{ marginTop: 4 }}><strong>Reset:</strong> Click "Clear All Data" on the Overview tab to wipe all playback history (with confirmation).</p>

          <Tip>
            Analytics refresh automatically after each playback run. High drift in the Performance tab may indicate your macro has events with very short delays that the system can't execute precisely.
          </Tip>
        </Section>

        {/* ── 10. Overlay Widget ───────────────────────────────────── */}
        <Section title="Overlay Widget" icon="🔲">
          <p>The floating overlay widget is a compact, always-on-top indicator that shows the current status of Macronyx.</p>

          <ul style={{ margin: '6px 0', paddingLeft: 20 }}>
            <li><strong>Status dot</strong> — color-coded: cyan (playing), red (recording), orange (paused), green (idle)</li>
            <li><strong>Timer</strong> — elapsed time (and total duration during playback)</li>
            <li><strong>Success counter</strong> — events passed / failed during playback</li>
            <li><strong>Progress bar</strong> — thin bar at the bottom showing playback progress</li>
          </ul>

          <p style={{ marginTop: 8 }}>The widget appears automatically during recording or playback and hides when idle (if the main window is visible). It stays above fullscreen apps and games.</p>

          <p style={{ marginTop: 4 }}>Click the widget to bring the main window to focus. Toggle the widget in <strong>Settings → General → Show Overlay Widget</strong>.</p>
        </Section>

        {/* ── 11. Hotkeys Reference ───────────────────────────────── */}
        <Section title="Hotkeys Reference" icon="⌨">
          <p>All hotkeys work globally — even when Macronyx is not focused or is minimized to tray.</p>

          <table style={{ ...tableStyle, marginTop: 8 }}>
            <thead>
              <tr>
                <th style={thStyle}>Action</th>
                <th style={thStyle}>Default Hotkey</th>
                <th style={thStyle}>Notes</th>
              </tr>
            </thead>
            <tbody>
              <tr><td style={tdStyle}>Start recording</td><td style={tdStyle}><Kbd>F9</Kbd></td><td style={tdStyle}>Opens Recorder if not already there</td></tr>
              <tr><td style={tdStyle}>Stop recording</td><td style={tdStyle}><Kbd>F10</Kbd></td><td style={tdStyle}>Saves macro to Library</td></tr>
              <tr><td style={tdStyle}>Pause / Resume</td><td style={tdStyle}><Kbd>Shift+F9</Kbd></td><td style={tdStyle}>Works for both recording and playback</td></tr>
              <tr><td style={tdStyle}>Start playback</td><td style={tdStyle}><Kbd>F11</Kbd></td><td style={tdStyle}>Plays selected macro or chain</td></tr>
              <tr><td style={tdStyle}>Stop playback</td><td style={tdStyle}><Kbd>Shift+F11</Kbd></td><td style={tdStyle}>Stops current playback</td></tr>
              <tr><td style={tdStyle}>Emergency stop</td><td style={tdStyle}><Kbd>Escape</Kbd></td><td style={tdStyle}>Stops everything immediately</td></tr>
            </tbody>
          </table>

          <p style={{ marginTop: 10 }}>All hotkeys can be customized in <strong>Settings → Hotkeys</strong>. Click a hotkey field and press your desired key combination.</p>
        </Section>

        {/* ── 12. Portable Mode ───────────────────────────────────── */}
        <Section title="Portable Mode" icon="💾">
          <p>Portable mode stores all settings and macros next to the executable, so you can run Macronyx from a USB drive.</p>

          <StepList steps={[
            'Download the portable .exe.',
            'Launch it, go to Settings → Advanced.',
            'Click "Enable" next to Portable Mode.',
            'Restart the app.',
            'A data/ folder appears next to the executable with all your settings and macros.',
          ]} />

          <p style={{ marginTop: 8 }}>You can also enable portable mode manually by creating an empty file named <code style={{ color: 'var(--accent-cyan)' }}>portable</code> (no extension) next to the executable.</p>
        </Section>

        {/* ── 13. Tips & Tricks ───────────────────────────────────── */}
        <Section title="Tips & Tricks" icon="💡">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ padding: '8px 12px', background: 'var(--bg-primary)', borderRadius: 6 }}>
              <p><strong>Fast macro switching</strong></p>
              <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>Select a different macro in the Library and press <Kbd>F11</Kbd> — no need to open the editor first.</p>
            </div>

            <div style={{ padding: '8px 12px', background: 'var(--bg-primary)', borderRadius: 6 }}>
              <p><strong>Combine triggers with conditions</strong></p>
              <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>Use a pixel color trigger to start a macro, then add IF conditions inside to handle different UI states.</p>
            </div>

            <div style={{ padding: '8px 12px', background: 'var(--bg-primary)', borderRadius: 6 }}>
              <p><strong>Clean up sloppy recordings</strong></p>
              <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>After recording, open the editor and use "Smooth Delays" to normalize irregular timing. Delete unnecessary mouse movement events to speed up playback.</p>
            </div>

            <div style={{ padding: '8px 12px', background: 'var(--bg-primary)', borderRadius: 6 }}>
              <p><strong>Debug with the Performance tab</strong></p>
              <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>If a macro behaves inconsistently, check the Performance tab in Analytics. High drift values indicate events that can't be timed precisely.</p>
            </div>

            <div style={{ padding: '8px 12px', background: 'var(--bg-primary)', borderRadius: 6 }}>
              <p><strong>Use chains for complex workflows</strong></p>
              <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>Break a long task into smaller macros and chain them together. This makes each piece easier to edit, test, and reuse.</p>
            </div>

            <div style={{ padding: '8px 12px', background: 'var(--bg-primary)', borderRadius: 6 }}>
              <p><strong>Mouse curves for realism</strong></p>
              <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>Enable bezier mouse curves in the Editor → Curves button. Combined with humanization, your macros will look like natural human input.</p>
            </div>

            <div style={{ padding: '8px 12px', background: 'var(--bg-primary)', borderRadius: 6 }}>
              <p><strong>Silent background operation</strong></p>
              <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>Enable "Minimize to Tray" and "Start Minimized" in Settings. Macronyx will run silently in the background, controllable entirely via hotkeys.</p>
            </div>
          </div>
        </Section>
      </div>

      {/* Footer */}
      <div style={{ textAlign: 'center', padding: '20px 0 10px', color: 'var(--text-muted)', fontSize: 11 }}>
        Macronyx v1.6.2 &middot; <a href="https://github.com/DefinitelyN0tMe/Macronyx" target="_blank" rel="noreferrer" style={{ color: 'var(--accent-cyan)', textDecoration: 'none' }}>GitHub</a> &middot; <a href="https://github.com/DefinitelyN0tMe/Macronyx/issues" target="_blank" rel="noreferrer" style={{ color: 'var(--accent-cyan)', textDecoration: 'none' }}>Report an Issue</a>
      </div>
    </div>
  )
}
