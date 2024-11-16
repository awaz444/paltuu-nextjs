"use client";
import { useState } from "react";
import './style.css';

const Login = () => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const handleLogin = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        // Handle login logic here
        console.log({ email, password });
    };

    return (
        <>
            <div className="flex min-h-screen bg-white">
                <div style={{ backgroundColor: "#A03048" }} className="w-1/2  flex flex-col justify-center items-center p-10">
                <img src="/paltu_logo.svg" alt="paltu" />
                </div>
                <div className="w-1/2 flex flex-col justify-center items-left p-10">
                    <h2 className="text-3xl font-semibold ">Welcome</h2>
                    <p className="text-gray-500 mt-2">Log in to your account</p>
                    <form
                        onSubmit={handleLogin}
                        className="mt-8 w-3/4 bg-white shadow-lg rounded-lg p-8"
                    >
                        <label className="block mb-4">
                            <span className="text-gray-700">Email</span>
                            <input
                                style={{ borderColor: "#A03048" }}
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="mt-1 block w-full border p-2 rounded"
                                required
                            />
                        </label>
                        <label className="block mb-4">
                            <span className="text-gray-700">Password</span>
                            <input
                                style={{ borderColor: "#A03048" }}
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="mt-1 block w-full border p-2 rounded"
                                required
                            />
                        </label>
                        <button
                            style={{ backgroundColor: "#A03048" }}
                            type="submit"
                            className="text-white w-full py-2 rounded mt-4"
                        >
                            Log In
                        </button>
                        <button
                            style={{ borderColor: "#A03048" }}
                            type="button"
                            className="border w-full py-2 rounded mt-2"
                        >
                            Forgot Password?
                        </button>
                        {/* <button
                            type="button"
                            className="border border-gray-400 text-gray-500 w-full py-2 rounded mt-4"
                        >
                            New Rescue Signup
                        </button> */}
                    </form>
                </div>
            </div>
        </>
    );
};

export default Login;
