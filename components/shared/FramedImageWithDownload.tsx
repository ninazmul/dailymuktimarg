"use client";

import * as React from "react";
import NextImage from "next/image";
import { Download } from "lucide-react";

interface FramedImageWithDownloadProps {
  featuredImage: string;
  title: string;
  imageCaption?: string;
  slug?: string;
}

const PRIMARY = "#226B3A";

function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function drawCornerAccent(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  corner: "tl" | "tr" | "bl" | "br",
) {
  ctx.save();
  ctx.strokeStyle = "rgba(255,255,255,0.40)";
  ctx.lineWidth = Math.max(2, size * 0.12);
  ctx.lineCap = "round";
  const o = size * 0.1;

  let hx1 = x,
    hy1 = y,
    hx2 = x,
    hy2 = y;
  let vx1 = x,
    vy1 = y,
    vx2 = x,
    vy2 = y;

  switch (corner) {
    case "tl":
      hx1 = x + o;
      hy1 = y;
      hx2 = x + size;
      hy2 = y;
      vx1 = x;
      vy1 = y + o;
      vx2 = x;
      vy2 = y + size;
      break;
    case "tr":
      hx1 = x - size + o;
      hy1 = y;
      hx2 = x;
      hy2 = y;
      vx1 = x;
      vy1 = y + o;
      vx2 = x;
      vy2 = y + size;
      break;
    case "bl":
      hx1 = x + o;
      hy1 = y;
      hx2 = x + size;
      hy2 = y;
      vx1 = x;
      vy1 = y - size + o;
      vx2 = x;
      vy2 = y;
      break;
    case "br":
      hx1 = x - size + o;
      hy1 = y;
      hx2 = x;
      hy2 = y;
      vx1 = x;
      vy1 = y - size + o;
      vx2 = x;
      vy2 = y;
      break;
  }
  ctx.beginPath();
  ctx.moveTo(hx1, hy1);
  ctx.lineTo(hx2, hy2);
  ctx.moveTo(vx1, vy1);
  ctx.lineTo(vx2, vy2);
  ctx.stroke();
  ctx.restore();
}

export default function FramedImageWithDownload({
  featuredImage,
  title,
  imageCaption,
  slug = "news",
}: FramedImageWithDownloadProps) {
  const [isGenerating, setIsGenerating] = React.useState(false);
  const frameRef = React.useRef<HTMLDivElement | null>(null);

  const handleContextMenu = React.useCallback((e: React.MouseEvent) => {
    e.preventDefault();
  }, []);

  const loadImage = React.useCallback(
    (src: string): Promise<HTMLImageElement> =>
      new Promise((resolve, reject) => {
        const ImgCtor = (typeof window !== "undefined"
          ? window.Image
          : Image) as unknown as new () => HTMLImageElement;
        const img = new ImgCtor();
        img.crossOrigin = "anonymous";
        img.onload = () => resolve(img);
        img.onerror = () => {
          const retry = new ImgCtor();
          retry.onload = () => resolve(retry);
          retry.onerror = reject;
          retry.src = src;
        };
        img.src = src;
      }),
    [],
  );

  const generateFramedCanvas = React.useCallback(async (): Promise<Blob> => {
    const baseW = 1920;
    const aspectW = 16,
      aspectH = 9;
    const paddingX = Math.round(baseW * 0.01);
    const paddingTop = paddingX;
    const paddingBottomBeforeBand = paddingX;
    const bandH = Math.round(baseW * 0.062);
    const totalImgAreaW = baseW - paddingX * 2;
    const totalImgAreaH = (totalImgAreaW * aspectH) / aspectW;
    const baseH = paddingTop + totalImgAreaH + paddingBottomBeforeBand + bandH;

    const canvas = document.createElement("canvas");
    canvas.width = baseW;
    canvas.height = Math.round(baseH);
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas context unavailable");

    const radiusOuter = Math.round(baseW * 0.022);
    drawRoundedRect(ctx, 0, 0, baseW, baseH, radiusOuter);
    ctx.fillStyle = PRIMARY;
    ctx.fill();

    const imgX = paddingX;
    const imgY = paddingTop;
    const imgW = totalImgAreaW;
    const imgH = totalImgAreaH;
    const imgRadius = Math.round(baseW * 0.014);

    ctx.save();
    drawRoundedRect(ctx, imgX, imgY, imgW, imgH, imgRadius);
    ctx.clip();

    const [photo, logoImg] = await Promise.all([
      loadImage(featuredImage),
      loadImage("/assets/images/logo.webp").catch(() => null as any),
    ]);

    const iw = photo.naturalWidth || photo.width || 1;
    const ih = photo.naturalHeight || photo.height || 1;
    const scale = Math.max(imgW / iw, imgH / ih);
    const dw = iw * scale;
    const dh = ih * scale;
    const dx = imgX + (imgW - dw) / 2;
    const dy = imgY + (imgH - dh) / 2;
    ctx.drawImage(photo, dx, dy, dw, dh);
    ctx.restore();

    const cornerSize = Math.round(baseW * 0.03);
    drawCornerAccent(ctx, imgX + 2, imgY + 2, cornerSize, "tl");
    drawCornerAccent(ctx, imgX + imgW - 2, imgY + 2, cornerSize, "tr");
    drawCornerAccent(ctx, imgX + 2, imgY + imgH - 2, cornerSize, "bl");
    drawCornerAccent(ctx, imgX + imgW - 2, imgY + imgH - 2, cornerSize, "br");

    const bandY = baseH - bandH;
    const lineY = bandY + bandH / 2;
    const lineColor = "rgba(255,255,255,0.40)";
    const lineThickness = Math.max(1, Math.round(baseW * 0.001));

    if (logoImg) {
      const logoMaxH = bandH * 0.58;
      const lW = logoImg.naturalWidth || logoImg.width || 1;
      const lH = logoImg.naturalHeight || logoImg.height || 1;
      const logoScale = Math.min(logoMaxH / lH, (baseW * 0.28) / lW);
      const logoDrawW = lW * logoScale;
      const logoDrawH = lH * logoScale;
      const badgePaddingX = logoDrawW * 0.5;
      const badgePaddingY = logoDrawH * 0.22;
      const badgeW = logoDrawW + badgePaddingX * 2;
      const badgeH = logoDrawH + badgePaddingY * 2;
      const badgeR = badgeH / 2;
      const badgeX = baseW / 2 - badgeW / 2;
      const badgeY = bandY + (bandH - badgeH) / 2;

      const lineStartX = paddingX + Math.round(baseW * 0.02);
      const lineEndX = baseW - paddingX - Math.round(baseW * 0.02);
      ctx.strokeStyle = lineColor;
      ctx.lineWidth = lineThickness;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(lineStartX, lineY);
      ctx.lineTo(badgeX - Math.round(baseW * 0.015), lineY);
      ctx.moveTo(badgeX + badgeW + Math.round(baseW * 0.015), lineY);
      ctx.lineTo(lineEndX, lineY);
      ctx.stroke();

      drawRoundedRect(ctx, badgeX, badgeY, badgeW, badgeH, badgeR);
      ctx.fillStyle = "#FFFFFF";
      ctx.fill();
      ctx.save();
      ctx.strokeStyle = "rgba(34,107,58,0.20)";
      ctx.lineWidth = Math.max(1, Math.round(baseW * 0.0012));
      drawRoundedRect(ctx, badgeX, badgeY, badgeW, badgeH, badgeR);
      ctx.stroke();
      ctx.restore();

      ctx.save();
      ctx.shadowColor = "rgba(0,0,0,0.16)";
      ctx.shadowBlur = Math.round(baseW * 0.006);
      ctx.shadowOffsetY = Math.round(baseW * 0.0012);
      drawRoundedRect(ctx, badgeX, badgeY, badgeW, badgeH, badgeR);
      ctx.fillStyle = "#FFFFFF";
      ctx.fill();
      ctx.restore();
      ctx.drawImage(
        logoImg,
        badgeX + badgePaddingX,
        badgeY + badgePaddingY,
        logoDrawW,
        logoDrawH,
      );
    } else {
      ctx.strokeStyle = lineColor;
      ctx.lineWidth = lineThickness;
      ctx.beginPath();
      ctx.moveTo(paddingX + 20, lineY);
      ctx.lineTo(baseW - paddingX - 20, lineY);
      ctx.stroke();

      ctx.font = `bold ${Math.round(bandH * 0.42)}px serif`;
      ctx.fillStyle = "#FFFFFF";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("Daily Muktimarg", baseW / 2, bandY + bandH / 2);
    }

    const blob: Blob = await new Promise((resolve, reject) => {
      canvas.toBlob(
        (b) => {
          if (b) resolve(b);
          else reject(new Error("Blob conversion failed"));
        },
        "image/png",
        1.0,
      );
    });
    return blob;
  }, [featuredImage, loadImage]);

  const handleDownload = React.useCallback(async () => {
    if (isGenerating) return;
    setIsGenerating(true);
    try {
      const blob = await generateFramedCanvas();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const safeTitle =
        slug && slug.length > 3
          ? slug.replace(/[^a-zA-Z0-9-_]+/g, "-").slice(0, 80)
          : title.replace(/[^a-zA-Z0-9-_]+/g, "-").slice(0, 80) ||
            "dailymuktimarg-image";
      a.download = `${safeTitle}-dailymuktimarg.png`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 2000);
    } catch (err) {
      console.error("Download failed:", err);
      alert("ছবি ডাউনলোড করতে ব্যর্থ হয়েছে। আবার চেষ্টা করুন।");
    } finally {
      setIsGenerating(false);
    }
  }, [generateFramedCanvas, isGenerating, slug, title]);

  return (
    <figure className="mb-10" ref={frameRef}>
      <div
        className="relative rounded-2xl bg-primary overflow-hidden"
        style={{
          boxShadow:
            "0 4px 24px rgba(34,107,58,0.22), 0 1.5px 6px rgba(0,0,0,0.10)",
        }}
        onContextMenu={handleContextMenu}
      >
        <button
          type="button"
          onClick={handleDownload}
          disabled={isGenerating}
          className="absolute top-3 right-3 md:top-5 md:right-5 z-20 group bg-white/95 hover:bg-white text-primary shadow-lg border border-white/40 backdrop-blur-sm px-3 md:px-4 py-2 md:py-2.5 rounded-full flex items-center gap-1.5 md:gap-2 text-xs md:text-sm font-bold transition hover:scale-[1.03] disabled:opacity-60 disabled:cursor-not-allowed"
          title="ফ্রেমসহ ছবি ডাউনলোড করুন"
        >
          <Download className="w-3.5 h-3.5 md:w-4 md:h-4" />
          <span className="whitespace-nowrap">
            {isGenerating ? "প্রস্তুত হচ্ছে..." : "ডাউনলোড"}
          </span>
        </button>

        <div className="p-[4px] md:p-[10px] pb-[4px] md:pb-[10px]">
          <div className="relative">
            <span className="absolute top-0 left-0 w-5 h-5 md:w-7 md:h-7 border-t-2 border-l-2 md:border-t-[3px] md:border-l-[3px] border-white/40 rounded-tl-lg pointer-events-none z-10" />
            <span className="absolute top-0 right-0 w-5 h-5 md:w-7 md:h-7 border-t-2 border-r-2 md:border-t-[3px] md:border-r-[3px] border-white/40 rounded-tr-lg pointer-events-none z-10" />
            <span className="absolute bottom-0 left-0 w-5 h-5 md:w-7 md:h-7 border-b-2 border-l-2 md:border-b-[3px] md:border-l-[3px] border-white/40 rounded-bl-lg pointer-events-none z-10" />
            <span className="absolute bottom-0 right-0 w-5 h-5 md:w-7 md:h-7 border-b-2 border-r-2 md:border-b-[3px] md:border-r-[3px] border-white/40 rounded-br-lg pointer-events-none z-10" />

            <div className="relative aspect-video rounded-xl overflow-hidden select-none">
              <NextImage
                src={featuredImage}
                alt={title}
                fill
                className="object-cover pointer-events-none select-none"
                draggable={false}
                onContextMenu={handleContextMenu}
                priority
              />
            </div>
          </div>
        </div>

        <div className="flex items-center gap-0 px-3 md:px-6 py-2 md:py-3 select-none">
          <div className="flex-1 h-[1.5px] md:h-[2px] bg-white/40 rounded-full" />
          <div className="mx-3 md:mx-5 flex items-center gap-2 bg-white px-4 md:px-6 py-1.5 md:py-2 rounded-full shadow-lg border-2 border-primary/20 shrink-0">
            <NextImage
              src="/assets/images/logo.webp"
              alt="Daily Muktimarg"
              width={120}
              height={36}
              className="h-5 md:h-7 w-auto object-contain pointer-events-none select-none"
              draggable={false}
              onContextMenu={handleContextMenu}
            />
          </div>
          <div className="flex-1 h-[1.5px] md:h-[2px] bg-white/40 rounded-full" />
        </div>
      </div>

      {imageCaption && (
        <figcaption className="text-xs text-gray-500 italic mt-2 text-center bg-gray-50 py-1.5 px-3 rounded-md border border-gray-100">
          📷 {imageCaption}
        </figcaption>
      )}
    </figure>
  );
}
