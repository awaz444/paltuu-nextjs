"use client";
import { useDispatch, useSelector } from "react-redux";
import { useEffect, useState } from "react";
import { RootState, AppDispatch } from "../store/store"; // Import store types
import { fetchCities } from "../store/slices/citiesSlice"; // Fetch cities from store
import { postUser } from "../store/slices/userSlice";
import { User } from "../types/user";

{/*post
{
    "username": "johndoe",
    "name": "John Doe",
    "DOB": "1990-05-15",
    "city_id": 1,   // Replace with a valid city_id
    "email": "johndoe@example.com",
    "password": "password123",
    "phone_number": "1234567890",
    "role": "regular user"  // Options: 'admin', 'regular user', 'vet'
}*/ }
const createUser = () => {
    const dispatch = useDispatch<AppDispatch>();
    const { cities } = useSelector((state: RootState) => state.cities); // Fetch cities if needed

    // State for form fields
    const [username, setUsername] = useState("");
    const [name, setName] = useState("");
    const [DOB, setDOB] = useState("");
    const [cityId, setCityId] = useState<number | null>(null);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [phone_number, setPhoneNumber] = useState(""); // Match here
    const [role, setRole] = useState<'admin' | 'regular user' | 'vet'>('regular user');
    

    useEffect(() => {
        dispatch(fetchCities()); // Fetch cities when component mounts
    }, [dispatch]);

    // Handle form submission
    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
    
        const newUser: Omit<User, 'user_id'> = {
            username,
            name,
            DOB,
            city_id: cityId,
            email,
            password,
            phone_number,
            role,
        }; 
    
        console.log(newUser);
        // Dispatch postUser action
        dispatch(postUser(newUser));
    };
    

    return (
        <form onSubmit={handleSubmit} className="max-w-md mx-auto p-4 bg-white shadow-md rounded">
            <h2 className="text-2xl font-semibold mb-4">Add User</h2>

            <label className="block mb-2">Username</label>
            <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="border p-2 rounded w-full mb-4"
                required
            />

            <label className="block mb-2">Name</label>
            <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="border p-2 rounded w-full mb-4"
                required
            />

            <label className="block mb-2">Date of Birth</label>
            <input
                type="date"
                value={DOB}
                onChange={(e) => setDOB(e.target.value)}
                className="border p-2 rounded w-full mb-4"
                required
            />

            <label className="block mb-2">City ID</label>
            <input
                type="number"
                value={cityId || ''}
                onChange={(e) => setCityId(Number(e.target.value))}
                className="border p-2 rounded w-full mb-4"
                required
            />

            <label className="block mb-2">Email</label>
            <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="border p-2 rounded w-full mb-4"
                required
            />

            <label className="block mb-2">Password</label>
            <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="border p-2 rounded w-full mb-4"
                required
            />

            <label className="block mb-2">Phone Number</label>
            <input
                type="tel"
                value={phone_number}
                onChange={(e) => setPhoneNumber(e.target.value)}
                className="border p-2 rounded w-full mb-4"
                required
            />

            <label className="block mb-2">Role</label>
            <select
                value={role}
                onChange={(e) => setRole(e.target.value as "admin" | "regular user" | "vet")}
                className="border p-2 rounded w-full mb-4"
            >
                <option value="regular user">Regular User</option>
                <option value="admin">Admin</option>
                <option value="vet">Vet</option>
            </select>

            <button type="submit" className="bg-blue-500 text-white p-2 rounded w-full">
                Submit
            </button>
        </form>
    );
}

export default createUser