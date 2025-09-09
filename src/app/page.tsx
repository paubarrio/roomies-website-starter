"use client";
import React from "react";
import { Card, Chip, Tabs, Toggle, AccentButton, DesignProvider, DesignPanel } from "@/components/ui";
import { addMinutes, startOfDay } from "date-fns";

type Roommate = { id: string; name: string; color: string };
const INITIAL_ROOMMATES: Roommate[] = [
  { id: "pau", name: "Pau", color: "#f97316" },
  { id: "yas", name: "Yasmeen", color: "#6366f1" },
  { id: "sam", name: "Samantha", color: "#10b981" },
  { id: "isa", name: "Isabelle", color: "#ef4444" },
];

const today = new Date();
const base = startOfDay(today);
const mockEvents = () => ([
  { title: "Class – PSYCH 2B03", start: addMinutes(base, 9 * 60), end: addMinutes(base, 10 * 60 + 20), owner: "yas" },
  { title: "Gym", start: addMinutes(base, 7 * 60), end: addMinutes(base, 7 * 60 + 45), owner: "pau" },
  { title: "Work block", start: addMinutes(base, 9 * 60), end: addMinutes(base, 12 * 60), owner: "sam" },
  { title: "Clinic shift", start: addMinutes(base, 13 * 60), end: addMinutes(base, 17 * 60), owner: "isa" },
  { title: "Study Group", start: addMinutes(base, 18 * 60), end: addMinutes(base, 19 * 60 + 30), owner: "yas" },
]);

type Event = ReturnType<typeof mockEvents>[number];

function suggestCommonTimes({ events, people, windowStart, windowEnd, durationMin }:{ events: Event[]; people: string[]; windowStart: Date; windowEnd: Date; durationMin: number;}){
  const byPerson = new Map<string, [Date,Date][]>(); people.forEach(p=>byPerson.set(p, []));
  for(const ev of events){ if(byPerson.has(ev.owner)) byPerson.get(ev.owner)!.push([ev.start, ev.end]); }
  for(const p of people){
    const arr = (byPerson.get(p) || []).sort((a,b)=>a[0].getTime()-b[0].getTime());
    const merged:[Date,Date][]=[];
    for(const [s,e] of arr){
      if(!merged.length || s > merged[merged.length-1][1]) merged.push([s,e]);
      else merged[merged.length-1][1] = new Date(Math.max(merged[merged.length-1][1].getTime(), e.getTime()));
    }
    byPerson.set(p, merged);
  }
  function invertBusy(busy:[Date,Date][]):[Date,Date][]{ const res:[Date,Date][]=[]; let cur=windowStart;
    for(const [s,e] of busy){ if(s>cur) res.push([cur,s]); cur=new Date(Math.max(cur.getTime(), e.getTime())); }
    if(cur<windowEnd) res.push([cur,windowEnd]); return res; }
  const freeLists = people.map(p=>invertBusy(byPerson.get(p) || []));
  function intersectTwo(a:[Date,Date][], b:[Date,Date][]):[Date,Date][]{ let i=0,j=0,out:[Date,Date][]=[]; while(i<a.length&&j<b.length){
    const [as,ae]=a[i], [bs,be]=b[j]; const s=new Date(Math.max(as.getTime(),bs.getTime())); const e=new Date(Math.min(ae.getTime(),be.getTime()));
    if(e>s) out.push([s,e]); if(ae<be) i++; else j++; } return out; }
  let common = freeLists[0] || []; for(let k=1;k<freeLists.length;k++) common = intersectTwo(common, freeLists[k]);
  const suggestions:[Date,Date][]=[]; for(const [s,e] of common){ let cur=new Date(s);
    while(new Date(cur.getTime()+durationMin*60000) <= e){ const slotEnd=new Date(cur.getTime()+durationMin*60000); suggestions.push([new Date(cur), slotEnd]); cur=new Date(cur.getTime()+durationMin*60000); } }
  return suggestions.slice(0,10);
}

function Calendars({ roommates }: { roommates: Roommate[] }){
  const [events] = React.useState<Event[]>(mockEvents());
  const [visible, setVisible] = React.useState(Object.fromEntries(roommates.map(r=>[r.id,true])) as Record<string,boolean>);
  const [duration, setDuration] = React.useState(60);
  const [participants, setParticipants] = React.useState(Object.fromEntries(roommates.map(r=>[r.id,true])) as Record<string,boolean>);
  const dayStart = React.useMemo(
    () => new Date(today.getFullYear(), today.getMonth(), today.getDate(), 8, 0),
    [today]
  );
  const dayEnd = React.useMemo(
    () => new Date(today.getFullYear(), today.getMonth(), today.getDate(), 22, 0),
    [today]
  );
  const filtered = React.useMemo(()=>events.filter(e=>visible[e.owner]), [events,visible]);
  const suggestions = React.useMemo(()=>{
    const selected = roommates.filter(r=>participants[r.id]).map(r=>r.id);
    if(selected.length<2) return [];
    return suggestCommonTimes({ events: filtered, people: selected, windowStart: dayStart, windowEnd: dayEnd, durationMin: Number(duration) });
  }, [filtered, participants, duration, dayStart, dayEnd, roommates]);

  return (
    <div className="grid grid-cols-1 xl:grid-cols-5 gap-4">
      <Card className="xl:col-span-3">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold">Today • {today.toLocaleDateString()}</h3>
          <div className="flex gap-3">{roommates.map(r=>(
            <Toggle key={r.id} label={r.name} checked={visible[r.id]} onChange={(v)=>setVisible(s=>({ ...s, [r.id]: v }))} />
          ))}</div>
        </div>
        <div className="relative">
          <div className="absolute left-16 top-0 bottom-0 w-px bg-zinc-200 dark:bg-zinc-800" />
          {Array.from({length:15}).map((_,i)=>{
            const h=8+i; return (
              <div key={h} className="flex items-start gap-2 h-12">
                <div className="w-14 text-xs text-right pr-2 text-zinc-500">{h}:00</div>
                <div className="flex-1 relative" />
              </div>
            );
          })}
          {filtered.map((ev,idx)=>{
            const total=(22-8)*60;
            const start=Math.max(ev.start.getTime(), dayStart.getTime());
            const end=Math.min(ev.end.getTime(), dayEnd.getTime());
            if(end <= dayStart.getTime() || start >= dayEnd.getTime()) return null;
            const startMin=(start - dayStart.getTime())/60000;
            const duration=(end - start)/60000;
            const top=(startMin/total)*15*48;
            const height=(duration/total)*15*48;
            const owner = roommates.find(r=>r.id===ev.owner);
            return (
              <div key={idx} className="absolute left-20 right-4" style={{ top, height }}>
                <div
                  className="h-full rounded-[calc(var(--radius)-6px)] shadow text-white text-xs p-2"
                  style={{ background: owner?.color || '#71717a' }}
                >
                  <div className="font-semibold text-sm">{ev.title}</div>
                  <div>{ev.start.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})} – {ev.end.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</div>
                  <div className="opacity-80 mt-1">{owner?.name}</div>
                </div>
              </div>
            );
          })}
        </div>
      </Card>
      <Card className="xl:col-span-2">
        <h3 className="font-semibold mb-3">Suggest a time</h3>
        <div className="flex flex-wrap gap-3 mb-3">{roommates.map(r=>(
          <Toggle key={r.id} label={r.name} checked={participants[r.id]} onChange={(v)=>setParticipants(s=>({ ...s, [r.id]: v }))} />
        ))}</div>
        <div className="flex items-center gap-3 mb-3">
          <label className="text-sm">Duration (mins)
            <input type="number" min={15} step={15} value={duration} onChange={e=>setDuration(Number(e.target.value))} className="ml-2 w-24 input" />
          </label>
        </div>
        <ul className="space-y-2">
          {suggestions.length===0 && <li className="text-sm text-zinc-500">Pick at least two people to see suggestions.</li>}
          {suggestions.map((s,i)=>(
            <li key={i} className="flex items-center justify-between p-3 rounded-[calc(var(--radius)-6px)] border border-zinc-200 dark:border-zinc-800">
              <div>
                <div className="font-medium">{s[0].toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})} – {s[1].toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</div>
                <div className="text-xs text-zinc-500">All selected are free</div>
              </div>
              <AccentButton>Propose</AccentButton>
            </li>
          ))}
        </ul>
        <p className="text-xs text-zinc-500 mt-3">* In production, proposals would notify roommates and can auto‑create events on connected calendars.</p>
      </Card>
    </div>
  );
}

function Chores({ roommates }: { roommates: Roommate[] }){
  const [chores, setChores] = React.useState([
    {
      id: "c1",
      room: "Kitchen",
      task: "Dishes",
      recurrence: "Daily",
      assignedTo: "pau",
      nextDue: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 20, 0),
    },
    {
      id: "c2",
      room: "Bathroom",
      task: "Clean sink & mirror",
      recurrence: "Weekly (Sat)",
      assignedTo: "yas",
      nextDue: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 2, 11, 0),
    },
    {
      id: "c3",
      room: "Living Room",
      task: "Vacuum",
      recurrence: "Weekly (Sun)",
      assignedTo: "sam",
      nextDue: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 3, 15, 0),
    },
    {
      id: "c4",
      room: "Garage",
      task: "Take out recycling",
      recurrence: "Weekly (Mon)",
      assignedTo: "isa",
      nextDue: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 4, 9, 0),
    },
  ] as any[]);
  const [filterRoom, setFilterRoom] = React.useState("All");
  const rooms = React.useMemo(()=>["All", ...Array.from(new Set(chores.map(c=>c.room)))], [chores]);
  const filtered = React.useMemo(()=> chores.filter(c => filterRoom==="All" || c.room===filterRoom), [chores, filterRoom]);

  function addChore(e: React.FormEvent<HTMLFormElement>){
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const room = (form.get("room")?.toString() || "General");
    const task = (form.get("task")?.toString() || "");
    const recurrence = (form.get("rec")?.toString() || "Weekly");
    const assignedTo = (form.get("who")?.toString() || roommates[0]?.id || "");
    if(!task) return;
    setChores(cs => cs.concat({ id: crypto.randomUUID(), room, task, recurrence, assignedTo, nextDue: new Date() }));
    e.currentTarget.reset();
  }
  const markDone = (id:string) => setChores(cs => cs.map(c => c.id===id ? { ...c, nextDue: new Date(c.nextDue.getTime() + 7*24*3600*1000) } : c));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <Card className="lg:col-span-2">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <h3 className="font-semibold">Chore board</h3>
            <select value={filterRoom} onChange={e=>setFilterRoom(e.target.value)} className="px-2 py-1 text-sm rounded-lg border border-zinc-300 dark:border-zinc-700">
              {rooms.map(r => <option key={r}>{r}</option>)}
            </select>
          </div>
        </div>
        <div className="divide-y divide-zinc-200 dark:divide-zinc-800">
          {filtered.map(c => {
            const assignee = roommates.find(r=>r.id===c.assignedTo);
            return (
              <div key={c.id} className="py-3 flex items-center justify-between">
                <div>
                  <div className="font-medium">{c.task} <span className="text-xs text-zinc-500">• {c.room}</span></div>
                  <div className="text-xs text-zinc-500">{c.recurrence} • Next due {new Date(c.nextDue).toLocaleString()}</div>
                </div>
                <div className="flex items-center gap-3">
                  <Chip className="text-white" style={{ background: assignee?.color, borderColor: assignee?.color }}>
                    {assignee?.name || c.assignedTo}
                  </Chip>
                  <AccentButton onClick={()=>markDone(c.id)}>Done</AccentButton>
                </div>
              </div>
            );
          })}
        </div>
      </Card>
      <Card>
        <h3 className="font-semibold mb-3">Add chore</h3>
        <form onSubmit={addChore} className="space-y-3">
          <div>
            <label className="label">Room</label>
            <input name="room" placeholder="Kitchen, Bathroom…" className="input mt-1" />
          </div>
          <div>
            <label className="label">Task</label>
            <input name="task" placeholder="Take out trash" className="input mt-1" />
          </div>
          <div>
            <label className="label">Recurrence</label>
            <select name="rec" className="input mt-1">
              <option>Daily</option><option>Weekly</option><option>Biweekly</option><option>Monthly</option>
            </select>
          </div>
          <div>
            <label className="label">Assign to</label>
            <select name="who" className="input mt-1">
              {roommates.map(r=> <option key={r.id} value={r.id}>{r.name}</option>)}
            </select>
          </div>
          <AccentButton className="w-full">Add chore</AccentButton>
          <p className="text-xs text-zinc-500">* In production, we’ll store RRULEs and optionally create calendar reminders.</p>
        </form>
      </Card>
    </div>
  );
}

function CostsGroceries({ roommates }: { roommates: Roommate[] }){
  const [expenses, setExpenses] = React.useState([
    {
      id: "e1",
      date: new Date(),
      payer: "pau",
      description: "Paper towels",
      amount: 8.99,
      split: ["pau", "yas", "sam", "isa"],
    },
    {
      id: "e2",
      date: new Date(),
      payer: "yas",
      description: "Dish soap",
      amount: 5.49,
      split: ["pau", "yas", "sam", "isa"],
    },
  ] as any[]);
  const [groceries, setGroceries] = React.useState([
    { id:"g1", name:"Milk 2L", lastPrice: 4.69, need:true },
    { id:"g2", name:"Eggs (12)", lastPrice: 3.99, need:false },
    { id:"g3", name:"Rice 5kg", lastPrice: 12.49, need:true },
  ] as any[]);

  const balances = React.useMemo(()=>{
    const map = new Map<string, number>(roommates.map(r=>[r.id,0]));
    for(const e of expenses){
      const share = e.amount / e.split.length;
      for(const p of e.split){ map.set(p, (map.get(p) || 0) - share); }
      map.set(e.payer, (map.get(e.payer) || 0) + e.amount);
    }
    return map;
  }, [expenses, roommates]);

  function addExpense(e: React.FormEvent<HTMLFormElement>){
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const description = form.get("desc")?.toString() || "";
    const amount = parseFloat(form.get("amt")?.toString() || "0");
    const payer = form.get("payer")?.toString() || roommates[0]?.id || "";
    const split = roommates.map(r => form.get(`split_${r.id}`) ? r.id : null).filter(Boolean) as string[];
    if(!description || !amount || split.length===0) return;
    setExpenses(es => es.concat({ id: crypto.randomUUID(), date: new Date(), payer, description, amount, split }));
    setGroceries(gs => gs.map(g => g.name.toLowerCase().includes(description.toLowerCase()) ? { ...g, lastPrice: amount } : g));
    e.currentTarget.reset();
  }
  const toggleNeed = (id:string) => setGroceries(gs => gs.map(g => g.id===id ? { ...g, need: !g.need } : g));
  function addGrocery(e: React.FormEvent<HTMLFormElement>){
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const name = form.get("name")?.toString() || "";
    const price = parseFloat(form.get("price")?.toString() || "0");
    if(!name) return;
    setGroceries(gs => gs.concat({ id: crypto.randomUUID(), name, lastPrice: price || undefined, need: true }));
    e.currentTarget.reset();
  }

  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
      <Card className="xl:col-span-2">
        <h3 className="font-semibold mb-3">Expenses & splits</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <div className="text-sm font-medium mb-2">Add expense</div>
            <form onSubmit={addExpense} className="space-y-2">
              <input name="desc" placeholder="Groceries, Hydro, Internet…" className="input" />
              <input name="amt" type="number" min="0" step="0.01" placeholder="Amount" className="input" />
              <div className="flex items-center gap-2">
                <span className="text-sm">Payer:</span>
                <select name="payer" className="px-2 py-1 rounded-lg border border-zinc-300 dark:border-zinc-700">
                  {roommates.map(r=> <option key={r.id} value={r.id}>{r.name}</option>)}
                </select>
              </div>
              <div className="text-sm">Split with:</div>
              <div className="flex flex-wrap gap-3">
                {roommates.map(r=> (
                  <label key={r.id} className="flex items-center gap-2 text-sm">
                    <input type="checkbox" name={`split_${r.id}`} defaultChecked /> {r.name}
                  </label>
                ))}
              </div>
              <AccentButton>Add</AccentButton>
            </form>
          </div>
          <div>
            <div className="text-sm font-medium mb-2">Balances</div>
            <div className="space-y-2">
              {roommates.map(r=>{
                const val = balances.get(r.id) || 0;
                const isPos = val>=0;
                return (
                  <div key={r.id} className="flex items-center justify-between p-2 rounded-[calc(var(--radius)-6px)] border border-zinc-200 dark:border-zinc-800">
                    <Chip className="text-white" style={{ background: r.color, borderColor: r.color }}>{r.name}</Chip>
                    <div className={isPos? 'text-emerald-600' : 'text-rose-600'}>{isPos? '+$' : '-$'}{Math.abs(val).toFixed(2)}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </Card>
      <Card>
        <h3 className="font-semibold mb-3">Grocery list</h3>
        <div className="space-y-2">
          {groceries.map(g => (
            <div key={g.id} className="flex items-center justify-between p-2 rounded-[calc(var(--radius)-6px)] border border-zinc-200 dark:border-zinc-800">
              <div>
                <div className="font-medium">{g.name}</div>
                <div className="text-xs text-zinc-500">Last price {g.lastPrice ? `$${g.lastPrice.toFixed(2)}` : '—'}</div>
              </div>
              <label className="text-sm flex items-center gap-2">
                <input type="checkbox" checked={g.need} onChange={()=>toggleNeed(g.id)} /> Need
              </label>
            </div>
          ))}
        </div>
        <div className="mt-4">
          <div className="text-sm font-medium mb-2">Add item</div>
          <form onSubmit={addGrocery} className="space-y-2">
            <input name="name" placeholder="Apples, Pasta…" className="input" />
            <input name="price" type="number" min="0" step="0.01" placeholder="Optional price" className="input" />
            <AccentButton className="w-full">Add</AccentButton>
          </form>
          <p className="text-xs text-zinc-500 mt-2">* When you log an expense matching an item name, its last price is remembered.</p>
        </div>
      </Card>
    </div>
  );
}

function Profiles({ roommates, setRoommates }:{ roommates: Roommate[]; setRoommates: React.Dispatch<React.SetStateAction<Roommate[]>> }){
  const [draft, setDraft] = React.useState<Roommate[]>(roommates);
  React.useEffect(() => setDraft(roommates), [roommates]);
  const update = (id: string, data: Partial<Roommate>) =>
    setDraft(rs => rs.map(r => r.id===id ? { ...r, ...data } : r));
  return (
    <Card>
      <h3 className="font-semibold mb-3">Roommate profiles</h3>
      <div className="space-y-2">
        {draft.map(r => (
          <div key={r.id} className="flex items-center gap-2">
            <input
              className="input flex-1"
              value={r.name}
              onChange={e=>update(r.id,{ name:e.target.value })}
            />
            <input
              type="color"
              className="w-10 h-10 rounded"
              value={r.color}
              onChange={e=>update(r.id,{ color:e.target.value })}
            />
          </div>
        ))}
      </div>
      <AccentButton
        className="mt-4"
        onClick={() => {
          setRoommates(draft);
          if (typeof window !== "undefined") {
            localStorage.setItem("roommates", JSON.stringify(draft));
          }
        }}
      >
        Save
      </AccentButton>
    </Card>
  );
}

export default function HomePage(){
  const [roommates, setRoommates] = React.useState<Roommate[]>(INITIAL_ROOMMATES);
  React.useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = localStorage.getItem("roommates");
    if (stored) {
      try {
        setRoommates(JSON.parse(stored));
      } catch {}
    }
  }, []);
  const [tab, setTab] = React.useState<"Calendars"|"Chores"|"Costs & Groceries"|"Profiles">("Calendars");
  return (
    <DesignProvider>
      <div className="container py-6">
        <header className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Roomies</h1>
            <p className="text-sm text-zinc-500">Shared calendars • chores • costs • groceries</p>
          </div>
          <div className="flex gap-2">
            <Chip>MVP</Chip>
            <Chip>Theme‑able</Chip>
          </div>
        </header>
        <Tabs tabs={["Calendars","Chores","Costs & Groceries","Profiles"]} current={tab} onChange={(t)=>setTab(t as any)} />
        {tab==="Calendars" && <Calendars roommates={roommates}/>}
        {tab==="Chores" && <Chores roommates={roommates}/>}
        {tab==="Costs & Groceries" && <CostsGroceries roommates={roommates}/>}
        {tab==="Profiles" && <Profiles roommates={roommates} setRoommates={setRoommates}/>}
        <footer className="mt-10 text-xs text-zinc-500">
          Next: connect Google/Microsoft calendars via OAuth, add proposals & notifications, persist data.
        </footer>
        <DesignPanel />
      </div>
    </DesignProvider>
  );
}
