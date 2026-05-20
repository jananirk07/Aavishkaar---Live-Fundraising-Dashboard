import { FundConfig } from "@/types/fund";

export const FUND_CONFIGS: FundConfig[] = [
  {
    id: "jvf2",
    name: "Jamwant Ventures Fund II",
    shortName: "JVF II",
    targetSize: 500,
    currency: "INR",
    strategy: "Equity, early-stage dual-use defence tech",
    csvUrl:
      process.env.JVF2_CSV_URL ||
      "https://docs.google.com/spreadsheets/d/e/2PACX-1vRegulIrdZoqM5ztMQDG7ZRsOXqGiGPGUP1yXl0EmKMDXxyGp48iOEoxmImeS0atJOPdYGZ5mBV26M4/pub?output=csv",
    owners: ["Navneet", "Tarun", "Shriya", "Somnil", "Kartik Sir"],
    color: "#0f4c81",
  },
  {
    id: "anf",
    name: "Aavishkaar Next Gen Fund",
    shortName: "ANF",
    targetSize: 2000,
    currency: "INR",
    strategy: "Equity, growth-stage impact tech",
    csvUrl:
      process.env.ANF_CSV_URL ||
      "https://docs.google.com/spreadsheets/d/e/2PACX-1vQ0rC5V7y7hxMswQsydX_rZMPlaZknrGSE95zME6VkK4uQVEInXWMSl7QJ5Ov-Xa3eF8vL_ODylwTD8/pub?output=csv",
    owners: [
      "Sanchayan",
      "Anurag",
      "Shashwat",
      "Shilpa",
      "Tarun",
      "Vineet",
      "Shriya",
    ],
    color: "#1a6b3c",
  },
  {
    id: "gscsf",
    name: "Global Supply Chain Support Fund",
    shortName: "GSCSF",
    targetSize: 150,
    currency: "USD",
    strategy: "Private credit for SMEs in Africa and Asia supply chains",
    csvUrl:
      process.env.GSCSF_CSV_URL ||
      "https://docs.google.com/spreadsheets/d/e/2PACX-1vR0RFVaGXuu8smeMc067NVtNvhhxlrQTITaK3BQ16rAaFN0Mv0NyCMGXgILh8qp9Q/pub?output=csv",
    owners: ["Abhishek", "Ashish", "Monu", "Shriya"],
    color: "#7c3aed",
  },
];
