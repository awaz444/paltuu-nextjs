"use client";
import React, { useState, useEffect } from 'react';
import {
  Form,
  Input,
  Select,
  Button,
  Upload,
  Card,
  Row,
  Col,
  Switch,
  InputNumber,
  message,
  Collapse,
  Image
} from 'antd';
import {
  PlusOutlined,
  UploadOutlined
} from '@ant-design/icons';
import { useAuth } from '../context/AuthContext';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '../app/store/store';
import { fetchCities } from '../app/store/slices/citiesSlice';
import { fetchPetCategories } from '../app/store/slices/petCategoriesSlice';
import { postPet } from '../app/store/slices/petSlice';
import axios from 'axios';
import type { UploadFile, UploadProps } from 'antd';

const { TextArea } = Input;
const { Option } = Select;
const { Panel } = Collapse;

interface SinglePetUploadFormProps {
  entityType: 'shop' | 'shelter';
  entityId: number;
  entityName: string;
  showPrice: boolean;
  entityAddress?: string;
}

export default function SinglePetUploadForm({
  entityType,
  entityId,
  entityName,
  showPrice,
  entityAddress
}: SinglePetUploadFormProps) {
  const { user } = useAuth();
  const dispatch = useDispatch<AppDispatch>();
  const { cities } = useSelector((state: RootState) => state.cities);
  const { categories } = useSelector((state: RootState) => state.categories);

  const [form] = Form.useForm();
  const [currentStep, setCurrentStep] = useState(1);
  const [uploading, setUploading] = useState(false);

  // Form state
  const [title, setTitle] = useState("");
  const [petType, setPetType] = useState("");
  const [cityId, setCityId] = useState("");
  const [area, setArea] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [sex, setSex] = useState("male");
  const [breed, setBreed] = useState("");
  const [age, setAge] = useState<number | null>(null);
  const [months, setMonths] = useState<number | null>(null);
  const [vaccinated, setVaccinated] = useState(false);
  const [neutered, setNeutered] = useState(false);
  const [minAgeOfChildren, setMinAgeOfChildren] = useState(0);
  const [canLiveWithDogs, setCanLiveWithDogs] = useState(false);
  const [canLiveWithCats, setCanLiveWithCats] = useState(false);
  const [mustHaveSomeoneHome, setMustHaveSomeoneHome] = useState(false);
  const [contactNumber, setContactNumber] = useState("");
  const [selectedTags, setSelectedTags] = useState<number[]>([]);
  const [healthIssues, setHealthIssues] = useState("");
  const [rescueStory, setRescueStory] = useState("");
  const [ageError, setAgeError] = useState<string | null>(null);
  const [monthsError, setMonthsError] = useState<string | null>(null);

  // Special needs and medical conditions for shelters
  const [specialNeeds, setSpecialNeeds] = useState<string[]>([]);
  const [medicalConditions, setMedicalConditions] = useState<Array<{condition: string, treatmentCost: number | null, treated: boolean}>>([]);
  const [newSpecialNeed, setNewSpecialNeed] = useState("");
  const [newMedicalCondition, setNewMedicalCondition] = useState("");
  const [newTreatmentCost, setNewTreatmentCost] = useState<number | null>(null);
  const [newTreated, setNewTreated] = useState(false);


  // Image upload state
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewImage, setPreviewImage] = useState("");

  useEffect(() => {
    dispatch(fetchCities());
    dispatch(fetchPetCategories());
  }, [dispatch]);

  const handleAgeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value === "" || (!isNaN(Number(value)) && Number(value) >= 0)) {
      const numberValue = value ? Number(value) : null;
      setAge(numberValue);

      if (
        (numberValue === null || numberValue === 0) &&
        (months === null || months === 0)
      ) {
        setAgeError("Either age or months must be filled");
        setMonthsError("Either age or months must be filled");
      } else {
        setAgeError(null);
        setMonthsError(null);
      }
    }
  };

  const handleMonthsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const parsedMonth = value ? parseInt(value) : null;

    if (parsedMonth === null || (parsedMonth >= 0 && parsedMonth <= 11)) {
      setMonths(parsedMonth);

      if (
        (parsedMonth === null || parsedMonth === 0) &&
        (age === null || age === 0)
      ) {
        setAgeError("Either age or months must be filled");
        setMonthsError("Either age or months must be filled");
      } else {
        setAgeError(null);
        setMonthsError(null);
      }
    }
  };

  const beforeUpload = (file: File) => {
    const isImage = file.type.startsWith("image/");
    if (!isImage) {
      message.error("You can only upload image files!");
    }
    const isSmallEnough = file.size / 1024 / 1024 < 5;
    if (!isSmallEnough) {
      message.error("Image must be smaller than 5MB!");
    }
    return isImage && isSmallEnough;
  };

  const getBase64 = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });

  const handlePreview = async (file: UploadFile) => {
    if (!file.url && !file.preview) {
      file.preview = await getBase64(file.originFileObj as File);
    }

    setPreviewImage(file.url || (file.preview as string));
    setPreviewOpen(true);
  };

  const handleChange: UploadProps["onChange"] = ({ fileList: newFileList }) =>
    setFileList(newFileList);

  const uploadButton = (
    <button style={{ border: 0, background: "none" }} type="button">
      <PlusOutlined />
      <div style={{ marginTop: 8 }}>Upload</div>
    </button>
  );

  const validateForm = () => {
    if (!title) {
      message.error("Title is required");
      return false;
    }
    if (!petType) {
      message.error("Pet type is required");
      return false;
    }
    if (!cityId) {
      message.error("City is required");
      return false;
    }
    if (!contactNumber) {
      message.error("Contact number is required");
      return false;
    }
    if ((age === null || age === 0) && (months === null || months === 0)) {
      message.error("Either age or months must be filled");
      return false;
    }
    if (showPrice && (!price || Number(price) <= 0)) {
      message.error("Price is required for shop listings");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    if (!user?.id && !user?.user_id) {
      message.error("User not authenticated. Please login to upload pets.");
      return;
    }

    setUploading(true);

    try {
      // Fix: Parse user ID to number
      const userId = parseInt(user.id || user.user_id || '0', 10);

      if (userId === 0) {
        message.error("Invalid user ID. Please login again.");
        setUploading(false);
        return;
      }

      // Determine listing type based on entity type and price
      const listingType = entityType === 'shop' ? 'shop' : 'rescue';

      // Create the pet with entity ID
      const newPet = {
        owner_id: userId, // Now this is a number
        pet_name: title,
        pet_type: Number(petType),
        pet_breed: entityType === 'shop' ? (breed || null) : null,
        city_id: Number(cityId),
        area: area || entityAddress || "",
        age_months: ((age || 0) * 12) + (months || 0),
        contact_number: contactNumber || null,
        description: description || null,
        adoption_status: "available",
        price: showPrice ? Number(price) : null,
        min_age_of_children: minAgeOfChildren || null,
        can_live_with_dogs: canLiveWithDogs,
        can_live_with_cats: canLiveWithCats,
        must_have_someone_home: mustHaveSomeoneHome,
        tags: selectedTags,
        health_issues: healthIssues || null,
        rescue_story: entityType === 'shelter' ? (rescueStory || null) : null,
        sex: sex,
        listing_type: listingType,
        vaccinated,
        neutered,
        shop_id: entityType === 'shop' ? entityId : null,
        shelter_id: entityType === 'shelter' ? entityId : null
      };

      const petResult = await dispatch(postPet(newPet)).unwrap();
      const petId = petResult?.pet_id;

      if (!petId) {
        throw new Error("Failed to get pet ID from response");
      }

      // Upload images if any
      if (fileList.length > 0) {
        const formData = new FormData();
        fileList.forEach((file) => {
          if (file.originFileObj) {
            formData.append("files", file.originFileObj);
          }
        });
        formData.append("pet_id", String(petId));

        await axios.post("/api/upload-image", formData, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        });
      }

      // Save special needs and medical conditions for shelters
      if (entityType === 'shelter' && petId) {
        try {
          // Save special needs
          if (specialNeeds.length > 0) {
            await axios.post("/api/v1/pets/special-needs", {
              pet_id: petId,
              special_needs: specialNeeds
            });
          }

          // Save medical conditions
          if (medicalConditions.length > 0) {
            await axios.post("/api/v1/pets/medical-conditions", {
              pet_id: petId,
              medical_conditions: medicalConditions
            });
          }
        } catch (error) {
          console.error("Error saving special needs/medical conditions:", error);
          message.warning("Pet created but special needs/medical conditions failed to save");
        }
      }

      message.success("Pet listing created successfully!");

      // Reset form
      setTitle("");
      setPetType("");
      setCityId("");
      setArea("");
      setDescription("");
      setPrice("");
      setSex("male");
      setBreed("");
      setAge(null);
      setMonths(null);
      setVaccinated(false);
      setNeutered(false);
      setMinAgeOfChildren(0);
      setCanLiveWithDogs(false);
      setCanLiveWithCats(false);
      setMustHaveSomeoneHome(false);
      setContactNumber("");
      setSelectedTags([]);
      setHealthIssues("");
      setRescueStory("");
      setAgeError(null);
      setMonthsError(null);
      setFileList([]);
      setCurrentStep(1);

      // Reset special needs and medical conditions
      setSpecialNeeds([]);
      setMedicalConditions([]);
      setNewSpecialNeed("");
      setNewMedicalCondition("");
      setNewTreatmentCost(null);
      setNewTreated(false);

    } catch (error) {
      console.error("Error creating pet listing:", error);
      message.error("Failed to create pet listing. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  const nextStep = () => {
    if (!title || !petType || !cityId) {
      message.error("Please fill in all required fields");
      return;
    }
    setCurrentStep(2);
  };

  const prevStep = () => {
    setCurrentStep(1);
  };

  const AVAILABLE_TAGS = [
    { id: 1, name: 'Playful', category: 'personality' },
    { id: 2, name: 'Calm', category: 'personality' },
    { id: 3, name: 'Affectionate', category: 'personality' },
    { id: 4, name: 'Independent', category: 'personality' },
    { id: 5, name: 'Vocal', category: 'personality' },
    { id: 6, name: 'Gentle', category: 'personality' },
    { id: 7, name: 'Energetic', category: 'personality' },
    { id: 8, name: 'Shy', category: 'personality' },
    { id: 9, name: 'Confident', category: 'personality' },
    { id: 10, name: 'Curious', category: 'personality' },
    { id: 11, name: 'Good with kids', category: 'lifestyle' },
    { id: 12, name: 'Apartment friendly', category: 'lifestyle' },
    { id: 13, name: 'Needs outdoor space', category: 'lifestyle' },
    { id: 14, name: 'Low maintenance', category: 'lifestyle' },
    { id: 15, name: 'Lap cat/dog', category: 'lifestyle' },
    { id: 16, name: 'Active lifestyle', category: 'lifestyle' },
    { id: 17, name: 'Vaccinated', category: 'health' },
    { id: 18, name: 'Neutered/Spayed', category: 'health' },
    { id: 19, name: 'Special needs', category: 'health' },
    { id: 20, name: 'Senior pet', category: 'health' },
    { id: 21, name: 'Good with dogs', category: 'compatibility' },
    { id: 22, name: 'Good with cats', category: 'compatibility' },
    { id: 23, name: 'Good with other pets', category: 'compatibility' },
    { id: 24, name: 'Prefers to be only pet', category: 'compatibility' }
  ];

  const toggleTag = (id: number) => {
    setSelectedTags(prev =>
      prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id]
    );
  };

  // Special needs functions
  const addSpecialNeed = () => {
    if (newSpecialNeed.trim() && !specialNeeds.includes(newSpecialNeed.trim())) {
      setSpecialNeeds([...specialNeeds, newSpecialNeed.trim()]);
      setNewSpecialNeed("");
    }
  };

  const removeSpecialNeed = (need: string) => {
    setSpecialNeeds(specialNeeds.filter(n => n !== need));
  };

  // Medical conditions functions
  const addMedicalCondition = () => {
    if (newMedicalCondition.trim()) {
      const conditionExists = medicalConditions.some(c => c.condition === newMedicalCondition.trim());
      if (!conditionExists) {
        setMedicalConditions([...medicalConditions, {
          condition: newMedicalCondition.trim(),
          treatmentCost: newTreatmentCost,
          treated: newTreated
        }]);
        setNewMedicalCondition("");
        setNewTreatmentCost(null);
        setNewTreated(false);
      }
    }
  };

  const removeMedicalCondition = (condition: string) => {
    setMedicalConditions(medicalConditions.filter(c => c.condition !== condition));
  };

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit}>
        <Card className="w-full">
          <h3 className="text-lg font-semibold mb-4">
            {currentStep === 1 ? "Pet Details" : "Upload Images"}
          </h3>

          {currentStep === 1 ? (
            <div className="space-y-4">
              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Title *
                </label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="E.g. 'Max the friendly dog' or '5 kittens needing homes'"
                  required
                  size="large"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Give your listing a descriptive title that will attract potential adopters
                </p>
              </div>

              <Row gutter={[16, 16]}>
                {/* Pet Type */}
                <Col xs={24} sm={12}>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Pet Type *
                    </label>
                    <Select
                      value={petType}
                      onChange={setPetType}
                      placeholder="Select pet type"
                      className="w-full"
                      size="large"
                    >
                      {categories.map((category) => (
                        <Option key={category.category_id} value={category.category_id.toString()}>
                          {category.category_name}
                        </Option>
                      ))}
                    </Select>
                  </div>
                </Col>

                {/* City */}
                <Col xs={24} sm={12}>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      City *
                    </label>
                    <Select
                      value={cityId}
                      onChange={setCityId}
                      placeholder="Select City"
                      className="w-full"
                      size="large"
                    >
                      {cities.map((city) => (
                        <Option key={city.city_id} value={city.city_id.toString()}>
                          {city.city_name}
                        </Option>
                      ))}
                    </Select>
                  </div>
                </Col>
              </Row>

              <Row gutter={[16, 16]}>
                {/* Area */}
                <Col xs={24} sm={12}>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Area/Neighborhood *
                    </label>
                    <Input
                      value={area}
                      onChange={(e) => setArea(e.target.value)}
                      placeholder="Enter your area or neighborhood"
                      size="large"
                    />
                  </div>
                </Col>

                {/* Sex */}
                <Col xs={24} sm={12}>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Sex *
                    </label>
                    <Select
                      value={sex}
                      onChange={setSex}
                      className="w-full"
                      size="large"
                    >
                      <Option value="male">Male</Option>
                      <Option value="female">Female</Option>
                      <Option value="unknown">Unknown</Option>
                    </Select>
                  </div>
                </Col>
              </Row>

              <Row gutter={[16, 16]}>
                {/* Contact Number */}
                <Col xs={24} sm={24}>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Contact Number *
                    </label>
                    <Input
                      value={contactNumber}
                      onChange={(e) => setContactNumber(e.target.value)}
                      placeholder="+923..."
                      size="large"
                    />
                  </div>
                </Col>
              </Row>

              <Row gutter={[16, 16]}>
                {/* Age */}
                <Col xs={24} sm={8}>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Age (Years) *
                    </label>
                    <InputNumber
                      value={age}
                      onChange={(value) => setAge(value)}
                      placeholder="Years"
                      className="w-full"
                      min={0}
                      size="large"
                    />
                    {ageError && (
                      <p className="text-red-500 text-xs mt-1">{ageError}</p>
                    )}
                  </div>
                </Col>

                {/* Months */}
                <Col xs={24} sm={8}>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Age (Months) *
                    </label>
                    <InputNumber
                      value={months}
                      onChange={(value) => setMonths(value)}
                      placeholder="Months (0-11)"
                      className="w-full"
                      min={0}
                      max={11}
                      size="large"
                    />
                    {monthsError && (
                      <p className="text-red-500 text-xs mt-1">{monthsError}</p>
                    )}
                  </div>
                </Col>

                {/* Price */}
                {showPrice && (
                  <Col xs={24} sm={8}>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Price (PKR) *
                      </label>
                      <InputNumber
                        value={price ? Number(price) : null}
                        onChange={(value) => setPrice(value?.toString() || "")}
                        placeholder="Enter price"
                        className="w-full"
                        min={0}
                        size="large"
                        formatter={value => `PKR ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                        parser={value => Number(value!.replace(/PKR\s?|(,*)/g, '')) || 0}
                      />
                    </div>
                  </Col>
                )}
              </Row>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <TextArea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Tell potential adopters about the pet(s) - personality, history, special needs, etc."
                  rows={3}
                  className="w-full"
                />
              </div>

              {/* Rescue Story - Only for shelters */}
              {entityType === 'shelter' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Rescue Story
                  </label>
                  <TextArea
                    value={rescueStory}
                    onChange={(e) => setRescueStory(e.target.value)}
                    placeholder="Tell the story of how this pet was rescued - where they were found, what condition they were in, their journey to recovery, etc."
                    rows={4}
                    className="w-full"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Share the pet's rescue journey to help potential adopters understand their background and build a connection.
                  </p>
                </div>
              )}

              {/* Additional Details Accordion */}
              <Collapse defaultActiveKey={[]}>
                <Panel header="Additional Details" key="1">
                  <div className="space-y-4">
                    {/* Breed (only for shops) */}
                    {entityType === 'shop' && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Breed
                        </label>
                        <Input
                          value={breed}
                          onChange={(e) => setBreed(e.target.value)}
                          placeholder="Enter breed if known"
                          size="large"
                        />
                      </div>
                    )}

                    {/* Vaccinated & Neutered */}
                    <Row gutter={[16, 16]}>
                      <Col xs={24} sm={12}>
                        <div className="flex items-center">
                          <Switch
                            checked={vaccinated}
                            onChange={setVaccinated}
                            className="mr-2"
                          />
                          <span className="text-sm font-medium text-gray-700">Vaccinated</span>
                        </div>
                      </Col>
                      <Col xs={24} sm={12}>
                        <div className="flex items-center">
                          <Switch
                            checked={neutered}
                            onChange={setNeutered}
                            className="mr-2"
                          />
                          <span className="text-sm font-medium text-gray-700">Neutered/Spayed</span>
                        </div>
                      </Col>
                    </Row>

                    {/* Compatibility */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Compatibility
                      </label>
                      <Row gutter={[16, 16]}>
                        <Col xs={24} sm={8}>
                          <div className="flex items-center">
                            <Switch
                              checked={canLiveWithDogs}
                              onChange={setCanLiveWithDogs}
                              className="mr-2"
                            />
                            <span className="text-sm">Can live with dogs</span>
                          </div>
                        </Col>
                        <Col xs={24} sm={8}>
                          <div className="flex items-center">
                            <Switch
                              checked={canLiveWithCats}
                              onChange={setCanLiveWithCats}
                              className="mr-2"
                            />
                            <span className="text-sm">Can live with cats</span>
                          </div>
                        </Col>
                        <Col xs={24} sm={8}>
                          <div className="flex items-center">
                            <Switch
                              checked={mustHaveSomeoneHome}
                              onChange={setMustHaveSomeoneHome}
                              className="mr-2"
                            />
                            <span className="text-sm">Needs someone home</span>
                          </div>
                        </Col>
                      </Row>
                    </div>

                    {/* Pet Tags */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Pet Attributes
                      </label>
                      <div className="space-y-4">
                        {['personality', 'lifestyle', 'compatibility'].map(category => (
                          <div key={category}>
                            <p className="text-xs font-semibold text-gray-500 uppercase mb-2">{category}</p>
                            <div className="flex flex-wrap gap-2">
                              {AVAILABLE_TAGS.filter(tag => tag.category === category).map(tag => {
                                const isSelected = selectedTags.includes(tag.id);
                                return (
                                  <button
                                    key={tag.id}
                                    type="button"
                                    onClick={() => toggleTag(tag.id)}
                                    className={`px-3 py-1 text-sm rounded-full transition-colors border ${
                                      isSelected
                                        ? 'bg-blue-100 text-blue-700 border-blue-300'
                                        : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                                    }`}
                                  >
                                    {tag.name}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Health Issues */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Known Health Issues
                      </label>
                      <Input
                        value={healthIssues}
                        onChange={(e) => setHealthIssues(e.target.value)}
                        placeholder="Describe any health issues"
                        size="large"
                      />
                    </div>

                    {/* Special Needs - Only for shelters */}
                    {entityType === 'shelter' && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Special Needs
                        </label>
                        <div className="space-y-2">
                          <div className="flex flex-col sm:flex-row gap-2">
                            <Input
                              value={newSpecialNeed}
                              onChange={(e) => setNewSpecialNeed(e.target.value)}
                              placeholder="Enter special need"
                              onPressEnter={addSpecialNeed}
                              size="large"
                              className="flex-1"
                            />
                            <Button
                              type="primary"
                              onClick={addSpecialNeed}
                              disabled={!newSpecialNeed.trim()}
                              size="large"
                              className="w-full sm:w-auto"
                            >
                              Add
                            </Button>
                          </div>
                          {specialNeeds.length > 0 && (
                            <div className="space-y-2">
                              {specialNeeds.map((need, index) => (
                                <div key={index} className="flex items-center justify-between bg-gray-50 p-3 rounded border">
                                  <span className="text-sm flex-1 pr-2">{need}</span>
                                  <Button
                                    type="text"
                                    size="small"
                                    danger
                                    onClick={() => removeSpecialNeed(need)}
                                    className="flex-shrink-0"
                                  >
                                    Remove
                                  </Button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Medical Conditions - Only for shelters */}
                    {entityType === 'shelter' && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Medical Conditions
                        </label>
                        <div className="space-y-3">
                          <div className="border p-3 rounded-lg bg-gray-50">
                            <div className="space-y-2">
                              <Input
                                value={newMedicalCondition}
                                onChange={(e) => setNewMedicalCondition(e.target.value)}
                                placeholder="Enter medical condition"
                                size="large"
                              />
                              <Row gutter={[8, 8]}>
                                <Col xs={24} sm={12}>
                                  <InputNumber
                                    value={newTreatmentCost}
                                    onChange={(value) => setNewTreatmentCost(value)}
                                    placeholder="Treatment cost (PKR)"
                                    className="w-full"
                                    min={0}
                                    size="large"
                                    formatter={value => `PKR ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                                    parser={value => Number(value!.replace(/PKR\s?|(,*)/g, '')) || 0}
                                  />
                                </Col>
                                <Col xs={24} sm={12}>
                                  <div className="flex items-center h-full">
                                    <Switch
                                      checked={newTreated}
                                      onChange={setNewTreated}
                                      className="mr-2"
                                    />
                                    <span className="text-sm">Treated</span>
                                  </div>
                                </Col>
                              </Row>
                              <Button
                                type="primary"
                                onClick={addMedicalCondition}
                                disabled={!newMedicalCondition.trim()}
                                className="w-full"
                              >
                                Add Medical Condition
                              </Button>
                            </div>
                          </div>
                          {medicalConditions.length > 0 && (
                            <div className="space-y-3">
                              {medicalConditions.map((condition, index) => (
                                <div key={index} className="flex flex-col sm:flex-row sm:items-center justify-between bg-gray-50 p-3 rounded border gap-2">
                                  <div className="flex-1">
                                    <div className="font-medium text-sm">{condition.condition}</div>
                                    <div className="text-xs text-gray-600 mt-1">
                                      Cost: {condition.treatmentCost ? `PKR ${condition.treatmentCost.toLocaleString()}` : 'Not specified'} |
                                      Status: {condition.treated ? 'Treated' : 'Not treated'}
                                    </div>
                                  </div>
                                  <Button
                                    type="text"
                                    size="small"
                                    danger
                                    onClick={() => removeMedicalCondition(condition.condition)}
                                    className="flex-shrink-0 w-full sm:w-auto"
                                  >
                                    Remove
                                  </Button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </Panel>
              </Collapse>

              <div className="flex justify-end">
                <Button
                  type="primary"
                  onClick={nextStep}
                  className="mt-4 w-full sm:w-auto"
                  size="large"
                >
                  Next
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Upload Images */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Upload Images (Maximum 5)
                </label>
                <Upload
                  action=""
                  listType="picture-card"
                  fileList={fileList}
                  onPreview={handlePreview}
                  onChange={handleChange}
                  beforeUpload={beforeUpload}
                  maxCount={5}
                >
                  {fileList.length >= 5 ? null : uploadButton}
                </Upload>
                {previewImage && (
                  <Image
                    wrapperStyle={{ display: "none" }}
                    preview={{
                      visible: previewOpen,
                      onVisibleChange: (visible) => setPreviewOpen(visible),
                      afterOpenChange: (visible) => !visible && setPreviewImage(""),
                    }}
                    src={previewImage}
                  />
                )}
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <Button
                  onClick={prevStep}
                  className="w-full sm:flex-1"
                  size="large"
                >
                  Back
                </Button>
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={uploading}
                  className="w-full sm:flex-1"
                  size="large"
                >
                  {uploading ? "Creating Listing..." : "Create Listing"}
                </Button>
              </div>
            </div>
          )}
        </Card>
      </form>
    </div>
  );
}