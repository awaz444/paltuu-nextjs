"use client";

import React, { useEffect, useState } from "react";
import Navbar from "@/components/navbar";



const ListingCreated = () => {

    return (
        <>
            <Navbar />
            <div className="listing-created-container">
                <h1>Listing Created Successfully!</h1>
                <p>Your pet listing has been created and is now awaiting approval from our Admins. You can view your listing in the My Listings section.</p>
                <button onClick={() => window.location.href = "/my-listings"}>View My Listings</button>
                <button onClick={() => window.location.href = "/browse-pets"}>Go Back to Home Page</button>
            </div>
        </>
    );
};

export default ListingCreated;
