"use client";

import { io, Socket } from "socket.io-client";

export const DEFECTS_CHANGED_EVENT = "defects:changed";

export type DefectChangeAction = "created" | "updated" | "deleted";

export interface DefectChangeEvent {
  action: DefectChangeAction;
  defectId?: string;
  actorUserId?: string;
  timestamp: string;
}

const backendBaseUrl =
  process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000";

let socket: Socket | null = null;

export function getRealtimeSocket() {
  if (typeof window === "undefined") {
    return null;
  }

  if (!socket) {
    socket = io(backendBaseUrl, {
      withCredentials: true,
      transports: ["websocket", "polling"],
    });
  }

  return socket;
}
