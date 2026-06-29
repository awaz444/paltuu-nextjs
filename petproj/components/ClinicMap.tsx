"use client";

import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Tooltip, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Clinic } from "../app/types/clinic";

// Custom pin icon using the brand colour #a03048
const createPinIcon = () =>
    L.divIcon({
        className: "",
        html: `
      <svg xmlns="http://www.w3.org/2000/svg" width="28" height="36" viewBox="0 0 28 36">
        <path d="M14 0C6.268 0 0 6.268 0 14c0 9.333 14 22 14 22S28 23.333 28 14C28 6.268 21.732 0 14 0z"
              fill="#a03048"/>
        <circle cx="14" cy="14" r="6" fill="white"/>
      </svg>`,
        iconSize: [28, 36],
        iconAnchor: [14, 36],
        tooltipAnchor: [0, -36],
    });

// Re-centre map when userCoords or clinics change
function MapController({ userCoords }: { userCoords: { lat: number; lng: number } | null }) {
    const map = useMap();
    useEffect(() => {
        if (userCoords) {
            map.setView([userCoords.lat, userCoords.lng], 11, { animate: true });
        }
    }, [userCoords, map]);
    return null;
}

interface ClinicMapProps {
    clinics: Clinic[];
    userCoords: { lat: number; lng: number } | null;
}

export default function ClinicMap({ clinics, userCoords }: ClinicMapProps) {
    const pinIcon = createPinIcon();
    const clinicsWithCoords = clinics.filter((c) => c.latitude != null && c.longitude != null);

    // Pakistan centre as default
    const defaultCenter: [number, number] = [30.3753, 69.3451];
    const defaultZoom = 5;

    return (
        <MapContainer
            center={defaultCenter}
            zoom={defaultZoom}
            style={{ height: "350px", width: "100%" }}
            scrollWheelZoom={false}
        >
            <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            <MapController userCoords={userCoords} />

            {clinicsWithCoords.map((clinic) => (
                <Marker
                    key={clinic.clinic_id}
                    position={[clinic.latitude!, clinic.longitude!]}
                    icon={pinIcon}
                >
                    <Tooltip direction="top" offset={[0, -36]} opacity={1}>
                        <span className="text-sm font-semibold">{clinic.name}</span>
                        {clinic.city && (
                            <span className="block text-xs text-gray-500">{clinic.city}</span>
                        )}
                    </Tooltip>
                </Marker>
            ))}
        </MapContainer>
    );
}
