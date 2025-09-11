"use client";
import React, { useState, useEffect } from "react";
import { PlusOutlined, LoadingOutlined } from "@ant-design/icons";
import { Modal, Form, message, Button, Select, Input } from "antd";

interface Schedule {
    availability_id: number;
    vet_id: number;
    day_of_week: string;
    start_time: string;
    end_time: string;
}

const VetScheduleTab = () => {
    const [schedule, setSchedule] = useState<Schedule[]>([]);
    const [vetId, setVetId] = useState<string | null>(null);
    const [editing, setEditing] = useState(false);
    const [loading, setLoading] = useState(true);
    const [scheduleModalVisible, setScheduleModalVisible] = useState(false);
    const [scheduleForm] = Form.useForm();
    const [submittingSchedule, setSubmittingSchedule] = useState(false);
    const [deleting, setDeleting] = useState<number | null>(null);

    useEffect(() => {
        const loadVetId = async () => {
            const storedUser = localStorage.getItem("user");
            if (!storedUser) return;

            const parsedUser = JSON.parse(storedUser);
            if (!parsedUser?.id) return;

            try {
                const res = await fetch(`/api/get-vet-id?user_id=${parsedUser.id}`);
                if (!res.ok) throw new Error('Failed to fetch vet ID');
                const data = await res.json();
                setVetId(data.vet_id);
            } catch (error) {
                console.error("Error fetching vet ID:", error);
            }
        };

        loadVetId();
    }, []);

    useEffect(() => {
        const fetchSchedule = async () => {
            if (!vetId) return;

            try {
                const res = await fetch(`/api/vet-panel/schedule/${vetId}`);
                if (!res.ok) throw new Error('Failed to fetch schedule');
                const data = await res.json();
                setSchedule(data);
            } catch (error) {
                console.error("Error fetching schedule:", error);
                message.error("Failed to load schedule");
            } finally {
                setLoading(false);
            }
        };

        if (vetId) {
            fetchSchedule();
        }
    }, [vetId]);

    const handleScheduleSubmit = async () => {
        if (submittingSchedule || !vetId) return;
        setSubmittingSchedule(true);

        try {
            const values = await scheduleForm.validateFields();

            // Format time properly
            const formatTime = (timeStr: string): string => {
                if (!timeStr.includes(':')) {
                    return `${timeStr}:00`;
                }
                return timeStr;
            };

            const slots = [{
                day_of_week: values.day_of_week,
                start_time: formatTime(values.start_time),
                end_time: formatTime(values.end_time)
            }];

            const response = await fetch(`/api/vet-panel/schedule/${vetId}`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    ...(localStorage.getItem("token") && {
                        Authorization: `Bearer ${localStorage.getItem("token")}`
                    })
                },
                body: JSON.stringify(slots)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || "Failed to add slot");
            }

            message.success("Slot added!");
            setScheduleModalVisible(false);
            scheduleForm.resetFields();
            
            // Refresh schedule
            const res = await fetch(`/api/vet-panel/schedule/${vetId}`);
            if (res.ok) {
                const data = await res.json();
                setSchedule(data);
            }
        } catch (error) {
            console.error("Error:", error);
            message.error({ content: "Failed to add slot" });
        } finally {
            setSubmittingSchedule(false);
        }
    };

    const deleteScheduleSlot = async (availabilityId: number) => {
        if (!vetId) return;
        
        setDeleting(availabilityId);
        try {
            const res = await fetch(`/api/vet-panel/schedule/${vetId}`, {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ availability_id: availabilityId })
            });
            if (!res.ok) throw new Error('Failed to delete schedule slot');
            
            // Remove from local state
            setSchedule(prev => prev.filter(s => s.availability_id !== availabilityId));
            message.success("Schedule slot deleted successfully");
        } catch (error) {
            console.error("Error deleting schedule slot:", error);
            message.error("Failed to delete schedule slot");
        } finally {
            setDeleting(null);
        }
    };

    const handleScheduleChange = (availability_id: number, field: keyof Schedule, value: string) => {
        const updatedSchedule = schedule.map((slot) =>
            slot.availability_id === availability_id ? { ...slot, [field]: value } : slot
        );
        setSchedule(updatedSchedule);
    };

    const handleSaveChanges = async () => {
        if (!vetId) {
            message.error("Schedule not available for saving");
            return;
        }

        try {
            const res = await fetch(`/api/vet-panel/schedule/${vetId}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    availability: schedule.map(s => ({
                        availability_id: s.availability_id,
                        day_of_week: s.day_of_week,
                        start_time: s.start_time,
                        end_time: s.end_time
                    }))
                })
            });

            if (!res.ok) throw new Error('Failed to update schedule');

            message.success("Schedule updated successfully");
            setEditing(false);
        } catch (error) {
            console.error('Error saving schedule changes:', error);
            message.error(error instanceof Error ? error.message : "Failed to update schedule");
        }
    };

    const handleCancel = () => {
        // Reload original data
        if (vetId) {
            fetch(`/api/vet-panel/schedule/${vetId}`)
                .then(res => res.json())
                .then(data => setSchedule(data))
                .catch(error => console.error("Error reloading schedule:", error));
        }
        setEditing(false);
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold">Schedule</h2>
                <div className="flex gap-2">
                    <button
                        onClick={() => setScheduleModalVisible(true)}
                        className="px-4 py-2 bg-primary text-white rounded-lg flex items-center gap-2"
                    >
                        <PlusOutlined /> Add Slot
                    </button>
                    {editing ? (
                        <>
                            <button
                                onClick={handleCancel}
                                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-all"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSaveChanges}
                                className="px-4 py-2 bg-primary text-white rounded-lg transition-all"
                            >
                                Save Changes
                            </button>
                        </>
                    ) : (
                        <button
                            onClick={() => setEditing(true)}
                            className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary transition-all"
                        >
                            Edit Schedule
                        </button>
                    )}
                </div>
            </div>

            {schedule.length === 0 ? (
                <p className="text-gray-500 py-4">No schedule slots added</p>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {schedule.map((slot) => (
                        <div key={slot.availability_id} className="border rounded-lg p-4 relative">
                            <button
                                onClick={() => deleteScheduleSlot(slot.availability_id)}
                                className="absolute top-2 right-2 text-red-500 hover:text-red-700 transition-all duration-200 ease-in-out hover:scale-125"
                                title="Delete schedule slot"
                                disabled={deleting === slot.availability_id}
                            >
                                {deleting === slot.availability_id ? (
                                    <LoadingOutlined className="text-red-500" />
                                ) : (
                                    '×'
                                )}
                            </button>

                            <div className="space-y-3">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Day</label>
                                    {editing ? (
                                        <select
                                            value={slot.day_of_week}
                                            onChange={(e) => handleScheduleChange(slot.availability_id, "day_of_week", e.target.value)}
                                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                                        >
                                            {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(day => (
                                                <option key={day} value={day}>{day}</option>
                                            ))}
                                        </select>
                                    ) : (
                                        <p className="mt-1 text-gray-900">{slot.day_of_week}</p>
                                    )}
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Start Time</label>
                                        {editing ? (
                                            <input
                                                type="time"
                                                value={slot.start_time}
                                                onChange={(e) => handleScheduleChange(slot.availability_id, "start_time", e.target.value)}
                                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                                            />
                                        ) : (
                                            <p className="mt-1 text-gray-900">{slot.start_time}</p>
                                        )}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">End Time</label>
                                        {editing ? (
                                            <input
                                                type="time"
                                                value={slot.end_time}
                                                onChange={(e) => handleScheduleChange(slot.availability_id, "end_time", e.target.value)}
                                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                                            />
                                        ) : (
                                            <p className="mt-1 text-gray-900">{slot.end_time}</p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Schedule Modal */}
            <Modal
                title="Add Schedule Slot"
                visible={scheduleModalVisible}
                onCancel={() => setScheduleModalVisible(false)}
                footer={[
                    <Button key="back" onClick={() => setScheduleModalVisible(false)}>
                        Cancel
                    </Button>,
                    <Button
                        type="primary"
                        onClick={handleScheduleSubmit}
                        loading={submittingSchedule}
                        disabled={submittingSchedule}
                    >
                        Add Schedule
                    </Button>,
                ]}
            >
                <Form form={scheduleForm} layout="vertical">
                    <Form.Item
                        name="day_of_week"
                        label="Day of Week"
                        rules={[{ required: true, message: 'Please select a day' }]}
                    >
                        <Select placeholder="Select a day">
                            {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(day => (
                                <Select.Option key={day} value={day}>{day}</Select.Option>
                            ))}
                        </Select>
                    </Form.Item>
                    <Form.Item
                        name="start_time"
                        label="Start Time"
                        rules={[{ required: true, message: 'Please select start time' }]}
                    >
                        <Input type="time" />
                    </Form.Item>
                    <Form.Item
                        name="end_time"
                        label="End Time"
                        rules={[{ required: true, message: 'Please select end time' }]}
                    >
                        <Input type="time" />
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
};

export default VetScheduleTab;