import { Clock } from "lucide-react";
import { useEffect, useRef, useState } from "react";

interface ActivityItem {
  rawData: any;
  id: string;
  title: string;
  description?: string;
  author: string;
  timestamp: string;
  method: string;
  url: string;
  statusCode?: string | number;
  messageType?: string;
}

interface RecentActivityProps {
  title: string;
  activities: ActivityItem[] | any;
  isLoading?: boolean;
  onLoadMore?: () => void;
}

function ActivityCard({ item }: { item: ActivityItem }) {
  return (
    <div className="flex w-full bg-ui-bg-subtle text-ui-fg-subtle items-start gap-4 p-4">
      <div className="flex-1 w-full min-w-0">
        <div className="flex w-full items-start justify-between gap-4">
          <div className="flex-1 flex flex-col">
            <p className="text-sm mb-2 break-all">{item?.description}</p>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-400">by {item.author}</span>
              <span
                className={`text-sm font-semibold ${
                  item.messageType === "Error"
                    ? "text-red-500"
                    : item.messageType === "Success"
                      ? "text-green-500"
                      : "text-gray-500"
                }`}
              >
                {item.messageType}
              </span>
            </div>
          </div>
          <div className="flex flex-col items-end gap-1">
            <span className="text-sm whitespace-nowrap text-gray-400">{item.timestamp}</span>
          </div>
        </div>
        <div className="mt-2 text-sm text-gray-500">
          <strong>Method:</strong> {item.method} | <strong>URL:</strong> {item.url}
        </div>
      </div>
    </div>
  );
}

export default function RecentActivity({
  title,
  activities,
  isLoading,
  onLoadMore,
}: RecentActivityProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isFetchingMore, setIsFetchingMore] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const container = containerRef.current;
      if (!container || isFetchingMore || isLoading) return;

      if (container.scrollTop + container.clientHeight >= container.scrollHeight - 10) {
        setIsFetchingMore(true);
        if (onLoadMore) onLoadMore();
      }
    };

    const container = containerRef.current;
    if (container) {
      container.addEventListener("scroll", handleScroll);
    }

    return () => {
      if (container) {
        container.removeEventListener("scroll", handleScroll);
      }
    };
  }, [onLoadMore, isFetchingMore, isLoading]);

  // Reset fetching flag after loading is completed
  useEffect(() => {
    if (!isLoading) {
      setIsFetchingMore(false);
    }
  }, [isLoading]);

  return (
    <div className="bg-ui-bg-subtle text-ui-fg-subtle rounded-lg shadow-elevation-card-rest">
      <div className="flex items-center justify-between p-6">
        <h3 className="text-lg font-semibold text-ui-fg-subtle">{title}</h3>
        <Clock className="h-5 w-5 text-gray-400" />
      </div>

      <div
        ref={containerRef}
        className="divide-y shadow-elevation-card-rest max-h-96 overflow-y-auto"
      >
        {activities.length > 0 ? (
          activities.map((activity: ActivityItem) => (
            <ActivityCard key={activity.id} item={activity} />
          ))
        ) : isLoading ? (
          <p className="text-sm text-center py-4 text-gray-400">Loading activities...</p>
        ) : (
          <p className="text-sm text-center py-4 text-gray-400">No recent activity</p>
        )}

        {isLoading && activities.length > 0 && (
          <p className="text-sm text-center py-4 text-gray-400">Loading more...</p>
        )}
      </div>
    </div>
  );
}
