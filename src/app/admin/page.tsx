'use client';

import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useState, useEffect } from 'react';
import { Suspense } from 'react';

type TabType = 'analytics' | 'users' | 'tickets' | 'knowledge-base' | 'settings';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'worker' | 'customer';
  created_at: string;
}

interface Ticket {
  id: string;
  title: string;
  description: string;
  status: 'Open' | 'In Progress' | 'Resolved' | 'Closed';
  priority: 'High' | 'Medium' | 'Low';
  assigned_to: string | null;
  submitted_by: string;
  created_at: string;
  assignee?: {
    name: string;
    email: string;
  };
}

interface KnowledgeBaseArticle {
  id: string;
  title: string;
  content: string;
  tags: string[];
  created_by: string;
  created_at: string;
  updated_at: string;
  status: 'published' | 'draft' | 'archived';
}

interface Message {
  id: string;
  ticket_id: string;
  sender_id: string;
  sender_name: string;
  content: string;
  created_at: string;
}

// Stats component to handle data fetching
function StatsGrid() {
  const supabase = createClientComponentClient();
  const [stats, setStats] = useState({
    totalTickets: 0,
    openTickets: 0,
    avgResponse: '0h',
    resolutionRate: '0%'
  });

  // Fetch stats on component mount
  useEffect(() => {
    async function fetchStats() {
      try {
        const { data: tickets } = await supabase
          .from('tickets')
          .select('*');

        const openTickets = tickets?.filter(t => t.status === 'Open').length || 0;
        const totalTickets = tickets?.length || 0;

        setStats({
          totalTickets,
          openTickets,
          avgResponse: '1.8h', // Placeholder - implement actual calculation
          resolutionRate: '9.5%' // Placeholder - implement actual calculation
        });
      } catch (err) {
        console.error('Error fetching stats:', err);
      }
    }

    fetchStats();
  }, [supabase]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
      <div className="card bg-gray-800/50 aspect-square">
        <div className="card-body flex flex-col items-center text-center">
          <div className="flex-1 flex items-end">
            <h3 className="text-gray-400 text-base font-normal">Total Tickets</h3>
          </div>
          <div className="flex-[2] flex items-center">
            <div className="text-7xl font-bold text-primary">{stats.totalTickets}</div>
          </div>
          <div className="flex-1 flex items-start">
            <p className="text-gray-400 text-sm">All time tickets</p>
          </div>
        </div>
      </div>

      <div className="card bg-gray-800/50 aspect-square">
        <div className="card-body flex flex-col items-center text-center">
          <div className="flex-1 flex items-end">
            <h3 className="text-gray-400 text-base font-normal">Open Tickets</h3>
          </div>
          <div className="flex-[2] flex items-center">
            <div className="text-7xl font-bold text-secondary">{stats.openTickets}</div>
          </div>
          <div className="flex-1 flex items-start">
            <p className="text-gray-400 text-sm">Awaiting response</p>
          </div>
        </div>
      </div>

      <div className="card bg-gray-800/50 aspect-square">
        <div className="card-body flex flex-col items-center text-center">
          <div className="flex-1 flex items-end">
            <h3 className="text-gray-400 text-base font-normal">Avg Response</h3>
          </div>
          <div className="flex-[2] flex items-center">
            <div className="text-7xl font-bold text-accent">{stats.avgResponse}</div>
          </div>
          <div className="flex-1 flex items-start">
            <p className="text-gray-400 text-sm">First response time</p>
          </div>
        </div>
      </div>

      <div className="card bg-gray-800/50 aspect-square">
        <div className="card-body flex flex-col items-center text-center">
          <div className="flex-1 flex items-end">
            <h3 className="text-gray-400 text-base font-normal">Resolution Rate</h3>
          </div>
          <div className="flex-[2] flex items-center">
            <div className="text-7xl font-bold text-success">{stats.resolutionRate}</div>
          </div>
          <div className="flex-1 flex items-start">
            <p className="text-gray-400 text-sm">Successfully resolved</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// Loading fallback component
function StatsLoading() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="card bg-gray-800/50 aspect-square animate-pulse">
          <div className="card-body flex flex-col items-center">
            <div className="flex-1 flex items-end">
              <div className="h-4 bg-gray-700 rounded w-24"></div>
            </div>
            <div className="flex-[2] flex items-center">
              <div className="h-16 bg-gray-700 rounded w-20"></div>
            </div>
            <div className="flex-1 flex items-start">
              <div className="h-3 bg-gray-700 rounded w-20"></div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// Users Tab Component
function UsersTab() {
  const supabase = createClientComponentClient();
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    async function fetchUsers() {
      try {
        setIsLoading(true);
        setError(null);
        
        const { data, error: fetchError } = await supabase
          .from('users')
          .select('*')
          .order('created_at', { ascending: false });

        if (fetchError) throw fetchError;
        setUsers(data || []);
      } catch (err) {
        console.error('Error fetching users:', err);
        setError('Failed to load users. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    }

    fetchUsers();
  }, [supabase]);

  // Filter users based on search query
  const filteredUsers = users.filter(user => 
    user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.role.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Get appropriate color for role badge
  const getRoleColor = (role: string) => {
    switch (role) {
      case 'Admin':
        return 'bg-rose-500/10 text-rose-500 ring-1 ring-rose-500/20';
      case 'Worker':
        return 'bg-indigo-500/10 text-indigo-500 ring-1 ring-indigo-500/20';
      case 'Customer':
        return 'bg-emerald-500/10 text-emerald-500 ring-1 ring-emerald-500/20';
      default:
        return 'bg-gray-500/10 text-gray-500 ring-1 ring-gray-500/20';
    }
  };

  if (error) {
    return (
      <div className="bg-gray-800/50 rounded-lg p-4">
        <div className="alert alert-error">
          <span>{error}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <input
          type="text"
          placeholder="Search users..."
          className="input input-ghost w-[300px] bg-gray-900/50 text-gray-300"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <button className="btn btn-primary bg-indigo-500 hover:bg-indigo-600">Add User</button>
      </div>

      <div className="overflow-x-auto">
        {isLoading ? (
          <div className="flex justify-center items-center h-32">
            <span className="loading loading-spinner loading-lg"></span>
          </div>
        ) : (
          <table className="table w-full">
            <thead>
              <tr className="border-b border-gray-800">
                <th className="text-gray-400 font-normal">Name</th>
                <th className="text-gray-400 font-normal">Email</th>
                <th className="text-gray-400 font-normal">Role</th>
                <th className="text-gray-400 font-normal">Created</th>
                <th className="text-gray-400 font-normal">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user) => (
                <tr key={user.id} className="border-b border-gray-800/50">
                  <td className="text-gray-300">{user.name}</td>
                  <td className="text-gray-300">{user.email}</td>
                  <td>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getRoleColor(user.role)}`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="text-gray-400">{new Date(user.created_at).toLocaleDateString()}</td>
                  <td>
                    <button className="text-gray-400 hover:text-gray-200">Edit</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

// Tickets Tab Component
function TicketsTab() {
  const supabase = createClientComponentClient();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [workers, setWorkers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [assigneeFilter, setAssigneeFilter] = useState('');
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);

  useEffect(() => {
    async function fetchData() {
      try {
        setIsLoading(true);
        setError(null);
        
        // Fetch tickets with assignee information
        const { data: ticketsData, error: ticketsError } = await supabase
          .from('tickets')
          .select(`
            *,
            assignee:users!tickets_assigned_to_fkey (
              name,
              email
            )
          `)
          .order('created_at', { ascending: false });

        if (ticketsError) throw ticketsError;

        // Fetch workers for the assignee filter
        const { data: workersData, error: workersError } = await supabase
          .from('users')
          .select('*')
          .eq('role', 'Worker');

        if (workersError) throw workersError;

        setTickets(ticketsData || []);
        setWorkers(workersData || []);
      } catch (err) {
        console.error('Error fetching tickets:', err);
        setError('Failed to load tickets. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, [supabase]);

  // Filter tickets based on selected filters
  const filteredTickets = tickets.filter(ticket => {
    const matchesStatus = !statusFilter || ticket.status === statusFilter;
    const matchesPriority = !priorityFilter || ticket.priority === priorityFilter;
    const matchesAssignee = !assigneeFilter || 
      (assigneeFilter === 'unassigned' ? !ticket.assigned_to : ticket.assigned_to === assigneeFilter);
    return matchesStatus && matchesPriority && matchesAssignee;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Open':
        return 'bg-blue-500/10 text-blue-500 ring-1 ring-blue-500/20';
      case 'In Progress':
        return 'bg-amber-500/10 text-amber-500 ring-1 ring-amber-500/20';
      case 'Resolved':
        return 'bg-emerald-500/10 text-emerald-500 ring-1 ring-emerald-500/20';
      case 'Closed':
        return 'bg-gray-500/10 text-gray-500 ring-1 ring-gray-500/20';
      default:
        return 'bg-gray-500/10 text-gray-500 ring-1 ring-gray-500/20';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'High':
        return 'bg-rose-500/10 text-rose-500 ring-1 ring-rose-500/20';
      case 'Medium':
        return 'bg-amber-500/10 text-amber-500 ring-1 ring-amber-500/20';
      case 'Low':
        return 'bg-emerald-500/10 text-emerald-500 ring-1 ring-emerald-500/20';
      default:
        return 'bg-gray-500/10 text-gray-500 ring-1 ring-gray-500/20';
    }
  };

  const loadMessages = async (ticketId: string) => {
    if (!supabase) return;

    try {
      setIsLoadingMessages(true);
      
      const { data: messagesData, error: messagesError } = await supabase
        .from('messages')
        .select('*')
        .eq('ticket_id', ticketId)
        .order('created_at', { ascending: true });

      if (messagesError) throw messagesError;
      setMessages(messagesData || []);
    } catch (err) {
      console.error('Error loading messages:', err);
      setMessages([]);
    } finally {
      setIsLoadingMessages(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase || !selectedTicket || !newMessage.trim()) return;

    try {
      // Send user message
      const { error: insertError } = await supabase
        .from('messages')
        .insert({
          ticket_id: selectedTicket.id,
          sender_id: (await supabase.auth.getUser()).data.user?.id,
          content: newMessage.trim()
        });

      if (insertError) throw insertError;

      // Clear input and refresh messages
      setNewMessage('');
      await loadMessages(selectedTicket.id);

      // Format conversation history
      const formattedHistory = messages.map(msg => ({
        role: msg.sender_id === 'AI_ASSISTANT' ? 'assistant' as const : 'user' as const,
        content: msg.content
      }));

      // Generate and send AI response
      const response = await fetch('/api/ai', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          operation: 'generateFollowUpResponse',
          ticketId: selectedTicket.id,
          title: selectedTicket.title,
          userMessage: newMessage.trim(),
          conversationHistory: formattedHistory,
          ticketStatus: selectedTicket.status,
          similarArticles: [] // You can add relevant KB articles here
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate AI response');
      }

      const aiResponse = await response.json();

      // Save AI response to messages
      const { error: aiError } = await supabase
        .from('messages')
        .insert({
          ticket_id: selectedTicket.id,
          sender_id: 'AI_ASSISTANT',
          sender_name: 'AI Assistant',
          content: aiResponse.message
        });

      if (aiError) throw aiError;

      // Refresh messages to show AI response
      await loadMessages(selectedTicket.id);
    } catch (err) {
      console.error('Error sending message:', err);
      setError('Failed to send message');
    }
  };

  const handleView = (ticket: Ticket) => {
    setSelectedTicket(ticket);
    loadMessages(ticket.id);
    setIsViewModalOpen(true);
  };

  if (error) {
    return (
      <div className="bg-gray-800/50 rounded-lg p-4">
        <div className="alert alert-error">
          <span>{error}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex gap-4">
        <select 
          className="select select-bordered bg-gray-800/50"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="">All Statuses</option>
          <option value="Open">Open</option>
          <option value="In Progress">In Progress</option>
          <option value="Resolved">Resolved</option>
          <option value="Closed">Closed</option>
        </select>

        <select 
          className="select select-bordered bg-gray-800/50"
          value={priorityFilter}
          onChange={(e) => setPriorityFilter(e.target.value)}
        >
          <option value="">All Priorities</option>
          <option value="High">High</option>
          <option value="Medium">Medium</option>
          <option value="Low">Low</option>
        </select>

        <select 
          className="select select-bordered bg-gray-800/50"
          value={assigneeFilter}
          onChange={(e) => setAssigneeFilter(e.target.value)}
        >
          <option value="">All Assignees</option>
          <option value="unassigned">Unassigned</option>
          {workers.map((worker) => (
            <option key={worker.id} value={worker.id}>
              {worker.name}
            </option>
          ))}
        </select>
      </div>

      <div className="bg-gray-800/50 rounded-lg">
        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="flex justify-center items-center h-32">
              <span className="loading loading-spinner loading-lg"></span>
            </div>
          ) : (
            <table className="table w-full">
              <thead>
                <tr className="border-b border-gray-800">
                  <th className="text-gray-400 font-normal">Title</th>
                  <th className="text-gray-400 font-normal">Status</th>
                  <th className="text-gray-400 font-normal">Priority</th>
                  <th className="text-gray-400 font-normal">Assignee</th>
                  <th className="text-gray-400 font-normal">Created</th>
                  <th className="text-gray-400 font-normal">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredTickets.map((ticket) => (
                  <tr key={ticket.id} className="border-b border-gray-800/50">
                    <td className="text-gray-300">{ticket.title}</td>
                    <td>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(ticket.status)}`}>
                        {ticket.status}
                      </span>
                    </td>
                    <td>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${getPriorityColor(ticket.priority)}`}>
                        {ticket.priority}
                      </span>
                    </td>
                    <td className="text-gray-300">
                      {ticket.assignee?.name || 'Unassigned'}
                    </td>
                    <td className="text-gray-400">
                      {new Date(ticket.created_at).toLocaleDateString()}
                    </td>
                    <td>
                      <button 
                        className="text-gray-400 hover:text-gray-200"
                        onClick={() => handleView(ticket)}
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* View Modal with Chat */}
      {isViewModalOpen && selectedTicket && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 w-full max-w-4xl space-y-4">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-xl font-semibold text-gray-200">{selectedTicket.title}</h3>
                <p className="text-gray-400 mt-1">{selectedTicket.description}</p>
              </div>
              <button 
                className="btn btn-sm btn-ghost"
                onClick={() => setIsViewModalOpen(false)}
              >
                ✕
              </button>
            </div>

            {/* Messages Section */}
            <div className="bg-gray-900/50 rounded-lg p-4">
              <div className="h-96 overflow-y-auto space-y-4 mb-4">
                {isLoadingMessages ? (
                  <div className="flex justify-center items-center h-full">
                    <span className="loading loading-spinner loading-lg"></span>
                  </div>
                ) : messages.length > 0 ? (
                  messages.map((message) => (
                    <div 
                      key={message.id} 
                      className={`flex ${message.sender_id === 'AI_ASSISTANT' ? 'justify-start' : 'justify-end'}`}
                    >
                      <div className={`max-w-[80%] ${
                        message.sender_id === 'AI_ASSISTANT' 
                          ? 'bg-gray-700/50' 
                          : 'bg-indigo-500/10'
                      } rounded-lg p-4`}>
                        <div className="flex justify-between items-start gap-4 mb-1">
                          <span className={`text-sm font-medium ${
                            message.sender_id === 'AI_ASSISTANT'
                              ? 'text-blue-400'
                              : 'text-indigo-400'
                          }`}>
                            {message.sender_name || 'Unknown'}
                          </span>
                          <span className="text-xs text-gray-400">
                            {new Date(message.created_at).toLocaleString()}
                          </span>
                        </div>
                        <p className="text-gray-200 whitespace-pre-wrap">
                          {message.content}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-gray-400 text-center py-8">
                    No messages yet
                  </div>
                )}
              </div>

              {/* Message Input */}
              <form onSubmit={handleSendMessage} className="flex gap-2">
                <input
                  type="text"
                  placeholder="Type your message..."
                  className="input input-bordered flex-1 bg-gray-700 text-white"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                />
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={!newMessage.trim()}
                >
                  Send
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Knowledge Base Tab Component
function KnowledgeBaseTab() {
  const supabase = createClientComponentClient();
  const [articles, setArticles] = useState<KnowledgeBaseArticle[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedArticle, setSelectedArticle] = useState<KnowledgeBaseArticle | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [isNewArticleModalOpen, setIsNewArticleModalOpen] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [editForm, setEditForm] = useState({
    title: '',
    content: '',
    tags: [] as string[],
    status: 'draft' as 'published' | 'draft' | 'archived'
  });

  useEffect(() => {
    fetchArticles();
  }, [supabase]);

  async function fetchArticles() {
    try {
      setIsLoading(true);
      setError(null);
      
      const { data, error: fetchError } = await supabase
        .from('knowledge_base_articles')
        .select(`
          *,
          author:users!knowledge_base_articles_created_by_fkey (
            name,
            email
          )
        `)
        .order('updated_at', { ascending: false });

      if (fetchError) throw fetchError;
      
      const transformedData = data?.map(article => ({
        ...article,
        status: article.status.charAt(0).toUpperCase() + article.status.slice(1)
      })) || [];
      
      setArticles(transformedData);
    } catch (err) {
      console.error('Error fetching articles:', err);
      setError('Failed to load knowledge base articles. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  }

  const handleEdit = (article: KnowledgeBaseArticle) => {
    setSelectedArticle(article);
    setEditForm({
      title: article.title,
      content: article.content,
      tags: article.tags,
      status: article.status as 'published' | 'draft' | 'archived'
    });
    setIsEditModalOpen(true);
  };

  const handlePreview = (article: KnowledgeBaseArticle) => {
    setSelectedArticle(article);
    setIsPreviewModalOpen(true);
  };

  const handleSave = async () => {
    if (!selectedArticle) return;

    try {
      const { error: updateError } = await supabase
        .from('knowledge_base_articles')
        .update({
          title: editForm.title,
          content: editForm.content,
          tags: editForm.tags,
          status: editForm.status,
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedArticle.id);

      if (updateError) throw updateError;

      // Refresh articles list
      await fetchArticles();
      setIsEditModalOpen(false);
    } catch (err) {
      console.error('Error updating article:', err);
      // You might want to show an error toast here
    }
  };

  const handleSync = async () => {
    try {
      setIsSyncing(true);
      const response = await fetch('/api/knowledge/sync', {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Failed to sync knowledge base');
      }

      // Refresh the articles list after sync
      await fetchArticles();
    } catch (err) {
      console.error('Error syncing articles:', err);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleCreateNew = () => {
    setEditForm({
      title: '',
      content: '',
      tags: [],
      status: 'draft'
    });
    setIsNewArticleModalOpen(true);
  };

  const handleSaveNew = async () => {
    try {
      const { error: createError } = await supabase
        .from('knowledge_base_articles')
        .insert({
          title: editForm.title,
          content: editForm.content,
          tags: editForm.tags,
          status: editForm.status.toLowerCase(),
          created_by: (await supabase.auth.getUser()).data.user?.id,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });

      if (createError) throw createError;

      // Refresh articles list
      await fetchArticles();
      setIsNewArticleModalOpen(false);
    } catch (err) {
      console.error('Error creating article:', err);
    }
  };

  const getTagColor = (tag: string) => {
    return 'bg-indigo-500/10 text-indigo-500 ring-1 ring-indigo-500/20';
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'published':
        return 'bg-emerald-500/10 text-emerald-500 ring-1 ring-emerald-500/20';
      case 'draft':
        return 'bg-amber-500/10 text-amber-500 ring-1 ring-amber-500/20';
      case 'archived':
        return 'bg-gray-500/10 text-gray-500 ring-1 ring-gray-500/20';
      default:
        return 'bg-gray-500/10 text-gray-500 ring-1 ring-gray-500/20';
    }
  };

  if (error) {
    return (
      <div className="bg-gray-800/50 rounded-lg p-4">
        <div className="alert alert-error">
          <span>{error}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-200">Knowledge Base Articles</h2>
        <div className="flex gap-3">
          <button 
            className={`btn btn-outline ${isSyncing ? 'loading' : ''}`}
            onClick={handleSync}
            disabled={isSyncing}
          >
            {isSyncing ? 'Syncing...' : 'Sync Articles'}
          </button>
          <button 
            className="btn btn-primary bg-indigo-500 hover:bg-indigo-600"
            onClick={handleCreateNew}
          >
            New Article
          </button>
        </div>
      </div>

      <div className="bg-gray-800/50 rounded-lg">
        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="flex justify-center items-center h-32">
              <span className="loading loading-spinner loading-lg"></span>
            </div>
          ) : (
            <table className="table w-full">
              <thead>
                <tr className="border-b border-gray-800">
                  <th className="text-gray-400 font-normal">Title</th>
                  <th className="text-gray-400 font-normal">Tags</th>
                  <th className="text-gray-400 font-normal">Last Updated</th>
                  <th className="text-gray-400 font-normal">Status</th>
                  <th className="text-gray-400 font-normal">Actions</th>
                </tr>
              </thead>
              <tbody>
                {articles.map((article) => (
                  <tr key={article.id} className="border-b border-gray-800/50">
                    <td className="text-gray-300">{article.title}</td>
                    <td className="text-gray-300">
                      <div className="flex gap-2 flex-wrap">
                        {article.tags?.map((tag, index) => (
                          <span key={index} className={`px-2 py-1 rounded-full text-xs font-medium ${getTagColor(tag)}`}>
                            {tag}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="text-gray-400">
                      {new Date(article.updated_at).toLocaleDateString()}
                    </td>
                    <td>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(article.status)}`}>
                        {article.status === 'published' ? 'Published' : 
                         article.status === 'draft' ? 'Draft' : 
                         article.status === 'archived' ? 'Archived' : article.status}
                      </span>
                    </td>
                    <td className="space-x-2">
                      <button 
                        className="text-gray-400 hover:text-gray-200"
                        onClick={() => handleEdit(article)}
                      >
                        Edit
                      </button>
                      <button 
                        className="text-gray-400 hover:text-gray-200"
                        onClick={() => handlePreview(article)}
                      >
                        Preview
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Edit Modal */}
      {isEditModalOpen && selectedArticle && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 w-full max-w-2xl space-y-4">
            <h3 className="text-xl font-semibold text-gray-200">Edit Article</h3>
            
            <div className="form-control">
              <label className="label">
                <span className="label-text text-gray-300">Title</span>
              </label>
              <input
                type="text"
                className="input input-bordered bg-gray-700 text-gray-200"
                value={editForm.title}
                onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
              />
            </div>

            <div className="form-control">
              <label className="label">
                <span className="label-text text-gray-300">Content</span>
              </label>
              <textarea
                className="textarea textarea-bordered bg-gray-700 text-gray-200 h-48"
                value={editForm.content}
                onChange={(e) => setEditForm({ ...editForm, content: e.target.value })}
              />
            </div>

            <div className="form-control">
              <label className="label">
                <span className="label-text text-gray-300">Tags (comma-separated)</span>
              </label>
              <input
                type="text"
                className="input input-bordered bg-gray-700 text-gray-200"
                value={editForm.tags.join(', ')}
                onChange={(e) => setEditForm({ ...editForm, tags: e.target.value.split(',').map(tag => tag.trim()) })}
              />
            </div>

            <div className="form-control">
              <label className="label">
                <span className="label-text text-gray-300">Status</span>
              </label>
              <select
                className="select select-bordered bg-gray-700 text-gray-200"
                value={editForm.status}
                onChange={(e) => setEditForm({ ...editForm, status: e.target.value.toLowerCase() as 'published' | 'draft' | 'archived' })}
              >
                <option value="draft">Draft</option>
                <option value="published">Published</option>
                <option value="archived">Archived</option>
              </select>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button 
                className="btn btn-ghost"
                onClick={() => setIsEditModalOpen(false)}
              >
                Cancel
              </button>
              <button 
                className="btn btn-primary"
                onClick={handleSave}
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {isPreviewModalOpen && selectedArticle && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 w-full max-w-2xl space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-semibold text-gray-200">{selectedArticle.title}</h3>
              <button 
                className="btn btn-sm btn-ghost"
                onClick={() => setIsPreviewModalOpen(false)}
              >
                ✕
              </button>
            </div>
            
            <div className="flex gap-2 flex-wrap">
              {selectedArticle.tags?.map((tag, index) => (
                <span key={index} className={`px-2 py-1 rounded-full text-xs font-medium ${getTagColor(tag)}`}>
                  {tag}
                </span>
              ))}
            </div>

            <div className="prose prose-invert max-w-none">
              <div className="bg-gray-700/50 rounded-lg p-4 text-gray-200 whitespace-pre-wrap">
                {selectedArticle.content}
              </div>
            </div>

            <div className="flex justify-between items-center text-sm text-gray-400 mt-4">
              <span>Last updated: {new Date(selectedArticle.updated_at).toLocaleDateString()}</span>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(selectedArticle.status)}`}>
                {selectedArticle.status}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* New Article Modal */}
      {isNewArticleModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 w-full max-w-2xl space-y-4">
            <h3 className="text-xl font-semibold text-gray-200">Create New Article</h3>
            
            <div className="form-control">
              <label className="label">
                <span className="label-text text-gray-300">Title</span>
              </label>
              <input
                type="text"
                className="input input-bordered bg-gray-700 text-gray-200"
                value={editForm.title}
                onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                placeholder="Enter article title"
              />
            </div>

            <div className="form-control">
              <label className="label">
                <span className="label-text text-gray-300">Content</span>
              </label>
              <textarea
                className="textarea textarea-bordered bg-gray-700 text-gray-200 h-48"
                value={editForm.content}
                onChange={(e) => setEditForm({ ...editForm, content: e.target.value })}
                placeholder="Write your article content here..."
              />
            </div>

            <div className="form-control">
              <label className="label">
                <span className="label-text text-gray-300">Tags (comma-separated)</span>
              </label>
              <input
                type="text"
                className="input input-bordered bg-gray-700 text-gray-200"
                value={editForm.tags.join(', ')}
                onChange={(e) => setEditForm({ ...editForm, tags: e.target.value.split(',').map(tag => tag.trim()) })}
                placeholder="account, billing, features, etc."
              />
            </div>

            <div className="form-control">
              <label className="label">
                <span className="label-text text-gray-300">Status</span>
              </label>
              <select
                className="select select-bordered bg-gray-700 text-gray-200"
                value={editForm.status}
                onChange={(e) => setEditForm({ ...editForm, status: e.target.value.toLowerCase() as 'published' | 'draft' | 'archived' })}
              >
                <option value="draft">Draft</option>
                <option value="published">Published</option>
                <option value="archived">Archived</option>
              </select>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button 
                className="btn btn-ghost"
                onClick={() => setIsNewArticleModalOpen(false)}
              >
                Cancel
              </button>
              <button 
                className="btn btn-primary"
                onClick={handleSaveNew}
              >
                Create Article
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Settings Tab Component
function SettingsTab() {
  return (
    <div className="max-w-2xl bg-gray-800/50 rounded-lg p-8">
      <div className="space-y-6">
        <div className="form-control">
          <label className="label cursor-pointer">
            <span className="label-text text-white">Email Notifications</span>
            <input
              type="checkbox"
              className="toggle"
              defaultChecked
            />
          </label>
        </div>

        <div className="form-control">
          <label className="label cursor-pointer">
            <span className="label-text text-white">Auto Assignment</span>
            <input
              type="checkbox"
              className="toggle"
            />
          </label>
        </div>

        <div className="form-control">
          <label className="label">
            <span className="label-text text-white">System Name</span>
          </label>
          <input
            type="text"
            className="input input-bordered bg-gray-700 text-white"
            defaultValue="gm-autocrm"
          />
        </div>

        <div className="form-control">
          <label className="label">
            <span className="label-text text-white">Support Email</span>
          </label>
          <input
            type="email"
            className="input input-bordered bg-gray-700 text-white"
            defaultValue="support@example.com"
          />
        </div>

        <button className="btn btn-primary w-full">
          Save Changes
        </button>
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<TabType>('analytics');

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold text-gray-200">Admin Dashboard</h1>

      {/* Navigation */}
      <div className="tabs tabs-boxed bg-base-200 p-1">
        <button 
          className={`tab ${activeTab === 'analytics' ? 'tab-active' : ''}`}
          onClick={() => setActiveTab('analytics')}
        >
          Analytics
        </button>
        <button 
          className={`tab ${activeTab === 'users' ? 'tab-active' : ''}`}
          onClick={() => setActiveTab('users')}
        >
          Users
        </button>
        <button 
          className={`tab ${activeTab === 'tickets' ? 'tab-active' : ''}`}
          onClick={() => setActiveTab('tickets')}
        >
          Tickets
        </button>
        <button 
          className={`tab ${activeTab === 'knowledge-base' ? 'tab-active' : ''}`}
          onClick={() => setActiveTab('knowledge-base')}
        >
          Knowledge Base
        </button>
        <button 
          className={`tab ${activeTab === 'settings' ? 'tab-active' : ''}`}
          onClick={() => setActiveTab('settings')}
        >
          Settings
        </button>
      </div>

      {/* Tab Content */}
      <div className="mt-6">
        {activeTab === 'analytics' && (
          <Suspense fallback={<StatsLoading />}>
            <StatsGrid />
          </Suspense>
        )}
        {activeTab === 'users' && <UsersTab />}
        {activeTab === 'tickets' && <TicketsTab />}
        {activeTab === 'knowledge-base' && <KnowledgeBaseTab />}
        {activeTab === 'settings' && <SettingsTab />}
      </div>
    </div>
  );
} 