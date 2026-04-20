"use client";

import { useEffect, useState } from "react";
import { Table, Button, message, Select, Input } from "antd";
import { User } from "../types/user";
import Navbar from "@/components/navbar";
import { useSetPrimaryColor } from "../hooks/useSetPrimaryColor";

const { Option } = Select;
const { Search } = Input;

const AdminUsersPage = () => {
    const [users, setUsers] = useState<User[]>([]);
    const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [sortBy, setSortBy] = useState<string>("newest");
    const [roleFilter, setRoleFilter] = useState<string>("all");
    const [searchTerm, setSearchTerm] = useState<string>("");



    // Fetch all users
    useEffect(() => {
        const fetchUsers = async () => {
            try {
                setLoading(true);
                const response = await fetch("/api/v1/admin/users");
                if (!response.ok) {
                    throw new Error("Failed to fetch users");
                }
                const data = await response.json();
                setUsers(data);
                setFilteredUsers(data);
            } catch (error) {
                message.error("Failed to fetch users");
            } finally {
                setLoading(false);
            }
        };
        fetchUsers();
    }, []);

    // Apply filters and sorting
    useEffect(() => {
        let result = [...users];

        // Filter by role
        if (roleFilter !== "all") {
            result = result.filter((user) => user.role === roleFilter);
        }

        // Filter by search term
        if (searchTerm) {
            result = result.filter(
                (user) =>
                    user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    user.name?.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        // Sort
        result.sort((a, b) => {
            if (sortBy === "newest") {
                return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
            } else if (sortBy === "oldest") {
                return new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime();
            } else if (sortBy === "name") {
                return (a.name || "").localeCompare(b.name || "");
            }
            return 0;
        });

        setFilteredUsers(result);
    }, [users, sortBy, roleFilter, searchTerm]);

    // Delete a user
    const deleteUser = async (userId: number) => {
        try {
            const response = await fetch(`/api/v1/admin/users`, {
                method: "DELETE",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ user_id: userId }),
            });
            if (!response.ok) {
                throw new Error("Failed to delete user");
            }
            setUsers(users.filter((user) => user.user_id !== userId));
            message.success("User deleted successfully");
        } catch (error) {
            message.error("Failed to delete user");
        }
    };

    const columns = [
        {
            title: "User ID",
            dataIndex: "user_id",
            key: "user_id",
            responsive: ["md"] as any,
        },
        {
            title: "Name",
            dataIndex: "name",
            key: "name",
            render: (name: string) => name || "N/A",
        },
        {
            title: "Email",
            dataIndex: "email",
            key: "email",
        },
        {
            title: "Role",
            dataIndex: "role",
            key: "role",
            responsive: ["sm"] as any,
        },
        {
            title: "Joined",
            dataIndex: "created_at",
            key: "created_at",
            responsive: ["lg"] as any,
            render: (date: string) => date ? new Date(date).toLocaleDateString() : "N/A",
        },
        {
            title: "Actions",
            key: "actions",
            render: (_: any, record: User) => (
                <Button
                    type="primary"
                    danger
                    size="small"
                    className="rounded-lg"
                    onClick={() => deleteUser(_.user_id)}
                >
                    Delete
                </Button>
            ),
        },
    ];

    return (
        <>

            <div className="bg-gray-100 min-h-screen px-4 md:px-10 py-8">
                <div className="container mx-auto">
                    <h1 className="text-2xl font-semibold mb-6">
                        Manage Users
                    </h1>

                    {/* Filters and Search */}
                    <div className="bg-white p-4 rounded-lg shadow mb-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {/* Search */}
                            <div>
                                <label className="block text-sm font-medium mb-2">Search Users</label>
                                <Search
                                    placeholder="Search by name or email"
                                    allowClear
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full"
                                />
                            </div>

                            {/* Role Filter */}
                            <div>
                                <label className="block text-sm font-medium mb-2">Filter by Role</label>
                                <Select
                                    value={roleFilter}
                                    onChange={setRoleFilter}
                                    className="w-full"
                                >
                                    <Option value="all">All Roles</Option>
                                    <Option value="regular user">Regular User</Option>
                                    <Option value="vet">Veterinarian</Option>
                                    <Option value="shelter admin">Shelter Admin</Option>
                                    <Option value="shop admin">Shop Admin</Option>
                                    <Option value="admin">Admin</Option>
                                </Select>
                            </div>

                            {/* Sort */}
                            <div>
                                <label className="block text-sm font-medium mb-2">Sort By</label>
                                <Select
                                    value={sortBy}
                                    onChange={setSortBy}
                                    className="w-full"
                                >
                                    <Option value="newest">Newest First</Option>
                                    <Option value="oldest">Oldest First</Option>
                                    <Option value="name">Name (A-Z)</Option>
                                </Select>
                            </div>
                        </div>

                        {/* Results Count */}
                        <div className="mt-4 text-sm text-gray-600">
                            Showing {filteredUsers.length} of {users.length} users
                        </div>
                    </div>

                    {/* Table */}
                    <div className="bg-white rounded-lg shadow overflow-hidden">
                        <Table
                            dataSource={filteredUsers}
                            columns={columns}
                            rowKey="user_id"
                            loading={loading}
                            pagination={{
                                pageSize: 10,
                                showSizeChanger: true,
                                showTotal: (total) => `Total ${total} users`,
                                responsive: true,
                            }}
                            scroll={{ x: 768 }}
                        />
                    </div>
                </div>
            </div>
        </>
    );
};

export default AdminUsersPage;
