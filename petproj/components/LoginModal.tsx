"use client";
import { Modal } from "antd";
import LoginForm from "./LoginForm";

export default function LoginModal({
  visible,
  onClose,
  onSuccess,
}: {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
}) {
  return (
    <Modal
      open={visible}
      onCancel={onClose}
      footer={null}
      centered
    >
      <LoginForm onSuccess={onSuccess} onClose={onClose} />
    </Modal>
  );
}