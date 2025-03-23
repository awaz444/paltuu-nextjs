import React, { useEffect, useState } from "react";
import { Modal, Button, Input, Spin, message } from "antd";

interface VetQualification {
  qualification_id: number;
  qualification_name: string;
  year_acquired: string;
  note: string;
}

interface VetQualificationEditModalProps {
  vetId: string;
  isOpen: boolean;
  onClose: () => void;
}

const VetQualificationEditModal: React.FC<VetQualificationEditModalProps> = ({ vetId, isOpen, onClose }) => {
  const [qualifications, setQualifications] = useState<VetQualification[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isOpen || !vetId) return;

    const fetchQualifications = async () => {
      setLoading(true);
      setError(null);

      try {
        const res = await fetch(`/api/vet-qualification/${vetId}`);
        if (!res.ok) {
          throw new Error(`Failed to fetch qualifications. Status: ${res.status}`);
        }

        const data = await res.json();
        setQualifications(data.qualifications || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    };

    fetchQualifications();
  }, [isOpen, vetId]);

  const handleChange = (index: number, field: keyof VetQualification, value: string) => {
    setQualifications((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      for (const qualification of qualifications) {
        await fetch(`/api/vet-qualifications/update`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(qualification),
        });
      }
      message.success("Qualifications updated successfully!");
      onClose();
    } catch (err) {
      message.error("Failed to update qualifications.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      title="Edit Qualifications"
      open={isOpen}
      onCancel={onClose}
      footer={[
        <Button key="cancel" onClick={onClose} disabled={saving}>
          Cancel
        </Button>,
        <Button key="save" type="primary" onClick={handleSave} loading={saving}>
          Save
        </Button>,
      ]}
    >
      {loading ? (
        <div className="flex justify-center items-center">
          <Spin size="large" />
        </div>
      ) : error ? (
        <p className="text-red-600">{error}</p>
      ) : (
        <div className="space-y-4">
          {qualifications.map((qualification, index) => (
            <div key={qualification.qualification_id} className="space-y-2 border p-4 rounded">
              <h3 className="font-semibold">{qualification.qualification_name}</h3>
              <Input
                type="text"
                value={qualification.year_acquired}
                onChange={(e) => handleChange(index, "year_acquired", e.target.value)}
                placeholder="Year Acquired"
              />
              <Input.TextArea
                value={qualification.note}
                onChange={(e) => handleChange(index, "note", e.target.value)}
                placeholder="Enter qualification details..."
              />
            </div>
          ))}
        </div>
      )}
    </Modal>
  );
};

export default VetQualificationEditModal;
