import {useEffect,useState} from "react";
import {Link,useParams} from "react-router-dom";
import {ShieldCheck,ShieldAlert,ArrowLeft} from "lucide-react";
import api,{getErrorMessage} from "../services/api";

export default function VerificationPage(){
 const {reference}=useParams();const [record,setRecord]=useState(null);const [error,setError]=useState("");const [loading,setLoading]=useState(true);
 useEffect(()=>{let active=true;api.get(`/verification/${reference}/`).then(r=>{if(active)setRecord(r.data);}).catch(e=>{if(active)setError(getErrorMessage(e));}).finally(()=>{if(active)setLoading(false);});return()=>{active=false;};},[reference]);
 if(loading)return <div className="center-state">Checking verification record...</div>;
 const verified=record?.status==="verified_demo";
 return <div className="public-verification"><div className="public-brand"><ShieldCheck size={25}/> TrustID AI</div><div className="verification-card">{error?<><ShieldAlert size={45} className="danger-icon"/><h1>Verification unavailable</h1><p>{error}</p></>:<><div>{verified?<ShieldCheck size={48} className="success-icon"/>:<ShieldAlert size={48} className="danger-icon"/>}</div><span className={`status-pill ${verified?"success":"danger"}`}>{record.status}</span><h1>{verified?"Demo record matched":"Not verified"}</h1><p className="verification-description">{verified?"The submitted metadata matched an authorized record in this local demonstration. This is not a blockchain-backed verification.":"No matching authorized issuer record was found in this demonstration."}</p><div className="verification-details">{[["Student name",record.student_name],["Registration number",record.registration_number],["Degree",record.degree],["Institution",record.university_name],["Graduation year",record.graduation_year],["SHA-256 hash",record.certificate_hash],["Blockchain transaction",record.blockchain_tx_hash||"Not connected in demo"]].map(([label,value])=><div className="detail-row" key={label}><span>{label}</span><strong>{value||"—"}</strong></div>)}</div><div className="privacy-note">{record.review_note}</div></>}<Link className="secondary-button" to="/login"><ArrowLeft size={16}/> Return to portal</Link></div></div>;
}
