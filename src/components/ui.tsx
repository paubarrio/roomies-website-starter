"use client";
import React, { createContext, useContext, useState } from "react";

type Design = { compact: boolean; radius: number; accent: string; onAccent: string; setDesign: React.Dispatch<React.SetStateAction<Design>>; };
const DesignContext = createContext<Design | null>(null);
export const useDesign = () => {
  const ctx = useContext(DesignContext);
  if(!ctx) throw new Error("useDesign must be used within <DesignProvider/>");
  return ctx;
};

export function DesignProvider({ children }: { children: React.ReactNode }){
  const [design, setDesign] = useState({ compact:false, radius:16, accent:"#0a0a0a", onAccent:"#ffffff", setDesign: (_: any)=>{} } as any);
  (design as any).setDesign = setDesign;
  return (
    <DesignContext.Provider value={design as any}>
      <div style={{ ["--radius" as any]: `${design.radius}px`, ["--accent" as any]: design.accent, ["--on-accent" as any]: design.onAccent }}>{children}</div>
    </DesignContext.Provider>
  );
}

export function Card(props: React.HTMLAttributes<HTMLDivElement>){
  const { className="", ...rest } = props;
  return <div className={`card p-4 ${className}`} {...rest} />;
}

export function Chip({ children }: { children: React.ReactNode }){
  return <span className="px-2 py-0.5 rounded-full text-xs bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700">{children}</span>;
}

export function Toggle({ checked, onChange, label }:{ checked:boolean; onChange:(v:boolean)=>void; label:string; }){
  return (
    <label className="flex items-center gap-2 select-none cursor-pointer">
      <input type="checkbox" className="sr-only" checked={checked} onChange={e=>onChange(e.target.checked)} />
      <span className={`inline-block w-10 h-6 rounded-full transition ${checked ? 'bg-emerald-500' : 'bg-zinc-300 dark:bg-zinc-700'}`}>
        <span className={`block h-5 w-5 bg-white rounded-full shadow transform transition ${checked ? 'translate-x-5' : 'translate-x-0.5'} mt-0.5`} />
      </span>
      <span className="text-sm text-zinc-700 dark:text-zinc-300">{label}</span>
    </label>
  );
}

export function AccentButton(props: React.ButtonHTMLAttributes<HTMLButtonElement>){
  const { className="", ...rest } = props;
  return <button className={`btn btn-accent ${className}`} {...rest} />;
}

export function Tabs({ tabs, current, onChange }:{ tabs:string[]; current:string; onChange:(t:string)=>void; }){
  return (
    <div className="flex gap-2 mb-4">
      {tabs.map(t => (
        <button key={t} onClick={()=>onChange(t)}
          className={`px-3 py-2 rounded-[calc(var(--radius)-8px)] text-sm border ${current===t ? 'text-white dark:text-zinc-900 border-transparent' : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300'}`}
          style={current===t ? { background: "var(--accent)" } : {}}
        >
          {t}
        </button>
      ))}
    </div>
  );
}

export function DesignPanel(){
  const { compact, radius, accent, onAccent, setDesign } = useDesign();
  const [open, setOpen] = React.useState(false);
  return (
    <div className="fixed bottom-4 right-4 z-50">
      {open && (
        <Card className="mb-2 w-80">
          <h3 className="font-semibold mb-3">🎨 Design settings</h3>
          <div className="space-y-3 text-sm">
            <div>
              <label className="block mb-1">Accent color</label>
              <input type="color" value={accent} onChange={e=>setDesign(d=>({ ...(d as any), accent: e.target.value }))} />
            </div>
            <div>
              <label className="block mb-1">On‑accent (text)</label>
              <input type="color" value={onAccent} onChange={e=>setDesign(d=>({ ...(d as any), onAccent: e.target.value }))} />
            </div>
            <div>
              <label className="block mb-1">Corner radius: {radius}px</label>
              <input type="range" min={6} max={28} value={radius} onChange={e=>setDesign(d=>({ ...(d as any), radius: Number(e.target.value) }))} className="w-full" />
            </div>
            <div className="flex items-center gap-2">
              <input id="compact" type="checkbox" checked={compact} onChange={e=>setDesign(d=>({ ...(d as any), compact: e.target.checked }))} />
              <label htmlFor="compact">Compact layout</label>
            </div>
          </div>
        </Card>
      )}
      <button onClick={()=>setOpen(o=>!o)} className="btn btn-accent shadow">{open ? 'Close' : 'Design'}</button>
    </div>
  );
}
