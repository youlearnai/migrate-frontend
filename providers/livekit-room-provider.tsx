"use client";
import { RoomAudioRenderer, RoomContext } from "@livekit/components-react";
import { Room } from "livekit-client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

const LivekitRoomProvider = ({ children }: { children: React.ReactNode }) => {
  const params = useParams();
  const [room] = useState<Room>(() => new Room({}));

  // watches the params (spaceId and contentId) and disconnects from the room
  useEffect(() => {
    room.disconnect();
  }, [params?.contentId, params?.spaceId]);

  return (
    <RoomContext.Provider value={room}>
      {children}
      <RoomAudioRenderer />
    </RoomContext.Provider>
  );
};

export default LivekitRoomProvider;
