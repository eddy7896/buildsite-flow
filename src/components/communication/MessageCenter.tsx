import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  MessageCircle, Send, Plus, Users, Hash, Search, 
  MoreHorizontal, Phone, Video, Settings, Pin 
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface MessageThread {
  id: string;
  thread_type: string;
  title: string;
  project_id: string | null;
  created_by: string;
  agency_id: string;
  created_at: string;
  updated_at: string;
  participants?: ThreadParticipant[];
  last_message?: Message;
}

interface Message {
  id: string;
  thread_id: string;
  sender_id: string;
  content: string;
  message_type: string;
  attachment_url: string | null;
  read_by: any;
  created_at: string;
  sender?: any;
}

interface ThreadParticipant {
  id: string;
  thread_id: string;
  user_id: string;
  joined_at: string;
  last_read_at: string;
  user?: any;
}

export function MessageCenter() {
  const { user } = useAuth();
  const [threads, setThreads] = useState<MessageThread[]>([]);
  const [activeThread, setActiveThread] = useState<MessageThread | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showNewThreadDialog, setShowNewThreadDialog] = useState(false);
  const [threadForm, setThreadForm] = useState({
    title: '',
    thread_type: 'group' as const,
    participants: [] as string[]
  });
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const fetchThreads = async () => {
    try {
      const { data, error } = await supabase
        .from('message_threads')
        .select(`
          *,
          participants:thread_participants(
            *,
            user:user_id(full_name, email)
          )
        `)
        .order('updated_at', { ascending: false });

      if (error) throw error;
      setThreads(data || []);
    } catch (error) {
      console.error('Error fetching threads:', error);
      toast.error('Failed to load message threads');
    }
  };

  const fetchMessages = async (threadId: string) => {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select(`
          *,
          sender:sender_id(full_name, email)
        `)
        .eq('thread_id', threadId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages(data || []);
      scrollToBottom();
    } catch (error) {
      console.error('Error fetching messages:', error);
      toast.error('Failed to load messages');
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    const loadData = async () => {
      await fetchThreads();
      setLoading(false);
    };
    loadData();
  }, []);

  useEffect(() => {
    if (activeThread) {
      fetchMessages(activeThread.id);
    }
  }, [activeThread]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !activeThread || !user) return;

    try {
      const { error } = await supabase
        .from('messages')
        .insert({
          thread_id: activeThread.id,
          sender_id: user.id,
          content: newMessage.trim(),
          message_type: 'text'
        });

      if (error) throw error;

      setNewMessage('');
      fetchMessages(activeThread.id);
      
      // Update thread's updated_at timestamp
      await supabase
        .from('message_threads')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', activeThread.id);

      fetchThreads();
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
    }
  };

  const handleCreateThread = async () => {
    if (!user || !threadForm.title) {
      toast.error('Please provide a thread title');
      return;
    }

    try {
      const { data: threadData, error: threadError } = await supabase
        .from('message_threads')
        .insert({
          ...threadForm,
          created_by: user.id,
          agency_id: 'temp-agency-id'
        })
        .select()
        .single();

      if (threadError) throw threadError;

      // Add current user as participant
      const { error: participantError } = await supabase
        .from('thread_participants')
        .insert({
          thread_id: threadData.id,
          user_id: user.id
        });

      if (participantError) throw participantError;

      toast.success('Thread created successfully');
      setShowNewThreadDialog(false);
      setThreadForm({ title: '', thread_type: 'group', participants: [] });
      fetchThreads();
    } catch (error) {
      console.error('Error creating thread:', error);
      toast.error('Failed to create thread');
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return date.toLocaleDateString();
  };

  const getThreadIcon = (type: string) => {
    switch (type) {
      case 'direct':
        return <MessageCircle className="h-4 w-4" />;
      case 'group':
        return <Users className="h-4 w-4" />;
      case 'project':
        return <Hash className="h-4 w-4" />;
      default:
        return <MessageCircle className="h-4 w-4" />;
    }
  };

  const filteredThreads = threads.filter(thread =>
    thread.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return <div className="flex items-center justify-center p-8">Loading messages...</div>;
  }

  return (
    <div className="h-[calc(100vh-8rem)] flex">
      {/* Threads Sidebar */}
      <div className="w-80 border-r bg-muted/10">
        <div className="p-4 border-b">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Messages</h2>
            <Button size="sm" onClick={() => setShowNewThreadDialog(true)}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search threads..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        <ScrollArea className="h-[calc(100%-120px)]">
          <div className="p-2">
            {filteredThreads.length === 0 ? (
              <div className="text-center py-8">
                <MessageCircle className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">No threads found</p>
              </div>
            ) : (
              filteredThreads.map((thread) => (
                <div
                  key={thread.id}
                  className={`p-3 rounded-lg cursor-pointer hover:bg-muted/50 transition-colors ${
                    activeThread?.id === thread.id ? 'bg-muted' : ''
                  }`}
                  onClick={() => setActiveThread(thread)}
                >
                  <div className="flex items-start space-x-3">
                    <div className="mt-1">
                      {getThreadIcon(thread.thread_type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="font-medium truncate">{thread.title}</p>
                        <span className="text-xs text-muted-foreground">
                          {formatTime(thread.updated_at)}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {thread.participants?.length || 0} participants
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {activeThread ? (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b flex items-center justify-between">
              <div className="flex items-center space-x-3">
                {getThreadIcon(activeThread.thread_type)}
                <div>
                  <h3 className="font-medium">{activeThread.title}</h3>
                  <p className="text-sm text-muted-foreground">
                    {activeThread.participants?.length || 0} participants
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Button variant="ghost" size="sm">
                  <Phone className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm">
                  <Video className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm">
                  <Settings className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Messages */}
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.sender_id === user?.id ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[70%] rounded-lg p-3 ${
                        message.sender_id === user?.id
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted'
                      }`}
                    >
                      {message.sender_id !== user?.id && (
                        <p className="text-xs font-medium mb-1">
                          {message.sender?.full_name || 'Unknown User'}
                        </p>
                      )}
                      <p className="text-sm">{message.content}</p>
                      <p className={`text-xs mt-1 ${
                        message.sender_id === user?.id
                          ? 'text-primary-foreground/70'
                          : 'text-muted-foreground'
                      }`}>
                        {formatTime(message.created_at)}
                      </p>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            {/* Message Input */}
            <div className="p-4 border-t">
              <div className="flex items-center space-x-2">
                <Input
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type a message..."
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  className="flex-1"
                />
                <Button onClick={handleSendMessage} disabled={!newMessage.trim()}>
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <MessageCircle className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">Select a conversation</h3>
              <p className="text-muted-foreground mb-4">
                Choose from your existing conversations or start a new one
              </p>
              <Button onClick={() => setShowNewThreadDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Start New Conversation
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* New Thread Dialog */}
      <Dialog open={showNewThreadDialog} onOpenChange={setShowNewThreadDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Start New Conversation</DialogTitle>
            <DialogDescription>
              Create a new message thread for your team
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="thread-title">Thread Title</Label>
              <Input
                id="thread-title"
                value={threadForm.title}
                onChange={(e) => setThreadForm(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Enter thread title"
              />
            </div>

            <div>
              <Label htmlFor="thread-type">Thread Type</Label>
              <Select
                value={threadForm.thread_type}
                onValueChange={(value) => setThreadForm(prev => ({ ...prev, thread_type: value as any }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select thread type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="direct">Direct Message</SelectItem>
                  <SelectItem value="group">Group Chat</SelectItem>
                  <SelectItem value="project">Project Discussion</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewThreadDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateThread}>
              Create Thread
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}