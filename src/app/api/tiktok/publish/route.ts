import { NextResponse } from "next/server";
import { getAdminApp } from "@/lib/firebaseAdmin";
import admin from "firebase-admin";
import { generateIslamicSEO } from "@/lib/seoGenerator";

async function getValidAccessToken(accountId: string, db: admin.firestore.Firestore): Promise<string> {
  const accountRef = db.collection("tiktok_accounts").doc(accountId);
  const accountDoc = await accountRef.get();

  if (!accountDoc.exists) {
    throw new Error("TikTok account not found in database.");
  }

  const data = accountDoc.data()!;
  const now = Date.now();
  const expiresAt = data.expiresAt.toDate().getTime();
  
  if (expiresAt - now > 5 * 60 * 1000) {
    return data.accessToken;
  }

  console.log(`[TikTok Token] Refreshing access token for account: ${data.username}`);
  const clientKey = process.env.TIKTOK_CLIENT_KEY;
  const clientSecret = process.env.TIKTOK_CLIENT_SECRET;

  if (!clientKey || !clientSecret) {
    throw new Error("Server Configuration Error: Missing TikTok credentials");
  }

  const tokenUrl = "https://open.tiktokapis.com/v2/oauth/token/";
  const details: Record<string, string> = {
    client_key: clientKey,
    client_secret: clientSecret,
    grant_type: "refresh_token",
    refresh_token: data.refreshToken,
  };

  const formBody = Object.keys(details)
    .map(key => encodeURIComponent(key) + "=" + encodeURIComponent(details[key]!))
    .join("&");

  const refreshRes = await fetch(tokenUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "Cache-Control": "no-cache",
    },
    body: formBody,
  });

  if (!refreshRes.ok) {
    const errText = await refreshRes.text();
    console.error("[TikTok Token] Refresh failed:", errText);
    throw new Error(`TikTok refresh token failed: ${errText}`);
  }

  const tokenData = await refreshRes.json();
  const { access_token, refresh_token, expires_in, refresh_expires_in } = tokenData;

  if (!access_token) {
    throw new Error("Invalid refresh token response from TikTok");
  }

  const updateData: Record<string, any> = {
    accessToken: access_token,
    expiresAt: admin.firestore.Timestamp.fromMillis(now + expires_in * 1000),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  };

  if (refresh_token) {
    updateData.refreshToken = refresh_token;
    updateData.refreshTokenExpiresAt = admin.firestore.Timestamp.fromMillis(now + refresh_expires_in * 1000);
  }

  await accountRef.update(updateData);
  return access_token;
}

const ZERNIO_TIKTOK_ACCOUNT_ID = "6a4c75f09d9472faaea0b774";
const ZERNIO_YOUTUBE_ACCOUNT_ID = "6a9cfafb77555aae01e37454";
const ZERNIO_API_KEY = process.env.ZERNIO_API_KEY || "sk_e79e01e86d0f0499e55b0e768b9287c194d4b5c4843ee49040220efc21186a42";

function extractSmartTitle(caption: string, fallbackTitle?: string): string {
  if (fallbackTitle && fallbackTitle.trim()) {
    return fallbackTitle.trim().substring(0, 100);
  }
  const firstLine = caption.split("\n")[0] || "";
  const cleaned = firstLine
    .replace(/#[^\s]+/g, "")
    .replace(/https?:\/\/[^\s]+/g, "")
    .trim();
  return (cleaned || "تلاوة قرآنية مباركة 📖").substring(0, 100);
}

function extractSmartTags(caption: string, customTags?: any): string[] {
  let tags: string[] = [];
  if (Array.isArray(customTags) && customTags.length > 0) {
    tags = customTags.map((t: string) => String(t).replace(/[#,"'\n\r]/g, "").trim()).filter(Boolean);
  } else if (typeof customTags === "string" && customTags.trim()) {
    tags = customTags.split(",").map((t: string) => t.replace(/[#,"'\n\r]/g, "").trim()).filter(Boolean);
  }

  // Extract hashtags from caption if custom tags were empty
  let hashtags: string[] = [];
  if (tags.length === 0) {
    hashtags = (caption.match(/#([^\s#]+)/g) || []).map((h) =>
      h.replace(/^#+/, "").replace(/_/g, " ").trim()
    );
  }

  const baseTags = [
    "قرآن",
    "قران كريم",
    "تلاوة قرآنية",
    "يقين القرآن",
    "Quran",
    "Islam",
  ];

  const combined = Array.from(new Set([...tags, ...hashtags, ...baseTags]))
    .map(t => t.trim())
    .filter(t => t.length > 0 && t.length <= 50);

  const safeTags: string[] = [];
  let currentChars = 0;
  for (const t of combined) {
    if (currentChars + t.length + 1 > 400) break;
    safeTags.push(t);
    currentChars += t.length + 1;
  }

  return safeTags;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      accountId,
      videoUrl,
      caption,
      scheduledFor,
      adminToken,
      retryLogId,
      // YouTube & rich metadata fields:
      title,
      tags,
      tagsString,
      description,
      firstComment,
      publishToYouTube,
      youtubeAccountId,
      surahName,
      surahNumber,
      reciterName,
      startAyah,
      endAyah,
    } = body;

    if (!accountId || !videoUrl || !caption) {
      return NextResponse.json({ error: "Missing required fields: accountId, videoUrl, caption" }, { status: 400 });
    }
    const authHeader = request.headers.get("Authorization");
    const cronSecret = process.env.CRON_SECRET;
    const isCronBypass = cronSecret && authHeader === `Bearer ${cronSecret}`;

    if (!adminToken && !isCronBypass) {
      return NextResponse.json({ error: "Unauthorized: Missing token" }, { status: 401 });
    }

    const adminApp = getAdminApp();
    const adminDb = admin.firestore(adminApp);

    if (!isCronBypass) {
      const adminAuth = admin.auth(adminApp);
      try {
        const decodedToken = await adminAuth.verifyIdToken(adminToken);
        const emailLower = decodedToken.email?.toLowerCase() || "";
        if (
          emailLower !== "youssefosama@gmail.com" &&
          emailLower !== "youssef@yaqeen.app" &&
          !emailLower.includes("youssef")
        ) {
          return NextResponse.json({ error: "Forbidden: Admin access only" }, { status: 403 });
        }
      } catch (e: any) {
        return NextResponse.json({ error: `Unauthorized session: ${e.message}` }, { status: 401 });
      }
    }

    // ── Build Full, Rich Metadata for YouTube & Zernio via SEO Engine ──
    let surahCandidate = surahName || "";
    if (!surahCandidate) {
      const surahMatch = caption.match(/سورة\s+([^\s\-\–\|\(\)]+)/);
      if (surahMatch) surahCandidate = surahMatch[1];
    }
    
    let reciterCandidate = reciterName || "";
    if (!reciterCandidate) {
      const reciterMatch = caption.match(/(?:الشيخ|بصوت|القارئ)\s+([^\s\-\–\|\(\)\n]+(?:\s+[^\s\-\–\|\(\)\n]+)?)/);
      if (reciterMatch) reciterCandidate = reciterMatch[1];
    }

    const fallbackSEO = generateIslamicSEO({
      surahName: surahCandidate,
      surahNumber,
      reciterName: reciterCandidate,
      startAyah,
      endAyah,
    });

    const finalTitle = extractSmartTitle(caption, title || fallbackSEO.title);
    const finalTags = extractSmartTags(caption, tags || tagsString || fallbackSEO.tags);
    const finalTagsString = finalTags.join(", ");
    const finalDesc = (description && description.trim().length > 100) ? description.trim() : fallbackSEO.description;
    const finalFirstComment = (firstComment && firstComment.trim()) || fallbackSEO.firstComment;
    const finalYtAccountId = youtubeAccountId || ZERNIO_YOUTUBE_ACCOUNT_ID;
    const shouldPostToYouTube = publishToYouTube !== false;

    // 1. If it's a scheduled post, save to Firestore queue
    if (scheduledFor) {
      const scheduledTime = new Date(scheduledFor);
      if (isNaN(scheduledTime.getTime()) || scheduledTime.getTime() <= Date.now()) {
        return NextResponse.json({ error: "Invalid scheduled date/time. Must be in the future." }, { status: 400 });
      }

      let logRef;
      if (retryLogId) {
        logRef = adminDb.collection("tiktok_logs").doc(retryLogId);
        await logRef.update({
          status: "pending",
          title: finalTitle,
          tags: finalTags,
          tagsString: finalTagsString,
          description: finalDesc,
          firstComment: finalFirstComment,
          publishToYouTube: shouldPostToYouTube,
          youtubeAccountId: finalYtAccountId,
          scheduledFor: admin.firestore.Timestamp.fromDate(scheduledTime),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          error: admin.firestore.FieldValue.delete(),
        });
      } else {
        logRef = await adminDb.collection("tiktok_logs").add({
          videoUrl,
          accountId,
          caption,
          title: finalTitle,
          tags: finalTags,
          tagsString: finalTagsString,
          description: finalDesc,
          firstComment: finalFirstComment,
          publishToYouTube: shouldPostToYouTube,
          youtubeAccountId: finalYtAccountId,
          status: "pending",
          progress: 0,
          uploadSpeed: "0 MB/s",
          scheduledFor: admin.firestore.Timestamp.fromDate(scheduledTime),
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          publishedAt: null,
        });
      }

      // If posting via Make.com or direct to Zernio API, schedule immediately on Zernio so it appears in Zernio Scheduled dashboard
      if (ZERNIO_API_KEY) {
        try {
          console.log(`[TikTok Publish] Scheduling post on Zernio API (TikTok: ${ZERNIO_TIKTOK_ACCOUNT_ID}${shouldPostToYouTube ? `, YouTube: ${finalYtAccountId}` : ""})`);
          
          const zernioPlatforms: any[] = [
            {
              platform: "tiktok",
              accountId: ZERNIO_TIKTOK_ACCOUNT_ID,
              platformSpecificData: {
                privacy_level: "PUBLIC_TO_EVERYONE",
                privacyLevel: "PUBLIC_TO_EVERYONE",
                allow_comment: true,
                allow_duet: true,
                allow_stitch: true,
                disableComment: false,
                disableDuet: false,
                disableStitch: false,
                tiktokSettings: {
                  privacy_level: "PUBLIC_TO_EVERYONE",
                  allow_comment: true,
                  allow_duet: true,
                  allow_stitch: true,
                },
              },
            },
          ];

          if (shouldPostToYouTube) {
            zernioPlatforms.push({
              platform: "youtube",
              accountId: finalYtAccountId,
              platformSpecificData: {
                title: finalTitle,
                description: finalDesc,
                tags: finalTags,
                firstComment: finalFirstComment,
                visibility: "public",
                categoryId: "27",
                madeForKids: false,
              },
            });
          }

          const zernioPayload: any = {
            title: finalTitle,
            content: caption,
            tags: finalTags,
            mediaItems: [{ type: "video", url: videoUrl }],
            platforms: zernioPlatforms,
            scheduledFor: scheduledTime.toISOString(),
            publishNow: false,
            isDraft: false,
          };

          const zernioRes = await fetch("https://zernio.com/api/v1/posts", {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${ZERNIO_API_KEY}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify(zernioPayload),
          });
          const zernioData = await zernioRes.json().catch(() => null);
          console.log("[TikTok Publish] Direct Zernio schedule response:", zernioData);
        } catch (zErr: any) {
          console.warn("[TikTok Publish] Direct Zernio schedule warning:", zErr.message);
        }
      }

      // Also forward scheduled info to Make.com Webhook if configured
      if (accountId === "make_com") {
        const makeWebhookUrl = process.env.MAKE_WEBHOOK_URL || "https://hook.eu1.make.com/tl01y7q4wfa8k1rzg1lvggvb93yolmf4";
        if (makeWebhookUrl) {
          fetch(makeWebhookUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              videoUrl,
              url: videoUrl,
              mediaUrl: videoUrl,
              caption,
              content: caption,
              title: finalTitle,
              videoTitle: finalTitle,
              tags: finalTags,
              tagsString: finalTagsString,
              tagsCsv: finalTagsString,
              videoTags: finalTags,
              keywords: finalTags,
              description: finalDesc,
              youtubeDescription: finalDesc,
              ytDescription: finalDesc,
              firstComment: finalFirstComment,
              accountId,
              jobId: logRef.id,
              scheduledFor: scheduledTime.toISOString(),
              publishNow: false,
              publishToYouTube: shouldPostToYouTube,
              youtube: {
                accountId: finalYtAccountId,
                title: finalTitle,
                tags: finalTags,
                tagsString: finalTagsString,
                videoTags: finalTags,
                keywords: finalTags,
                description: finalDesc,
                firstComment: finalFirstComment,
                visibility: "public",
                categoryId: "27",
                madeForKids: false,
              },
              platformSpecificData: {
                title: finalTitle,
                description: finalDesc,
                tags: finalTags,
                tagsString: finalTagsString,
                videoTags: finalTags,
                keywords: finalTags,
                firstComment: finalFirstComment,
                visibility: "public",
                categoryId: "27",
                madeForKids: false,
              },
              zernioPayload: {
                content: caption,
                tags: finalTags,
                mediaItems: [{ type: "video", url: videoUrl }],
                platforms: [
                  {
                    platform: "youtube",
                    accountId: finalYtAccountId,
                    platformSpecificData: {
                      title: finalTitle,
                      description: finalDesc,
                      tags: finalTags,
                      firstComment: finalFirstComment,
                      visibility: "public",
                      categoryId: "27",
                      madeForKids: false,
                    },
                  },
                ],
              },
            }),
          }).catch((err) => console.warn("[Make.com forward warning]:", err.message));
        }
      }

      return NextResponse.json({ success: true, message: "Video scheduled successfully", jobId: logRef.id });
    }

    // 2. Initialize/Update log document first with status 'uploading'
    let logRef;
    if (retryLogId) {
      logRef = adminDb.collection("tiktok_logs").doc(retryLogId);
      await logRef.update({
        status: "uploading",
        title: finalTitle,
        tags: finalTags,
        tagsString: finalTagsString,
        description: finalDesc,
        firstComment: finalFirstComment,
        publishToYouTube: shouldPostToYouTube,
        youtubeAccountId: finalYtAccountId,
        progress: 0,
        uploadSpeed: "0 MB/s",
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        error: admin.firestore.FieldValue.delete(),
      });
    } else {
      logRef = await adminDb.collection("tiktok_logs").add({
        videoUrl,
        accountId,
        caption,
        title: finalTitle,
        tags: finalTags,
        tagsString: finalTagsString,
        description: finalDesc,
        firstComment: finalFirstComment,
        publishToYouTube: shouldPostToYouTube,
        youtubeAccountId: finalYtAccountId,
        status: "uploading",
        progress: 0,
        uploadSpeed: "0 MB/s",
        scheduledFor: null,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        publishedAt: null,
      });
    }

    // ==========================================
    // OPTION A: FORWARD TO MAKE.COM WEBHOOK (IF CHOSEN)
    // ==========================================
    if (accountId === "make_com") {
      const makeWebhookUrl = process.env.MAKE_WEBHOOK_URL || "https://hook.eu1.make.com/tl01y7q4wfa8k1rzg1lvggvb93yolmf4";
      if (!makeWebhookUrl) {
        const errText = "عذراً، لم يتم إعداد رابط الويب هوك (MAKE_WEBHOOK_URL) في السيرفر بعد.";
        await logRef.update({ status: "failed", error: errText });
        return NextResponse.json({ error: errText }, { status: 400 });
      }

      console.log(`[TikTok Publish] Forwarding payload to Make.com Webhook: ${makeWebhookUrl}`);
      
      await logRef.update({
        status: "uploading",
        progress: 50,
        uploadSpeed: "Make.com Flow",
      });

      // Complete, multi-platform payload with full YouTube title, tags, description and comment
      const makeRes = await fetch(makeWebhookUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          videoUrl,
          url: videoUrl,
          mediaUrl: videoUrl,
          caption,
          content: caption,
          text: caption,
          title: finalTitle,
          videoTitle: finalTitle,
          tags: finalTags,
          tagsString: finalTagsString,
          description: finalDesc,
          firstComment: finalFirstComment,
          accountId,
          jobId: logRef.id,
          scheduledFor: null,
          publishNow: true,
          publishToYouTube: shouldPostToYouTube,
          youtube: {
            accountId: finalYtAccountId,
            title: finalTitle,
            tags: finalTags,
            tagsString: finalTagsString,
            description: finalDesc,
            firstComment: finalFirstComment,
            visibility: "public",
            categoryId: "22",
            madeForKids: false,
          },
          platformSpecificData: {
            title: finalTitle,
            description: finalDesc,
            tags: finalTags,
            firstComment: finalFirstComment,
            visibility: "public",
            categoryId: "22",
            madeForKids: false,
          },
          zernioPayload: {
            content: caption,
            mediaItems: [{ type: "video", url: videoUrl }],
            platforms: [
              {
                platform: "youtube",
                accountId: finalYtAccountId,
                platformSpecificData: {
                  title: finalTitle,
                  description: finalDesc,
                  tags: finalTags,
                  firstComment: finalFirstComment,
                  visibility: "public",
                  categoryId: "27",
                  madeForKids: false,
                },
              },
            ],
            publishNow: true,
          },
        }),
      });

      if (!makeRes.ok) {
        const errText = await makeRes.text();
        await logRef.update({ status: "failed", error: `Make.com Webhook failed: ${errText}` });
        return NextResponse.json({ error: `Make.com Webhook failed: ${errText}` }, { status: makeRes.status });
      }

      // Also directly post to Zernio API for YouTube if configured
      if (ZERNIO_API_KEY && shouldPostToYouTube) {
        try {
          console.log(`[TikTok Publish] Creating immediate YouTube post on Zernio API`);
          await fetch("https://zernio.com/api/v1/posts", {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${ZERNIO_API_KEY}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              content: caption,
              tags: finalTags,
              mediaItems: [{ type: "video", url: videoUrl }],
              platforms: [
                {
                  platform: "tiktok",
                  accountId: ZERNIO_TIKTOK_ACCOUNT_ID,
                  platformSpecificData: {
                    privacy_level: "PUBLIC_TO_EVERYONE",
                    privacyLevel: "PUBLIC_TO_EVERYONE",
                    allow_comment: true,
                    allow_duet: true,
                    allow_stitch: true,
                    disableComment: false,
                    disableDuet: false,
                    disableStitch: false,
                  },
                },
                ...(shouldPostToYouTube ? [{
                  platform: "youtube",
                  accountId: finalYtAccountId,
                  platformSpecificData: {
                    title: finalTitle,
                    description: finalDesc,
                    tags: finalTags,
                    firstComment: finalFirstComment,
                    visibility: "public",
                    categoryId: "27",
                    madeForKids: false,
                  },
                }] : []),
              ],
              publishNow: true,
            }),
          }).catch((err) => console.warn("[Zernio direct post warning]:", err.message));
        } catch (zErr: any) {
          console.warn("[Zernio direct post error]:", zErr.message);
        }
      }

      await logRef.update({
        status: "completed",
        progress: 100,
        publishId: "make_com",
        publishedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      return NextResponse.json({
        success: true,
        message: "Video published via Make.com successfully",
        jobId: logRef.id,
      });
    }


    // ==========================================
    // OPTION B: NATIVE TIKTOK API CHUNK UPLOADER
    // ==========================================
    console.log(`[TikTok Publish] Downloading video: ${videoUrl}`);
    const videoRes = await fetch(videoUrl);
    if (!videoRes.ok) {
      const errText = `Failed to download video file: ${videoRes.statusText}`;
      await logRef.update({ status: "failed", error: errText });
      return NextResponse.json({ error: errText }, { status: 400 });
    }
    const videoBuffer = Buffer.from(await videoRes.arrayBuffer());
    const fileSize = videoBuffer.length;

    const CHUNK_SIZE = 5 * 1024 * 1024; // 5MB chunks
    const totalChunks = Math.ceil(fileSize / CHUNK_SIZE);

    const accessToken = await getValidAccessToken(accountId, adminDb);

    const publishInitUrl = "https://open.tiktokapis.com/v2/post/publish/video/init/";
    const publishBody = {
      post_info: {
        title: caption,
        privacy_level: "PUBLIC_TO_EVERYONE",
        disable_comment: false,
        disable_duet: false,
        disable_stitch: false,
        video_cover_timestamp_ms: 1500, // Cover at 1.5 seconds mark (1080x1920)
      },
      source_info: {
        source: "FILE_UPLOAD",
        video_size: fileSize,
        chunk_size: totalChunks > 1 ? CHUNK_SIZE : fileSize,
        total_chunk_count: totalChunks,
      },
    };

    const publishRes = await fetch(publishInitUrl, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Content-Type": "application/json; charset=UTF-8",
      },
      body: JSON.stringify(publishBody),
    });

    const resText = await publishRes.text();
    if (!publishRes.ok) {
      console.error("[TikTok API] Video publish init failed:", resText);
      await logRef.update({ status: "failed", error: `TikTok Init failed: ${resText}` });
      return NextResponse.json({ error: `TikTok API failed: ${resText}` }, { status: publishRes.status });
    }

    const publishData = JSON.parse(resText);
    const { upload_url, publish_id } = publishData.data;

    if (!upload_url || !publish_id) {
      await logRef.update({ status: "failed", error: "TikTok response missing upload details" });
      return NextResponse.json({ error: "Missing upload details in TikTok response" }, { status: 500 });
    }

    for (let i = 0; i < totalChunks; i++) {
      const start = i * CHUNK_SIZE;
      const end = Math.min((i + 1) * CHUNK_SIZE - 1, fileSize - 1);
      const chunkBuffer = videoBuffer.slice(start, end + 1);

      const chunkStartTime = Date.now();
      const uploadChunkRes = await fetch(upload_url, {
        method: "PUT",
        headers: {
          "Content-Range": `bytes ${start}-${end}/${fileSize}`,
          "Content-Length": chunkBuffer.length.toString(),
          "Content-Type": "video/mp4",
        },
        body: chunkBuffer,
      });

      if (!uploadChunkRes.ok) {
        const err = await uploadChunkRes.text();
        console.error(`[TikTok API] Failed to upload chunk ${i+1}/${totalChunks}:`, err);
        await logRef.update({ status: "failed", error: `Failed chunk ${i+1}: ${err}` });
        return NextResponse.json({ error: `Failed to upload chunk ${i+1}/${totalChunks}: ${err}` }, { status: 400 });
      }

      const durationSec = (Date.now() - chunkStartTime) / 1000;
      const speedMbps = durationSec > 0 ? (chunkBuffer.length / (1024 * 1024)) / durationSec : 0;
      const progress = Math.round(((end + 1) / fileSize) * 100);

      await logRef.update({
        progress,
        uploadSpeed: `${speedMbps.toFixed(1)} MB/s`,
      });
    }

    await logRef.update({
      status: "completed",
      publishId: publish_id,
      publishedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return NextResponse.json({
      success: true,
      message: "Video published successfully to TikTok",
      jobId: logRef.id,
      publishId: publish_id,
    });

  } catch (error: any) {
    console.error("[TikTok Publish API Error]:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
