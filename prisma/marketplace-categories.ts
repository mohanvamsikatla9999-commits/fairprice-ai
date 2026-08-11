/**
 * Marketplace category tree for FairPrice AI classifieds.
 * Parent → children; attributes drive dynamic sell/filter forms.
 */

export type CategorySeedNode = {
  name: string;
  slug: string;
  icon?: string;
  description?: string;
  children?: CategorySeedNode[];
  attributes?: Array<{
    key: string;
    label: string;
    type: "TEXT" | "NUMBER" | "BOOLEAN" | "SELECT" | "MULTI_SELECT" | "DATE";
    options?: string[];
    required?: boolean;
    unit?: string;
  }>;
};

export const MARKETPLACE_CATEGORY_TREE: CategorySeedNode[] = [
  {
    name: "Cars",
    slug: "cars",
    icon: "car",
    description: "Used cars and SUVs",
    attributes: [
      { key: "brand", label: "Brand", type: "TEXT", required: true },
      { key: "model", label: "Model", type: "TEXT", required: true },
      { key: "year", label: "Year", type: "NUMBER", required: true },
      {
        key: "fuel",
        label: "Fuel",
        type: "SELECT",
        options: ["Petrol", "Diesel", "CNG", "Electric", "Hybrid"],
        required: true,
      },
      {
        key: "transmission",
        label: "Transmission",
        type: "SELECT",
        options: ["Manual", "Automatic"],
      },
      { key: "km_driven", label: "KM driven", type: "NUMBER", unit: "km" },
      {
        key: "owners",
        label: "Owners",
        type: "SELECT",
        options: ["1", "2", "3", "4+"],
      },
    ],
    children: [
      { name: "Cars", slug: "cars-cars" },
      { name: "Spare Parts", slug: "cars-spare-parts" },
    ],
  },
  {
    name: "Bikes",
    slug: "bikes",
    icon: "bike",
    description: "Motorcycles, scooters and bicycles",
    attributes: [
      { key: "brand", label: "Brand", type: "TEXT", required: true },
      { key: "model", label: "Model", type: "TEXT", required: true },
      { key: "year", label: "Year", type: "NUMBER" },
      { key: "km_driven", label: "KM driven", type: "NUMBER", unit: "km" },
      {
        key: "fuel",
        label: "Fuel",
        type: "SELECT",
        options: ["Petrol", "Electric"],
      },
    ],
    children: [
      { name: "Motorcycles", slug: "motorcycles" },
      { name: "Scooters", slug: "scooters" },
      { name: "Spare Parts", slug: "bike-spare-parts" },
      { name: "Bicycles", slug: "bicycles" },
    ],
  },
  {
    name: "Properties",
    slug: "properties",
    icon: "building",
    description: "Sale and rent properties",
    attributes: [
      {
        key: "property_type",
        label: "Property type",
        type: "SELECT",
        options: ["Apartment", "Independent House", "Plot", "Shop", "Office", "PG"],
      },
      { key: "bedrooms", label: "Bedrooms", type: "SELECT", options: ["1", "2", "3", "4", "5+"] },
      { key: "bathrooms", label: "Bathrooms", type: "SELECT", options: ["1", "2", "3", "4+"] },
      { key: "area_sqft", label: "Area", type: "NUMBER", unit: "sqft" },
      {
        key: "furnishing",
        label: "Furnishing",
        type: "SELECT",
        options: ["Unfurnished", "Semi-furnished", "Fully furnished"],
      },
    ],
    children: [
      { name: "For Sale: Houses & Apartments", slug: "property-sale-homes" },
      { name: "For Rent: Houses & Apartments", slug: "property-rent-homes" },
      { name: "Lands & Plots", slug: "lands-plots" },
      { name: "New Projects", slug: "new-projects" },
      { name: "Shops & Offices", slug: "shops-offices" },
      { name: "PG & Guest Houses", slug: "pg-guest-houses" },
    ],
  },
  {
    name: "Electronics & Appliances",
    slug: "electronics",
    icon: "tv",
    description: "TVs, computers, appliances",
    children: [
      { name: "TVs / Video / Audio", slug: "tvs-video-audio" },
      { name: "Kitchen Appliances", slug: "kitchen-appliances" },
      { name: "Computers & Laptops", slug: "computers-laptops" },
      { name: "Cameras & Lenses", slug: "cameras-lenses" },
      { name: "Games & Entertainment", slug: "games-entertainment" },
      { name: "Fridges", slug: "fridges" },
      { name: "Computer Accessories", slug: "computer-accessories" },
      { name: "Hard Disks / Printers / Monitors", slug: "storage-printers-monitors" },
      { name: "ACs", slug: "acs" },
      { name: "Washing Machines", slug: "washing-machines" },
    ],
  },
  {
    name: "Mobiles",
    slug: "mobiles",
    icon: "smartphone",
    description: "Phones, tablets and accessories",
    attributes: [
      { key: "brand", label: "Brand", type: "TEXT", required: true },
      { key: "model", label: "Model", type: "TEXT", required: true },
      {
        key: "storage",
        label: "Storage",
        type: "SELECT",
        options: ["32GB", "64GB", "128GB", "256GB", "512GB", "1TB"],
      },
      {
        key: "ram",
        label: "RAM",
        type: "SELECT",
        options: ["2GB", "3GB", "4GB", "6GB", "8GB", "12GB", "16GB"],
      },
      {
        key: "warranty",
        label: "Warranty",
        type: "SELECT",
        options: ["No warranty", "Under warranty", "Extended warranty"],
      },
    ],
    children: [
      { name: "Mobile Phones", slug: "mobile-phones" },
      { name: "Accessories", slug: "mobile-accessories" },
      { name: "Tablets", slug: "tablets" },
    ],
  },
  {
    name: "Commercial Vehicles & Spares",
    slug: "commercial-vehicles",
    icon: "truck",
    children: [
      { name: "Commercial & Other Vehicles", slug: "commercial-other-vehicles" },
      { name: "Spare Parts", slug: "commercial-spare-parts" },
    ],
  },
  {
    name: "Jobs",
    slug: "jobs",
    icon: "briefcase",
    description: "Local job classifieds",
    children: [
      { name: "Data Entry", slug: "jobs-data-entry" },
      { name: "Sales & Marketing", slug: "jobs-sales-marketing" },
      { name: "BPO & Telecaller", slug: "jobs-bpo" },
      { name: "Driver", slug: "jobs-driver" },
      { name: "Delivery & Collection", slug: "jobs-delivery" },
      { name: "Teacher", slug: "jobs-teacher" },
      { name: "Cook", slug: "jobs-cook" },
      { name: "Receptionist", slug: "jobs-receptionist" },
      { name: "Operator & Technician", slug: "jobs-technician" },
      { name: "IT Engineer & Developer", slug: "jobs-it" },
      { name: "Hotel & Travel", slug: "jobs-hotel" },
      { name: "Accountant", slug: "jobs-accountant" },
      { name: "Warehouse", slug: "jobs-warehouse" },
      { name: "Designer", slug: "jobs-designer" },
      { name: "Other Jobs", slug: "jobs-other" },
    ],
  },
  {
    name: "Furniture",
    slug: "furniture",
    icon: "sofa",
    children: [
      { name: "Sofa & Dining", slug: "sofa-dining" },
      { name: "Beds & Wardrobes", slug: "beds-wardrobes" },
      { name: "Home Decor & Garden", slug: "home-decor-garden" },
      { name: "Kids Furniture", slug: "kids-furniture" },
      { name: "Other Household Items", slug: "other-household" },
    ],
  },
  {
    name: "Fashion",
    slug: "fashion",
    icon: "shirt",
    children: [
      { name: "Men", slug: "fashion-men" },
      { name: "Women", slug: "fashion-women" },
      { name: "Kids", slug: "fashion-kids" },
    ],
  },
  {
    name: "Pets",
    slug: "pets",
    icon: "paw",
    children: [
      { name: "Fish & Aquarium", slug: "fish-aquarium" },
      { name: "Pet Food & Accessories", slug: "pet-food-accessories" },
      { name: "Other Pets", slug: "other-pets" },
    ],
  },
  {
    name: "Books, Sports & Hobbies",
    slug: "books-sports-hobbies",
    icon: "book",
    children: [
      { name: "Books", slug: "books" },
      { name: "Gym & Fitness", slug: "gym-fitness" },
      { name: "Musical Instruments", slug: "musical-instruments" },
      { name: "Sports Equipment", slug: "sports-equipment" },
      { name: "Other Hobbies", slug: "other-hobbies" },
    ],
  },
  {
    name: "Services",
    slug: "services",
    icon: "wrench",
    children: [
      { name: "Education & Classes", slug: "education-classes" },
      { name: "Tours & Travel", slug: "tours-travel" },
      { name: "Electronics Repair", slug: "electronics-repair" },
      { name: "Health & Beauty", slug: "health-beauty" },
      { name: "Home Renovation & Repair", slug: "home-renovation" },
      { name: "Cleaning & Pest Control", slug: "cleaning-pest" },
      { name: "Legal & Documentation", slug: "legal-docs" },
      { name: "Packers & Movers", slug: "packers-movers" },
      { name: "Other Services", slug: "other-services" },
    ],
  },
];

export const CITY_AREAS: Record<string, string[]> = {
  hyderabad: ["Madhapur", "Kondapur", "Gachibowli", "Hitech City", "Banjara Hills", "Secunderabad"],
  bengaluru: ["Koramangala", "Indiranagar", "Whitefield", "HSR Layout", "Electronic City", "Jayanagar"],
  mumbai: ["Andheri", "Bandra", "Powai", "Thane", "Navi Mumbai", "Dadar"],
  delhi: ["Saket", "Connaught Place", "Dwarka", "Rohini", "South Extension", "Karol Bagh"],
  chennai: ["T Nagar", "Anna Nagar", "Velachery", "OMR", "Adyar"],
  pune: ["Hinjewadi", "Kothrud", "Viman Nagar", "Baner", "Hadapsar"],
  kolkata: ["Salt Lake", "Park Street", "Howrah", "New Town"],
  ahmedabad: ["SG Highway", "Navrangpura", "Satellite", "Bopal"],
};
