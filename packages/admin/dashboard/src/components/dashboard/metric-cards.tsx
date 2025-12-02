interface MetricCardProps {
  title: string;
  value: string;
  //   icon: React.ReactNode
  icon: string;
  change: string;
  changeType: "positive" | "negative";
  period: string;
}

function MetricCard({ title, value, icon, period }: MetricCardProps) {
  return (
    <div className="bg-ui-bg-subtle text-ui-fg-subtle p-6 rounded-lg shadow-elevation-card-rest">
      <div className="flex items-center justify-between mb-4">
        <h3 className=" text-sm font-medium">{title}</h3>
        <div className="">{icon}</div>
      </div>

      <div className="mb-3">
        <div className="text-2xl font-bold ">{value}</div>
      </div>

      <div className="flex items-center gap-2 text-sm">
        {/* <span className={`flex items-center gap-1 ${changeType === "positive" ? "text-green-400" : "text-red-400"}`}>
          <span>{changeType === "positive" ? "↗" : "↘"}</span>
          {change}
        </span> */}
        <span className="text-gray-500">{period}</span>
      </div>
    </div>
  );
}

export default function MetricCards() {
  const metrics = [
    {
      title: "Demo text",
      value: "AUD 00.00",
      icon: "AUD",
      change: "0%",
      changeType: "positive" as const,
      period: "Demo text",
    },
  ];

  return (
    <div>
      {metrics.map((metric, index) => (
        <MetricCard key={index} {...metric} />
      ))}
    </div>
  );
}
