"use client";
import React, { useEffect, useState } from "react";

const ListingCreated = () => {
    return (
        <>
            <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 py-10 ">
                <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center">
                    <h1 className="text-3xl font-semibold text-primary mb-4">Application Submitted Successfully!</h1>
                    <p className="text-lg text-gray-700 mb-6">
                        Thank you for applying. Our team will review your details and may call you to confirm them.
                        Once you're approved, your profile will appear in the Paltuu vet directory.
                        In the meantime, you can <b>log in</b> with your email and password and use Paltuu as a <b>normal user</b>.
                    </p>
                    <div className="flex justify-center gap-4">
                        <button
                            onClick={() => window.location.href = "/auth"}
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