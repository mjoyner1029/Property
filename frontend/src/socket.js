import { io } from "socket.io-client";
const socket = io(process.env.REACT_APP_API_URL, { withCredentials:true, autoConnect:true, reconnection:true });
if (process.env.NODE_ENV !== "production") {
  socket.on("connect_error", (e)=>console.warn("socket error", e?.message));
}
export default socket;
