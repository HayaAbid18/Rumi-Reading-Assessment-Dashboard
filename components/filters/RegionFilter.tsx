'use client';

interface RegionFilterProps {
  regions: string[];
  selectedRegion: string;
  onChange: (region: string) => void;
}

export default function RegionFilter({ regions, selectedRegion, onChange }: RegionFilterProps) {
  return (
    <div className="flex items-center gap-2">
      <label htmlFor="region-select" className="text-sm font-medium text-gray-700">
        Region:
      </label>
      <select
        id="region-select"
        value={selectedRegion}
        onChange={(e) => onChange(e.target.value)}
        className="px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
      >
        {regions.map((r) => (
          <option key={r} value={r}>
            {r}
          </option>
        ))}
      </select>
    </div>
  );
}
