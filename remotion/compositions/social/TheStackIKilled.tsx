import React from "react";
import { AbsoluteFill, Sequence, useCurrentFrame, interpolate, spring, useVideoConfig } from "remotion";
import { C, F } from "../../theme";
import { CenterScene } from "../../components/Layout";
import { GradientText } from "../../components/Typography";

const tools = [
  { name: "Kajabi", cost: "$149", color: "#0072EF" },
  { name: "Mailchimp", cost: "$50", color: "#FFE01B" },
  { name: "Buffer", cost: "$25", color: "#2C4BFF" },
  { name: "ManyChat", cost: "$45", color: "#0084FF" },
  { name: "Gumroad", cost: "10%", color: "#FF90E8" },
  { name: "Patreon", cost: "12%", color: "#FF424D" },
  { name: "Zapier", cost: "$29", color: "#FF4F00" },
];

const Hook: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  
  const opacity = interpolate(frame, [0, 15], [0, 1]);
  const scale = spring({ frame, fps, from: 0.8, to: 1 });

  return (
    <CenterScene seed={1} orbColors={[C.red, C.orange]}>
      <div style={{ opacity, transform: `scale(${scale})` }}>
        <h1 style={{ fontFamily: F, fontSize: 80, color: C.white, fontWeight: 900, lineHeight: 1.1, textTransform: "uppercase" }}>
          Every Producer Is <br />
          <GradientText from={C.red} to={C.orange}>Bleeding Money</GradientText>
        </h1>
      </div>
    </CenterScene>
  );
};

const Problem: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  return (
    <CenterScene seed={2} orbColors={[C.red, C.purple]}>
      <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 30, maxWidth: 900 }}>
        {tools.map((tool, i) => {
          const delay = i * 5;
          const scale = spring({ frame: frame - delay, fps, from: 0, to: 1, config: { damping: 12 } });
          const opacity = interpolate(frame - delay, [0, 5], [0, 1]);

          return (
            <div
              key={tool.name}
              style={{
                backgroundColor: C.darkGray,
                padding: "20px 40px",
                borderRadius: 20,
                border: `2px solid ${tool.color}`,
                transform: `scale(${scale})`,
                opacity,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                minWidth: 200,
              }}
            >
              <span style={{ fontFamily: F, fontSize: 32, color: C.white, fontWeight: 700 }}>{tool.name}</span>
              <span style={{ fontFamily: F, fontSize: 24, color: C.gray, marginTop: 5 }}>{tool.cost}/mo</span>
            </div>
          );
        })}
      </div>
      <div style={{ marginTop: 60, opacity: interpolate(frame, [40, 50], [0, 1]) }}>
        <h2 style={{ fontFamily: F, fontSize: 60, color: C.white, fontWeight: 800 }}>
          Total: <span style={{ color: C.red }}>$500+/mo</span>
        </h2>
        <p style={{ fontFamily: F, fontSize: 30, color: C.gray, marginTop: 10 }}>And nothing is connected.</p>
      </div>
    </CenterScene>
  );
};

const Solution: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const mergeProgress = spring({ frame, fps, from: 0, to: 1, config: { damping: 20, stiffness: 50 } });
  const pprScale = interpolate(mergeProgress, [0.8, 1], [0, 1]);
  
  return (
    <CenterScene seed={3} orbColors={[C.primary, C.cyan]}>
      <div style={{ position: "relative", width: 800, height: 800, display: "flex", justifyContent: "center", alignItems: "center" }}>
        {/* Tools merging in */}
        {tools.map((tool, i) => {
          const angle = (i / tools.length) * Math.PI * 2;
          const radius = interpolate(mergeProgress, [0, 1], [350, 0]);
          const x = Math.cos(angle) * radius;
          const y = Math.sin(angle) * radius;
          const opacity = interpolate(mergeProgress, [0.8, 1], [1, 0]);

          return (
            <div
              key={tool.name}
              style={{
                position: "absolute",
                transform: `translate(${x}px, ${y}px) scale(${1 - mergeProgress * 0.5})`,
                opacity,
                backgroundColor: tool.color,
                width: 60,
                height: 60,
                borderRadius: "50%",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                fontSize: 10,
                color: "white",
                fontWeight: "bold",
                fontFamily: F,
              }}
            >
              {tool.name[0]}
            </div>
          );
        })}

        {/* PPR Logo appearing */}
        <div style={{ transform: `scale(${pprScale})`, opacity: pprScale, zIndex: 10, display: "flex", flexDirection: "column", alignItems: "center" }}>
           <div style={{ 
             width: 200, 
             height: 200, 
             borderRadius: 40, 
             background: `linear-gradient(135deg, ${C.primary}, ${C.cyan})`,
             display: "flex",
             justifyContent: "center",
             alignItems: "center",
             boxShadow: `0 0 60px ${C.primary}80`
           }}>
             <span style={{ fontSize: 100 }}>▶</span>
           </div>
           <h2 style={{ fontFamily: F, fontSize: 60, color: C.white, fontWeight: 900, marginTop: 40 }}>
             One Dashboard.
           </h2>
           <h3 style={{ fontFamily: F, fontSize: 40, color: C.gray, fontWeight: 500, marginTop: 10 }}>
             Everything Connected.
           </h3>
        </div>
      </div>
    </CenterScene>
  );
};

const Proof: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  
  const slideUp = spring({ frame, fps, from: 100, to: 0 });

  return (
    <CenterScene seed={4} orbColors={[C.purple, C.pink]}>
      <div style={{ 
        width: 900, 
        height: 1400, 
        backgroundColor: C.darkGray, 
        borderRadius: 30, 
        border: `1px solid ${C.gray}30`,
        overflow: "hidden",
        transform: `translateY(${slideUp}px)`,
        boxShadow: "0 20px 80px rgba(0,0,0,0.5)",
        display: "flex",
        flexDirection: "column"
      }}>
        {/* Mock Header */}
        <div style={{ height: 80, borderBottom: `1px solid ${C.gray}20`, display: "flex", alignItems: "center", padding: "0 30px" }}>
          <div style={{ width: 40, height: 40, borderRadius: 8, background: C.primary }}></div>
          <div style={{ marginLeft: 20, width: 200, height: 20, background: `${C.gray}20`, borderRadius: 4 }}></div>
        </div>
        
        {/* Mock Content */}
        <div style={{ padding: 40, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 30 }}>
           <div style={{ gridColumn: "1 / -1", height: 200, background: `linear-gradient(to right, ${C.primary}20, ${C.cyan}20)`, borderRadius: 16, border: `1px solid ${C.primary}40`, display: "flex", alignItems: "center", justifyContent: "center" }}>
             <span style={{ fontFamily: F, fontSize: 30, color: C.white, fontWeight: 600 }}>Email Automation Active</span>
           </div>
           <div style={{ height: 150, background: `${C.gray}10`, borderRadius: 16 }}></div>
           <div style={{ height: 150, background: `${C.gray}10`, borderRadius: 16 }}></div>
           <div style={{ gridColumn: "1 / -1", height: 300, background: `${C.gray}10`, borderRadius: 16 }}></div>
        </div>
      </div>
      <div style={{ position: "absolute", bottom: 100 }}>
         <h2 style={{ fontFamily: F, fontSize: 50, color: C.white, fontWeight: 800, background: "rgba(0,0,0,0.8)", padding: "10px 30px", borderRadius: 10 }}>
           Email + Store + Courses + Social
         </h2>
      </div>
    </CenterScene>
  );
};

const CTA: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const scale = spring({ frame, fps, from: 0.9, to: 1, config: { damping: 10 } });

  return (
    <CenterScene seed={5} orbColors={[C.orange, C.red]}>
      <div style={{ transform: `scale(${scale})` }}>
        <h2 style={{ fontFamily: F, fontSize: 50, color: C.gray, fontWeight: 600, marginBottom: 20 }}>
          Want the full breakdown?
        </h2>
        <h1 style={{ fontFamily: F, fontSize: 90, color: C.white, fontWeight: 900, lineHeight: 1.1 }}>
          COMMENT <br />
          <GradientText from={C.orange} to={C.red}>"STACK"</GradientText>
        </h1>
        <div style={{ marginTop: 60, display: "flex", alignItems: "center", justifyContent: "center", gap: 20 }}>
          <div style={{ width: 60, height: 60, borderRadius: 12, background: C.white }}></div>
          <span style={{ fontFamily: F, fontSize: 40, color: C.white, fontWeight: 700 }}>Link in bio</span>
        </div>
      </div>
    </CenterScene>
  );
};

export const TheStackIKilled: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: C.bg }}>
      <Sequence from={0} durationInFrames={90}>
        <Hook />
      </Sequence>
      <Sequence from={90} durationInFrames={210}>
        <Problem />
      </Sequence>
      <Sequence from={300} durationInFrames={300}>
        <Solution />
      </Sequence>
      <Sequence from={600} durationInFrames={300}>
        <Proof />
      </Sequence>
      <Sequence from={900} durationInFrames={150}>
        <CTA />
      </Sequence>
    </AbsoluteFill>
  );
};
