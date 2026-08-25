"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { motion } from "framer-motion";
import {
  Camera, CameraOff, CheckCircle2, Loader2,
  ShieldCheck, AlertCircle, RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

function safeNext(raw: string | null): string {
  if (!raw || !raw.startsWith("/") || raw.startsWith("//")) return "/dashboard";
  return raw;
}

type Phase = "intro" | "camera" | "checking" | "success" | "failed";

function FaceChallengeInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = safeNext(searchParams.get("next"));

  const videoRef = React.useRef<HTMLVideoElement>(null);
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const streamRef = React.useRef<MediaStream | null>(null);

  const [phase, setPhase] = React.useState<Phase>("intro");
  const [error, setError] = React.useState<string | null>(null);
  const [cameraPermission, setCameraPermission] = React.useState<"idle" | "requesting" | "granted" | "denied">("idle");
  const [attempts, setAttempts] = React.useState(0);
  const [countdown, setCountdown] = React.useState<number | null>(null);
  const [useUpload, setUseUpload] = React.useState(false); // fallback: upload selfie

  // Check if face verification is still required
  React.useEffect(() => {
    (async () => {
      const me = await fetch("/api/auth/me");
      if (me.status === 401) {
        router.replace(`/login?next=${encodeURIComponent(next)}`);
        return;
      }
      const json = await me.json();
      // Already verified — skip
      if (json.ok && !json.data?.requiresFaceVerification) {
        router.replace(next);
      }
    })();
  }, [router, next]);

  // Cleanup camera on unmount
  React.useEffect(() => {
    return () => { streamRef.current?.getTracks().forEach((t) => t.stop()); };
  }, []);

  async function startCamera() {
    setCameraPermission("requesting");
    setError(null);
    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraPermission("denied");
      setError("Camera not supported in this browser. Please use the photo upload option below.");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      streamRef.current = stream;
      setCameraPermission("granted");
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setPhase("camera");
      // Start 3-second auto-countdown
      setCountdown(3);
    } catch (err) {
      const name = err instanceof Error ? err.name : "";
      setCameraPermission("denied");
      setError(
        name === "NotAllowedError"
          ? "Camera permission denied. Please allow camera access and try again."
          : "Could not access camera. Make sure no other app is using it.",
      );
    }
  }

  // Countdown timer
  React.useEffect(() => {
    if (countdown === null) return;
    if (countdown === 0) {
      void captureAndVerify();
      return;
    }
    const t = setTimeout(() => setCountdown((c) => (c ?? 1) - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  async function captureAndVerify() {
    setCountdown(null);
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Mirror the capture to match the mirrored video display
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, 0, 0);

    // Get base64 image
    const imageBase64 = canvas.toDataURL("image/jpeg", 0.85);

    // Stop camera
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;

    setPhase("checking");

    try {
      const res = await fetch("/api/auth/face-verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageBase64, mimeType: "image/jpeg" }),
      });
      const json = await res.json();

      if (json.ok && json.data?.verified) {
        setPhase("success");
        setTimeout(() => router.replace(next), 1500);
      } else {
        setAttempts((a) => a + 1);
        setError(json.error?.message ?? "Face verification failed. Please try again.");
        setPhase("failed");
      }
    } catch {
      setAttempts((a) => a + 1);
      setError("Network error. Please check your connection and try again.");
      setPhase("failed");
    }
  }

  function retry() {
    setError(null);
    setPhase("intro");
    setCameraPermission("idle");
    setCountdown(null);
    setUseUpload(false);
  }

  async function handleSelfieUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhase("checking");
    setError(null);

    const reader = new FileReader();
    reader.onload = async () => {
      const imageBase64 = reader.result as string;
      try {
        const res = await fetch("/api/auth/face-verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ imageBase64, mimeType: file.type || "image/jpeg" }),
        });
        const json = await res.json();
        if (json.ok && json.data?.verified) {
          setPhase("success");
          setTimeout(() => router.replace(next), 1500);
        } else {
          setAttempts((a) => a + 1);
          setError(json.error?.message ?? "Face verification failed. Please try a clearer photo.");
          setPhase("failed");
        }
      } catch {
        setAttempts((a) => a + 1);
        setError("Network error. Please try again.");
        setPhase("failed");
      }
    };
    reader.readAsDataURL(file);
  }

  return (
    <div className="relative min-h-[90vh] overflow-hidden bg-gradient-to-b from-[#f0f4ff] to-white">
      <div className="container-page flex min-h-[90vh] items-center justify-center py-10">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-sm"
        >
          {/* Header */}
          <div className="mb-6 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
              <ShieldCheck className="h-7 w-7 text-primary" />
            </div>
            <p className="text-xs font-semibold uppercase tracking-widest text-primary">
              FairPrice ID
            </p>
            <h1 className="mt-1 font-display text-2xl font-bold">
              {phase === "success" ? "Verified!" : "Face Verification"}
            </h1>
            <p className="mt-1 text-sm text-foreground-muted">
              {phase === "intro" && "One quick selfie to confirm you're a real person. Protects everyone on the platform."}
              {phase === "camera" && (countdown !== null ? `Taking photo in ${countdown}…` : "Position your face in the frame")}
              {phase === "checking" && "Gemini AI is analysing your photo…"}
              {phase === "success" && "Your identity is confirmed. Redirecting…"}
              {phase === "failed" && "Verification failed. Please try again."}
            </p>
          </div>

          {/* Camera viewfinder */}
          {(phase === "camera" || phase === "checking") && (
            <div className="relative mx-auto aspect-[3/4] w-full max-w-[280px] overflow-hidden rounded-3xl border-2 border-primary/30 bg-zinc-950 shadow-xl">
              <video
                ref={videoRef}
                playsInline
                muted
                className="h-full w-full object-cover scale-x-[-1]"
              />
              {/* Face oval guide */}
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                <motion.div
                  className={cn(
                    "h-52 w-40 rounded-[50%] border-2 border-dashed",
                    phase === "checking" ? "border-primary" : "border-white/70",
                  )}
                  animate={{ opacity: [0.6, 1, 0.6] }}
                  transition={{ repeat: Infinity, duration: 2 }}
                />
              </div>
              {/* Countdown overlay */}
              {countdown !== null && countdown > 0 && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <motion.span
                    key={countdown}
                    initial={{ scale: 1.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="font-display text-7xl font-bold text-white drop-shadow-lg"
                  >
                    {countdown}
                  </motion.span>
                </div>
              )}
              {/* Checking overlay */}
              {phase === "checking" && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/60">
                  <Loader2 className="h-10 w-10 animate-spin text-white" />
                  <p className="text-sm font-medium text-white">Analysing…</p>
                </div>
              )}
              {/* Bottom hint */}
              {phase === "camera" && (
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-3 text-center text-xs text-white/90">
                  Look directly at camera · Good lighting
                </div>
              )}
            </div>
          )}

          {/* Hidden canvas for capture */}
          <canvas ref={canvasRef} className="hidden" />

          {/* Success state */}
          {phase === "success" && (
            <div className="flex flex-col items-center gap-4 py-8">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 200 }}
                className="flex h-20 w-20 items-center justify-center rounded-full bg-green-100"
              >
                <CheckCircle2 className="h-10 w-10 text-green-600" />
              </motion.div>
              <p className="font-semibold text-green-700">Identity confirmed!</p>
              <Loader2 className="h-4 w-4 animate-spin text-foreground-muted" />
            </div>
          )}

          {/* Error message */}
          {error && phase === "failed" && (
            <div className="mt-4 flex items-start gap-2 rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              {error}
            </div>
          )}

          {/* Camera denied error */}
          {cameraPermission === "denied" && phase === "intro" && (
            <div className="mt-4 space-y-3">
              <div className="flex items-start gap-2 rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
                <CameraOff className="mt-0.5 h-4 w-4 shrink-0" />
                <div>
                  <p className="font-medium">Camera permission denied</p>
                  <p className="mt-1 text-xs">
                    To fix: Click the camera icon in your browser address bar → Allow → Refresh the page.
                  </p>
                </div>
              </div>
              <p className="text-center text-sm text-foreground-muted">— or —</p>
              <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border-2 border-dashed border-primary/40 bg-primary/5 px-4 py-4 text-sm font-medium text-primary hover:bg-primary/10 transition">
                <Camera className="h-5 w-5" />
                Upload a selfie photo instead
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  capture="user"
                  className="sr-only"
                  onChange={handleSelfieUpload}
                />
              </label>
              <p className="text-center text-xs text-foreground-muted">
                Take a selfie with your phone camera app and upload it here
              </p>
            </div>
          )}

          {/* Tips */}
          {phase === "intro" && (
            <div className="mt-5 rounded-2xl border border-border bg-white p-4">
              <p className="mb-3 text-sm font-semibold">For best results:</p>
              <ul className="space-y-2 text-sm text-foreground-muted">
                {[
                  "Face the camera directly in good lighting",
                  "Remove glasses or face coverings",
                  "Hold still during the 3-second countdown",
                  "Do not hold up a phone or photo",
                ].map((tip) => (
                  <li key={tip} className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                    {tip}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Attempt counter */}
          {attempts > 0 && phase !== "success" && (
            <p className="mt-3 text-center text-xs text-foreground-muted">
              Attempt {attempts} of 3
              {attempts >= 3 ? " — contact support if you continue to have issues" : ""}
            </p>
          )}

          {/* Action buttons */}
          <div className="mt-5 space-y-3">
            {phase === "intro" && (
              <Button
                variant="lime"
                size="lg"
                className="w-full"
                onClick={startCamera}
                disabled={cameraPermission === "requesting"}
              >
                {cameraPermission === "requesting" ? (
                  <><Loader2 className="h-4 w-4 animate-spin" /> Opening camera…</>
                ) : (
                  <><Camera className="h-4 w-4" /> Start face verification</>
                )}
              </Button>
            )}

            {phase === "intro" && cameraPermission !== "denied" && (
              <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-border bg-white px-4 py-2.5 text-sm font-medium text-foreground hover:bg-secondary transition">
                <Camera className="h-4 w-4 text-foreground-muted" />
                Upload selfie instead
                <input type="file" accept="image/jpeg,image/png,image/webp" capture="user" className="sr-only" onChange={handleSelfieUpload} />
              </label>
            )}

            {phase === "camera" && countdown === null && (
              <Button variant="lime" size="lg" className="w-full" onClick={() => setCountdown(3)}>
                <Camera className="h-4 w-4" /> Take photo
              </Button>
            )}

            {phase === "failed" && attempts < 3 && (
              <Button variant="lime" size="lg" className="w-full" onClick={retry}>
                <RefreshCw className="h-4 w-4" /> Try again
              </Button>
            )}

            {phase === "failed" && (
              <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-border bg-white px-4 py-2.5 text-sm font-medium text-foreground hover:bg-secondary transition">
                <Camera className="h-4 w-4 text-foreground-muted" />
                Upload a selfie photo instead
                <input type="file" accept="image/jpeg,image/png,image/webp" capture="user" className="sr-only" onChange={handleSelfieUpload} />
              </label>
            )}

            {/* Skip option — only in dev or after 3 failures */}
            {(process.env.NODE_ENV !== "production" || attempts >= 3) && phase !== "success" && (
              <Button
                variant="ghost"
                className="w-full text-foreground-muted"
                onClick={() => router.replace(next)}
              >
                {attempts >= 3 ? "Skip and continue" : "Skip (dev mode)"}
              </Button>
            )}
          </div>

          <p className="mt-5 text-center text-xs text-foreground-muted">
            Your selfie is analysed by Gemini AI and immediately discarded — never stored.
          </p>
        </motion.div>
      </div>
    </div>
  );
}

export default function LoginFacePage() {
  return (
    <Suspense>
      <FaceChallengeInner />
    </Suspense>
  );
}
