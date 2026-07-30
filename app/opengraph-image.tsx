import { ImageResponse } from "next/og";

export const alt = "땅뷰 - 토지 정보를 지도에서 한눈에";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          alignItems: "center",
          background:
            "linear-gradient(135deg, #fff7ed 0%, #ffedd5 58%, #fed7aa 100%)",
          color: "#292524",
          display: "flex",
          height: "100%",
          justifyContent: "space-between",
          padding: "82px 92px",
          width: "100%",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", width: 735 }}>
          <div
            style={{
              alignItems: "center",
              color: "#c2410c",
              display: "flex",
              fontSize: 28,
              fontWeight: 700,
              letterSpacing: 3,
            }}
          >
            LANDVIEW
          </div>
          <div
            style={{
              display: "flex",
              fontSize: 76,
              fontWeight: 800,
              letterSpacing: -4,
              lineHeight: 1.18,
              marginTop: 24,
            }}
          >
            토지 정보를
            <br />
            지도에서 한눈에
          </div>
          <div
            style={{
              color: "#57534e",
              display: "flex",
              fontSize: 29,
              marginTop: 30,
            }}
          >
            필지 경계 · 토지대장 면적 · 공공데이터
          </div>
        </div>
        <div
          style={{
            alignItems: "center",
            background: "#c2410c",
            borderRadius: 72,
            boxShadow: "0 28px 70px rgba(124, 45, 18, 0.22)",
            color: "white",
            display: "flex",
            fontSize: 92,
            fontWeight: 800,
            height: 280,
            justifyContent: "center",
            width: 280,
          }}
        >
          땅뷰
        </div>
      </div>
    ),
    size,
  );
}
