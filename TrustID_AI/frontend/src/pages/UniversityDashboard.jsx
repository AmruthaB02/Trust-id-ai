import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Building2, FileCheck2, AlertTriangle, Plus, RefreshCw } from "lucide-react";
import DashboardLayout from "../components/DashboardLayout";
import StatCard from "../components/StatCard";
import api,{getList,getErrorMessage} from "../services/api";

export default function UniversityDashboard({user}) {
  const navigate=useNavigate();const [certs,setCerts]=useState([]);const [records,setRecords]=useState([]);const [error,setError]=useState("");const [loading,setLoading]=useState(true);
  async function load(){setLoading(true);setError("");try{const [a,b]=await Promise.all([api.get("/certificates/"),api.get("/institutions/authorized-certificates/")]);setCerts(getList(a.data));setRecords(getList(b.data));}catch(e){setError(getErrorMessage(e));}finally{setLoading(false);}}
  useEffect(()=>{load();},[]);
  const flagged=certs.filter(x=>x.status==="unverified").length;
  return <DashboardLayout user={user}><div className="welcome-row"><div><span className="eyebrow">UNIVERSITY ADMINISTRATOR</span><h1>Institution dashboard</h1><p>Manage issuer records and review submitted credentials.</p></div><button className="primary-button" onClick={()=>navigate("/university/records")}><Plus size={17}/> Register original record</button></div>
    <div className="stats-grid"><StatCard title="Authorized records" value={records.length} icon={Building2}/><StatCard title="Submissions" value={certs.length} icon={FileCheck2}/><StatCard title="Unverified" value={flagged} icon={AlertTriangle}/><StatCard title="Verified demo matches" value={certs.filter(x=>x.status==="verified_demo").length} icon={FileCheck2}/></div>
    <section className="panel"><div className="panel-heading"><div><h2>Certificate submissions</h2><p>Review student submissions returned by the API.</p></div><button className="text-button" onClick={load}><RefreshCw size={15}/> Refresh</button></div>
    {loading?<p className="state-message">Loading records...</p>:error?<div className="error-message">{error}</div>:certs.length===0?<div className="empty-state"><Building2/><h3>No submissions yet</h3></div>:<div className="table-wrap"><table className="data-table"><thead><tr><th>Student</th><th>Registration</th><th>Degree</th><th>Status</th><th>Review note</th></tr></thead><tbody>{certs.map(x=><tr key={x.id}><td>{x.student_name||"—"}</td><td>{x.registration_number}</td><td>{x.degree}</td><td><span className={`status-pill ${x.status==="verified_demo"?"success":x.status==="unverified"?"danger":"pending"}`}>{x.status}</span></td><td>{x.review_note}</td></tr>)}</tbody></table></div>}</section>
  </DashboardLayout>;
}
