import React from "react";

const VetVerificationPage = () => {
  const data = {
    vets: [
      {
        vet_id: 2,
        vet_name: "John Doe",
        vet_email: "johndoe@example.com",
        profile_verified: false,
        qualifications: [
          {
            qualification_id: 1,
            year_acquired: 2019,
            note: "woaahh",
            images: [
              "https://res.cloudinary.com/dfwykqn1d/image/upload/v1733469992/etlwlwsj7twqcm3hlrua.png",
              "https://res.cloudinary.com/dfwykqn1d/image/upload/v1733469615/dzfqnu0m9suh1ra5mewp.png",
              "https://res.cloudinary.com/dfwykqn1d/image/upload/v1733469310/jeq434grs3ztx6h1gyuu.png",
            ],
          },
        ],
      },
      {
        vet_id: 14,
        vet_name: "tete",
        vet_email: "hydra@hy.com",
        profile_verified: false,
        qualifications: [
          {
            qualification_id: 1,
            year_acquired: 2020,
            note: "fear me",
            images: [
              "https://res.cloudinary.com/dfwykqn1d/image/upload/v1733469992/etlwlwsj7twqcm3hlrua.png",
              "https://res.cloudinary.com/dfwykqn1d/image/upload/v1733469615/dzfqnu0m9suh1ra5mewp.png",
              "https://res.cloudinary.com/dfwykqn1d/image/upload/v1733469310/jeq434grs3ztx6h1gyuu.png",
            ],
          },
          {
            qualification_id: 2,
            year_acquired: 2012,
            note: "im cool",
            images: [
              "https://res.cloudinary.com/dfwykqn1d/image/upload/v1733470001/jnwxevzhakbxabzi57eh.png",
              "https://res.cloudinary.com/dfwykqn1d/image/upload/v1733469629/uolzfeecxmozhrpjcivr.png",
              "https://res.cloudinary.com/dfwykqn1d/image/upload/v1733469356/snopyrthbsron4bpjjyd.png",
            ],
          },
        ],
      },
    ],
  };

  return (
    <div style={{ padding: "20px" }}>
      <h1>Vet Verification Applications</h1>
      {data.vets.map((vet) => (
        <div
          key={vet.vet_id}
          style={{
            border: "1px solid #ddd",
            borderRadius: "8px",
            padding: "20px",
            marginBottom: "20px",
          }}
        >
          <h2>
            {vet.vet_name} ({vet.vet_email})
          </h2>
          <p>
            <strong>Profile Verified:</strong>{" "}
            {vet.profile_verified ? "Yes" : "No"}
          </p>
          <h3>Qualifications:</h3>
          {vet.qualifications.map((qualification) => (
            <div
              key={qualification.qualification_id}
              style={{
                border: "1px solid #ccc",
                borderRadius: "8px",
                padding: "15px",
                margin: "10px 0",
              }}
            >
              <p>
                <strong>Qualification ID:</strong> {qualification.qualification_id}
              </p>
              <p>
                <strong>Year Acquired:</strong> {qualification.year_acquired}
              </p>
              <p>
                <strong>Note:</strong> {qualification.note}
              </p>
              <h4>Images:</h4>
              <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                {qualification.images.map((image, index) => (
                  <img
                    key={index}
                    src={image}
                    alt={`Qualification ${qualification.qualification_id} - Proof ${index + 1}`}
                    style={{
                      width: "150px",
                      height: "150px",
                      objectFit: "cover",
                      borderRadius: "8px",
                    }}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
};

export default VetVerificationPage;
