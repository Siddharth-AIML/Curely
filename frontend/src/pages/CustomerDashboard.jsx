import React, { useEffect, useState } from "react";

export default function CustomerDashboard() {
    const [profile, setProfile] = useState(null);

    useEffect(() => {
        const fetchProfile = async () => {
            const token = localStorage.getItem("token");
            if (!token) {
                window.location.href = "/login";
                return;
            }

            const res = await fetch("http://localhost:3001/api/customer/profile", {
                method: "GET",
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            });

            const data = await res.json();
            if (res.ok) {
                setProfile(data);
            } else {
                alert(data.msg || "Failed to fetch profile");
            }
        };

        fetchProfile();
    }, []);

    return (
        <div>
            <h1>Customer Dashboard</h1>
            {profile && (
                <div>
                    <p>Name: {profile.name}</p>
                    <p>Email: {profile.email}</p>
                </div>
            )}
        </div>
    );
}
