"use client";

import { Modal } from "antd";

interface PartnerModalProps {
    visible: boolean;
    onClose: () => void;
}

export default function PartnerModal({ visible, onClose }: PartnerModalProps) {
    return (
        <Modal
            title="Partner with Paltuu"
            open={visible}
            onCancel={onClose}
            footer={null}
            centered
            className="[&_.ant-modal-content]:p-6"
        >
            <div className="space-y-4">
                <p className="text-gray-600">
                    Are you a vet, clinic, or rescue shelter? Contact us for
                    onboarding:
                </p>
                <div className="space-y-2">
                    <div>
                        <span className="font-medium text-gray-700">Email: </span>
                        <a
                            href="mailto:contact@paltuu.pk"
                            className="text-primary hover:underline"
                        >
                            contact@paltuu.pk
                        </a>
                    </div>
                    <div>
                        <span className="font-medium text-gray-700">Phone: </span>
                        <a
                            href="tel:+923394022468"
                            className="text-primary hover:underline"
                        >
                            +92 339 4022468
                        </a>
                    </div>
                </div>
            </div>
        </Modal>
    );
}
