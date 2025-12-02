import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Upload, Download, Folder, File, Plus, Share2, Lock, Unlock, 
  Eye, Edit, Trash2, MoreHorizontal, Search, Filter, Grid, List 
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { db } from '@/lib/database';
import { toast } from 'sonner';

interface DocumentFolder {
  id: string;
  name: string;
  description: string;
  parent_folder_id: string | null;
  created_by: string;
  agency_id: string;
  created_at: string;
}

interface Document {
  id: string;
  name: string;
  description: string;
  file_path: string;
  file_size: number;
  file_type: string;
  uploaded_by: string;
  folder_id: string | null;
  tags: string[];
  is_public: boolean;
  download_count: number;
  agency_id: string;
  created_at: string;
  updated_at: string;
}

interface DocumentVersion {
  id: string;
  document_id: string;
  version_number: number;
  file_path: string;
  uploaded_by: string;
  upload_date: string;
  change_summary: string;
  is_current: boolean;
}

interface DocumentPermission {
  id: string;
  document_id: string;
  user_id: string;
  role: string;
  permission_type: 'read' | 'write' | 'admin';
  granted_by: string;
  created_at: string;
}

export function DocumentManager() {
  const { user } = useAuth();
  const [folders, setFolders] = useState<DocumentFolder[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [currentFolder, setCurrentFolder] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showFolderDialog, setShowFolderDialog] = useState(false);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [showPermissionsDialog, setShowPermissionsDialog] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [folderForm, setFolderForm] = useState({
    name: '',
    description: ''
  });

  const fetchFolders = async () => {
    try {
      const { data, error } = await supabase
        .from('document_folders')
        .select('*')
        .order('name');

      if (error) throw error;
      setFolders(data || []);
    } catch (error) {
      console.error('Error fetching folders:', error);
      toast.error('Failed to load folders');
    }
  };

  const fetchDocuments = async () => {
    try {
      let query = supabase
        .from('documents')
        .select('*');

      if (currentFolder) {
        query = query.eq('folder_id', currentFolder);
      } else {
        query = query.is('folder_id', null);
      }

      const { data, error } = await query.order('name');

      if (error) throw error;
      setDocuments(data || []);
    } catch (error) {
      console.error('Error fetching documents:', error);
      toast.error('Failed to load documents');
    }
  };

  useEffect(() => {
    const loadData = async () => {
      await Promise.all([fetchFolders(), fetchDocuments()]);
      setLoading(false);
    };
    loadData();
  }, [currentFolder]);

  const handleCreateFolder = async () => {
    if (!user || !folderForm.name) {
      toast.error('Please provide a folder name');
      return;
    }

    try {
      const { error } = await supabase
        .from('document_folders')
        .insert({
          ...folderForm,
          parent_folder_id: currentFolder,
          created_by: user.id,
          agency_id: 'temp-agency-id'
        });

      if (error) throw error;

      toast.success('Folder created successfully');
      setShowFolderDialog(false);
      setFolderForm({ name: '', description: '' });
      fetchFolders();
    } catch (error) {
      console.error('Error creating folder:', error);
      toast.error('Failed to create folder');
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    try {
      // Upload file to Supabase Storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `documents/${fileName}`;

      const { error: uploadError } = await db.storage
        .from('documents')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Save document metadata
      const { error: dbError } = await supabase
        .from('documents')
        .insert({
          name: file.name,
          file_path: filePath,
          file_size: file.size,
          file_type: file.type,
          uploaded_by: user.id,
          folder_id: currentFolder,
          agency_id: 'temp-agency-id',
          tags: [],
          is_public: false
        });

      if (dbError) throw dbError;

      toast.success('File uploaded successfully');
      fetchDocuments();
    } catch (error) {
      console.error('Error uploading file:', error);
      toast.error('Failed to upload file');
    }
  };

  const handleDownload = async (document: Document) => {
    try {
      const { data, error } = await db.storage
        .from('documents')
        .download(document.file_path);

      if (error) throw error;

      // Create download link
      const url = URL.createObjectURL(data);
      const a = globalThis.document.createElement('a');
      a.href = url;
      a.download = document.name;
      globalThis.document.body.appendChild(a);
      a.click();
      globalThis.document.body.removeChild(a);
      URL.revokeObjectURL(url);

      // Update download count
      await supabase
        .from('documents')
        .update({ download_count: document.download_count + 1 })
        .eq('id', document.id);

      toast.success('File downloaded successfully');
    } catch (error) {
      console.error('Error downloading file:', error);
      toast.error('Failed to download file');
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith('image/')) return '🖼️';
    if (fileType.includes('pdf')) return '📄';
    if (fileType.includes('word')) return '📝';
    if (fileType.includes('excel') || fileType.includes('spreadsheet')) return '📊';
    if (fileType.includes('powerpoint') || fileType.includes('presentation')) return '📽️';
    return '📄';
  };

  const filteredDocuments = documents.filter(doc =>
    doc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    doc.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const currentFolderData = folders.find(f => f.id === currentFolder);
  const subFolders = folders.filter(f => f.parent_folder_id === currentFolder);

  if (loading) {
    return <div className="flex items-center justify-center p-8">Loading documents...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Document Management</h1>
          <p className="text-muted-foreground">Organize and manage your files with version control</p>
        </div>
        <div className="flex space-x-2">
          <Button onClick={() => setShowFolderDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            New Folder
          </Button>
          <Button onClick={() => document.getElementById('file-upload')?.click()}>
            <Upload className="h-4 w-4 mr-2" />
            Upload File
          </Button>
          <input
            id="file-upload"
            type="file"
            className="hidden"
            onChange={handleFileUpload}
          />
        </div>
      </div>

      {/* Breadcrumb Navigation */}
      <div className="flex items-center space-x-2 text-sm text-muted-foreground">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setCurrentFolder(null)}
          className={!currentFolder ? 'text-foreground' : ''}
        >
          Root
        </Button>
        {currentFolderData && (
          <>
            <span>/</span>
            <span className="text-foreground">{currentFolderData.name}</span>
          </>
        )}
      </div>

      {/* Search and View Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Search className="h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search documents..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-64"
          />
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant={viewMode === 'grid' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('grid')}
          >
            <Grid className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === 'list' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('list')}
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Folders */}
      {subFolders.length > 0 && (
        <div>
          <h3 className="text-lg font-medium mb-3">Folders</h3>
          <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4' : 'space-y-2'}>
            {subFolders.map((folder) => (
              <Card
                key={folder.id}
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => setCurrentFolder(folder.id)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center space-x-3">
                    <Folder className="h-8 w-8 text-blue-500" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{folder.name}</p>
                      {folder.description && (
                        <p className="text-sm text-muted-foreground truncate">{folder.description}</p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Documents */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-medium">Documents ({filteredDocuments.length})</h3>
        </div>

        {filteredDocuments.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <File className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-lg font-medium">No documents found</p>
              <p className="text-muted-foreground mb-4">
                {searchTerm ? 'Try adjusting your search terms' : 'Upload your first document to get started'}
              </p>
              {!searchTerm && (
                <Button onClick={() => document.getElementById('file-upload')?.click()}>
                  <Upload className="h-4 w-4 mr-2" />
                  Upload File
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4' : 'space-y-2'}>
            {filteredDocuments.map((document) => (
              <Card key={document.id} className="group">
                <CardContent className="p-4">
                  <div className="flex items-start space-x-3">
                    <div className="text-2xl">{getFileIcon(document.file_type)}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="font-medium truncate">{document.name}</p>
                        <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDownload(document)}
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedDocument(document);
                              setShowPermissionsDialog(true);
                            }}
                          >
                            <Share2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2 mt-1">
                        <span className="text-sm text-muted-foreground">{formatFileSize(document.file_size)}</span>
                        <span className="text-sm text-muted-foreground">•</span>
                        <span className="text-sm text-muted-foreground">
                          Downloaded {document.download_count} times
                        </span>
                        {document.is_public ? (
                          <Unlock className="h-3 w-3 text-green-500" />
                        ) : (
                          <Lock className="h-3 w-3 text-gray-500" />
                        )}
                      </div>
                      {document.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {document.tags.slice(0, 3).map((tag, index) => (
                            <Badge key={index} variant="secondary" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                          {document.tags.length > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{document.tags.length - 3}
                            </Badge>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Folder Creation Dialog */}
      <Dialog open={showFolderDialog} onOpenChange={setShowFolderDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Folder</DialogTitle>
            <DialogDescription>
              Create a new folder to organize your documents
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="folder-name">Folder Name</Label>
              <Input
                id="folder-name"
                value={folderForm.name}
                onChange={(e) => setFolderForm(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Folder name"
              />
            </div>

            <div>
              <Label htmlFor="folder-description">Description (Optional)</Label>
              <Textarea
                id="folder-description"
                value={folderForm.description}
                onChange={(e) => setFolderForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Folder description"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowFolderDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateFolder}>
              Create Folder
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Document Permissions Dialog */}
      <Dialog open={showPermissionsDialog} onOpenChange={setShowPermissionsDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Document Permissions</DialogTitle>
            <DialogDescription>
              Manage who can access "{selectedDocument?.name}"
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="text-center py-8 text-muted-foreground">
              <Share2 className="h-12 w-12 mx-auto mb-4" />
              <p>Permission management coming soon</p>
              <p className="text-sm">This feature will allow you to control document access</p>
            </div>
          </div>

          <DialogFooter>
            <Button onClick={() => setShowPermissionsDialog(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}