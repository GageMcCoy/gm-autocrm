'use client';

import { useState, useEffect } from 'react';
import { useSupabase } from '@/hooks/useSupabase';
import Header from '@/components/Header';

type TabType = 'analytics' | 'users' | 'tickets' | 'settings';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  created_at: string;
  updated_at: string;
}

interface AnalyticsData {
  totalTickets: number;
  openTickets: number;
  avgResponseTime: string;
  resolutionRate: string;
  isLoading: boolean;
  error: string | null;
}

interface Ticket {
  id: string;
  title: string;
  description: string;
  status: 'Open' | 'In Progress' | 'Resolved' | 'Closed' | 'Re-Opened';
  priority: 'High' | 'Medium' | 'Low';
  submitted_by: string;
  assigned_to: string | null;
  created_at: string;
  updated_at: string;
  assignee_name?: string;
  assignee_email?: string;
}

export default function AdminView() {
  const [activeTab, setActiveTab] = useState<TabType>('analytics');
  const [users, setUsers] = useState<User[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { supabase } = useSupabase();
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [autoAssignment, setAutoAssignment] = useState(false);
  const [systemName, setSystemName] = useState('gm-autocrm');
  const [analytics, setAnalytics] = useState<AnalyticsData>({
    totalTickets: 0,
    openTickets: 0,
    avgResponseTime: '0h',
    resolutionRate: '0%',
    isLoading: true,
    error: null
  });
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [filteredTickets, setFilteredTickets] = useState<Ticket[]>([]);
  const [isLoadingTickets, setIsLoadingTickets] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [priorityFilter, setPriorityFilter] = useState<string>('');
  const [assigneeFilter, setAssigneeFilter] = useState<string>('');
  const [workers, setWorkers] = useState<User[]>([]);
  const [workersError, setWorkersError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchUsers() {
      if (!supabase) return;

      try {
        setIsLoadingUsers(true);
        setError(null);
        
        const { data, error: fetchError } = await supabase
          .from('users')
          .select('*')
          .order('created_at', { ascending: false });

        console.log('Users Query Result:', { data, fetchError });

        if (fetchError) throw fetchError;
        setUsers(data || []);
      } catch (err) {
        console.error('Error fetching users:', err);
        setError('Failed to load users. Please try again later.');
      } finally {
        setIsLoadingUsers(false);
      }
    }

    if (activeTab === 'users' && supabase) {
      fetchUsers();
    }
  }, [activeTab, supabase]);

  // Fetch analytics data
  useEffect(() => {
    async function fetchAnalytics() {
      if (!supabase) return;

      try {
        setAnalytics(prev => ({ ...prev, isLoading: true, error: null }));

        // Get total tickets
        const { count: totalCount, error: totalError } = await supabase
          .from('tickets')
          .select('*', { count: 'exact' });

        if (totalError) throw totalError;

        // Get open tickets
        const { count: openCount, error: openError } = await supabase
          .from('tickets')
          .select('*', { count: 'exact' })
          .in('status', ['Open', 'In Progress']);

        if (openError) throw openError;

        // Get resolved tickets for resolution rate
        const { count: resolvedCount, error: resolvedError } = await supabase
          .from('tickets')
          .select('*', { count: 'exact' })
          .eq('status', 'Resolved');

        if (resolvedError) throw resolvedError;

        // Calculate resolution rate
        const resolutionRate = totalCount ? ((resolvedCount || 0) / totalCount * 100).toFixed(1) : '0';

        // Get average response time (time between created_at and first update)
        const { data: ticketsWithUpdates, error: updatesError } = await supabase
          .from('tickets')
          .select('created_at, updated_at')
          .not('updated_at', 'is', null);

        if (updatesError) throw updatesError;

        // Calculate average response time in hours
        let avgResponse = 0;
        if (ticketsWithUpdates && ticketsWithUpdates.length > 0) {
          const totalResponseTime = ticketsWithUpdates.reduce((acc, ticket) => {
            const created = new Date(ticket.created_at);
            const updated = new Date(ticket.updated_at);
            return acc + (updated.getTime() - created.getTime());
          }, 0);
          avgResponse = totalResponseTime / (ticketsWithUpdates.length * 3600000); // Convert to hours
        }

        setAnalytics({
          totalTickets: totalCount || 0,
          openTickets: openCount || 0,
          avgResponseTime: `${avgResponse.toFixed(1)}h`,
          resolutionRate: `${resolutionRate}%`,
          isLoading: false,
          error: null
        });

      } catch (err) {
        console.error('Error fetching analytics:', err);
        setAnalytics(prev => ({
          ...prev,
          isLoading: false,
          error: 'Failed to load analytics data'
        }));
      }
    }

    if (activeTab === 'analytics' && supabase) {
      fetchAnalytics();
    }
  }, [activeTab, supabase]);

  // Fetch tickets
  useEffect(() => {
    async function fetchTickets() {
      if (!supabase) return;

      try {
        setIsLoadingTickets(true);
        setError(null);

        const { data, error: fetchError } = await supabase
          .from('tickets')
          .select(`
            *,
            assignee:users!tickets_assigned_to_fkey (
              name,
              email
            )
          `)
          .order('created_at', { ascending: false });

        if (fetchError) throw fetchError;

        // Transform the data to include assignee details in a flattened structure
        const transformedData = (data || []).map(ticket => ({
          ...ticket,
          assignee_name: ticket.assignee?.name || null,
          assignee_email: ticket.assignee?.email || null
        }));

        setTickets(transformedData);
        setFilteredTickets(transformedData);
      } catch (err) {
        console.error('Error fetching tickets:', err);
        setError('Failed to load tickets. Please try again later.');
      } finally {
        setIsLoadingTickets(false);
      }
    }

    // Fetch workers for assignee filter
    async function fetchWorkers() {
      if (!supabase) return;

      try {
        // First, let's log all users to see what roles exist
        const { data: allUsers, error: allUsersError } = await supabase
          .from('users')
          .select('id, email, name, role');

        console.log('All users:', allUsers);

        if (allUsersError) {
          console.error('Error fetching all users:', allUsersError);
          return;
        }

        // Then try to fetch workers with case-insensitive comparison
        const { data, error: fetchError } = await supabase
          .from('users')
          .select('id, name, email, role, created_at, updated_at')
          .eq('role', 'Worker');

        if (fetchError) {
          console.error('Supabase error fetching workers:', fetchError);
          setWorkersError('Failed to load workers list');
          return;
        }

        console.log('Workers fetched:', data);
        setWorkers(data || []);
        setWorkersError(null);
      } catch (err) {
        const error = err as Error;
        console.error('Error fetching workers:', {
          message: error.message,
          stack: error.stack
        });
        setWorkersError('Failed to load workers list');
      }
    }

    if (activeTab === 'tickets' && supabase) {
      fetchTickets();
      fetchWorkers();
    }
  }, [activeTab, supabase]);

  // Apply filters
  useEffect(() => {
    let filtered = [...tickets];

    if (statusFilter) {
      filtered = filtered.filter(ticket => ticket.status === statusFilter);
    }
    if (priorityFilter) {
      filtered = filtered.filter(ticket => ticket.priority === priorityFilter);
    }
    if (assigneeFilter) {
      if (assigneeFilter === 'unassigned') {
        filtered = filtered.filter(ticket => !ticket.assigned_to);
      } else {
        filtered = filtered.filter(ticket => ticket.assigned_to === assigneeFilter);
      }
    }

    setFilteredTickets(filtered);
  }, [tickets, statusFilter, priorityFilter, assigneeFilter]);

  return (
    <div className="min-h-screen bg-gray-900">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="space-y-6">
          {/* Tab Navigation */}
          <div className="bg-gray-800 p-1 rounded-lg shadow-lg">
            <div className="flex space-x-1">
              <button 
                className={`flex-1 px-4 py-3 text-sm font-medium rounded-md transition-all duration-200 ${
                  activeTab === 'analytics' 
                    ? 'bg-primary text-white' 
                    : 'text-gray-400 hover:text-white hover:bg-gray-700'
                }`}
                onClick={() => setActiveTab('analytics')}
              >
                Analytics
              </button>
              <button 
                className={`flex-1 px-4 py-3 text-sm font-medium rounded-md transition-all duration-200 ${
                  activeTab === 'users' 
                    ? 'bg-primary text-white' 
                    : 'text-gray-400 hover:text-white hover:bg-gray-700'
                }`}
                onClick={() => setActiveTab('users')}
              >
                User Management
              </button>
              <button 
                className={`flex-1 px-4 py-3 text-sm font-medium rounded-md transition-all duration-200 ${
                  activeTab === 'tickets' 
                    ? 'bg-primary text-white' 
                    : 'text-gray-400 hover:text-white hover:bg-gray-700'
                }`}
                onClick={() => setActiveTab('tickets')}
              >
                Ticket Management
              </button>
              <button 
                className={`flex-1 px-4 py-3 text-sm font-medium rounded-md transition-all duration-200 ${
                  activeTab === 'settings' 
                    ? 'bg-primary text-white' 
                    : 'text-gray-400 hover:text-white hover:bg-gray-700'
                }`}
                onClick={() => setActiveTab('settings')}
              >
                System Settings
              </button>
            </div>
          </div>

          {/* Content Area */}
          <div className="bg-gray-800 rounded-lg shadow-lg">
            <div className="p-6">
              {activeTab === 'analytics' && (
                <div>
                  <div className="flex justify-between items-center mb-8">
                    <h2 className="text-2xl font-bold text-white">Analytics</h2>
                  </div>
                  {analytics.error ? (
                    <div className="bg-red-500/10 border border-red-500 text-red-500 p-4 rounded-lg mb-4">
                      <span>{analytics.error}</span>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                      <div className="bg-gray-700 rounded-lg p-6 border border-gray-600">
                        <h3 className="text-lg font-semibold text-white mb-2">Total Tickets</h3>
                        {analytics.isLoading ? (
                          <span className="loading loading-spinner loading-md text-primary"></span>
                        ) : (
                          <p className="text-4xl font-bold text-white">{analytics.totalTickets}</p>
                        )}
                      </div>
                      <div className="bg-gray-700 rounded-lg p-6 border border-gray-600">
                        <h3 className="text-lg font-semibold text-white mb-2">Open Tickets</h3>
                        {analytics.isLoading ? (
                          <span className="loading loading-spinner loading-md text-primary"></span>
                        ) : (
                          <p className="text-4xl font-bold text-white">{analytics.openTickets}</p>
                        )}
                      </div>
                      <div className="bg-gray-700 rounded-lg p-6 border border-gray-600">
                        <h3 className="text-lg font-semibold text-white mb-2">Avg Response Time</h3>
                        {analytics.isLoading ? (
                          <span className="loading loading-spinner loading-md text-primary"></span>
                        ) : (
                          <p className="text-4xl font-bold text-white">{analytics.avgResponseTime}</p>
                        )}
                      </div>
                      <div className="bg-gray-700 rounded-lg p-6 border border-gray-600">
                        <h3 className="text-lg font-semibold text-white mb-2">Resolution Rate</h3>
                        {analytics.isLoading ? (
                          <span className="loading loading-spinner loading-md text-primary"></span>
                        ) : (
                          <p className="text-4xl font-bold text-white">{analytics.resolutionRate}</p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'users' && (
                <div>
                  <div className="flex justify-between items-center mb-8">
                    <h2 className="text-2xl font-bold text-white">User Management</h2>
                    <button className="btn btn-primary gap-2">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                      </svg>
                      Add User
                    </button>
                  </div>
                  
                  {error && (
                    <div className="bg-red-500/10 border border-red-500 text-red-500 p-4 rounded-lg mb-4">
                      <span>{error}</span>
                    </div>
                  )}

                  {isLoadingUsers ? (
                    <div className="flex justify-center items-center py-8">
                      <span className="loading loading-spinner loading-lg text-primary"></span>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="table w-full">
                        <thead>
                          <tr>
                            <th className="bg-gray-700 text-white">Email</th>
                            <th className="bg-gray-700 text-white">Role</th>
                            <th className="bg-gray-700 text-white">Joined</th>
                            <th className="bg-gray-700 text-white">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {users.length === 0 ? (
                            <tr>
                              <td colSpan={4} className="text-center py-4 text-gray-400">
                                No users found
                              </td>
                            </tr>
                          ) : (
                            users.map(user => (
                              <tr key={user.id} className="hover:bg-gray-700/50">
                                <td className="text-white">{user.email}</td>
                                <td>
                                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                    user.role === 'Admin' ? 'bg-purple-500 text-white' :
                                    user.role === 'Worker' ? 'bg-blue-500 text-white' :
                                    'bg-gray-500 text-white'
                                  }`}>
                                    {user.role}
                                  </span>
                                </td>
                                <td className="text-gray-300">
                                  {new Date(user.created_at).toLocaleDateString()}
                                </td>
                                <td>
                                  <button className="btn btn-ghost btn-sm text-gray-300 hover:text-white">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                      <path d="M6 10a2 2 0 11-4 0 2 2 0 014 0zM12 10a2 2 0 11-4 0 2 2 0 014 0zM16 12a2 2 0 100-4 2 2 0 000 4z" />
                                    </svg>
                                  </button>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'tickets' && (
                <div>
                  <div className="flex justify-between items-center mb-8">
                    <h2 className="text-2xl font-bold text-white">Ticket Management</h2>
                  </div>
                  <div className="space-y-6">
                    <div className="flex flex-wrap gap-4">
                      <select 
                        className="select select-bordered bg-gray-700 text-white border-gray-600 min-w-[200px]"
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                      >
                        <option value="">Filter by Status</option>
                        <option value="Open">Open</option>
                        <option value="In Progress">In Progress</option>
                        <option value="Resolved">Resolved</option>
                        <option value="Closed">Closed</option>
                      </select>
                      <select 
                        className="select select-bordered bg-gray-700 text-white border-gray-600 min-w-[200px]"
                        value={priorityFilter}
                        onChange={(e) => setPriorityFilter(e.target.value)}
                      >
                        <option value="">Filter by Priority</option>
                        <option value="High">High</option>
                        <option value="Medium">Medium</option>
                        <option value="Low">Low</option>
                      </select>
                      <select 
                        className="select select-bordered bg-gray-700 text-white border-gray-600 min-w-[200px]"
                        value={assigneeFilter}
                        onChange={(e) => setAssigneeFilter(e.target.value)}
                      >
                        <option value="">Filter by Assignee</option>
                        <option value="unassigned">Unassigned</option>
                        {workersError ? (
                          <option value="" disabled>Error loading workers</option>
                        ) : (
                          workers.map(worker => (
                            <option key={worker.id} value={worker.id}>
                              {worker.email}
                            </option>
                          ))
                        )}
                      </select>
                    </div>

                    {error && (
                      <div className="bg-red-500/10 border border-red-500 text-red-500 p-4 rounded-lg">
                        <span>{error}</span>
                      </div>
                    )}

                    {isLoadingTickets ? (
                      <div className="flex justify-center items-center py-8">
                        <span className="loading loading-spinner loading-lg text-primary"></span>
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="table w-full">
                          <thead>
                            <tr>
                              <th className="bg-gray-700 text-white">Title</th>
                              <th className="bg-gray-700 text-white">Status</th>
                              <th className="bg-gray-700 text-white">Priority</th>
                              <th className="bg-gray-700 text-white">Submitted By</th>
                              <th className="bg-gray-700 text-white">Assigned To</th>
                              <th className="bg-gray-700 text-white">Created</th>
                              <th className="bg-gray-700 text-white">Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {filteredTickets.length === 0 ? (
                              <tr>
                                <td colSpan={7} className="text-center py-4 text-gray-400">
                                  No tickets found
                                </td>
                              </tr>
                            ) : (
                              filteredTickets.map(ticket => (
                                <tr key={ticket.id} className="hover:bg-gray-700/50">
                                  <td className="text-white font-medium">{ticket.title}</td>
                                  <td>
                                    <span className={`inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                      ticket.status === 'Open' ? 'bg-purple-500 text-white' :
                                      ticket.status === 'In Progress' ? 'bg-yellow-500 text-white' :
                                      ticket.status === 'Resolved' ? 'bg-green-500 text-white' :
                                      ticket.status === 'Re-Opened' ? 'bg-blue-500 text-white' :
                                      'bg-gray-500 text-white'
                                    } min-w-[80px]`}>
                                      {ticket.status}
                                    </span>
                                  </td>
                                  <td>
                                    <span className={`inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                      ticket.priority === 'High' ? 'bg-red-500 text-white' :
                                      ticket.priority === 'Medium' ? 'bg-orange-500 text-white' :
                                      'bg-green-500 text-white'
                                    } min-w-[60px]`}>
                                      {ticket.priority}
                                    </span>
                                  </td>
                                  <td className="text-gray-300">{ticket.submitted_by}</td>
                                  <td className="text-gray-300">
                                    {ticket.assignee_name || 'Unassigned'}
                                  </td>
                                  <td className="text-gray-300">
                                    {new Date(ticket.created_at).toLocaleDateString()}
                                  </td>
                                  <td>
                                    <button className="btn btn-ghost btn-sm text-gray-300 hover:text-white">
                                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                        <path d="M6 10a2 2 0 11-4 0 2 2 0 014 0zM12 10a2 2 0 11-4 0 2 2 0 014 0zM16 12a2 2 0 100-4 2 2 0 000 4z" />
                                      </svg>
                                    </button>
                                  </td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {activeTab === 'settings' && (
                <div>
                  <div className="flex justify-between items-center mb-8">
                    <h2 className="text-2xl font-bold text-white">System Settings</h2>
                  </div>
                  <div className="max-w-2xl space-y-8">
                    <div className="form-control">
                      <label className="label">
                        <span className="label-text text-white font-medium">System Name</span>
                      </label>
                      <input 
                        type="text" 
                        className="input input-bordered bg-gray-700 text-white border-gray-600" 
                        value={systemName}
                        onChange={(e) => setSystemName(e.target.value)}
                      />
                    </div>
                    <div className="form-control">
                      <label className="label">
                        <span className="label-text text-white font-medium">Email Notifications</span>
                      </label>
                      <div className="flex items-center space-x-4 bg-gray-700 p-4 rounded-lg border border-gray-600">
                        <input 
                          type="checkbox" 
                          className="toggle toggle-primary" 
                          checked={emailNotifications}
                          onChange={(e) => setEmailNotifications(e.target.checked)}
                        />
                        <span className="text-gray-300">Enable email notifications for new tickets</span>
                      </div>
                    </div>
                    <div className="form-control">
                      <label className="label">
                        <span className="label-text text-white font-medium">Auto-Assignment</span>
                      </label>
                      <div className="flex items-center space-x-4 bg-gray-700 p-4 rounded-lg border border-gray-600">
                        <input 
                          type="checkbox" 
                          className="toggle toggle-primary"
                          checked={autoAssignment}
                          onChange={(e) => setAutoAssignment(e.target.checked)}
                        />
                        <span className="text-gray-300">Automatically assign tickets to available workers</span>
                      </div>
                    </div>
                    <div className="pt-4">
                      <button className="btn btn-primary w-full md:w-auto">
                        Save Settings
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
} 