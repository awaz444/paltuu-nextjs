"use client";
import React, { useEffect, useState, useCallback } from "react";
import { MapContainer, TileLayer, Polygon, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "@geoman-io/leaflet-geoman-free";
import "@geoman-io/leaflet-geoman-free/dist/leaflet-geoman.css";
import { Button, Space, message, Typography } from "antd";
import { RestOutlined, CheckCircleOutlined, DeleteOutlined } from "@ant-design/icons";

const { Text, Title } = Typography;

// This component handles the Geoman drawing logic
const GeomanControl = ({ onChange, onClear }: { onChange: (area: any) => void, onClear: () => void }) => {
  const map = useMap();

  useEffect(() => {
    if (!map) return;

    // Fix for Leaflet default icons in Next.js
    // @ts-ignore
    delete L.Icon.Default.prototype._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
      iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
      shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
    });

    map.pm.addControls({
      position: "topleft",
      drawMarker: false,
      drawCircleMarker: false,
      drawPolyline: false,
      drawRectangle: true,
      drawPolygon: true,
      drawCircle: false,
      editMode: true,
      dragMode: true,
      cutPolygon: false,
      removalMode: true,
    });

    // Custom wording for non-technical users
    // @ts-ignore
    map.pm.setLang('en', {
      tooltips: {
        placeMarker: 'Click to place marker',
        firstVertex: 'Click to start drawing boundary',
        continueLine: 'Click to continue drawing boundary',
        finishLine: 'Click first point to finish the boundary',
        finishPoly: 'Click first point to finish the boundary',
        finishRect: 'Click to finish the area',
      },
      buttonTitles: {
        drawPolyButton: 'Draw Custom Boundary',
        drawRectButton: 'Draw Square Boundary',
        editButton: 'Edit Boundary',
        dragButton: 'Move Boundary',
        deleteButton: 'Delete Boundary',
      }
    }, 'en');

    map.on("pm:create", (e: any) => {
      const layer = e.layer;
      const geojson = layer.toGeoJSON();
      onChange(geojson);
      
      // Auto-remove other layers - only one boundary allowed
      map.eachLayer((l: any) => {
        if (l instanceof L.Polygon && l !== layer) {
          map.removeLayer(l);
        }
      });
      message.success("New boundary defined!");
    });

    map.on("pm:remove", (e: any) => {
      onChange(null);
      message.info("Boundary removed.");
    });

    map.on("pm:update", (e: any) => {
      const geojson = e.layer.toGeoJSON();
      onChange(geojson);
    });

    return () => {
      map.pm.removeControls();
    };
  }, [map, onChange]);

  return null;
};

interface MapDrawingToolProps {
  initialArea?: any;
  onChange: (area: any) => void;
}

const MapDrawingTool: React.FC<MapDrawingToolProps> = ({ initialArea, onChange }) => {
  const [mapKey, setMapKey] = useState(0); // To force re-render on reset
  const center: [number, number] = [33.6844, 73.0479]; // Islamabad

  const handleReset = () => {
    onChange(null);
    setMapKey(prev => prev + 1);
    message.info("Redrawing boundary - click on the map to start again.");
  };

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center bg-gray-50 p-3 rounded-xl border border-gray-100">
        <Text className="text-xs font-semibold uppercase tracking-wider text-gray-500">Service Area Controls</Text>
        <Space>
           <Button 
             danger 
             size="small" 
             icon={<RestOutlined />} 
             onClick={handleReset}
             className="text-[11px] font-bold h-9 px-4 rounded-lg flex items-center"
           >
             RESET / REDO
           </Button>
        </Space>
      </div>

      <div className="h-[450px] w-full rounded-[2rem] overflow-hidden border-4 border-white shadow-2xl relative z-10 group">
        <MapContainer
          key={mapKey}
          center={center}
          zoom={12}
          scrollWheelZoom={true}
          style={{ height: "100%", width: "100%" }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {initialArea && initialArea.geometry && (
            <Polygon 
              positions={initialArea.geometry.coordinates[0].map((coord: any) => [coord[1], coord[0]])} 
              color="#a03048"
              fillColor="#a03048"
              fillOpacity={0.2}
            />
          )}
          <GeomanControl onChange={onChange} onClear={handleReset} />
        </MapContainer>
        
        {/* Quick Instructions Overlay */}
        <div className="absolute bottom-4 left-4 z-[1000] bg-white/90 backdrop-blur-md p-3 rounded-2xl shadow-xl border border-gray-100 max-w-[240px] pointer-events-none group-hover:opacity-100 opacity-60 transition-opacity">
           <Title level={5} className="!mb-1 !text-xs !text-[#a03048]"><CheckCircleOutlined className="mr-1" /> Drawing Guide</Title>
           <Text className="text-[10px] text-gray-600 leading-tight block">
              1. Click the **Polygon** icon on the top left.<br/>
              2. Click on the map to place corners.<br/>
              3. Click the first point again to finish.<br/>
              4. Drag corners to fine-tune your area.
           </Text>
        </div>
      </div>
    </div>
  );
};

export default MapDrawingTool;
