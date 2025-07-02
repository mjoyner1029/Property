import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";

export default function VerifyEmail() {
  const { token } = useParams();
  const [message, setMessage] = useState("");

  useEffect(() => {
    axios
      .get(`/api/verify/${token}`)
      .then(res => setMessage(res.data.message))
      .catch(err => setMessage(err.response?.data?.message || "Verification failed."));
  }, [token]);

  return <h2>{message}</h2>;
}
