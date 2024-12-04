"use client"

import { useEffect, useState } from 'react';
import { Table, Button, message } from 'antd';
import { User } from '../types/user'; // Assume you have a User interface in your types folder.
import { useSetPrimaryColor } from '../hooks/useSetPrimaryColor';

const AdminUsersPage = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  useSetPrimaryColor

  // Fetch all users
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/users');
        if (!response.ok) {
          throw new Error('Failed to fetch users');
        }
        const data = await response.json();
        setUsers(data);
      } catch (error) {
        message.error('Failed to fetch users');
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, []);

  // Delete a user
  const deleteUser = async (userId: number) => {
    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: 'DELETE',
        headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ user_id: userId }),
      });
      if (!response.ok) {
        throw new Error('Failed to delete user');
      }
      setUsers(users.filter(user => user.user_id !== userId));
      message.success('User deleted successfully');
    } catch (error) {
      message.error('Failed to delete user');
    }
  };

  const columns = [
    {
      title: 'Username',
      dataIndex: 'username',
      key: 'username',
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
    },
    {
      title: 'Role',
      dataIndex: 'role',
      key: 'role',
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, record: User) => (
        <Button
          type="primary"
          onClick={() => deleteUser(users.user_id)}
        >
          Delete
        </Button>
      ),
    },
  ];

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-semibold mb-4">Manage Users</h1>
      <Table
        dataSource={users}
        columns={columns}
        rowKey="user_id"
        loading={loading}
        pagination={false}
      />
    </div>
  );
};

export default AdminUsersPage;
