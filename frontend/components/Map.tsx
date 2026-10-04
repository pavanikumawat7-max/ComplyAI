import { useEffect, useState } from "react";

export default function Map() {
  const [points, setPoints] = useState<any[]>([]);

  useEffect(() => {
    // MOCK: Replace with /regulations later
    setPoints([
  { x: 20, y: 35, size: 60, level: "HIGH", label: "USA" },
  { x: 55, y: 42, size: 50, level: "HIGH", label: "Middle East" },
  { x: 68, y: 50, size: 55, level: "HIGH", label: "India" },
  { x: 82, y: 75, size: 50, level: "HIGH", label: "Australia" },
  { x: 35, y: 65, size: 45, level: "HIGH", label: "Brazil" },
]);
  }, []);

  return (
    <div className="bg-[#111] p-4 rounded-xl border border-gray-800 h-[400px] relative">
      <h3 className="mb-2 text-gray-400">Compliance Map</h3>

      {/* Fake world map background */}
      <div className="absolute inset-0 bg-[url('/world.png')] opacity-20 bg-cover"></div>

      {points.map((p, i) => (
        <div
          key={i}
          className="absolute rounded-full bg-orange-500 opacity-70 animate-ping"
          style={{
            top: `${p.y}%`,
            left: `${p.x}%`,
            width: p.size,
            height: p.size,
          }}
        />
      ))}
    </div>
  );
}