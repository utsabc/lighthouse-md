import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_TOKEN);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });


const prompt = `Attached is an image of a clinical report. Go over the clinical report and identify the biomarkers that show slight or large abnormalities. Then write a summary of the report, including the identified biomarkers and their abnormalities. If the report has multiple pages, please summarize all the pages.
Make sure to include numerical values and key details from the report in your summary. Do not include any personal information from the report in your summary.`;

function fileToGenerativePart(fileContent: string) {
  return {
    inlineData: {
      data: fileContent.split(",")[1],
      mimeType: fileContent.substring(
        fileContent.indexOf(":") + 1,
        fileContent.indexOf(";")
      ),
    },
  };
}


export async function getSummaryForClinicalReport(fileContent: string) {
  const generativePart = fileToGenerativePart(fileContent);
  const response =  await model.generateContent([prompt, generativePart]);
  return response.response.text();
}
