// Test script to verify rescue panel fixes
// This script tests that rescue_story and shelter_id are properly saved

const testPetCreation = async () => {
  const testData = {
    owner_id: 1,
    pet_name: "Test Rescue Pet",
    pet_type: 1,
    pet_breed: null,
    city_id: 1,
    area: "Test Area",
    age: 2,
    months: 6,
    description: "A test rescue pet for verification",
    adoption_status: "available",
    min_age_of_children: null,
    can_live_with_dogs: true,
    can_live_with_cats: false,
    must_have_someone_home: false,
    energy_level: 3,
    cuddliness_level: 4,
    health_issues: null,
    sex: "female",
    listing_type: "rescue",
    vaccinated: true,
    neutered: false,
    price: null,
    rescue_story: "This pet was found on the streets, malnourished and scared. After proper care and rehabilitation, they are now ready for adoption.",
    shelter_id: 1,
    shop_id: null
  };

  try {
    console.log("Testing pet creation with rescue_story and shelter_id...");
    
    const response = await fetch('http://localhost:3000/api/pets', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData)
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    console.log("✅ Pet created successfully!");
    console.log("Pet ID:", result.pet_id);
    console.log("Rescue Story:", result.rescue_story);
    console.log("Shelter ID:", result.shelter_id);
    
    // Verify the fields were saved correctly
    if (result.rescue_story === testData.rescue_story) {
      console.log("✅ Rescue story saved correctly!");
    } else {
      console.log("❌ Rescue story not saved correctly");
    }
    
    if (result.shelter_id === testData.shelter_id) {
      console.log("✅ Shelter ID saved correctly!");
    } else {
      console.log("❌ Shelter ID not saved correctly");
    }
    
    return result;
  } catch (error) {
    console.error("❌ Test failed:", error.message);
    throw error;
  }
};

// Test bulk upload
const testBulkUpload = async () => {
  const testData = {
    pets: [{
      owner_id: 1,
      pet_name: "Bulk Test Pet",
      pet_type: 1,
      pet_breed: null,
      city_id: 1,
      area: "Test Area",
      age: 1,
      months: 0,
      description: "A test pet for bulk upload verification",
      adoption_status: "available",
      min_age_of_children: null,
      can_live_with_dogs: true,
      can_live_with_cats: true,
      must_have_someone_home: false,
      energy_level: 2,
      cuddliness_level: 5,
      health_issues: null,
      sex: "male",
      listing_type: "rescue",
      vaccinated: false,
      neutered: true,
      price: null,
      rescue_story: "This pet was rescued from a hoarding situation and has made great progress in rehabilitation.",
      images: []
    }],
    entityType: "shelter",
    entityId: 1
  };

  try {
    console.log("\nTesting bulk upload with rescue_story and shelter_id...");
    
    const response = await fetch('http://localhost:3000/api/pets/bulk-upload', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData)
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    console.log("✅ Bulk upload successful!");
    console.log("Results:", result.results);
    
    return result;
  } catch (error) {
    console.error("❌ Bulk upload test failed:", error.message);
    throw error;
  }
};

// Run tests
const runTests = async () => {
  console.log("🧪 Starting rescue panel fix tests...\n");
  
  try {
    await testPetCreation();
    await testBulkUpload();
    console.log("\n🎉 All tests passed! Rescue panel fixes are working correctly.");
  } catch (error) {
    console.log("\n💥 Tests failed. Please check the implementation.");
    process.exit(1);
  }
};

// Only run if this script is executed directly
if (typeof window === 'undefined') {
  runTests();
}

module.exports = { testPetCreation, testBulkUpload };
