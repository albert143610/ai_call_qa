
import { Badge } from '@/components/ui/badge';
import type { Tables } from '@/integrations/supabase/types';

type Call = Tables<'calls'>;
type CallTag = Tables<'call_tags'>;

interface CallDetailsAndTagsProps {
  call: Call;
  tags: CallTag[];
}

export const CallDetailsAndTags = ({ call, tags }: CallDetailsAndTagsProps) => {
  return (
    <div className="space-y-3">
      <h4 className="font-semibold">Details & Tags</h4>
      <div className="text-sm space-y-2">
        <div>
          <p><span className="font-medium">File:</span> {call.file_name}</p>
          {call.call_source && (
            <p><span className="font-medium">Source:</span> {call.call_source}</p>
          )}
          {call.customer_phone && (
            <p><span className="font-medium">Customer:</span> {call.customer_phone}</p>
          )}
        </div>
        
        {tags.length > 0 && (
          <div>
            <p className="font-medium mb-1">Tags:</p>
            <div className="flex flex-wrap gap-1">
              {tags.map((tag) => (
                <Badge key={tag.id} variant="outline" className="text-xs">
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
