import express from 'express';
import { GoogleGenAI,Type  } from '@google/genai';
import dotenv from 'dotenv';
import fs from "fs";

// Load environment variables from .env file
dotenv.config();

// Initialize Express app
const app = express();
const port = process.env.PORT || 3000;

// Middleware to parse JSON bodies
app.use(express.json());
app.use(express.json({ limit: "10mb" }));

// Initialize the Google AI client with the API key from environment variables
const ai = new GoogleGenAI(process.env.GEMINI_API_KEY);



// const base64ImageFile = fs.readFileSync("path/to/small-sample.jpg", {
//   encoding: "base64",
// });

// Define the API route for content generation
app.get('/generate', async (req, res) => {
  try {
    

    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: "Explain how AI works in a one line words in json format or the app will crash",
    });
    console.log(response.text);

    

    res.send("done")

  } catch (error) {
    console.error('Error generating content:', error);
    res.status(500).json({ error: 'Failed to generate content' });
  }
});


//gemini structured output
app.get('/structured-output', async (req,res) =>{
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents:
            "List a few popular cookie recipes, and include the amounts of ingredients.",
            config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        recipeName: {
                            type: Type.STRING,
                        },
                        ingredients: {
                            type: Type.ARRAY,
                        items: {
                            type: Type.STRING,
                        },
                        },
                    },
                propertyOrdering: ["recipeName", "ingredients"],
                },
            },
            },
        });


        const data = JSON.parse(response.text);
        console.log(data);
        res.json(data).status(200)
    } catch (error) {
        console.error('Error generating structured-output:', error);
        res.status(500).json({ error: 'Failed to structured-output content' });
    }finally{
        console.log("structured-output ran")
    }
})



// Structured farmer ranking with Gemini
app.get('/structured-farmers', async (req, res) => {
  try {
    // Example farmer data from DB (could be dynamically fetched)
    const farmersData = [
      { farmer_id: 1, crop_grow_year: 2019, asked_quality: "A grade", delivered_quality: "A grade", asked_qty: 100, delivered_qty: 80, price: 16 },
      { farmer_id: 1, crop_grow_year: 2020, asked_quality: "A grade", delivered_quality: "A grade", asked_qty: 100, delivered_qty: 100, price: 17 },
      { farmer_id: 2, crop_grow_year: 2020, asked_quality: "A grade", delivered_quality: "B grade", asked_qty: 100, delivered_qty: 100, price: 14 },
      { farmer_id: 3, crop_grow_year: 2020, asked_quality: "B grade", delivered_quality: "C grade", asked_qty: 100, delivered_qty: 90,  price: 15 },
      { farmer_id: 4, crop_grow_year: 2020, asked_quality: "A grade", delivered_quality: "A grade", asked_qty: 100, delivered_qty: 50,  price: 16 },
      { farmer_id: 5, crop_grow_year: 2020, asked_quality: "B grade", delivered_quality: "A grade", asked_qty: 100, delivered_qty: 100,  price: 16 }
    ];

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [
        {
          text: `You are an AI that evaluates farmers for contract farming.
          Based on the following records:

          Buyer is asking for the crop in 2021 grade is A, Quantity is 100kg, suggest him best farmer to sign contract from.

          ${JSON.stringify(farmersData)}
          
          Rules:
          - Score each farmer between 0 and 100 (probability of being best for buyers).
          - Consider quality match, quantity fulfillment, and price competitiveness.
          - If the farmer delivered the best quality than asked then it is a good thing.
          - Return the result on ranked from best to worst.
          - Provide reasoning for each farmer.
          - Return JSON according to the schema.`
        }
      ],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              farmer_id: { type: Type.NUMBER },
              probability_score: { type: Type.NUMBER },
              reason: { type: Type.STRING }
            },
            propertyOrdering: ["farmer_id", "probability_score", "reason"]
          }
        }
      }
    });

    const data = JSON.parse(response.text);
    console.log(data);

    res.status(200).json(data);

  } catch (error) {
    console.error('Error generating structured-farmers:', error);
    res.status(500).json({ error: 'Failed to generate farmer ranking' });
  } finally {
    console.log("structured-farmers ran");
  }
});



app.get('/image-anaysis', async (req,res) =>{

    try {
      const contents = [
        {
          inlineData: {
            mimeType: "image/jpeg",
            data: base64ImageFile,
          },
        },
        { text: "Caption this image." },
      ];

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: contents,
      });

      const data = JSON.parse(response.text);
      res.json(data).status(200);
    } catch (error) {
      console.error("Error generating image-anaysis:", error);
      res.status(500).json({ error: "Failed to image-anaysis content" });
    } finally {
      console.log("structured-output ran");
    }

    

})

// static hard coded image test to gemini api
app.get('/image_analysis_hard_coded', async (req, res) => {
  try {
    const imagePath = "test2.jpg"; // put an image in your project
    const base64ImageFile = fs.readFileSync(imagePath, { encoding: "base64" });

    const contents = [
      {
        inlineData: {
          mimeType: "image/jpeg",
          data: base64ImageFile,
        },
      },
      { text: `
              you are an AI that grades Apple. From the image provided.

              rules:-
              you need to only reply with A,B,C
              you need to grade the apple based on the quality 
              if the apple is majority red then A grade
              if the apple is slightly yellow then B grade
              if the apple has any rotten mark on it then C grade` 
      },
    ];

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: contents,
    });

    res.status(200).json(response.candidates[0].content.parts[0].text);
  } catch (error) {
    console.error("Error generating image-analysis:", error);
    res.status(500).json({ error: "Failed to process image" });
  }
});

// Start the server
app.listen(port, () => {
  console.log(`✨ Server is running on http://localhost:${port}`);
});