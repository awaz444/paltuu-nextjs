import React from "react";
import { Typography, Card, Tag, Divider, Row, Col } from "antd";
import {
    HeartOutlined,
    MedicineBoxOutlined,
    DollarOutlined,
    CheckCircleOutlined,
    CloseCircleOutlined,
} from "@ant-design/icons";

const { Title, Text, Paragraph } = Typography;

interface MedicalCondition {
    condition: string;
    treatment_cost: string;
    treated: boolean;
}

interface RescueDetailsProps {
    rescue_story: string | null;
    special_needs: string[];
    medical_conditions: MedicalCondition[];
}

const RescueDetails: React.FC<RescueDetailsProps> = ({
    rescue_story,
    special_needs,
    medical_conditions,
}) => {
    return (
        <div className="mt-8">
            <Divider className="border-gray-200" />
            
            <Title level={2} className="text-red-600 mb-6 flex items-center">
                <HeartOutlined className="mr-2" />
                Rescue Details
            </Title>

            {/* Rescue Story */}
            {rescue_story && (
                <Card className="mb-6 h-full shadow-lg rounded-full overflow-hidden">
                    <Title level={4} className="text-gray-800 mb-3">
                        Rescue Story
                    </Title>
                    <Paragraph className="text-gray-700 text-base">
                        {rescue_story}
                    </Paragraph>
                </Card>
            )}

            <Row gutter={[16, 16]}>
                {/* Special Needs */}
                {special_needs && special_needs.length > 0 && (
                    <Col xs={24} md={12}>
                        <Card className="h-full shadow-lg rounded-full overflow-hidden">
                            <Title level={4} className="text-gray-800 mb-3 flex items-center">
                                <MedicineBoxOutlined className="mr-2 text-orange-500" />
                                Special Needs
                            </Title>
                            <div className="space-y-2">
                                {special_needs.map((need, index) => (
                                    <div key={index} className="flex items-start">
                                        <span className="text-red-500 mr-2">•</span>
                                        <Text className="text-gray-700">{need}</Text>
                                    </div>
                                ))}
                            </div>
                        </Card>
                    </Col>
                )}

                {/* Medical Conditions */}
                {medical_conditions && medical_conditions.length > 0 && (
                    <Col xs={24} md={12}>
                        <Card className="h-full shadow-lg rounded-full overflow-hidden">
                            <Title level={4} className="text-gray-800 mb-3 flex items-center">
                                <MedicineBoxOutlined className="mr-2 text-purple-500" />
                                Medical Conditions
                            </Title>
                            <div className="space-y-4">
                                {medical_conditions.map((condition, index) => (
                                    <div key={index} className="border-b border-gray-100 pb-3 last:border-b-0">
                                        <div className="flex justify-between items-start mb-1">
                                            <Text strong className="text-gray-800">
                                                {condition.condition}
                                            </Text>
                                            <Tag
                                                color={condition.treated ? "green" : "red"}
                                                icon={condition.treated ? <CheckCircleOutlined /> : <CloseCircleOutlined />}
                                                className="flex items-center"
                                            >
                                                {condition.treated ? "Treated" : "Needs Treatment"}
                                            </Tag>
                                        </div>
                                        {condition.treatment_cost && (
                                            <div className="flex items-center text-gray-600">
                                                <DollarOutlined className="mr-1" />
                                                <Text>Treatment cost: PKR {condition.treatment_cost}</Text>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </Card>
                    </Col>
                )}
            </Row>

            {/* Call to Action */}
            <Card className="mt-6 bg-red-50 border-red-200">
                <div className="text-center">
                    <Title level={4} className="text-red-700">
                        This rescue pet needs your help!
                    </Title>
                    <Paragraph className="text-red-600">
                        Consider donating to support their medical treatment and care, or contact the shelter 
                        to learn how you can help this pet find a loving home.
                    </Paragraph>
                </div>
            </Card>
        </div>
    );
};

export default RescueDetails;