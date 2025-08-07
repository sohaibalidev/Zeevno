import json
import random
import os
import datetime

# Create directory if it doesn't exist
os.makedirs("Dev Tools/Database Json", exist_ok=True)

imageUrls = [
    "/api/images/img1.jpeg",
    "/api/images/img2.jpeg",
    "/api/images/img3.jpeg",
    "/api/images/img4.jpeg",
    "/api/images/img5.jpeg",
    "/api/images/img6.jpeg",
    "/api/images/img7.jpeg",
    "/api/images/img8.jpeg",
    "/api/images/img9.jpeg",
    "/api/images/img10.jpeg",
    "/api/images/img11.jpeg",
    "/api/images/img12.jpeg",
    "/api/images/img13.jpeg",
]

categories = [
    "smartwatch",
    "powerbank",
    "airbuds",
    "gaming-headset",
    "wireless-charger",
    "bluetooth-speaker",
    "vr-headset",
]

prefixes = ["Hyper", "Fit", "Charge", "Qi", "Immersa", "Pulse", "Sound"]
midParts = ["Boost", "Mate", "Sync", "Pro", "X", "Titan", "Max"]
suffixes = ["Ultra", "X2", "5", "Elite", "Air", "360", "Plus"]

generatedNames = set()


def generateUniqueName():
    while True:
        name = f"{random.choice(prefixes)}{random.choice(midParts)} {random.choice(suffixes)}"
        if name not in generatedNames:
            generatedNames.add(name)
            return name


# Sample descriptions and features
descriptions = [
    "Experience cutting-edge technology with our premium product.",
    "The ultimate solution for your everyday needs with advanced features.",
    "Designed for performance and style, this product exceeds expectations.",
    "Innovative design meets superior functionality in this amazing product.",
    "Transform your experience with this high-quality, feature-rich product.",
]

featuresOptions = [
    ["Long battery life", "Fast charging", "Water resistant", "Bluetooth connectivity"],
    [
        "High-resolution display",
        "Multiple color options",
        "Lightweight design",
        "Voice assistant",
    ],
    [
        "Noise cancellation",
        "Comfortable fit",
        "Wireless freedom",
        "Crystal clear sound",
    ],
    ["Sleek design", "Multiple ports", "Compact size", "Fast data transfer"],
    [
        "Immersive experience",
        "Adjustable straps",
        "High refresh rate",
        "Wide compatibility",
    ],
]

otherOptions = [
    {"material": "Plastic", "warranty": "1 year", "dimensions": "5x3x1 inches"},
    {"weight": "150g", "compatibility": "iOS/Android", "chargingTime": "2 hours"},
    {
        "batteryCapacity": "4000mAh",
        "connectivity": "Bluetooth 5.0",
        "colorOptions": "3",
    },
    {
        "screenSize": "1.4 inch",
        "sensors": "Heart rate, Step counter",
        "waterResistance": "IP68",
    },
    {"driverSize": "40mm", "frequencyResponse": "20Hz-20kHz", "impedance": "32 ohms"},
]

whatsInBoxOptions = [
    "1 x Main Unit, 1 x Charging Cable, 1 x User Manual, 1 x Warranty Card",
    "1 x Product, 2 x AAA Batteries, Quick Start Guide",
    "1 x Device, 1 x USB-C Cable, 1 x Ear Tips (S/M/L), 1 x Storage Pouch",
    "1 x Headset, 1 x AUX Cable, 1 x Cleaning Cloth",
    "1 x Smartwatch, 1 x Magnetic Charger, 1 x Strap (Extra)",
    "1 x Speaker, 1 x Power Adapter, 1 x 3.5mm Audio Cable",
    "1 x VR Headset, 2 x Controllers, 1 x Lens Cleaning Kit",
]

# Generate reviews first with unique IDs
reviews = []
for i in range(1, 101):  # 100 reviews
    firstNames = [
        "Ali",
        "Fatima",
        "Usman",
        "Aisha",
        "Bilal",
        "Zainab",
        "Haroon",
        "Sana",
        "Owais",
        "Hira",
    ]
    lastNames = [
        "Ahmed",
        "Khan",
        "Malik",
        "Rizwan",
        "Akhtar",
        "Shaikh",
        "Chaudhry",
        "Memon",
        "Qureshi",
        "Siddiqui",
    ]

    review = {
        "reviewId": f"rev_{1000 + i}",
        "email": f"{random.choice(firstNames).lower()}.{random.choice(lastNames).lower()}@example.com",
        "name": f"{random.choice(firstNames)} {random.choice(lastNames)}",
        "rating": random.randint(1, 5),
        "review": random.choice(
            [
                "Absolutely revolutionary! The immersion is unlike anything I've experienced.",
                "Great value for money, though the product gets warm after prolonged use.",
                "Frequent software glitches ruin the experience. Needs better QC.",
                "Worth every penny! The features make this product exceptional.",
            ]
        ),
        "date": f"2024-{random.randint(1, 12):02d}-{random.randint(1, 28):02d}",
        "timestamp": random.randint(1700000000, 1730000000),
    }
    reviews.append(review)

# Generate products with references to review IDs
products = []
for i in range(1, 121):  # 120 products
    category = random.choice(categories)
    productName = generateUniqueName()
    random.shuffle(imageUrls)

    regularPrice = random.randint(50, 90) * 100  # 5000 to 9000 in 100s
    discountedPrice = regularPrice - random.randint(10, 40) * 100

    if discountedPrice < 0:
        discountedPrice = 0

    description = random.choice(descriptions)
    features = random.choice(featuresOptions)
    otherDetails = random.choice(otherOptions)

    extraFields = {
        "expressDelivery": random.choice(["Available", "Not Available"]),
        "modelYear": random.randint(2020, 2023),
    }
    otherDetails.update(extraFields)

    # Select random reviews (3-6 reviews per product)
    reviewIds = random.sample([r["reviewId"] for r in reviews], k=random.randint(3, 6))

    product = {
        "id": str(123400 + i),
        "category": category,
        "name": productName,
        "pricing": {
            "originalPrice": regularPrice,
            "currentPrice": discountedPrice,
        },
        "inventory": {
            "stockQuantity": random.choice([0, random.randint(1, 50)]),
            "inStock": False,  # Will be set below
        },
        "isFeatured": random.choice([True] + [False] * 6),
        "createdAt": datetime.datetime.now().isoformat(),
        "variants": {
            "hasColorOptions": True,
            "availableColors": [
                color.strip()
                for color in random.choice(
                    [
                        "Black, White, Silver, Gray",
                        "Red, Blue, Yellow",
                        "Green, LimeGreen, Olive",
                    ]
                ).split(",")
            ],
        },
        "media": {"imageUrls": imageUrls[:4], "primaryImage": imageUrls[0]},
        "specifications": {
            "packageContents": random.choice(whatsInBoxOptions),
            "description": description,
            "keyFeatures": features,
            "technicalSpecs": otherDetails,
            "reviewIds": reviewIds,
        },
        "metadata": {
            "lastUpdated": datetime.datetime.now().isoformat(),
            "source": "inventorySystem",
        },
    }

    # Set inStock status
    product["inventory"]["inStock"] = product["inventory"]["stockQuantity"] > 0

    products.append(product)

# Save products and reviews to separate files
with open("Dev Tools/Database Json/products.json", "w") as f:
    json.dump(products, f, indent=2)

with open("Dev Tools/Database Json/reviews.json", "w") as f:
    json.dump(reviews, f, indent=2)

print("Done! Generated products.json and reviews.json in Dev Tools/Database Json/")
