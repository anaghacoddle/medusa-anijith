"use client";

import { FocusModal, Button, Textarea, Text } from "@medusajs/ui";
import { useState, useEffect } from "react";
import { Review } from "./review-page";

type RejectModalProps = {
  open: boolean;
  onClose: () => void;
  onSubmit: (reason: string) => void;
  selectedReviews: Review[];
};

const RejectReasonModal = ({ open, onClose, onSubmit, selectedReviews }: RejectModalProps) => {
  const [reason, setReason] = useState("");

  // Pre-fill reason only if one review is selected
  useEffect(() => {
    if (selectedReviews.length === 1) {
      setReason(selectedReviews[0].reject_reason || "");
    } else {
      setReason(""); // reset if multiple
    }
  }, [selectedReviews]);

  const handleSubmit = () => {
    if (!reason.trim() || reason.length > 500) return;
    onSubmit(reason.trim());
    setReason("");
    onClose();
  };

  return (
    <FocusModal open={open} onOpenChange={onClose}>
      <FocusModal.Content
        className="w-96 h-72 flex flex-col justify-center 
               fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 "
      >
        <FocusModal.Body className="p-4 flex-1">
          <div className="flex flex-col gap-2 h-full">
            <div className="text-sm font-medium mb-3">Reject Reviews</div>

            <Textarea
              placeholder="Enter reason (max 500 characters)..."
              value={reason}
              onChange={e => setReason(e.target.value)}
              className="flex-1 resize-none min-h-20"
              rows={4}
              maxLength={500}
            />

            <div className="flex justify-between text-xs text-gray-500">
              <Text>{reason.length}/500</Text>
              {reason.length > 500 && <Text className="text-red-500">Limit exceeded</Text>}
            </div>
          </div>
        </FocusModal.Body>

        <FocusModal.Footer className="pt-2 gap-2">
          <Button variant="secondary" onClick={onClose} size="small">
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            size="small"
            disabled={!reason.trim() || reason.length > 500}
          >
            Submit
          </Button>
        </FocusModal.Footer>
      </FocusModal.Content>
    </FocusModal>
  );
};

export default RejectReasonModal;
