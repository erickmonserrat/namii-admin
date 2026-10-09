import { useEffect, useState } from 'react'
import Sidebar from './components/Sidebar'
import Toast from './components/Toast'
import Dashboard from './modules/Dashboard'
import Rooms from './modules/Rooms'
import Families from './modules/Families'
import CRM from './modules/CRM'
import Centers from './modules/Centers'
import Staff from './modules/Staff'
import { seedData } from './data/seedData'

const STORAGE_KEY='namii-admin-react-data-v1'
function loadData(){try{const raw=localStorage.getItem(STORAGE_KEY);return raw?JSON.parse(raw):seedData}catch{return seedData}}

export default function App(){
 const [currentView,setCurrentView]=useState('dashboard')
 const [data,setData]=useState(loadData)
 const [toastMessage,setToastMessage]=useState('')
 useEffect(()=>{localStorage.setItem(STORAGE_KEY,JSON.stringify(data))},[data])
 useEffect(()=>{if(!toastMessage)return;const t=setTimeout(()=>setToastMessage(''),3000);return()=>clearTimeout(t)},[toastMessage])
 const toast=msg=>setToastMessage(msg)
 const view={
  dashboard:<Dashboard data={data}/>,
  rooms:<Rooms data={data} setData={setData} toast={toast}/>,
  children:<Families data={data} setData={setData} toast={toast}/>,
  crm:<CRM data={data} setData={setData} toast={toast}/>,
  centers:<Centers data={data} setData={setData} toast={toast}/>,
  staff:<Staff data={data}/>
 }[currentView]
 return <div className="flex h-screen w-full overflow-hidden bg-slate-100"><Sidebar currentView={currentView} setCurrentView={setCurrentView}/><main className="flex-1 flex min-w-0">{view}</main><Toast message={toastMessage}/></div>
}
