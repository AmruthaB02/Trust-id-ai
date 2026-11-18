import { useEffect,useState } from "react";
import DashboardLayout from "../components/DashboardLayout";
import api,{getList,getErrorMessage} from "../services/api";
import {Plus,RefreshCw} from "lucide-react";

const blank={student_name:"",registration_number:"",degree:"",university_name:"",marks:"",graduation_year:""};
export default function AuthorizedRecords({user}){
 const [form,setForm]=useState(blank);const [records,setRecords]=useState([]);const [error,setError]=useState("");const [message,setMessage]=useState("");const [busy,setBusy]=useState(false);
 async function load(){try{const r=await api.get("/institutions/authorized-certificates/");setRecords(getList(r.data));}catch(e){setError(getErrorMessage(e));}}
 useEffect(()=>{load();},[]);
 function change(e){setForm({...form,[e.target.name]:e.target.value});}
 async function submit(e){e.preventDefault();setBusy(true);setError("");setMessage("");try{await api.post("/institutions/authorized-certificates/",form);setForm(blank);setMessage("Original issuer record registered.");await load();}catch(e){setError(getErrorMessage(e));}finally{setBusy(false);}}
 return <DashboardLayout user={user}><div className="page-heading"><span className="eyebrow">ISSUER MODULE</span><h1>Authorized certificate records</h1><p>Register details from official university records.</p></div><div className="upload-grid"><section className="panel"><h2>Register an original record</h2><form className="form-stack" onSubmit={submit}>{[["student_name","Student name","text"],["registration_number","Registration number","text"],["degree","Degree","text"],["university_name","University name","text"],["marks","Marks / grade","text"],["graduation_year","Graduation year","number"]].map(([name,label,type])=><div className="form-field" key={name}><label>{label} *</label><input name={name} type={type} value={form[name]} onChange={change} required/></div>)}{error&&<div className="error-message">{error}</div>}{message&&<div className="success-message">{message}</div>}<button className="primary-button" disabled={busy}><Plus size={16}/>{busy?"Saving...":"Register record"}</button></form></section>
 <section className="panel"><div className="panel-heading"><div><h2>Registered issuer records</h2><p>Records belonging to your administrator account.</p></div><button className="text-button" onClick={load}><RefreshCw size={15}/> Refresh</button></div>{records.length===0?<div className="empty-state">No authorized records yet.</div>:records.map(r=><div className="record-item" key={r.id}><strong>{r.student_name}</strong><span>{r.registration_number} · {r.degree}</span><span>{r.university_name} · {r.graduation_year}</span></div>)}</section></div></DashboardLayout>;
}
