import {Navigate,Route,Routes} from "react-router-dom";
import {useAuth} from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Login from "./pages/Login";
import Register from "./pages/Register";
import DashboardRouter from "./pages/DashboardRouter";
import CertificateUpload from "./pages/CertificateUpload";
import AuthorizedRecords from "./pages/AuthorizedRecords";
import EmployerDashboard from "./pages/EmployerDashboard";
import VerifyPortal from "./pages/VerifyPortal";
import VerificationPage from "./pages/VerificationPage";
import Reports from "./pages/Reports";

function UserPage({Component,roles}) {
  const {user}=useAuth();
  return <ProtectedRoute roles={roles}><Component user={user}/></ProtectedRoute>;
}

export default function App(){
 return <Routes>
  <Route path="/" element={<Navigate to="/dashboard" replace/>}/>
  <Route path="/login" element={<Login/>}/>
  <Route path="/register" element={<Register/>}/>
  <Route path="/dashboard" element={<ProtectedRoute><DashboardRouter/></ProtectedRoute>}/>
  <Route path="/certificates/upload" element={<UserPage Component={CertificateUpload} roles={["student"]}/>}/>
  <Route path="/university/records" element={<UserPage Component={AuthorizedRecords} roles={["university_admin"]}/>}/>
  <Route path="/verify" element={<UserPage Component={VerifyPortal} roles={["employer", "university_admin", "student"]} />}/>
  <Route path="/verify/:reference" element={<VerificationPage/>}/>
  <Route path="/reports" element={<UserPage Component={Reports} roles={["student","university_admin","employer"]}/>}/>
  <Route path="*" element={<Navigate to="/dashboard" replace/>}/>
 </Routes>;
}
