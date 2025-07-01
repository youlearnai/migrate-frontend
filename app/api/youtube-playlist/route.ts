import { NextRequest, NextResponse } from "next/server";
import { extractPlaylistId } from "@/lib/utils";
import type { YouTubePlaylistResponse, VideoUrl } from "@/lib/types";

export const runtime = "edge";

async function fetchPlaylistItems(
  playlistId: string,
  apiKey: string,
  pageToken?: string,
): Promise<YouTubePlaylistResponse> {
  const params = new URLSearchParams({
    part: "snippet",
    playlistId,
    key: apiKey,
    maxResults: "25", // Maximum allowed by YouTube API
  });

  if (pageToken) {
    params.append("pageToken", pageToken);
  }

  const response = await fetch(
    `https://www.googleapis.com/youtube/v3/playlistItems?${params}`,
    {
      headers: {
        "Accept-Encoding": "gzip",
        "User-Agent": "YouLearn YouTube Playlist Fetcher (gzip)",
      },
    },
  );

  if (!response.ok) {
    throw new Error(
      `YouTube API error: ${response.status} ${response.statusText}`,
    );
  }

  return response.json();
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { playlistUrl } = body;

    if (!playlistUrl) {
      return NextResponse.json(
        { error: "Playlist URL is required" },
        { status: 400 },
      );
    }

    const apiKey = process.env.YOUTUBE_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "YouTube API key not configured" },
        { status: 500 },
      );
    }

    // Extract playlist ID from URL
    const playlistId = extractPlaylistId(playlistUrl);
    if (!playlistId) {
      return NextResponse.json(
        { error: "Invalid YouTube playlist URL" },
        { status: 400 },
      );
    }

    const allVideoUrls: VideoUrl[] = [];
    let nextPageToken: string | undefined;

    do {
      const response = await fetchPlaylistItems(
        playlistId,
        apiKey,
        nextPageToken,
      );

      const videoUrls = response.items.map((item) => ({
        videoId: item.snippet.resourceId.videoId,
        title: item.snippet.title,
        url: `https://www.youtube.com/watch?v=${item.snippet.resourceId.videoId}`,
        position: item.snippet.position,
      }));

      allVideoUrls.push(...videoUrls);
      nextPageToken = response.nextPageToken;
    } while (nextPageToken);

    allVideoUrls.sort((a, b) => a.position - b.position);

    return NextResponse.json({
      playlistId,
      totalVideos: allVideoUrls.length,
      videos: allVideoUrls,
    });
  } catch (error) {
    console.error("Error fetching YouTube playlist:", error);

    if (error instanceof Error) {
      return NextResponse.json(
        { error: `Failed to fetch playlist: ${error.message}` },
        { status: 500 },
      );
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
