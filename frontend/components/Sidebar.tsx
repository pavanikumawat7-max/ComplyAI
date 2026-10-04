export default function Sidebar() {
  return (
    <div className="w-64 bg-[#0f0f14] p-5 border-r border-gray-800">
      <h2 className="text-xl font-bold text-orange-400 mb-6">
        CY • FOCUS
      </h2>

      <button className="bg-orange-500 px-4 py-2 rounded w-full mb-6">
        + New Task
      </button>

      <ul className="space-y-4 text-gray-400">
        <li className="text-white">Dashboard</li>
        <li>Findings</li>
        <li>Incidents</li>
        <li>Compliance</li>
        <li>Vault</li>
        <li>Integrations</li>
      </ul>
    </div>
  );
}