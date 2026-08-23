export {};

declare global {
  interface KakaoLatLng {
    getLat(): number;
    getLng(): number;
  }

  interface KakaoMap {
    getBounds(): KakaoBounds;
    getLevel(): number;
    setCenter(position: KakaoLatLng): void;
    setLevel(level: number): void;
  }

  interface KakaoBounds {
    getNorthEast(): KakaoLatLng;
    getSouthWest(): KakaoLatLng;
  }

  interface KakaoMarker {
    setMap(map: KakaoMap | null): void;
    setPosition(position: KakaoLatLng): void;
  }

  interface KakaoCustomOverlay {
    getContent(): HTMLElement | string;
    setMap(map: KakaoMap | null): void;
    setPosition(position: KakaoLatLng): void;
    setZIndex(zIndex: number): void;
  }

  interface KakaoPolygon {
    setMap(map: KakaoMap | null): void;
    setOptions(options: {
      fillColor?: string;
      fillOpacity?: number;
      strokeColor?: string;
      strokeOpacity?: number;
      strokeWeight?: number;
    }): void;
  }

  interface KakaoPlace {
    address_name: string;
    place_name: string;
    road_address_name: string;
    x: string;
    y: string;
  }

  interface KakaoAddressResult {
    address?: {
      address_name: string;
    };
    road_address?: {
      address_name: string;
    } | null;
  }

  interface KakaoPlaces {
    keywordSearch(
      query: string,
      callback: (result: KakaoPlace[], status: string) => void
    ): void;
  }

  interface KakaoGeocoder {
    coord2Address(
      longitude: number,
      latitude: number,
      callback: (result: KakaoAddressResult[], status: string) => void
    ): void;
  }

  interface KakaoMapsNamespace {
    load(callback: () => void): void;
    LatLng: new (latitude: number, longitude: number) => KakaoLatLng;
    Map: new (
      container: HTMLElement,
      options: {
        center: KakaoLatLng;
        level: number;
      }
    ) => KakaoMap;
    Marker: new (options: {
      map: KakaoMap;
      position: KakaoLatLng;
    }) => KakaoMarker;
    CustomOverlay: new (options: {
      clickable?: boolean;
      content: HTMLElement | string;
      map: KakaoMap;
      position: KakaoLatLng;
      xAnchor?: number;
      yAnchor?: number;
      zIndex?: number;
    }) => KakaoCustomOverlay;
    Polygon: new (options: {
      map: KakaoMap;
      path: KakaoLatLng[] | KakaoLatLng[][];
      fillColor: string;
      fillOpacity: number;
      strokeColor: string;
      strokeOpacity: number;
      strokeStyle: "solid";
      strokeWeight: number;
    }) => KakaoPolygon;
    event: {
      preventMap(): void;
      addListener(
        target: KakaoMap | KakaoMarker | KakaoPolygon,
        type: "click" | "idle",
        handler: ((event: { latLng: KakaoLatLng }) => void) | (() => void)
      ): void;
      removeListener(
        target: KakaoMap | KakaoMarker | KakaoPolygon,
        type: "click" | "idle",
        handler: ((event: { latLng: KakaoLatLng }) => void) | (() => void)
      ): void;
    };
    services: {
      Status: {
        OK: string;
      };
      Places: new () => KakaoPlaces;
      Geocoder: new () => KakaoGeocoder;
    };
  }

  interface Window {
    kakao?: {
      maps: KakaoMapsNamespace;
    };
  }
}
