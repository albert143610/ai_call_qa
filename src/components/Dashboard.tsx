
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/hooks/useAuth';
import { useUserRole } from '@/hooks/useUserRole';
import { CallUpload } from './CallUpload';
import { CallsList } from './CallsList';
import { ReviewDashboard } from './ReviewDashboard';
import { LogOut, Phone, Star, Upload, List } from 'lucide-react';

export const Dashboard = () => {
  const { user, signOut } = useAuth();
  const { role, isReviewer, isAdmin } = useUserRole();
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleUploadComplete = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center gap-2">
              <Phone className="h-6 w-6 text-blue-600" />
              <h1 className="text-xl font-bold text-gray-900">AI Call QA</h1>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">
                Welcome, {user?.email}
                {role && <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-medium">{role}</span>}
              </span>
              <Button variant="outline" onClick={signOut}>
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs defaultValue="calls" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 lg:w-[400px]">
            <TabsTrigger value="calls" className="flex items-center gap-2">
              <List className="h-4 w-4" />
              My Calls
            </TabsTrigger>
            <TabsTrigger value="upload" className="flex items-center gap-2">
              <Upload className="h-4 w-4" />
              Upload
            </TabsTrigger>
            {isReviewer && (
              <TabsTrigger value="review" className="flex items-center gap-2">
                <Star className="h-4 w-4" />
                Reviews
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="calls" className="space-y-6">
            <CallsList refreshTrigger={refreshTrigger} />
          </TabsContent>

          <TabsContent value="upload" className="space-y-6">
            <div className="max-w-2xl">
              <CallUpload onUploadComplete={handleUploadComplete} />
            </div>
          </TabsContent>

          {isReviewer && (
            <TabsContent value="review" className="space-y-6">
              <ReviewDashboard />
            </TabsContent>
          )}
        </Tabs>
      </main>
    </div>
  );
};
