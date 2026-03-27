import { useState, useEffect, useRef } from "react";
import { MapContainer, TileLayer, WMSTileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { translations } from "./i18n";
import "./App.css";

// Fix leaflet default icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

const rentalIcon = L.divIcon({
  className: "",
  html: `<div style="
    width:32px;height:32px;background:#22c55e;border-radius:50% 50% 50% 0;
    transform:rotate(-45deg);border:3px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,0.3);
    display:flex;align-items:center;justify-content:center;">
    <span style="transform:rotate(45deg);font-size:14px;">🚲</span>
  </div>`,
  iconSize: [32, 32],
  iconAnchor: [16, 32],
});

function LocationButton({ t }) {
  const map = useMap();
  const [loading, setLoading] = useState(false);

  const handleLocate = () => {
    setLoading(true);
    map.locate({ setView: true, maxZoom: 15 });
    map.once("locationfound", () => setLoading(false));
    map.once("locationerror", () => setLoading(false));
  };

  return (
    <button className="locate-btn" onClick={handleLocate} title={t.locateMe}>
      {loading ? "⏳" : "📍"}
    </button>
  );
}

function LayerControl({ layers, setLayers, t }) {
  return (
    <div className="layer-panel">
      <div className="layer-title">{t.layers}</div>
      <label className="layer-item">
        <input
          type="checkbox"
          checked={layers.airPump}
          onChange={(e) => setLayers((l) => ({ ...l, airPump: e.target.checked }))}
        />
        <span className="layer-dot" style={{ background: "#3b82f6" }} />
        {t.airPump}
      </label>
      <label className="layer-item">
        <input
          type="checkbox"
          checked={layers.rental}
          onChange={(e) => setLayers((l) => ({ ...l, rental: e.target.checked }))}
        />
        <span className="layer-dot" style={{ background: "#22c55e" }} />
        {t.rentalStation}
      </label>
    </div>
  );
}

export default function App() {
  const [lang, setLang] = useState("ko");
  const t = translations[lang];
  const [layers, setLayers] = useState({ airPump: true, rental: true });
  const [rentalStations, setRentalStations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [apiKey, setApiKey] = useState("");
  const [showApiInput, setShowApiInput] = useState(false);

  // Load API key from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("bike_api_key");
    if (saved) setApiKey(saved);
    else setShowApiInput(true);
  }, []);

  const fetchRentalStations = async (key) => {
    if (!key) return;
    setLoading(true);
    setError(null);
    try {
      const url = `/api/proxy?serviceKey=${encodeURIComponent(key)}&pageNo=1&numOfRows=100&type=xml`;
      const res = await fetch(url);
      const text = await res.text();
      const parser = new DOMParser();
      const xml = parser.parseFromString(text, "text/xml");
      const items = xml.querySelectorAll("item");
      const stations = Array.from(items)
        .filter((item) => item.querySelector("위도") && item.querySelector("경도"))
        .map((item) => ({
          id: item.querySelector("관리번호")?.textContent || Math.random(),
          name: item.querySelector("대여소명")?.textContent || item.querySelector("시설명")?.textContent || t.rentalStation,
          addr: item.querySelector("소재지도로명주소")?.textContent || item.querySelector("소재지지번주소")?.textContent || "",
          lat: parseFloat(item.querySelector("위도")?.textContent),
          lng: parseFloat(item.querySelector("경도")?.textContent),
          tel: item.querySelector("전화번호")?.textContent || "",
        }));
      setRentalStations(stations);
    } catch (e) {
      setError(t.fetchError);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveKey = (key) => {
    localStorage.setItem("bike_api_key", key);
    setApiKey(key);
    setShowApiInput(false);
    fetchRentalStations(key);
  };

  useEffect(() => {
    if (apiKey) fetchRentalStations(apiKey);
  }, [apiKey]);

  return (
    <div className="app">
      {/* Header */}
      <header className="header">
        <div className="header-left">
          <span className="logo">🚴</span>
          <div>
            <h1 className="title">{t.title}</h1>
            <p className="subtitle">{t.subtitle}</p>
          </div>
        </div>
        <div className="header-right">
          <button className="api-btn" onClick={() => setShowApiInput((v) => !v)}>
            🔑 API
          </button>
          <div className="lang-toggle">
            <button
              className={lang === "ko" ? "active" : ""}
              onClick={() => setLang("ko")}
            >KO</button>
            <button
              className={lang === "en" ? "active" : ""}
              onClick={() => setLang("en")}
            >EN</button>
          </div>
        </div>
      </header>

      {/* API Key Input */}
      {showApiInput && (
        <ApiKeyModal t={t} onSave={handleSaveKey} onClose={() => setShowApiInput(false)} initialKey={apiKey} />
      )}

      {/* Status bar */}
      {(loading || error) && (
        <div className={`status-bar ${error ? "error" : ""}`}>
          {loading ? `⏳ ${t.loading}` : `⚠️ ${error}`}
        </div>
      )}

      {/* Map */}
      <div className="map-wrap">
        <MapContainer
          center={[36.5, 127.5]}
          zoom={7}
          className="map"
          zoomControl={false}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {/* 생활안전지도 WMS - 공기주입기 레이어 */}
          {/* {layers.airPump && (
            <WMSTileLayer
              url="https://www.safemap.go.kr/openApiService/wms/getLayerData.do"
              layers="A2SM_BIKE"
              format="image/png"
              transparent={true}
              version="1.1.1"
              opacity={0.85}
              attribution="생활안전지도"
              params={{
                TILED: true,
                SRS: "EPSG:4326",
              }}
            />
          )} */}

          {/* 자전거 대여소 마커 */}
          {layers.rental &&
            rentalStations.map((s) => (
              <Marker key={s.id} position={[s.lat, s.lng]} icon={rentalIcon}>
                <Popup>
                  <div className="popup">
                    <strong>🚲 {s.name}</strong>
                    {s.addr && <p>📍 {s.addr}</p>}
                    {s.tel && <p>📞 {s.tel}</p>}
                  </div>
                </Popup>
              </Marker>
            ))}

          <LocationButton t={t} />
        </MapContainer>

        {/* Layer Control */}
        <LayerControl layers={layers} setLayers={setLayers} t={t} />

        {/* Legend */}
        <div className="legend">
          <div className="legend-title">{t.legend}</div>
          <div className="legend-item">
            <span className="legend-line" style={{ background: "#3b82f6" }} />
            {t.airPumpLegend}
          </div>
          <div className="legend-item">
            <span className="legend-dot" style={{ background: "#22c55e" }} />
            {t.rentalLegend}
          </div>
        </div>
      </div>
    </div>
  );
}

function ApiKeyModal({ t, onSave, onClose, initialKey }) {
  const [key, setKey] = useState(initialKey || "");
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h3>🔑 {t.apiKeyTitle}</h3>
        <p>{t.apiKeyDesc}</p>
        <a href="https://www.data.go.kr" target="_blank" rel="noreferrer">
          data.go.kr →
        </a>
        <input
          type="text"
          placeholder={t.apiKeyPlaceholder}
          value={key}
          onChange={(e) => setKey(e.target.value)}
        />
        <div className="modal-btns">
          <button onClick={onClose}>{t.cancel}</button>
          <button className="primary" onClick={() => onSave(key)}>
            {t.save}
          </button>
        </div>
      </div>
    </div>
  );
}
