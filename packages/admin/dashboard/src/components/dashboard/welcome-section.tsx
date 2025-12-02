import { User, Calendar } from "lucide-react";

interface WelcomeSectionProps {
  user: any;
}

export default function WelcomeSection({ user }: WelcomeSectionProps) {
  const currentDate = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="bg-ui-bg-subtle text-ui-fg-subtle p-6 rounded-lg shadow-elevation-card-rest">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 shadow-borders-base bg-ui-bg-base rounded-full flex items-center justify-center">
            <User className="h-6 w-6 bg-ui-bg-base text-ui-fg-subtle" />
          </div>
          <div>
            <h2 className="text-xl text-ui-fg-subtle font-semibold flex items-center gap-2">
              Welcome back, {user?.first_name || "User"}!{" "}
              <span className="text-yellow-500 dark:text-yellow-400">👋</span>
            </h2>
            <p className="text-gray-600 dark:text-gray-400 text-sm">{user?.email || ""}</p>
          </div>
        </div>
        <div className="shadow-borders-base bg-ui-bg-base px-2 py-1 rounded">
          {user?.role?.name || "Role"}
        </div>
      </div>

      <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400 pt-4 border-t border-gray-200 dark:border-[#38383b]">
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4" />
          <span>{currentDate}</span>
        </div>
        <div className="flex items-center gap-2">
          {/* <Clock className="h-4 w-4" /> */}
          {/* <span>Last login: Today, 9:30 AM</span> */}
        </div>
      </div>
    </div>
  );
}
