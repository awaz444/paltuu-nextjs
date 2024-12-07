"use client";
import { useDispatch, useSelector } from "react-redux";
import { useEffect, useState } from "react";
import { RootState, AppDispatch } from "../store/store"; // Import store types
import { fetchCities } from "../store/slices/citiesSlice"; // Fetch cities from store
import { postUser } from "../store/slices/userSlice";
import { User } from "../types/user";
import { useRouter } from "next/navigation";
import { EyeOutlined, EyeInvisibleOutlined } from "@ant-design/icons";

const CreateUser = () => {
    const dispatch = useDispatch<AppDispatch>();
    const { cities } = useSelector((state: RootState) => state.cities); // Fetch cities if needed
    const router = useRouter();

    const [username, setUsername] = useState("");
    const [name, setName] = useState("");
    const [DOB, setDOB] = useState("");
    const [cityId, setCityId] = useState<number | null>(null);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [phone_number, setPhoneNumber] = useState("");
    const [role, setRole] = useState<"regular user" | "vet">("regular user");

    useEffect(() => {
        dispatch(fetchCities()); // Fetch cities when component mounts
    }, [dispatch]);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        if (password !== confirmPassword) {
            alert("Passwords do not match");
            return;
        }

        const newUser: Omit<User, "user_id"> = {
            username,
            name,
            DOB,
            city_id: cityId,
            email,
            password,
            phone_number,
            role,
        };

        try {
            const result = (await dispatch(postUser(newUser))) as {
                payload: User;
            };
            if (result.payload.role === "vet") {
                router.push(`/vet-register?user_id=${result.payload.user_id}`);
            } else {
                router.push("/login");
            }
        } catch (error) {
            console.error("Error creating user:", error);
        }
    };

    return (
        <div className="min-h-screen flex">
            <div className="sm:w-1/2 flex flex-col justify-center items-center bg-primary p-8 text-white rounded-r-3xl">
                <img src="/paltu_logo.svg" alt="Paltu Logo" className="mb-6" />
            </div>

            <div className="w-1/2 bg-gray-100 flex items-center justify-center px-8 py-12">
                <form
                    onSubmit={handleSubmit}
                    className="w-full max-w-md bg-white shadow-lg rounded-2xl p-6 space-y-4">
                    <h2 className="text-3xl font-semibold text-center mb-2">
                        Sign Up
                    </h2>
                    <p className="text-gray-600 text-center mb-6">
                        Fill in the details to create a new account.
                    </p>

                   {/* Email */}
                    <div>
                        <label className="block text-gray-700 text-sm font-medium mb-1">
                            Email
                        </label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full border border-gray-300 rounded-xl px-3 py-2 focus:ring-2 focus:ring-primary focus:outline-none"
                            required
                        />
                    </div>

                    {/* Password */}
                    <div className="relative">
                        <label className="block text-gray-700 text-sm font-medium mb-1">
                            Password
                        </label>
                        <input
                            type={showPassword ? "text" : "password"}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full border border-gray-300 rounded-xl px-3 py-2 focus:ring-2 focus:ring-primary focus:outline-none"
                            required
                        />
                        <span
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute inset-y-0 right-3 flex items-center cursor-pointer text-gray-500 mt-6">
                            {showPassword ? (
                                <EyeInvisibleOutlined />
                            ) : (
                                <EyeOutlined />
                            )}
                        </span>
                    </div>

                    {/* Confirm Password */}
                    <div className="relative">
                        <label className="block text-gray-700 text-sm font-medium mb-1">
                            Confirm Password
                        </label>
                        <input
                            type={showConfirmPassword ? "text" : "password"}
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className="w-full border border-gray-300 rounded-xl px-3 py-2 focus:ring-2 focus:ring-primary focus:outline-none"
                            required
                        />
                        <span
                            onClick={() =>
                                setShowConfirmPassword(!showConfirmPassword)
                            }
                            className="absolute inset-y-0 right-3 flex items-center cursor-pointer text-gray-500 mt-6">
                            {showConfirmPassword ? (
                                <EyeInvisibleOutlined />
                            ) : (
                                <EyeOutlined />
                            )}
                        </span>
                    </div>

                    {/* Date of Birth */}
                    <div>
                        <label className="block text-gray-700 text-sm font-medium mb-1">
                            Date of Birth
                        </label>
                        <input
                            type="date"
                            value={DOB}
                            onChange={(e) => setDOB(e.target.value)}
                            className="w-full border border-gray-300 rounded-xl px-3 py-2 focus:ring-2 focus:ring-primary focus:outline-none"
                            required
                        />
                    </div>

                    {/* City */}
                    <div>
                        <label className="block text-gray-700 text-sm font-medium mb-1">
                            City
                        </label>
                        <select
                            value={cityId || ""}
                            onChange={(e) => setCityId(Number(e.target.value))}
                            className="w-full border border-gray-300 rounded-xl px-3 py-2 focus:ring-2 focus:ring-primary focus:outline-none"
                            required>
                            <option value="">Select a City</option>
                            {cities.map((city) => (
                                <option key={city.city_id} value={city.city_id}>
                                    {city.city_name}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Role Checkbox */}
                    <div className="flex items-center space-x-2">
                        <input
                            type="checkbox"
                            checked={role === "vet"}
                            onChange={() =>
                                setRole((prevRole) =>
                                    prevRole === "regular user"
                                        ? "vet"
                                        : "regular user"
                                )
                            }
                            className="h-4 w-4 border-gray-300 text-primary rounded focus:ring-primary focus:outline-none"
                        />
                        <label className="text-gray-700 text-sm">
                            I am a vet
                        </label>
                    </div>

                    {/* Submit Button */}
                    <button
                        type="submit"
                        className="w-full bg-primary text-white py-2 px-4 rounded-xl hover:bg-primary-dark transition">
                        Create Account
                    </button>
                </form>
            </div>
        </div>
    );
};

export default CreateUser;
