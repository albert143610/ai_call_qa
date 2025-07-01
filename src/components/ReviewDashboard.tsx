
import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useUserRole } from '@/hooks/useUserRole';
import { useToast } from '@/hooks/use-toast';
import { Clock, CheckCircle, AlertCircle, User, Star } from 'lucide-react';
import type { Tables } from '@/integrations/supabase/types';

type ReviewAssignment = Tables<'review_assignments'> & {
  calls: Tables<'calls'> & {
    quality_scores: Tables<'quality_scores'>[];
  };
};

export const ReviewDashboard = () => {
  const [assignments, setAssignments] = useState<ReviewAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { hasRole } = useUserRole();
  const { toast } = useToast();

  useEffect(() => {
    if (!user || !hasRole('reviewer')) return;
    fetchAssignments();
  }, [user, hasRole]);

  const fetchAssignments = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('review_assignments')
        .select(`
          *,
          calls(
            *,
            quality_scores(*)
          )
        `)
        .eq('reviewer_id', user.id)
        .order('assigned_at', { ascending: false });

      if (error) throw error;
      setAssignments(data || []);
    } catch (error: any) {
      toast({
        title: "Error fetching assignments",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateAssignmentStatus = async (assignmentId: string, status: string) => {
    try {
      const { error } = await supabase
        .from('review_assignments')
        .update({ 
          status,
          completed_at: status === 'completed' ? new Date().toISOString() : null
        })
        .eq('id', assignmentId);

      if (error) throw error;

      toast({
        title: "Assignment updated",
        description: `Assignment marked as ${status}`,
      });

      fetchAssignments();
    } catch (error: any) {
      toast({
        title: "Error updating assignment",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const getStatusColor = (status: string) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      in_progress: 'bg-blue-100 text-blue-800',
      completed: 'bg-green-100 text-green-800',
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4" />;
      case 'in_progress':
        return <AlertCircle className="h-4 w-4" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  if (!hasRole('reviewer')) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-8">
          <User className="h-12 w-12 text-gray-400 mb-4" />
          <p className="text-gray-500">You don't have reviewer permissions to access this dashboard.</p>
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return <div>Loading review assignments...</div>;
  }

  const pendingCount = assignments.filter(a => a.status === 'pending').length;
  const inProgressCount = assignments.filter(a => a.status === 'in_progress').length;
  const completedCount = assignments.filter(a => a.status === 'completed').length;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Review Dashboard</h2>
        <p className="text-gray-600">Manage your assigned call reviews</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Reviews</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{pendingCount}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
            <AlertCircle className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{inProgressCount}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{completedCount}</div>
          </CardContent>
        </Card>
      </div>

      {/* Assignments List */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Review Assignments</h3>
        {assignments.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-8">
              <Star className="h-12 w-12 text-gray-400 mb-4" />
              <p className="text-gray-500">No review assignments yet.</p>
            </CardContent>
          </Card>
        ) : (
          assignments.map((assignment) => {
            const qualityScore = assignment.calls.quality_scores?.[0];
            return (
              <Card key={assignment.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="flex items-center gap-2">
                        {assignment.calls.title}
                        <Badge className={getStatusColor(assignment.status!)}>
                          {getStatusIcon(assignment.status!)}
                          <span className="ml-1">{assignment.status}</span>
                        </Badge>
                      </CardTitle>
                      <CardDescription>
                        Assigned on {new Date(assignment.assigned_at!).toLocaleDateString()}
                        {assignment.completed_at && (
                          <span> • Completed on {new Date(assignment.completed_at).toLocaleDateString()}</span>
                        )}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Call Details */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h4 className="font-medium text-sm text-gray-700 mb-2">Call Information</h4>
                        <div className="space-y-1 text-sm">
                          <p><span className="font-medium">Duration:</span> {assignment.calls.duration_seconds ? `${Math.floor(assignment.calls.duration_seconds / 60)}:${(assignment.calls.duration_seconds % 60).toString().padStart(2, '0')}` : 'N/A'}</p>
                          <p><span className="font-medium">Type:</span> {assignment.calls.call_type || 'N/A'}</p>
                          <p><span className="font-medium">Agent:</span> {assignment.calls.agent_name || 'N/A'}</p>
                        </div>
                      </div>
                      
                      {qualityScore && (
                        <div>
                          <h4 className="font-medium text-sm text-gray-700 mb-2">AI Quality Scores</h4>
                          <div className="space-y-1 text-sm">
                            <p><span className="font-medium">Overall:</span> {qualityScore.overall_satisfaction_score}/5</p>
                            <p><span className="font-medium">Communication:</span> {qualityScore.communication_score}/5</p>
                            <p><span className="font-medium">Problem Resolution:</span> {qualityScore.problem_resolution_score}/5</p>
                            <p><span className="font-medium">Sentiment:</span> {qualityScore.sentiment}</p>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2">
                      {assignment.status === 'pending' && (
                        <Button
                          onClick={() => updateAssignmentStatus(assignment.id, 'in_progress')}
                          variant="outline"
                        >
                          Start Review
                        </Button>
                      )}
                      {assignment.status === 'in_progress' && (
                        <Button
                          onClick={() => updateAssignmentStatus(assignment.id, 'completed')}
                          variant="default"
                        >
                          Mark Complete
                        </Button>
                      )}
                      <Button variant="ghost" size="sm">
                        View Details
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
};
