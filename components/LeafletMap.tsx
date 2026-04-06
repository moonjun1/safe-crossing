"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { CrossingWithRisk } from "@/app/api/crossings/route";
import type { RiskLevel } from "@/lib/risk-calculator";

interface LeafletMapProps {
  crossings: CrossingWithRisk[];
}

function getMarkerColor(level: RiskLevel): string {
  switch (level) {
    case "danger":
      return "#ef4444"; // red
    case "caution":
      return "#eab308"; // yellow
    case "safe":
      return "#22c55e"; // green
    case "unknown":
      return "#9ca3af"; // gray
  }
}

function createCircleIcon(color: string) {
  return L.divIcon({
    className: "",
    html: `<div style="
      width: 16px; height: 16px;
      background: ${color};
      border: 2px solid white;
      border-radius: 50%;
      box-shadow: 0 1px 4px rgba(0,0,0,0.3);
    "></div>`,
    iconSize: [16, 16],
    iconAnchor: [8, 8],
    popupAnchor: [0, -10],
  });
}

export default function LeafletMap({ crossings }: LeafletMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!mapRef.current) return;

    // 기존 맵 제거
    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    if (crossings.length === 0) return;

    const centerLat =
      crossings.reduce((sum, c) => sum + (c.lat || 0), 0) / crossings.length;
    const centerLng =
      crossings.reduce((sum, c) => sum + (c.lng || 0), 0) / crossings.length;

    const map = L.map(mapRef.current).setView([centerLat, centerLng], 13);
    mapInstanceRef.current = map;

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "&copy; OpenStreetMap contributors",
      maxZoom: 19,
    }).addTo(map);

    const markers: L.Marker[] = [];

    crossings.forEach((crossing) => {
      if (crossing.lat === null || crossing.lng === null) return;

      const color = getMarkerColor(crossing.risk.level);
      const icon = createCircleIcon(color);

      const marker = L.marker([crossing.lat, crossing.lng], { icon }).addTo(map);

      const laneInfo = crossing.laneWidth
        ? `${crossing.laneWidth}m`
        : "기본값 15m";
      const timeInfo = crossing.risk.crossingTime
        ? `${crossing.risk.crossingTime}초`
        : "-";
      const signalInfo = crossing.risk.signalTime
        ? `${crossing.risk.signalTime}초`
        : "데이터 없음";

      marker.bindPopup(`
        <div style="font-size:13px; min-width:180px; line-height:1.5;">
          <strong>${crossing.name}</strong><br/>
          <span style="color:${color}; font-weight:600;">${crossing.risk.label}</span><br/>
          <span style="font-size:11px; color:#666;">
            차로폭: ${laneInfo}<br/>
            횡단시간: ${timeInfo}<br/>
            보행신호: ${signalInfo}
          </span>
        </div>
      `);

      markers.push(marker);
    });

    // 모든 마커가 보이도록 bounds 조정
    if (markers.length > 1) {
      const group = L.featureGroup(markers);
      map.fitBounds(group.getBounds().pad(0.1));
    }

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, [crossings]);

  return <div ref={mapRef} className="w-full h-[400px]" />;
}
