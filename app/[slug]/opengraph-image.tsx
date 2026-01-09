import { ImageResponse } from "next/og";

// Image metadata
export const alt = "PPR Academy Storefront";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

// Image generation
export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return new ImageResponse(
    (
      <div
        style={{
          background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "80px",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            background: "rgba(255, 255, 255, 0.1)",
            backdropFilter: "blur(10px)",
            padding: "60px",
            borderRadius: "24px",
            border: "2px solid rgba(255, 255, 255, 0.2)",
          }}
        >
          <div
            style={{
              fontSize: 72,
              fontWeight: "bold",
              color: "white",
              textAlign: "center",
              marginBottom: "20px",
              textTransform: "capitalize",
            }}
          >
            {slug.replace(/-/g, " ")}
          </div>
          <div
            style={{
              fontSize: 32,
              color: "rgba(255, 255, 255, 0.9)",
              textAlign: "center",
              marginBottom: "40px",
            }}
          >
            Creator Storefront
          </div>
          <div
            style={{
              fontSize: 28,
              fontWeight: "600",
              color: "white",
              background: "rgba(255, 255, 255, 0.2)",
              padding: "16px 32px",
              borderRadius: "12px",
            }}
          >
            PPR Academy
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}

