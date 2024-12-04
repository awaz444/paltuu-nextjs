"use client";

import { useEffect, useState } from "react";
import { Table, Button, message } from "antd";
import { User } from "../types/user"; // Assume you have a User interface in your types folder.
import Navbar from "@/components/navbar";
import { useSetPrimaryColor } from "../hooks/useSetPrimaryColor";

const AdminUsersPage = () => {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState<boolean>(false);

    useSetPrimaryColor();

    // Fetch all users
    useEffect(() => {
        const fetchUsers = async () => {
            try {
                setLoading(true);
                const response = await fetch("/api/users");
                if (!response.ok) {
                    throw new Error("Failed to fetch users");
                }
                const data = await response.json();
                setUsers(data);
            } catch (error) {
                message.error("Failed to fetch users");
            } finally {
                setLoading(false);
            }
        };
        fetchUsers();
    }, []);

    // Delete a user
    const deleteUser = async (userId: number) => {
        try {
            const response = await fetch(`/api/users`, {
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
        },
        {
            title: "Actions",
            key: "actions",
            render: (_: any, record: User) => (
                <Button type="primary" className="bg-primary hover:bg-primary rounded-3xl" onClick={() => deleteUser(_.user_id)}>
                    Delete
                </Button>
            ),
        },
    ];

    return (
        <>
            <Navbar />
            <div className="bg-gray-100 min-h-screen px-10 py-8">
                <div className="container">
                    <h1 className="text-2xl font-semibold mb-4">
                        Manage Users
                    </h1>
                    <Table
                        dataSource={users}
                        columns={columns}
                        rowKey="user_id"
                        loading={loading}
                        pagination={false}
                    />
                </div>
            </div>
        </>
    );
};

export default AdminUsersPage;
