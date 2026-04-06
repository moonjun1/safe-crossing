"use client";

import { useEffect, useRef } from "react";
import type { CrossingWithRisk } from "@/app/api/crossings/route";

interface CrossingMapProps {
  crossings: CrossingWithRisk[];
}

declare global {
  interface Window {
    kakao: {
      maps: {
        load: (cb: () => void) => void;
        Map: new (
          container: HTMLElement,
          options: { center: unknown; level: number }
        ) => unknown;
        LatLng: new (lat: number, lng: number) => unknown;
        Marker: new (options: { position: unknown; map: unknown }) => {
          setMap: (map: unknown | null) => void;
        };
        InfoWindow: new (options: {
          content: string;
          removable?: boolean;
        }) => { open: (map: unknown, marker: unknown) => void };
        event: {
          addListener: (
            target: unknown,
            type: string,
            handler: () => void
          ) => void;
        };
        services: unknown;
      };
    };
  }
}

export default function CrossingMap({ crossings }: CrossingMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const kakaoKey = process.env.NEXT_PUBLIC_KAKAO_MAP_KEY;

  useEffect(() => {
    if (!kakaoKey || !mapRef.current) return;

    const script = document.createElement("script");
    script.src = `//dapi.kakao.com/v2/maps/sdk.js?appkey=${kakaoKey}&autoload=false`;
    script.async = true;
    document.head.appendChild(script);

    script.onload = () => {
      window.kakao.maps.load(() => {
        if (!mapRef.current) return;

        const validCrossings = crossings.filter(
          (c) => c.lat !== null && c.lng !== null
        );

        const centerLat =
          validCrossings.length > 0
            ? validCrossings.reduce((sum, c) => sum + (c.lat || 0), 0) /
              validCrossings.length
            : 37.5665;
        const centerLng =
          validCrossings.length > 0
            ? validCrossings.reduce((sum, c) => sum + (c.lng || 0), 0) /
              validCrossings.length
            : 126.978;

        const map = new window.kakao.maps.Map(mapRef.current, {
          center: new window.kakao.maps.LatLng(centerLat, centerLng),
          level: 5,
        });

        validCrossings.forEach((crossing) => {
          if (crossing.lat === null || crossing.lng === null) return;

          const marker = new window.kakao.maps.Marker({
            position: new window.kakao.maps.LatLng(crossing.lat, crossing.lng),
            map,
          });

          const riskEmoji =
            crossing.risk.level === "danger"
              ? "\uD83D\uDD34"
              : crossing.risk.level === "caution"
              ? "\uD83D\uDFE1"
              : crossing.risk.level === "safe"
              ? "\uD83D\uDFE2"
              : "\u2753";

          const infoContent = `
            <div style="padding:8px;font-size:13px;min-width:180px;">
              <strong>${riskEmoji} ${crossing.name}</strong><br/>
              <span>${crossing.risk.description}</span>
            </div>
          `;

          const infoWindow = new window.kakao.maps.InfoWindow({
            content: infoContent,
            removable: true,
          });

          window.kakao.maps.event.addListener(marker, "click", () => {
            infoWindow.open(map, marker);
          });
        });
      });
    };

    return () => {
      script.remove();
    };
  }, [kakaoKey, crossings]);

  if (!kakaoKey) {
    return null;
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div ref={mapRef} className="w-full h-[400px]" />
    </div>
  );
}
