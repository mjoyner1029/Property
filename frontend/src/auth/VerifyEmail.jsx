import React, { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import axios from "axios";

export default function VerifyEmail() {
  const [qp] = useSearchParams();
  const [state, setState] = useState("loading"); // loading|success|error
  const token = qp.get("token");

  useEffect(() => {
    let cancelled = false;
    async function run() {
      try {
        await axios.post(`${process.env.REACT_APP_API_URL}/api/auth/verify-email`, { token });
        if (!cancelled) setState("success");
      } catch {
        if (!cancelled) setState("error");
      }
    }
    if (token) run(); else setState("error");
    return () => { cancelled = true; };
  }, [token]);

  if (state === "loading") return <div>Verifying…</div>;
  if (state === "success")
    return (
      <div data-testid="verify-email">
        <h1>Email Verified!</h1>
        <Link to="/login">Go to Login</Link>
      </div>
    );
  return (
    <div data-testid="verify-email">
      <h1>Verification failed</h1>
      <button onClick={() => axios.post(`${process.env.REACT_APP_API_URL}/api/auth/resend-verification`)}>Resend verification</button>
    </div>
  );
}
