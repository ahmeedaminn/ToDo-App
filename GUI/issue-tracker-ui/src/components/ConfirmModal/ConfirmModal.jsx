import React from "react";
import "./ConfirmModal.css";

const ConfirmModal = ({ isOpen, onClose, onConfirm, title, message, isProcessing }) => {
  // If the modal isn't supposed to be open, render absolutely nothing.
  if (!isOpen) return null;

  return (
    <div className="modal-backdrop">
      <div className="confirm-card">
        <div className="confirm-icon">
          {/* A simple CSS-drawn warning triangle */}
          ⚠️
        </div>
        <div className="confirm-content">
          <h3>{title}</h3>
          <p>{message}</p>
        </div>
        
        <div className="confirm-actions">
          <button 
            className="btn-secondary" 
            onClick={onClose} 
            disabled={isProcessing}
          >
            Cancel
          </button>
          <button 
            className="btn-danger-solid" 
            onClick={onConfirm} 
            disabled={isProcessing}
          >
            {isProcessing ? "Deleting..." : "Yes, Delete Ticket"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;