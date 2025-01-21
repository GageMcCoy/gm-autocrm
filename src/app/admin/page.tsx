'use client';

import { useState, useEffect } from 'react';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import NavBar from '@/components/NavBar';

type TabType = 'analytics' | 'users' | 'tickets' | 'settings';

interface User {
  id: string;
  email: string;
  role: string;
  created_at: string;
  last_sign_in: string | null;
}

export default function AdminView() {
  const [activeTab, setActiveTab] = useState<TabType>('analytics');
  const [users, setUsers] = useState<User[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [supabase, setSupabase] = useState<SupabaseClient | null>(null);

  useEffect(() => {
    // Initialize Supabase client
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      setError('Missing Supabase credentials');
      setIsLoadingUsers(false);
      return;
    }

    const client = createClient(supabaseUrl, supabaseKey);
    setSupabase(client);
  }, []);

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

  return (
    <div className="min-h-screen bg-gray-50">
      <NavBar />
      <div className="p-6 max-w-[1600px] mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Admin Dashboard</h1>

        {/* Tab Navigation */}
        <div className="flex space-x-1 bg-white p-1 rounded-lg shadow-sm mb-6">
          <button 
            className={`flex-1 px-4 py-3 text-sm font-medium rounded-md transition-all duration-200 ${
              activeTab === 'analytics' 
                ? 'bg-primary text-white shadow-sm' 
                : 'text-gray-700 hover:bg-gray-100'
            }`}
            onClick={() => setActiveTab('analytics')}
          >
            Analytics
          </button>
          <button 
            className={`flex-1 px-4 py-3 text-sm font-medium rounded-md transition-all duration-200 ${
              activeTab === 'users' 
                ? 'bg-primary text-white shadow-sm' 
                : 'text-gray-700 hover:bg-gray-100'
            }`}
            onClick={() => setActiveTab('users')}
          >
            User Management
          </button>
          <button 
            className={`flex-1 px-4 py-3 text-sm font-medium rounded-md transition-all duration-200 ${
              activeTab === 'tickets' 
                ? 'bg-primary text-white shadow-sm' 
                : 'text-gray-700 hover:bg-gray-100'
            }`}
            onClick={() => setActiveTab('tickets')}
          >
            Ticket Management
          </button>
          <button 
            className={`flex-1 px-4 py-3 text-sm font-medium rounded-md transition-all duration-200 ${
              activeTab === 'settings' 
                ? 'bg-primary text-white shadow-sm' 
                : 'text-gray-700 hover:bg-gray-100'
            }`}
            onClick={() => setActiveTab('settings')}
          >
            System Settings
          </button>
        </div>

        {/* Tab Content */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6">
            {activeTab === 'analytics' && (
              <div>
                <div className="flex justify-between items-center mb-8">
                  <h2 className="text-2xl font-bold text-gray-900">Analytics</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {/* Analytics Cards */}
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow duration-200">
                    <div className="p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">Total Tickets</h3>
                      <p className="text-3xl font-bold text-primary">123</p>
                    </div>
                  </div>
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow duration-200">
                    <div className="p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">Open Tickets</h3>
                      <p className="text-3xl font-bold text-primary">45</p>
                    </div>
                  </div>
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow duration-200">
                    <div className="p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">Avg Response Time</h3>
                      <p className="text-3xl font-bold text-primary">2.4h</p>
                    </div>
                  </div>
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow duration-200">
                    <div className="p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">Resolution Rate</h3>
                      <p className="text-3xl font-bold text-primary">92%</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'users' && (
              <div>
                <div className="flex justify-between items-center mb-8">
                  <h2 className="text-2xl font-bold text-gray-900">User Management</h2>
                  <button className="btn btn-primary gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                    </svg>
                    Add User
                  </button>
                </div>
                
                {error && (
                  <div className="alert alert-error mb-4">
                    <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
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
                          <th className="bg-gray-50 text-gray-900">Email</th>
                          <th className="bg-gray-50 text-gray-900">Role</th>
                          <th className="bg-gray-50 text-gray-900">Joined</th>
                          <th className="bg-gray-50 text-gray-900">Last Sign In</th>
                          <th className="bg-gray-50 text-gray-900">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {users.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="text-center py-4 text-gray-500">
                              No users found
                            </td>
                          </tr>
                        ) : (
                          users.map(user => (
                            <tr key={user.id} className="hover:bg-gray-50">
                              <td className="text-gray-900">{user.email}</td>
                              <td className="text-gray-900">
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                  user.role === 'admin' ? 'bg-purple-100 text-purple-800' :
                                  user.role === 'worker' ? 'bg-blue-100 text-blue-800' :
                                  'bg-gray-100 text-gray-800'
                                }`}>
                                  {user.role}
                                </span>
                              </td>
                              <td className="text-gray-900">
                                {new Date(user.created_at).toLocaleDateString()}
                              </td>
                              <td className="text-gray-900">
                                {user.last_sign_in 
                                  ? new Date(user.last_sign_in).toLocaleDateString()
                                  : 'Never'
                                }
                              </td>
                              <td>
                                <button className="btn btn-ghost btn-sm">
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
                  <h2 className="text-2xl font-bold text-gray-900">Ticket Management</h2>
                </div>
                <div className="space-y-6">
                  <div className="flex flex-wrap gap-4">
                    <select className="select select-bordered bg-white text-gray-900 min-w-[200px]">
                      <option value="">Filter by Status</option>
                      <option value="Open">Open</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Resolved">Resolved</option>
                      <option value="Closed">Closed</option>
                    </select>
                    <select className="select select-bordered bg-white text-gray-900 min-w-[200px]">
                      <option value="">Filter by Priority</option>
                      <option value="High">High</option>
                      <option value="Medium">Medium</option>
                      <option value="Low">Low</option>
                    </select>
                    <select className="select select-bordered bg-white text-gray-900 min-w-[200px]">
                      <option value="">Filter by Assignee</option>
                      <option value="unassigned">Unassigned</option>
                      <option value="worker1">Worker 1</option>
                      <option value="worker2">Worker 2</option>
                    </select>
                  </div>
                  {/* Ticket list will go here */}
                  <div className="bg-gray-50 rounded-lg p-8 text-center">
                    <p className="text-gray-600">Ticket management features coming soon</p>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'settings' && (
              <div>
                <div className="flex justify-between items-center mb-8">
                  <h2 className="text-2xl font-bold text-gray-900">System Settings</h2>
                </div>
                <div className="max-w-2xl space-y-8">
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text text-gray-900 font-medium">System Name</span>
                    </label>
                    <input 
                      type="text" 
                      className="input input-bordered bg-white text-gray-900" 
                      value="gm-autocrm" 
                    />
                  </div>
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text text-gray-900 font-medium">Email Notifications</span>
                    </label>
                    <div className="flex items-center space-x-4 bg-white p-4 rounded-lg border border-gray-200">
                      <input type="checkbox" className="toggle toggle-primary" checked />
                      <span className="text-gray-700">Enable email notifications for new tickets</span>
                    </div>
                  </div>
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text text-gray-900 font-medium">Auto-Assignment</span>
                    </label>
                    <div className="flex items-center space-x-4 bg-white p-4 rounded-lg border border-gray-200">
                      <input type="checkbox" className="toggle toggle-primary" />
                      <span className="text-gray-700">Automatically assign tickets to available workers</span>
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
    </div>
  );
} 