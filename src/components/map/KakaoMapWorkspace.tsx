"use client";

import Link from "next/link";
import {
  ArrowLeft,
  Database,
  Layers3,
  Map,
  MapPin,
  Search,
  ShieldCheck,
  TriangleAlert
} from "lucide-react";
import { FormEvent, useCallback, useEffect, useRef, useState } from "react";

type KakaoMapWorkspaceProps = {
  appKey: string;
  vworldConfigured: boolean;
};

type MapStatus = "loading" | "ready" | "error" | "missing-key";
type ParcelStatus =
  | "idle"
  | "loading"
  | "ready"
  | "zoom-in"
  | "not-configured"
  | "error";

type PolygonGeometry = {
  type: "Polygon";
  coordinates: number[][][];
};

type MultiPolygonGeometry = {
  type: "MultiPolygon";
  coordinates: number[][][][];
};

type ParcelFeatureCollection = {
  type: "FeatureCollection";
  features: Array<{
    geometry: PolygonGeometry | MultiPolygonGeometry | null;
  }>;
};

let kakaoMapsLoader: Promise<KakaoMapsNamespace> | null = null;

function loadKakaoMaps(appKey: string) {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("브라우저에서만 지도를 불러올 수 있습니다."));
  }

  if (window.kakao?.maps) {
    return new Promise<KakaoMapsNamespace>((resolve) => {
      window.kakao?.maps.load(() => resolve(window.kakao!.maps));
    });
  }

  if (kakaoMapsLoader) {
    return kakaoMapsLoader;
  }

  kakaoMapsLoader = new Promise<KakaoMapsNamespace>((resolve, reject) => {
    const scriptId = "kakao-map-sdk";
    const existingScript = document.getElementById(scriptId) as HTMLScriptElement | null;

    const handleLoad = () => {
      if (!window.kakao?.maps) {
        kakaoMapsLoader = null;
        reject(new Error("카카오 지도 SDK를 초기화하지 못했습니다."));
        return;
      }

      window.kakao.maps.load(() => resolve(window.kakao!.maps));
    };

    const handleError = () => {
      kakaoMapsLoader = null;
      reject(new Error("카카오 지도 SDK를 불러오지 못했습니다."));
    };

    if (existingScript) {
      existingScript.addEventListener("load", handleLoad, { once: true });
      existingScript.addEventListener("error", handleError, { once: true });
      return;
    }

    const script = document.createElement("script");
    script.id = scriptId;
    script.async = true;
    script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${encodeURIComponent(
      appKey
    )}&autoload=false&libraries=services`;
    script.addEventListener("load", handleLoad, { once: true });
    script.addEventListener("error", handleError, { once: true });
    document.head.appendChild(script);
  });

  return kakaoMapsLoader;
}

export function KakaoMapWorkspace({
  appKey,
  vworldConfigured
}: KakaoMapWorkspaceProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapsApiRef = useRef<KakaoMapsNamespace | null>(null);
  const mapRef = useRef<KakaoMap | null>(null);
  const markerRef = useRef<KakaoMarker | null>(null);
  const placesRef = useRef<KakaoPlaces | null>(null);
  const geocoderRef = useRef<KakaoGeocoder | null>(null);
  const parcelPolygonsRef = useRef<KakaoPolygon[]>([]);
  const parcelRequestRef = useRef<AbortController | null>(null);
  const parcelLayerEnabledRef = useRef(false);
  const refreshParcelsRef = useRef<() => void>(() => undefined);

  const [mapStatus, setMapStatus] = useState<MapStatus>(appKey ? "loading" : "missing-key");
  const [query, setQuery] = useState("");
  const [searchMessage, setSearchMessage] = useState("");
  const [selectedAddress, setSelectedAddress] = useState("지도를 클릭하거나 주소를 검색해 보세요.");
  const [selectedCoordinates, setSelectedCoordinates] = useState("");
  const [parcelLayerEnabled, setParcelLayerEnabled] = useState(false);
  const [parcelStatus, setParcelStatus] = useState<ParcelStatus>("idle");
  const [parcelCount, setParcelCount] = useState(0);

  function moveMarker(position: KakaoLatLng) {
    const maps = mapsApiRef.current;
    const map = mapRef.current;

    if (!maps || !map) {
      return;
    }

    if (markerRef.current) {
      markerRef.current.setPosition(position);
      return;
    }

    markerRef.current = new maps.Marker({ map, position });
  }

  const clearParcelPolygons = useCallback(() => {
    parcelPolygonsRef.current.forEach((polygon) => polygon.setMap(null));
    parcelPolygonsRef.current = [];
    setParcelCount(0);
  }, []);

  const refreshParcels = useCallback(async () => {
    const maps = mapsApiRef.current;
    const map = mapRef.current;

    if (!maps || !map || !parcelLayerEnabledRef.current) {
      return;
    }

    if (!vworldConfigured) {
      clearParcelPolygons();
      setParcelStatus("not-configured");
      return;
    }

    if (map.getLevel() > 5) {
      parcelRequestRef.current?.abort();
      clearParcelPolygons();
      setParcelStatus("zoom-in");
      return;
    }

    const bounds = map.getBounds();
    const southWest = bounds.getSouthWest();
    const northEast = bounds.getNorthEast();
    const bbox = [
      southWest.getLng(),
      southWest.getLat(),
      northEast.getLng(),
      northEast.getLat()
    ].join(",");

    parcelRequestRef.current?.abort();
    const controller = new AbortController();
    parcelRequestRef.current = controller;
    setParcelStatus("loading");

    try {
      const response = await fetch(`/api/vworld/parcels?bbox=${encodeURIComponent(bbox)}`, {
        signal: controller.signal
      });

      if (!response.ok) {
        throw new Error("필지 정보를 불러오지 못했습니다.");
      }

      const featureCollection = (await response.json()) as ParcelFeatureCollection;

      if (controller.signal.aborted) {
        return;
      }

      clearParcelPolygons();

      featureCollection.features.forEach((feature) => {
        if (!feature.geometry) {
          return;
        }

        const polygons =
          feature.geometry.type === "Polygon"
            ? [feature.geometry.coordinates]
            : feature.geometry.coordinates;

        polygons.forEach((polygonCoordinates) => {
          const paths = polygonCoordinates
            .map((ring) =>
              ring
                .filter(
                  (coordinate) =>
                    coordinate.length >= 2 &&
                    Number.isFinite(coordinate[0]) &&
                    Number.isFinite(coordinate[1])
                )
                .map((coordinate) => new maps.LatLng(coordinate[1], coordinate[0]))
            )
            .filter((ring) => ring.length >= 3);

          if (paths.length === 0) {
            return;
          }

          parcelPolygonsRef.current.push(
            new maps.Polygon({
              map,
              path: paths.length === 1 ? paths[0] : paths,
              strokeWeight: 2,
              strokeColor: "#d54300",
              strokeOpacity: 0.9,
              strokeStyle: "solid",
              fillColor: "#f66336",
              fillOpacity: 0.12
            })
          );
        });
      });

      setParcelCount(parcelPolygonsRef.current.length);
      setParcelStatus("ready");
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        return;
      }

      clearParcelPolygons();
      setParcelStatus("error");
    }
  }, [clearParcelPolygons, vworldConfigured]);

  useEffect(() => {
    refreshParcelsRef.current = () => {
      void refreshParcels();
    };
  }, [refreshParcels]);

  useEffect(() => {
    if (!appKey || !mapContainerRef.current) {
      return;
    }

    let disposed = false;
    let clickHandler: ((event: { latLng: KakaoLatLng }) => void) | null = null;
    let idleHandler: (() => void) | null = null;
    let idleTimer: ReturnType<typeof setTimeout> | null = null;

    loadKakaoMaps(appKey)
      .then((maps) => {
        if (disposed || !mapContainerRef.current) {
          return;
        }

        const center = new maps.LatLng(36.35, 127.8);
        const map = new maps.Map(mapContainerRef.current, {
          center,
          level: 13
        });

        mapsApiRef.current = maps;
        mapRef.current = map;
        placesRef.current = new maps.services.Places();
        geocoderRef.current = new maps.services.Geocoder();

        clickHandler = ({ latLng }) => {
          moveMarker(latLng);
          setSelectedCoordinates(
            `${latLng.getLat().toFixed(6)}, ${latLng.getLng().toFixed(6)}`
          );
          setSearchMessage("");

          geocoderRef.current?.coord2Address(
            latLng.getLng(),
            latLng.getLat(),
            (result, status) => {
              if (status !== maps.services.Status.OK || !result[0]) {
                setSelectedAddress("선택한 위치의 주소를 찾지 못했습니다.");
                return;
              }

              const address =
                result[0].road_address?.address_name ??
                result[0].address?.address_name ??
                "주소 정보 없음";
              setSelectedAddress(address);
            }
          );
        };

        maps.event.addListener(map, "click", clickHandler);
        idleHandler = () => {
          if (idleTimer) {
            clearTimeout(idleTimer);
          }

          idleTimer = setTimeout(() => refreshParcelsRef.current(), 350);
        };
        maps.event.addListener(map, "idle", idleHandler);
        setMapStatus("ready");
      })
      .catch(() => {
        if (!disposed) {
          setMapStatus("error");
        }
      });

    return () => {
      disposed = true;

      if (clickHandler && mapsApiRef.current && mapRef.current) {
        mapsApiRef.current.event.removeListener(mapRef.current, "click", clickHandler);
      }

      if (idleHandler && mapsApiRef.current && mapRef.current) {
        mapsApiRef.current.event.removeListener(mapRef.current, "idle", idleHandler);
      }

      if (idleTimer) {
        clearTimeout(idleTimer);
      }

      parcelRequestRef.current?.abort();
      parcelPolygonsRef.current.forEach((polygon) => polygon.setMap(null));
      parcelPolygonsRef.current = [];
      markerRef.current?.setMap(null);
    };
  }, [appKey]);

  function handleParcelLayerToggle() {
    const nextEnabled = !parcelLayerEnabled;
    parcelLayerEnabledRef.current = nextEnabled;
    setParcelLayerEnabled(nextEnabled);

    if (!nextEnabled) {
      parcelRequestRef.current?.abort();
      clearParcelPolygons();
      setParcelStatus("idle");
      return;
    }

    void refreshParcels();
  }

  function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedQuery = query.trim();
    const maps = mapsApiRef.current;
    const map = mapRef.current;
    const places = placesRef.current;

    if (!trimmedQuery || !maps || !map || !places) {
      return;
    }

    setSearchMessage("검색 중입니다.");

    places.keywordSearch(trimmedQuery, (result, status) => {
      if (status !== maps.services.Status.OK || !result[0]) {
        setSearchMessage("검색 결과가 없습니다. 지번 또는 도로명 주소로 다시 입력해 주세요.");
        return;
      }

      const first = result[0];
      const position = new maps.LatLng(Number(first.y), Number(first.x));
      const address = first.road_address_name || first.address_name || first.place_name;

      map.setCenter(position);
      map.setLevel(4);
      moveMarker(position);
      setSelectedAddress(address);
      setSelectedCoordinates(`${Number(first.y).toFixed(6)}, ${Number(first.x).toFixed(6)}`);
      setSearchMessage(`${first.place_name || address}(으)로 이동했습니다.`);
    });
  }

  const showMapError = mapStatus === "missing-key" || mapStatus === "error";

  const parcelStatusMessage = {
    idle: "필지 경계를 표시할 수 있습니다.",
    loading: "현재 지도 영역의 필지를 불러오는 중입니다.",
    ready:
      parcelCount > 0
        ? `필지 경계 ${parcelCount.toLocaleString("ko-KR")}개를 표시했습니다.`
        : "현재 영역에서 필지 경계를 찾지 못했습니다.",
    "zoom-in": "지도를 더 확대하면 필지 경계가 표시됩니다.",
    "not-configured": "VWorld API 키와 등록 도메인 설정이 필요합니다.",
    error: "필지 정보를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요."
  } satisfies Record<ParcelStatus, string>;

  return (
    <div className="map-page">
      <header className="map-toolbar">
        <Link aria-label="땅뷰 홈으로 돌아가기" className="map-toolbar__brand" href="/">
          <span className="brand-mark__symbol">
            <Map aria-hidden="true" size={19} />
          </span>
          <span>땅뷰</span>
        </Link>

        <form className="map-search" onSubmit={handleSearch}>
          <Search aria-hidden="true" size={19} />
          <label className="sr-only" htmlFor="map-search-input">
            주소 또는 장소 검색
          </label>
          <input
            disabled={mapStatus !== "ready"}
            id="map-search-input"
            onChange={(event) => setQuery(event.target.value)}
            placeholder="주소 또는 장소를 검색하세요"
            type="search"
            value={query}
          />
          <button disabled={mapStatus !== "ready" || !query.trim()} type="submit">
            검색
          </button>
        </form>

        <Link className="map-toolbar__back" href="/">
          <ArrowLeft aria-hidden="true" size={17} />
          소개 페이지
        </Link>
      </header>

      <main className="map-workspace">
        <aside className="map-sidebar">
          <div className="map-sidebar__heading">
            <p className="eyebrow">지도 탐색</p>
            <h1>관심 지역을 선택하세요</h1>
            <p>필지를 선택하면 토지 정보를 이 패널에서 확인할 수 있습니다.</p>
          </div>

          <section className="map-selection" aria-live="polite">
            <div className="map-selection__icon">
              <MapPin aria-hidden="true" size={20} />
            </div>
            <div>
              <span>선택 위치</span>
              <strong>{selectedAddress}</strong>
              {selectedCoordinates ? <small>{selectedCoordinates}</small> : null}
            </div>
          </section>

          {searchMessage ? (
            <p className="map-search-message" role="status">
              {searchMessage}
            </p>
          ) : null}

          <button
            aria-pressed={parcelLayerEnabled}
            className={`map-layer-preview${parcelLayerEnabled ? " map-layer-preview--active" : ""}`}
            disabled={mapStatus !== "ready"}
            onClick={handleParcelLayerToggle}
            type="button"
          >
            <div>
              <Layers3 aria-hidden="true" size={18} />
              <span>연속지적도</span>
            </div>
            <span className="map-layer-preview__status">
              {parcelLayerEnabled ? "켜짐" : "꺼짐"}
            </span>
          </button>

          <p
            className={`map-layer-message map-layer-message--${parcelStatus}`}
            role="status"
          >
            {parcelStatusMessage[parcelStatus]}
          </p>

          <div className="map-coming-soon">
            <div>
              <Database aria-hidden="true" size={17} />
              <span>실거래가</span>
            </div>
            <div>
              <ShieldCheck aria-hidden="true" size={17} />
              <span>용도지역·규제</span>
            </div>
          </div>

          <p className="map-sidebar__notice">
            현재는 기본 지도와 위치 선택 기능을 먼저 연결한 단계입니다.
          </p>
        </aside>

        <section className="map-canvas" aria-label="카카오 지도">
          <div className="map-canvas__surface" ref={mapContainerRef} />

          {mapStatus === "loading" ? (
            <div className="map-state-card" role="status">
              <span className="map-loader" />
              <strong>지도를 불러오고 있습니다</strong>
              <p>카카오 지도 SDK 연결을 확인하는 중입니다.</p>
            </div>
          ) : null}

          {showMapError ? (
            <div className="map-state-card map-state-card--error" role="alert">
              <span className="map-state-card__icon">
                <TriangleAlert aria-hidden="true" size={24} />
              </span>
              <strong>
                {mapStatus === "missing-key"
                  ? "카카오 지도 키가 필요합니다"
                  : "카카오 지도를 불러오지 못했습니다"}
              </strong>
              <p>
                {mapStatus === "missing-key"
                  ? "로컬 .env와 Vercel 환경변수에 NEXT_PUBLIC_KAKAO_MAP_APP_KEY를 설정해 주세요."
                  : "JavaScript 키와 허용 도메인 설정을 확인한 뒤 페이지를 새로고침해 주세요."}
              </p>
              <code>NEXT_PUBLIC_KAKAO_MAP_APP_KEY=...</code>
            </div>
          ) : null}

          <div className="map-source-badge">지도 © Kakao</div>
        </section>
      </main>
    </div>
  );
}
