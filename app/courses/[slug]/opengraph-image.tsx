import { ImageResponse } from "next/og";

// Image metadata
export const alt = "PPR Academy Course";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

// Image generation
export default async function Image({ params }: { params: { slug: string } }) {
  // You can fetch course data here if needed
  // For now, we'll use the slug to generate a generic image
  
  return new ImageResponse(
    (
      <div
        style={{
          background: "linear-gradient(to bottom right, #6366f1, #8b5cf6)",
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
            {params.slug.replace(/-/g, " ")}
          </div>
          <div
            style={{
              fontSize: 32,
              color: "rgba(255, 255, 255, 0.9)",
              textAlign: "center",
              marginBottom: "40px",
            }}
          >
            Music Production Course
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

