import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { UploadCloud, FileCheck2, Clock3, AlertTriangle, RefreshCw } from "lucide-react";
import DashboardLayout from "../components/DashboardLayout";
import StatCard from "../components/StatCard";
import api, { getList, getErrorMessage } from "../services/api";

export default function StudentDashboard({ user }) {
  const navigate = useNavigate(); const [items,setItems]=useState([]); const [error,setError]=useState(""); const [loading,setLoading]=useState(true);
  async function load(){setLoading(true);setError("");try{const r=await api.get("/certificates/");setItems(getList(r.data));}catch(e){setError(getErrorMessage(e));}finally{setLoading(false);}}
  useEffect(()=>{load();},[]);
  const verified=items.filter(x=>x.status==="verified_demo").length;
  const pending=items.filter(x=>x.status==="pending_review").length;
  const flagged=items.filter(x=>x.status==="unverified").length;
  return <DashboardLayout user={user}>
    <div className="welcome-row"><div><span className="eyebrow">STUDENT WORKSPACE</span><h1>Welcome, {user.full_name || "Student"}</h1><p>Upload and track your educational certificate verification.</p></div><button className="primary-button" onClick={()=>navigate("/certificates/upload")}><UploadCloud size={17}/> Upload certificate</button></div>
    <div className="stats-grid"><StatCard title="Total submissions" value={items.length} icon={FileCheck2}/><StatCard title="Verified demo matches" value={verified} icon={FileCheck2}/><StatCard title="Pending review" value={pending} icon={Clock3}/><StatCard title="Unverified" value={flagged} icon={AlertTriangle}/></div>
    <section className="panel"><div className="panel-heading"><div><h2>My certificate submissions</h2><p>Latest status returned by the verification service.</p></div><button className="text-button" onClick={load}><RefreshCw size={15}/> Refresh</button></div>
    {loading?<p className="state-message">Loading submissions...</p>:error?<div className="error-message">{error}</div>:items.length===0?<div className="empty-state"><FileCheck2 size={32}/><h3>No certificates submitted yet</h3><p>Upload a certificate to start the demonstration workflow.</p></div>:<div className="table-wrap"><table className="data-table"><thead><tr><th>Registration</th><th>Degree</th><th>Institution</th><th>Status</th><th>Submitted</th></tr></thead><tbody>{items.map(x=><tr key={x.id}><td>{x.registration_number}</td><td>{x.degree}</td><td>{x.university_name}</td><td><span className={`status-pill ${x.status==="verified_demo"?"success":x.status==="unverified"?"danger":"pending"}`}>{x.status}</span></td><td>{new Date(x.created_at).toLocaleDateString()}</td></tr>)}</tbody></table></div>}</section>
  </DashboardLayout>;
}
