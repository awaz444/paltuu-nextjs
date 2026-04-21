"use client";
import React, { useState, useEffect } from "react";
import { Modal, Form, message, Button, Select, Input } from "antd";
import { 
  PlusIcon, 
  XMarkIcon, 
  PencilSquareIcon,
  CheckIcon,
  ClockIcon,
  CalendarDaysIcon,
  TrashIcon,
  ExclamationTriangleIcon
} from "@heroicons/react/24/outline";

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
    const [deleteConfirmVisible, setDeleteConfirmVisible] = useState(false);
    const [slotToDelete, setSlotToDelete] = useState<number | null>(null);

    useEffect(() => {
        const loadVetId = async () => {
            const storedUser = localStorage.getItem("user");
            if (!storedUser) return;

            const parsedUser = JSON.parse(storedUser);
            if (!parsedUser?.id) return;

            try {
                const res = await fetch(`/api/v1/vets/get-id?user_id=${parsedUser.id}`, { credentials: 'include' });
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
                const res = await fetch(`/api/v1/vet-panel/schedule/${vetId}`, { credentials: 'include' });
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

            const response = await fetch(`/api/v1/vet-panel/schedule/${vetId}`, {
                method: "POST",
                credentials: 'include',
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(slots)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || "Failed to add slot");
            }

            message.success("Time slot added successfully!");
            setScheduleModalVisible(false);
            scheduleForm.resetFields();
            
            // Refresh schedule
            const res = await fetch(`/api/v1/vet-panel/schedule/${vetId}`, { credentials: 'include' });
            if (res.ok) {
                const data = await res.json();
                setSchedule(data);
            }
        } catch (error) {
            console.error("Error:", error);
            message.error({ content: "Failed to add time slot" });
        } finally {
            setSubmittingSchedule(false);
        }
    };

    const showDeleteConfirm = (availabilityId: number) => {
        setSlotToDelete(availabilityId);
        setDeleteConfirmVisible(true);
    };

    const handleDeleteConfirm = async () => {
        if (!vetId || slotToDelete === null) return;
        
        setDeleting(slotToDelete);
        try {
            const res = await fetch(`/api/v1/vet-panel/schedule/${vetId}`, {
                method: "DELETE",
                credentials: 'include',
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ availability_id: slotToDelete })
            });
            if (!res.ok) throw new Error('Failed to delete schedule slot');
            
            // Remove from local state
            setSchedule(prev => prev.filter(s => s.availability_id !== slotToDelete));
            message.success("Time slot deleted successfully");
        } catch (error) {
            console.error("Error deleting schedule slot:", error);
            message.error("Failed to delete time slot");
        } finally {
            setDeleting(null);
            setDeleteConfirmVisible(false);
            setSlotToDelete(null);
        }
    };

    const handleDeleteCancel = () => {
        setDeleteConfirmVisible(false);
        setSlotToDelete(null);
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
            const res = await fetch(`/api/v1/vet-panel/schedule/${vetId}`, {
                method: "PUT",
                credentials: 'include',
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
            fetch(`/api/v1/vet-panel/schedule/${vetId}`, { credentials: 'include' })
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
            {/* Header Section */}
            <div className="bg-gradient-to-r from-primary to-primary/80 text-white p-6 rounded-2xl">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h2 className="text-2xl font-bold">Clinic Schedule</h2>
                        <p className="text-primary-100/90 mt-1">
                            Manage your clinic's operating hours and availability
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setScheduleModalVisible(true)}
                            className="px-5 py-2.5 bg-white text-primary rounded-xl hover:bg-gray-100 transition-all flex items-center gap-2"
                        >
                            <PlusIcon className="w-5 h-5" />
                            Add Time Slot
                        </button>
                        {editing ? (
                            <>
                                <button
                                    onClick={handleCancel}
                                    className="px-5 py-2.5 bg-white/20 text-white rounded-xl hover:bg-white/30 transition-all flex items-center gap-2 backdrop-blur-sm"
                                >
                                    <XMarkIcon className="w-5 h-5" />
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSaveChanges}
                                    className="px-5 py-2.5 bg-white text-primary rounded-xl hover:bg-gray-100 transition-all flex items-center gap-2"
                                >
                                    <CheckIcon className="w-5 h-5" />
                                    Save Changes
                                </button>
                            </>
                        ) : (
                            <button
                                onClick={() => setEditing(true)}
                                className="px-5 py-2.5 bg-white text-primary rounded-xl hover:bg-gray-100 transition-all flex items-center gap-2"
                            >
                                <PencilSquareIcon className="w-5 h-5" />
                                Edit Schedule
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {schedule.length === 0 ? (
                <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 text-center">
                    <ClockIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-700 mb-2">No Schedule Added Yet</h3>
                    <p className="text-gray-500 mb-4">Add your clinic's operating hours to let clients know when you're available</p>
                    <button
                        onClick={() => setScheduleModalVisible(true)}
                        className="px-5 py-2.5 bg-primary text-white rounded-xl hover:bg-primary/90 transition-all flex items-center gap-2 mx-auto"
                    >
                        <PlusIcon className="w-5 h-5" />
                        Add Your First Time Slot
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {schedule.map((slot) => (
                        <div key={slot.availability_id} className="bg-gradient-to-br from-primary/5 to-primary/10 p-5 rounded-xl border border-primary/20 relative">
                            <button
                                onClick={() => showDeleteConfirm(slot.availability_id)}
                                className="absolute top-4 right-4 p-1.5 bg-white text-red-500 rounded-lg hover:bg-red-50 transition-all duration-200"
                                title="Delete time slot"
                                disabled={deleting === slot.availability_id}
                            >
                                {deleting === slot.availability_id ? (
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-500"></div>
                                ) : (
                                    <TrashIcon className="w-4 h-4" />
                                )}
                            </button>

                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-2 bg-primary/10 rounded-lg">
                                    <CalendarDaysIcon className="w-5 h-5 text-primary" />
                                </div>
                                <h3 className="font-semibold text-gray-800">Time Slot</h3>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-600 mb-1">Day</label>
                                    {editing ? (
                                        <select
                                            value={slot.day_of_week}
                                            onChange={(e) => handleScheduleChange(slot.availability_id, "day_of_week", e.target.value)}
                                            className="w-full p-2.5 border border-primary/30 rounded-lg focus:border-primary focus:ring-2 focus:ring-primary/20 transition-colors duration-200 bg-white"
                                        >
                                            {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(day => (
                                                <option key={day} value={day}>{day}</option>
                                            ))}
                                        </select>
                                    ) : (
                                        <p className="text-gray-800 font-medium">{slot.day_of_week}</p>
                                    )}
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-600 mb-1">Start Time</label>
                                        {editing ? (
                                            <div className="relative">
                                                <input
                                                    type="time"
                                                    value={slot.start_time}
                                                    onChange={(e) => handleScheduleChange(slot.availability_id, "start_time", e.target.value)}
                                                    className="w-full p-2.5 border border-primary/30 rounded-lg focus:border-primary focus:ring-2 focus:ring-primary/20 transition-colors duration-200 bg-white"
                                                />
                                                <ClockIcon className="absolute right-3 top-2.5 w-4 h-4 text-gray-400" />
                                            </div>
                                        ) : (
                                            <p className="text-gray-800 font-medium">{slot.start_time}</p>
                                        )}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-600 mb-1">End Time</label>
                                        {editing ? (
                                            <div className="relative">
                                                <input
                                                    type="time"
                                                    value={slot.end_time}
                                                    onChange={(e) => handleScheduleChange(slot.availability_id, "end_time", e.target.value)}
                                                    className="w-full p-2.5 border border-primary/30 rounded-lg focus:border-primary focus:ring-2 focus:ring-primary/20 transition-colors duration-200 bg-white"
                                                />
                                                <ClockIcon className="absolute right-3 top-2.5 w-4 h-4 text-gray-400" />
                                            </div>
                                        ) : (
                                            <p className="text-gray-800 font-medium">{slot.end_time}</p>
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
                title={<div className="flex items-center gap-2 text-lg font-semibold"><ClockIcon className="w-5 h-5 text-primary" /> Add Time Slot</div>}
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
                        className="bg-primary hover:bg-primary/90 border-primary"
                    >
                        {submittingSchedule ? "Adding..." : "Add Time Slot"}
                    </Button>,
                ]}
                width={500}
            >
                <Form form={scheduleForm} layout="vertical" className="mt-4">
                    <Form.Item
                        name="day_of_week"
                        label="Day of Week"
                        rules={[{ required: true, message: 'Please select a day' }]}
                    >
                        <Select 
                            placeholder="Select a day"
                            size="large"
                            suffixIcon={<CalendarDaysIcon className="w-4 h-4 text-gray-400" />}
                        >
                            {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(day => (
                                <Select.Option key={day} value={day}>{day}</Select.Option>
                            ))}
                        </Select>
                    </Form.Item>
                    <div className="grid grid-cols-2 gap-4">
                        <Form.Item
                            name="start_time"
                            label="Start Time"
                            rules={[{ required: true, message: 'Please select start time' }]}
                        >
                            <Input 
                                type="time" 
                                size="large"
                                prefix={<ClockIcon className="w-4 h-4 text-gray-400" />}
                            />
                        </Form.Item>
                        <Form.Item
                            name="end_time"
                            label="End Time"
                            rules={[{ required: true, message: 'Please select end time' }]}
                        >
                            <Input 
                                type="time" 
                                size="large"
                                prefix={<ClockIcon className="w-4 h-4 text-gray-400" />}
                            />
                        </Form.Item>
                    </div>
                </Form>
            </Modal>

            {/* Delete Confirmation Modal */}
            <Modal
                title={null}
                visible={deleteConfirmVisible}
                onCancel={handleDeleteCancel}
                footer={[
                    <Button key="cancel" onClick={handleDeleteCancel}>
                        Cancel
                    </Button>,
                    <Button
                        key="delete"
                        danger
                        onClick={handleDeleteConfirm}
                        loading={deleting !== null}
                        className="bg-red-500 hover:bg-red-600 border-red-500"
                    >
                        {deleting !== null ? "Deleting..." : "Delete Time Slot"}
                    </Button>,
                ]}
                width={400}
                closable={false}
            >
                <div className="flex flex-col items-center py-4">
                    <ExclamationTriangleIcon className="w-12 h-12 text-yellow-500 mb-4" />
                    <h3 className="text-lg font-semibold text-gray-800 mb-2">Confirm Deletion</h3>
                    <p className="text-gray-600 text-center">
                        Are you sure you want to delete this time slot? This action cannot be undone.
                    </p>
                </div>
            </Modal>
        </div>
    );
};

export default VetScheduleTab;