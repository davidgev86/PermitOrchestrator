import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDistanceToNow } from "date-fns";

interface RecentActivityProps {
  projectId: string;
}

export default function RecentActivity({ projectId }: RecentActivityProps) {
  const { data: events, isLoading } = useQuery({
    queryKey: ["/api/projects", projectId, "events"],
    enabled: !!projectId,
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="flex items-start">
                <div className="w-2 h-2 bg-muted rounded-full mt-2"></div>
                <div className="ml-3 space-y-1">
                  <div className="h-4 bg-muted rounded w-32"></div>
                  <div className="h-3 bg-muted rounded w-20"></div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const getEventColor = (action: string) => {
    switch (action) {
      case 'PROJECT_CREATED':
        return 'bg-gray-400';
      case 'CASE_CREATED':
        return 'bg-blue-500';
      case 'PRECHECK_COMPLETED':
        return 'bg-green-500';
      case 'PERMIT_SUBMITTED':
        return 'bg-purple-500';
      case 'STATUS_UPDATED':
        return 'bg-orange-500';
      default:
        return 'bg-gray-400';
    }
  };

  const formatEventAction = (action: string) => {
    switch (action) {
      case 'PROJECT_CREATED':
        return 'Project created';
      case 'CASE_CREATED':
        return 'Permit case created';
      case 'PRECHECK_COMPLETED':
        return 'Pre-check completed';
      case 'PERMIT_SUBMITTED':
        return 'Permit submitted';
      case 'STATUS_UPDATED':
        return 'Status updated';
      default:
        return action.toLowerCase().replace(/_/g, ' ');
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
      </CardHeader>
      <CardContent>
        {!events || events.length === 0 ? (
          <div className="text-center py-6">
            <p className="text-sm text-muted-foreground">No recent activity</p>
          </div>
        ) : (
          <div className="space-y-4">
            {events.slice(0, 5).map((event: any) => (
              <div key={event.id} className="flex items-start" data-testid={`activity-${event.id}`}>
                <div className="flex-shrink-0">
                  <div className={`w-2 h-2 ${getEventColor(event.action)} rounded-full mt-2`}></div>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium">{formatEventAction(event.action)}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(event.createdAt), { addSuffix: true })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
