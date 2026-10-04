export default function Activity() {
  const items = [
    "New RBI regulation detected",
    "Compliance gap found in lending",
    "Audit report generated",
    "Policy update recommended",
  ];

  return (
    <div className="bg-[#111] p-4 rounded-xl border border-gray-800">
      <h3 className="mb-4 text-gray-400">Recent Activity</h3>

      <ul className="space-y-3">
        {items.map((item, i) => (
          <li key={i} className="text-sm text-gray-300">
            • {item}
          </li>
        ))}
      </ul>
    </div>
  );
}