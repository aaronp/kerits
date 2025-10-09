import { Input } from '../ui/input';
import { Label } from '../ui/label';

interface LegendProps {
  filter: string;
  onFilterChange: (value: string) => void;
}

const EVENT_TYPES = [
  { type: 'icp', label: 'Inception', color: '#40c057', description: 'Identity creation event' },
  { type: 'rot', label: 'Rotation', color: '#fab005', description: 'Key rotation event' },
  { type: 'ixn', label: 'Interaction', color: '#4dabf7', description: 'Interaction event' },
  { type: 'vcp', label: 'Registry', color: '#5c7cfa', description: 'Registry creation event' },
  { type: 'iss', label: 'Issuance', color: '#ff6b6b', description: 'Credential issuance' },
  { type: 'rev', label: 'Revocation', color: '#868e96', description: 'Credential revocation' },
];

export default function Legend({ filter, onFilterChange }: LegendProps) {
  return (
    <div className="p-4 border-b bg-background">
      <div className="space-y-4">
        {/* Filter Input */}
        <div className="space-y-2">
          <Label htmlFor="filter-input">Filter Events</Label>
          <Input
            id="filter-input"
            type="text"
            placeholder="Search by ID, type, registry, or label..."
            value={filter}
            onChange={(e) => onFilterChange(e.target.value)}
            className="w-full"
          />
          {filter && (
            <p className="text-xs text-muted-foreground">
              Showing matching events and their ancestors
            </p>
          )}
        </div>

        {/* Legend */}
        <div>
          <Label className="text-sm font-semibold mb-2 block">Event Types</Label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {EVENT_TYPES.map(({ type, label, color, description }) => (
              <div
                key={type}
                className="flex items-center gap-2 text-xs"
                title={description}
              >
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: color }}
                />
                <span className="text-foreground">{label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Instructions */}
        <div className="text-xs text-muted-foreground space-y-1">
          <p>• Click a node to pin details</p>
          <p>• Click identity sidebar to collapse/expand</p>
          <p>• Right-click identity sidebar to change color</p>
        </div>
      </div>
    </div>
  );
}
