import React from "react";

const PendingApproval = () => {
    return (
        <div style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            minHeight: "100vh",
            backgroundColor: "#f4f6f8",
            fontFamily: "Arial, sans-serif"
        }}>
            <h1 style={{ color: "#333" }}>Your account is under review</h1>
            <p style={{
                color: "#555",
                maxWidth: "500px",
                textAlign: "center",
                marginTop: "10px"
            }}>
                Thank you for signing up as a doctor.  
                Our team is currently reviewing your profile and documents.  
                Once approved, you will receive an email notification and will be able to access your dashboard.
            </p>
            <div style={{
                marginTop: "20px",
                padding: "10px 20px",
                backgroundColor: "#ccc",
                borderRadius: "5px"
            }}>
                ⏳ Waiting for admin approval
            </div>
        </div>
    );
};

export default PendingApproval;

