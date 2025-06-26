
import { io } from "socket.io-client";
const socket = io(import.meta.env.VITE_BACKEND_URL || "http://localhost:5050", {
  transports: ["websocket"],
});
export default socket;
