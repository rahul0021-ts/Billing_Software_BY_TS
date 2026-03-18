require("dotenv").config({ path: require("path").join(__dirname, "../.env") });
const mongoose = require("mongoose");
const Section = require("../models/Section");

const SECTIONS = [
  {
    sectionId: "mens",
    label: "Men's",
    order: 1,
    subsections: [
      { id: "mens_shirt", label: "Men's Shirts", defaultSizes: ["S", "M", "L", "XL", "XXL"], order: 1 },
      { id: "mens_pant", label: "Men's Pants / Jeans", defaultSizes: ["28", "30", "32", "34", "36", "38", "40"], order: 2 },
    ],
  },
  {
    sectionId: "boys",
    label: "Boys",
    order: 2,
    subsections: [
      { id: "boys_shirt", label: "Boys Shirts", defaultSizes: ["26", "28", "30", "32", "34", "36", "38","40"], order: 1 },
      { id: "boys_pant", label: "Boys Pants", defaultSizes: ["20", "22", "24", "26", "28", "30"], order: 2 },
    ],
  },
  {
    sectionId: "women",
    label: "Women",
    order: 3,
    subsections: [
      { id: "women_dress", label: "Women Dress / Kurti", defaultSizes: ["S", "M", "L", "XL", "XXL"], order: 1 },
      { id: "women_tops", label: "Women Tops", defaultSizes: ["S", "M", "L", "XL", "XXL"], order: 2 },
      { id: "women_pant", label: "Women Pants / Jeans", defaultSizes: ["26", "28", "30", "32", "34"], order: 3 },
    ],
  },
  {
    sectionId: "girls",
    label: "Girls",
    order: 4,
    subsections: [
      { id: "girls_dress", label: "Girls Dress / Frock", defaultSizes: ["S", "M", "L", "18", "20", "22", "24"], order: 1 },
      { id: "girls_tops", label: "Girls Tops", defaultSizes: ["S", "M", "L", "XL"], order: 2 },
      { id: "girls_pant", label: "Girls Pants", defaultSizes: ["18", "20", "22", "24", "26"], order: 3 },
    ],
  },
  {
    sectionId: "hosiery",
    label: "Hosiery",
    order: 5,
    subsections: [
      { id: "mens_inner", label: "Men's Innerwear", defaultSizes: ["S", "M", "L", "XL", "XXL", "70", "75", "80", "85", "90", "100"], order: 1 },
      { id: "womens_inner", label: "Women's Innerwear", defaultSizes: ["S", "M", "L", "XL", "30", "32", "34", "36", "38", "40"], order: 2 },
      { id: "boys_inner", label: "Boys Innerwear", defaultSizes: ["S", "M", "L", "24", "26", "28", "30"], order: 3 },
      { id: "girls_inner", label: "Girls Innerwear", defaultSizes: ["S", "M", "L", "24", "26", "28", "30"], order: 4 },
    ],
  },
  {
    sectionId: "other",
    label: "Others",
    order: 6,
    subsections: [
      { id: "towel", label: "Towels", defaultSizes: ["30x60", "32x64", "36x72"], order: 1 },
      { id: "napkin", label: "Napkins / Handkerchief", defaultSizes: ["Small", "Medium", "Large"], order: 2 },
      { id: "caps", label: "Caps / Hats", defaultSizes: ["Free Size", "S", "M", "L", "XL"], order: 3 },
      { id: "scarf", label: "Scarves / Dupattas", defaultSizes: ["Free Size", "Small", "Medium", "Large"], order: 4 },
    ],
  },
];

async function seed() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB");

    // ✅ Only clear sections
    await Section.deleteMany({});
    console.log("Cleared existing sections");

    // ❌ Removed product deletion
    // await Product.deleteMany({});

    const sections = await Section.insertMany(SECTIONS);
    console.log(`Created ${sections.length} sections`);

    console.log("\n✅ Seed complete!");
    console.log(`   Sections: ${sections.length}`);
    console.log(`   Products: 0 (manual from frontend)`);

    process.exit(0);
  } catch (err) {
    console.error("Seed failed:", err.message);
    process.exit(1);
  }
}

seed();