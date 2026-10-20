import React from "react";
import {
    HeartOutlined,
    MedicineBoxOutlined,
    CheckCircleOutlined,
    CloseCircleOutlined,
} from "@ant-design/icons";

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
        <section className="rounded-xl border border-red-100 bg-white p-5">
            <h2 className="mb-3 flex items-center gap-2 text-base font-semibold text-gray-900">
                <HeartOutlined className="text-red-500" />
                Rescue details
            </h2>

            {rescue_story && (
                <p className="mb-4 whitespace-pre-line text-[15px] leading-7 text-gray-700">
                    {rescue_story}
                </p>
            )}

            <div className="grid gap-4 md:grid-cols-2">
                {special_needs && special_needs.length > 0 && (
                    <div className="rounded-lg border border-gray-200 p-4">
                        <h3 className="mb-2 text-sm font-semibold text-gray-900">Special needs</h3>
                        <ul className="list-disc space-y-1 pl-5 text-sm text-gray-700">
                            {special_needs.map((need, index) => (
                                <li key={index}>{need}</li>
                            ))}
                        </ul>
                    </div>
                )}

                {medical_conditions && medical_conditions.length > 0 && (
                    <div className="rounded-lg border border-gray-200 p-4">
                        <h3 className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-gray-900">
                            <MedicineBoxOutlined className="text-gray-500" />
                            Medical conditions
                        </h3>
                        <div className="divide-y divide-gray-100">
                            {medical_conditions.map((condition, index) => (
                                <div key={index} className="py-2 first:pt-0 last:pb-0">
                                    <div className="flex items-start justify-between gap-2">
                                        <span className="text-sm font-medium text-gray-800">
                                            {condition.condition}
                                        </span>
                                        <span
                                            className={`inline-flex flex-shrink-0 items-center gap-1 rounded-md px-1.5 py-0.5 text-xs font-medium ${
                                                condition.treated
                                                    ? "bg-green-50 text-green-700"
                                                    : "bg-red-50 text-red-600"
                                            }`}>
                                            {condition.treated ? <CheckCircleOutlined /> : <CloseCircleOutlined />}
                                            {condition.treated ? "Treated" : "Needs treatment"}
                                        </span>
                                    </div>
                                    {condition.treatment_cost && (
                                        <p className="mt-0.5 text-xs text-gray-500">
                                            Treatment cost: PKR {condition.treatment_cost}
                                        </p>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            <p className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
                This rescue needs help. Consider supporting their treatment and care, or contact the
                shelter to learn how you can help them find a home.
            </p>
        </section>
    );
};

export default RescueDetails;
