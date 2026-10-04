export default function Metrics() {
  return (
    <div className="grid grid-cols-3 gap-4">
      <Card title="Active Incidents" value="7" />
      <Card title="Compliance Score" value="51%" />
      <Card title="Time to Remediate" value="2d 6h" />
    </div>
  );
}

function Card({ title, value }: any) {
  return (
    <div className="bg-[#111] p-4 rounded-xl border border-gray-800">
      <p className="text-gray-400 text-sm">{title}</p>
      <h2 className="text-2xl mt-2">{value}</h2>
    </div>
  );
}