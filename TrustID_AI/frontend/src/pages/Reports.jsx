import {useEffect,useState} from "react";
import {RefreshCw,BarChart3} from "lucide-react";
import DashboardLayout from "../components/DashboardLayout";
import StatCard from "../components/StatCard";
import api,{getList,getErrorMessage} from "../services/api";
export default function Reports({user}){
 const [summary,setSummary]=useState({});const [items,setItems]=useState([]);const [error,setError]=useState("");const [loading,setLoading]=useState(true);
 async function load(){setLoading(true);setError("");try{const [a,b]=await Promise.all([api.get("/reports/summary/"),api.get("/certificates/")]);setSummary(a.data);setItems(getList(b.data));}catch(e){setError(getErrorMessage(e));}finally{setLoading(false);}}
 useEffect(()=>{load();},[]);
 return <DashboardLayout user={user}><div className="welcome-row"><div><span className="eyebrow">REPORT MODULE</span><h1>Verification reports</h1><p>Summary of certificate activity returned by the backend.</p></div><button className="text-button" onClick={load}><RefreshCw size={15}/> Refresh</button></div>{loading?<p className="state-message">Loading report data...</p>:error?<div className="error-message">{error}</div>:<><div className="stats-grid"><StatCard title="Total certificates" value={summary.total_certificates??0} icon={BarChart3}/><StatCard title="Verified demo matches" value={summary.verified??0}/><StatCard title="Pending" value={summary.pending??0}/><StatCard title="Unverified" value={summary.flagged??0}/></div><section className="panel"><h2>Certificate activity</h2>{items.length===0?<div className="empty-state">No certificate activity available.</div>:<div className="table-wrap"><table className="data-table"><thead><tr><th>Student</th><th>Registration</th><th>Degree</th><th>Status</th><th>Date</th></tr></thead><tbody>{items.map(x=><tr key={x.id}><td>{x.student_name}</td><td>{x.registration_number}</td><td>{x.degree}</td><td>{x.status}</td><td>{new Date(x.created_at).toLocaleDateString()}</td></tr>)}</tbody></table></div>}</section></>}</DashboardLayout>;
}
