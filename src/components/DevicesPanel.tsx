import { Users, Loader, X } from "lucide-react";
import type { User } from "../types";

interface Props {
  myName: string;
  users: User[];
  onKick: (socketId: string) => void;
}

const DevicesPanel: React.FC<Props> = ({
  myName,
  users,
  onKick,
}) => {
  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
      <div className="flex items-center gap-2 mb-4">
        <Users className="w-5 h-5" />
        <h2 className="font-semibold">Devices</h2>
      </div>

      <div className="space-y-3">

        {/* You */}
        <div className="bg-indigo-500/10 px-3 py-2 rounded-lg">
          {myName} (You)
        </div>

        {/* Other Users */}
        {users.map((user) => (
          <div
            key={user.socketId + Math.random()} // Use socketId + random to ensure uniqueness
            className="group flex items-center justify-between bg-white/5 px-3 py-2 rounded-lg hover:bg-white/10 transition"
          >
            <span>{user.userName}</span>

            {/* Kick button appears on hover */}
            <button
              onClick={() => onKick(user.socketId)}
              className="opacity-0 group-hover:opacity-100 transition text-red-400 hover:text-red-300"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}

        {users.length === 0 && (
          <div className="flex items-center gap-2 text-gray-400 text-sm">
            <Loader className="w-4 h-4 animate-spin" />
            Waiting for peers…
          </div>
        )}
      </div>
    </div>
  );
};

export default DevicesPanel;