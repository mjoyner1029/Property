import React, { useEffect, useState } from "react";
import axios from "axios";

export default function TenantList(){
  const [state, setState] = useState({loading:true, error:'', tenants:[]});
  useEffect(()=>{
    let cancelled=false;
    axios.get(`${process.env.REACT_APP_API_URL}/api/tenants`)
      .then(r=>!cancelled && setState({loading:false, error:'', tenants:r.data||[]}))
      .catch(()=>!cancelled && setState({loading:false, error:'load', tenants:[]}));
    return ()=>{cancelled=true};
  },[]);
  if (state.loading) return <div role="progressbar" />;
  if (state.error) return <div role="alert">Error loading tenants</div>;
  if (!state.tenants.length) return <div>No tenants found</div>;
  return <ul>{state.tenants.map(t=><li key={t.id}>{t.name}</li>)}</ul>;
}
