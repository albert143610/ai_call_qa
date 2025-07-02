
import { Badge } from '@/components/ui/badge';
import { Phone, User, Building2 } from 'lucide-react';
import type { Tables } from '@/integrations/supabase/types';

type Call = Tables<'calls'>;

interface CallMetadataBadgesProps {
  call: Call;
}

const getStatusColor = (status: string) => {
  const colors = {
    uploaded: 'bg-gray-100 text-gray-800',
    transcribing: 'bg-blue-100 text-blue-800',
    transcribed: 'bg-green-100 text-green-800',
    analyzing: 'bg-yellow-100 text-yellow-800',
    analyzed: 'bg-purple-100 text-purple-800',
    reviewed: 'bg-emerald-100 text-emerald-800',
  };
  return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
};

const getCallTypeColor = (callType: string) => {
  const colors = {
    inbound: 'bg-blue-100 text-blue-800',
    outbound: 'bg-green-100 text-green-800',
  };
  return colors[callType as keyof typeof colors] || 'bg-gray-100 text-gray-800';
};

export const CallMetadataBadges = ({ call }: CallMetadataBadgesProps) => {
  return (
    <div className="flex flex-wrap gap-2 mt-2">
      <Badge className={getStatusColor(call.status!)}>
        {call.status}
      </Badge>
      {call.call_type && (
        <Badge className={getCallTypeColor(call.call_type)}>
          <Phone className="h-3 w-3 mr-1" />
          {call.call_type}
        </Badge>
      )}
      {call.agent_name && (
        <Badge variant="outline">
          <User className="h-3 w-3 mr-1" />
          {call.agent_name}
        </Badge>
      )}
      {call.department && (
        <Badge variant="outline">
          <Building2 className="h-3 w-3 mr-1" />
          {call.department}
        </Badge>
      )}
    </div>
  );
};
