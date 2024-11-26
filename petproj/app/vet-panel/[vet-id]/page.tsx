'use client';
import React, { useEffect, useState } from "react";
import { Card, Col, Row, Typography, List, Tag, Avatar, Spin, message } from "antd";
import type { VetPanelData } from "../../types/vetPanelData";

const { Title, Text } = Typography;

interface VetPanelPageProps {
    params: {
        vetId: string;
    };
}

const VetPanel = ({ params }: VetPanelPageProps) => {
    const { vetId } = params; // Get vetId from the dynamic route
    const [data, setData] = useState<VetPanelData | null>(null);
    const [loading, setLoading] = useState<boolean>(true);

    useEffect(() => {
        const fetchVetData = async () => {
            setLoading(true);
            try {
                const res = await fetch(`/api/vet-panel/${vetId}`);
                if (!res.ok) {
                    throw new Error(`Failed to fetch vet data. Status: ${res.status}`);
                }
                const responseData: VetPanelData = await res.json();
                setData(responseData);
            } catch (error) {
                console.error("Error fetching vet panel data:", error);
                message.error("Error loading vet data. Please try again later.");
                setData(null);
            } finally {
                setLoading(false);
            }
        };

        fetchVetData();
    }, [vetId]);

    if (loading) {
        return (
            <div style={{ textAlign: "center", marginTop: "50px" }}>
                <Spin size="large" />
            </div>
        );
    }

    if (!data) {
        return (
            <div style={{ textAlign: "center", marginTop: "50px" }}>
                <Text type="danger">Error loading data. Please try again later.</Text>
            </div>
        );
    }

    const { personal_info, reviews_summary, qualifications, specializations, schedules } = data;

    return (
        <div style={{ padding: "20px" }}>
            {/* Personal Info Box */}
            <Card
                style={{ marginBottom: "20px" }}
                bordered
                title={<Title level={3}>Personal Information</Title>}
            >
                <Row gutter={[16, 16]}>
                    <Col xs={24} sm={6}>
                        <Avatar
                            size={100}
                            src={personal_info.profile_image_url}
                            alt={personal_info.vet_name}
                        />
                    </Col>
                    <Col xs={24} sm={18}>
                        <Text strong>Vet Name:</Text> {personal_info.vet_name} <br />
                        <Text strong>Clinic Name:</Text> {personal_info.clinic_name} <br />
                        <Text strong>Location:</Text> {personal_info.location}, {personal_info.city} <br />
                        <Text strong>Contact:</Text> {personal_info.contact_details} <br />
                        <Text strong>Email:</Text> {personal_info.email} <br />
                        <Text strong>Minimum Fee:</Text> ${personal_info.minimum_fee} <br />
                        <Text strong>Profile Verified:</Text>{" "}
                        <Tag color={personal_info.profile_verified ? "green" : "red"}>
                            {personal_info.profile_verified ? "Yes" : "No"}
                        </Tag>
                    </Col>
                </Row>
            </Card>

            {/* 2x2 Grid for Smaller Cards */}
            <Row gutter={[16, 16]}>
                {/* Qualifications */}
                <Col xs={24} md={12}>
                    <Card title="Qualifications" bordered>
                        {qualifications.length > 0 ? (
                            <List
                                dataSource={qualifications}
                                renderItem={(item) => <List.Item>{item}</List.Item>}
                            />
                        ) : (
                            <Text>No qualifications listed.</Text>
                        )}
                    </Card>
                </Col>

                {/* Specializations */}
                <Col xs={24} md={12}>
                    <Card title="Specializations" bordered>
                        {specializations.length > 0 ? (
                            <List
                                dataSource={specializations}
                                renderItem={(item) => <List.Item>{item}</List.Item>}
                            />
                        ) : (
                            <Text>No specializations listed.</Text>
                        )}
                    </Card>
                </Col>

                {/* Reviews Summary */}
                <Col xs={24} md={12}>
                    <Card title="Reviews Summary" bordered>
                        <Text strong>Average Rating:</Text> {reviews_summary.average_rating} / 5 <br />
                        <Text strong>Total Reviews:</Text> {reviews_summary.total_reviews}
                    </Card>
                </Col>

                {/* Schedule */}
                <Col xs={24} md={12}>
                    <Card title="Schedule" bordered>
                        {schedules.length > 0 ? (
                            <List
                                dataSource={schedules}
                                renderItem={(item) => (
                                    <List.Item>
                                        <Text strong>{item.day_of_week}:</Text>{" "}
                                        {item.start_time} - {item.end_time}
                                    </List.Item>
                                )}
                            />
                        ) : (
                            <Text>No schedule available.</Text>
                        )}
                    </Card>
                </Col>
            </Row>
        </div>
    );
};

export default VetPanel;
