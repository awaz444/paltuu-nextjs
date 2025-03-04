"use client";

import React, { useEffect, useState } from "react";
import Navbar from "@/components/navbar";

const ListingCreated = () => {
    return (
        <>
            <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 py-10 ">
                <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center">
                    <h1 className="text-3xl font-semibold text-primary mb-4">Application Submitted Successfully!</h1>
                    <p className="text-lg text-gray-700 mb-6">
                        Your application as a vet has been completed. Our admins will review your application and verify your profile. 
                        In the meantime, you can explore our website as a <b>normal user</b> after <b>logging in</b>. You will receive an email once your application has been processed.
                    </p>
                    <div className="flex justify-center gap-4">
                        <button
                            onClick={() => window.location.href = "/login"}
                            className="px-6 py-2 bg-primary text-white rounded-xl transition-all duration-300"
                        >
                            Login
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
};

export default ListingCreated;

