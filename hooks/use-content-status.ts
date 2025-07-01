import { useEffect, useCallback, useState } from "react";
import { ContentProcessingEvent } from "@/lib/types";

class ContentStatusManager {
  private connections: Map<
    string,
    {
      eventSource: EventSource;
      subscribers: Set<(event: ContentProcessingEvent) => void>;
    }
  > = new Map();

  private completedChannels = new Set<string>();

  subscribe(
    channel: string,
    callback: (event: ContentProcessingEvent) => void,
  ): () => void {
    if (this.completedChannels.has(channel)) {
      this.completedChannels.delete(channel);
    }

    let connection = this.connections.get(channel);

    if (!connection) {
      const [, userId, contentId] = channel.split(":");
      const eventSource = new EventSource(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/content/add/status/${userId}/${contentId}`,
        {
          withCredentials: true,
        },
      );

      connection = {
        eventSource,
        subscribers: new Set(),
      };

      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          connection!.subscribers.forEach((cb) => cb(data));

          if (data.status === "completed" || data.status === "failed") {
            this.completedChannels.add(channel);
            eventSource.close();
            this.cleanup(channel);
          }
        } catch (error) {
          console.error("Error parsing content status event:", error);
        }
      };

      eventSource.addEventListener("close", () => {
        this.completedChannels.add(channel);
        this.cleanup(channel);
      });

      eventSource.onerror = (error) => {
        console.error("EventSource error:", error);
        if (!this.completedChannels.has(channel)) {
          if (eventSource.readyState === EventSource.CLOSED) {
            this.completedChannels.add(channel);
          }
          this.cleanup(channel);
        } else {
          eventSource.close();
        }
      };

      this.connections.set(channel, connection);
    }

    connection.subscribers.add(callback);

    return () => {
      const conn = this.connections.get(channel);
      if (conn) {
        conn.subscribers.delete(callback);

        if (conn.subscribers.size === 0) {
          this.cleanup(channel);
        }
      }
    };
  }

  private cleanup(channel: string) {
    const connection = this.connections.get(channel);
    if (connection) {
      connection.eventSource.close();
      this.connections.delete(channel);
    }

    if (this.completedChannels.has(channel)) {
      setTimeout(() => {
        this.completedChannels.delete(channel);
      }, 30000);
    }
  }
}

export const contentStatusManager = new ContentStatusManager();

export function useContentStatus(
  userId: string | undefined,
  contentId: string,
  spaceId?: string,
  enabled: boolean = true,
  onEvent?: (event: ContentProcessingEvent) => void,
) {
  const [isConnected, setIsConnected] = useState(false);

  const handleStatusUpdate = useCallback(
    (event: ContentProcessingEvent) => {
      if (event.status === "failed") {
        console.error("[Client] Processing Failed:", {
          event,
          contentId,
          userId,
        });
      }

      if (onEvent) {
        onEvent(event);
      }
    },
    [contentId, spaceId, userId, onEvent],
  );

  useEffect(() => {
    if (!enabled || !userId || !contentId) return;

    const channel = `content_status:${userId}:${contentId}`;

    const unsubscribe = contentStatusManager.subscribe(
      channel,
      handleStatusUpdate,
    );
    setIsConnected(true);

    return () => {
      unsubscribe();
      setIsConnected(false);
    };
  }, [userId, contentId, enabled, handleStatusUpdate]);

  return {
    isConnected,
  };
}
