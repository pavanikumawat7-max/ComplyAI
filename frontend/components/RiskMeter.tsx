"use client";

import { useEffect, useState } from "react";

export default function RiskMeter({ status }: any) {
  const [level, setLevel] = useState(0);

  useEffect(() => {
    if (status === "GREEN") setLevel(30);
    if (status === "YELLOW") setLevel(60);
    if (status === "RED") setLevel(100);
  }, [status]);

  return (
    <div className="mt-6">
      <h3 className="mb-2">Risk Meter</h3>

      <div className="w-full h-4 bg-gray-700 rounded-full">
        <div
          className="h-4 rounded-full transition-all duration-1000"
          style={{
            width: `${level}%`,
            background:
              level < 40
                ? "limegreen"
                : level < 80
                ? "yellow"
                : "red",
          }}
        />
      </div>

      <p className="text-sm mt-2">Status: {status}</p>
    </div>
  );
}