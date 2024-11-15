'use client';

import React, { useState, useEffect } from "react";
import { Carousel } from "antd";
import { PetWithImages } from "../../types/petWithImages"; 
import Navbar from "@/components/navbar";

interface PetDetailsProps {
    pet_id: string;  
}

const PetDetailsPage: React.FC<PetDetailsProps> = ({ pet_id }) => {
    const [pet, setPet] = useState<PetWithImages | null>(null); // State to hold pet data
    const [carouselImages, setCarouselImages] = useState<string[]>([]); // State for images

    useEffect(() => {
        const fetchPetDetails = async () => {
            try {
                const res = await fetch(`/api/browse-pets/${pet_id}`);
                if (!res.ok) {
                    throw new Error("Pet not found");
                }
                const petData = await res.json();
                setPet(petData);
    
                // Populate carousel images
                const images = [
                    petData.profile_image_url, 
                    ...petData.additional_images.map((image: { image_url: string }) => image.image_url)
                ]
                    .filter((image: string) => Boolean(image)) // Ensure no null/undefined values
                    .slice(0, 5); // Limit to 5 images for the carousel
                setCarouselImages(images);
            } catch (err) {
                console.error(err);
            }
        };
    
        if (pet_id) {
            fetchPetDetails();
        }
    }, [pet_id]);
    

    if (!pet) {
        return <div>Loading...</div>;
    }

    return (
        <>
        <Navbar/>
        <div className="pet-details min-h-screen bg-white-400">
            <h1 className="text-center font-bold text-4xl">{pet.pet_name}</h1>
            <div className="pet-carousel mb-8">
                <Carousel autoplay>
                    {carouselImages.map((image, index) => (
                        <div key={index}>
                            <img
                                src={image || "/placeholder.jpg"} 
                                alt={`${pet.pet_name}-image-${index}`}
                                className="w-full h-64 object-cover"
                            />
                        </div>
                    ))}
                </Carousel>
            </div>
            <div className="pet-info">
                <h2 className="text-2xl">Details:</h2>
                <p><strong>Breed:</strong> {pet.pet_breed}</p>
                <p><strong>Age:</strong> {pet.age} {pet.age > 1 ? "years" : "year"}</p>
                <p><strong>Location:</strong> {pet.city} - {pet.area}</p>
                <p><strong>Description:</strong> {pet.description}</p>
                <p><strong>Adoption Status:</strong> {pet.adoption_status}</p>
                <p><strong>Price:</strong> {pet.price ? `PKR ${pet.price}` : "Not listed"}</p>
                <p><strong>Vaccinated:</strong> {pet.vaccinated ? "Yes" : "No"}</p>
                <p><strong>Neutered:</strong> {pet.neutered ? "Yes" : "No"}</p>
                <p><strong>Energy Level:</strong> {pet.energy_level}</p>
                <p><strong>Cuddliness Level:</strong> {pet.cuddliness_level}</p>
                <p><strong>Can live with dogs:</strong> {pet.can_live_with_dogs ? "Yes" : "No"}</p>
                <p><strong>Can live with cats:</strong> {pet.can_live_with_cats ? "Yes" : "No"}</p>
                <p><strong>Must have someone home:</strong> {pet.must_have_someone_home ? "Yes" : "No"}</p>
            </div>
        </div>
        </>
        
    );
};

// Page function using the dynamic route parameter
export default function Page({ params }: { params: { pet_id: string } }) {
    const { pet_id } = params; // Extract the pet_id from the route params
    return <PetDetailsPage pet_id={pet_id} />; // Pass pet_id to PetDetailsPage
}
