
import { Badge } from '@/components/ui/badge';
import { FileText, Tag, Phone, Building } from 'lucide-react';
import type { Tables } from '@/integrations/supabase/types';

type Call = Tables<'calls'>;
type CallTag = Tables<'call_tags'>;

interface CallDetailsAndTagsProps {
  call: Call;
  tags: CallTag[];
}

export const CallDetailsAndTags = ({ call, tags }: CallDetailsAndTagsProps) => {
  return (
    <div className="space-y-4">
      <h4 className="font-semibold flex items-center gap-2">
        <FileText className="h-4 w-4" />
        Details & Tags
      </h4>
      <div className="space-y-4">
        {/* Call Details */}
        <div className="bg-gray-50 rounded-lg p-4 space-y-3">
          <div className="flex items-center gap-2">
            <FileText className="h-3 w-3 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">File:</span>
            <span className="text-sm text-gray-600">{call.file_name}</span>
          </div>
          
          {call.call_source && (
            <div className="flex items-center gap-2">
              <Building className="h-3 w-3 text-gray-500" />
              <span className="text-sm font-medium text-gray-700">Source:</span>
              <span className="text-sm text-gray-600">{call.call_source}</span>
            </div>
          )}
          
          {call.customer_phone && (
            <div className="flex items-center gap-2">
              <Phone className="h-3 w-3 text-gray-500" />
              <span className="text-sm font-medium text-gray-700">Customer:</span>
              <span className="text-sm text-gray-600">{call.customer_phone}</span>
            </div>
          )}
        </div>
        
        {/* Tags */}
        {tags.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Tag className="h-4 w-4 text-gray-600" />
              <p className="font-medium text-gray-700">Tags</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {tags.map((tag) => (
                <Badge key={tag.id} variant="outline" className="text-xs bg-white">
                  {tag.tag}
                  {tag.confidence_score && (
                    <span className="ml-1 text-gray-500">
                      ({(tag.confidence_score * 100).toFixed(0)}%)
                    </span>
                  )}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
