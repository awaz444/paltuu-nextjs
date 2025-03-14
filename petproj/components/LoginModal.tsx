"use client";
import { Modal } from "antd";
import LoginForm from "./LoginForm";

export default function LoginModal({
  visible,
  onClose,
  onSuccess,
  mandatory = false // Add this new prop with default value
}: {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
  mandatory?: boolean; // Optional prop
}) {
  return (
    <Modal
      open={visible}
      onCancel={mandatory ? undefined : onClose} // Disable onCancel when mandatory
      footer={null}
      centered
      closable={!mandatory} // Show close button only when not mandatory
      maskClosable={!mandatory} // Allow clicking outside only when not mandatory
      keyboard={!mandatory} // Allow ESC key only when not mandatory
    >
      <LoginForm 
        onSuccess={onSuccess} 
        onClose={mandatory ? undefined : onClose} // Remove close option from form if mandatory
      />
    </Modal>
  );
}