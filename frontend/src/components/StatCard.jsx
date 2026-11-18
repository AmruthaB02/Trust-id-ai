import { ShieldCheck } from "lucide-react";
export default function StatCard({ title, value, icon: Icon = ShieldCheck }) {
  return <div className="stat-card"><div className="stat-icon"><Icon size={20} /></div><span>{title}</span><strong>{value}</strong></div>;
}
