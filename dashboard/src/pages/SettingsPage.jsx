/**
 * SettingsPage.jsx
 *
 * Simple settings page — design token consistent with the new dark enterprise theme.
 */
import { Settings2, Info } from 'lucide-react';

export function SettingsPage() {
    return (
        <div className="flex flex-col gap-6">
            {/* Page header */}
            <div>
                <div className="flex items-center gap-2 mb-1">
                    <span className="text-[9px] font-semibold text-orange-500 uppercase tracking-widest">
                        ■ Configuration
                    </span>
                </div>
                <h1 className="text-xl font-black text-zinc-100 tracking-tight">Settings</h1>
                <p className="text-sm text-zinc-600 mt-0.5">Manage your platform preferences</p>
            </div>

            {/* Appearance card */}
            <div className="bg-[#111111] border border-zinc-800/60 rounded-xl p-5">
                <div className="flex items-center gap-2.5 mb-5 pb-4 border-b border-zinc-800/60">
                    <div className="w-8 h-8 rounded-lg bg-orange-500/10 border border-orange-500/20 flex items-center justify-center">
                        <Settings2 className="w-4 h-4 text-orange-400" />
                    </div>
                    <div>
                        <p className="text-sm font-semibold text-zinc-200">Appearance</p>
                        <p className="text-xs text-zinc-600">Interface and display preferences</p>
                    </div>
                </div>

                <div className="flex items-start gap-3 p-4 bg-zinc-900/50 border border-zinc-800/50 rounded-lg">
                    <Info className="w-4 h-4 text-zinc-600 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-zinc-500">
                        The dashboard uses a fixed dark enterprise theme optimized for long monitoring sessions.
                        Additional appearance settings will be available in a future update.
                    </p>
                </div>
            </div>

            {/* Platform info card */}
            <div className="bg-[#111111] border border-zinc-800/60 rounded-xl p-5">
                <p className="text-[10px] font-semibold text-zinc-600 uppercase tracking-widest mb-4">
                    Platform Info
                </p>
                <div className="space-y-3">
                    {[
                        { label: 'Version', value: 'v1.0.0' },
                        { label: 'Stack', value: 'MERN + Recharts + Tailwind CSS' },
                        { label: 'SDK', value: 'api-monitor-sdk v1.0.0' },
                    ].map(({ label, value }) => (
                        <div key={label} className="flex items-center justify-between py-2 border-b border-zinc-800/40 last:border-0">
                            <span className="text-sm text-zinc-500">{label}</span>
                            <span className="text-sm font-mono text-zinc-300">{value}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
